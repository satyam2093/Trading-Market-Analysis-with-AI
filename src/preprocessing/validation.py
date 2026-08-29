import logging
from typing import Dict, Any, List
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

class DataValidationError(Exception):
    """Raised when critical data quality checks fail."""
    pass

class DataValidator:
    """
    Data Quality Validation Engine for Market Data.
    Performs comprehensive sanity checks on OHLCV DataFrames.
    """

    def validate_ohlcv(self, df: pd.DataFrame, asset_symbol: str = "UNKNOWN") -> Dict[str, Any]:
        """
        Validates OHLCV DataFrame integrity.
        
        Checks:
        1. Required columns presence
        2. Non-empty DataFrame
        3. Missing / NaN values count
        4. Duplicate timestamps
        5. Invalid OHLC relationships (e.g. High < Low, High < Open, Low > Close)
        6. Non-negative prices and volumes
        7. Outlier returns (> 50% single-bar change)
        
        Returns validation report dict.
        """
        report: Dict[str, Any] = {
            "asset": asset_symbol,
            "is_valid": True,
            "total_rows": len(df),
            "errors": [],
            "warnings": [],
            "missing_values_count": 0,
            "duplicate_timestamps_count": 0,
            "invalid_ohlc_rows": 0,
            "outlier_rows": 0
        }

        # 1. Required Columns Check
        required_cols = ["timestamp", "open", "high", "low", "close", "volume"]
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            msg = f"Missing required columns: {missing_cols}"
            report["errors"].append(msg)
            report["is_valid"] = False
            logger.error(f"[{asset_symbol}] Data Validation Failed: {msg}")
            return report

        if df.empty:
            msg = "DataFrame is empty."
            report["errors"].append(msg)
            report["is_valid"] = False
            logger.error(f"[{asset_symbol}] Data Validation Failed: {msg}")
            return report

        # 2. Missing Values Check
        null_count = df[required_cols].isnull().sum().sum()
        report["missing_values_count"] = int(null_count)
        if null_count > 0:
            report["warnings"].append(f"Found {null_count} null/NaN values.")
            logger.warning(f"[{asset_symbol}] Data Quality Warning: Found {null_count} missing values.")

        # 3. Duplicate Timestamps Check
        dup_count = df["timestamp"].duplicated().sum()
        report["duplicate_timestamps_count"] = int(dup_count)
        if dup_count > 0:
            report["warnings"].append(f"Found {dup_count} duplicate timestamps.")
            logger.warning(f"[{asset_symbol}] Data Quality Warning: Found {dup_count} duplicate timestamps.")

        # 4. Invalid OHLC Relationships Check
        # High must be >= max(open, close, low)
        invalid_high = (df["high"] < df["low"]) | (df["high"] < df["open"]) | (df["high"] < df["close"])
        # Low must be <= min(open, close, high)
        invalid_low = (df["low"] > df["high"]) | (df["low"] > df["open"]) | (df["low"] > df["close"])
        # Prices must be strictly > 0
        invalid_price = (df["open"] <= 0) | (df["high"] <= 0) | (df["low"] <= 0) | (df["close"] <= 0)
        # Volume must be >= 0
        invalid_volume = (df["volume"] < 0)

        invalid_mask = invalid_high | invalid_low | invalid_price | invalid_volume
        invalid_count = invalid_mask.sum()
        report["invalid_ohlc_rows"] = int(invalid_count)

        if invalid_count > 0:
            report["errors"].append(f"Found {invalid_count} rows with invalid OHLC/volume relationships.")
            report["is_valid"] = False
            logger.error(f"[{asset_symbol}] Data Quality Error: {invalid_count} rows failed OHLC logical boundaries.")

        # 5. Outlier Detection (>50% single candle shift)
        returns = df["close"].pct_change().abs()
        outliers = returns > 0.50
        outlier_count = outliers.sum()
        report["outlier_rows"] = int(outlier_count)
        if outlier_count > 0:
            report["warnings"].append(f"Detected {outlier_count} potential extreme price outlier candles (>50% jump).")
            logger.warning(f"[{asset_symbol}] Data Quality Warning: {outlier_count} price outlier bars detected.")

        return report
