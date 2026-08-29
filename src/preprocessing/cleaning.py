import logging
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

class DataCleaner:
    """
    Data Cleaning & Preprocessing Engine.
    Cleans raw market data without silently obscuring structural financial errors.
    """

    def clean_ohlcv(self, df: pd.DataFrame, asset_symbol: str = "UNKNOWN") -> pd.DataFrame:
        """
        Cleans and normalizes OHLCV DataFrame:
        1. Ensures UTC timezone on timestamp.
        2. Drops duplicate timestamps (keeps last).
        3. Sorts chronologically.
        4. Imputes missing values via forward-fill for OHLC and 0 for volume.
        5. Enforces strictly valid high/low bounds.
        """
        df_clean = df.copy()

        # 1. Ensure UTC timezone
        df_clean["timestamp"] = pd.to_datetime(df_clean["timestamp"], utc=True)

        # 2. Drop duplicates
        initial_rows = len(df_clean)
        df_clean = df_clean.drop_duplicates(subset=["timestamp"], keep="last")
        dropped_dups = initial_rows - len(df_clean)
        if dropped_dups > 0:
            logger.info(f"[{asset_symbol}] Dropped {dropped_dups} duplicate timestamp rows.")

        # 3. Sort chronologically
        df_clean = df_clean.sort_values(by="timestamp").reset_index(drop=True)

        # 4. Impute missing values
        ohlc_cols = ["open", "high", "low", "close"]
        if df_clean[ohlc_cols].isnull().any().any():
            logger.info(f"[{asset_symbol}] Imputing missing OHLC values via forward-fill.")
            df_clean[ohlc_cols] = df_clean[ohlc_cols].ffill().bfill()

        if df_clean["volume"].isnull().any():
            logger.info(f"[{asset_symbol}] Imputing missing volume values with 0.")
            df_clean["volume"] = df_clean["volume"].fillna(0.0)

        # 5. Enforce High/Low bounds integrity
        # High must be at least max(open, close)
        max_oc = np.maximum(df_clean["open"], df_clean["close"])
        df_clean["high"] = np.maximum(df_clean["high"], max_oc)

        # Low must be at most min(open, close)
        min_oc = np.minimum(df_clean["open"], df_clean["close"])
        df_clean["low"] = np.minimum(df_clean["low"], min_oc)

        return df_clean
