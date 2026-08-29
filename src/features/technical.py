import logging
import pandas as pd
import numpy as np
import ta

logger = logging.getLogger(__name__)

class TechnicalAnalysisEngine:
    """
    Technical Analysis Feature Engineering Engine.
    Computes trend, momentum, volatility, volume, and returns indicators.
    """

    def compute_all_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculates complete set of technical indicators on input OHLCV DataFrame.
        """
        df_out = df.copy()

        if len(df_out) < 5:
            logger.warning("DataFrame too small to compute technical indicators.")
            return df_out

        # 1. Exponential Moving Averages (EMA)
        df_out["ema_20"] = ta.trend.ema_indicator(df_out["close"], window=20, fillna=True)
        df_out["ema_50"] = ta.trend.ema_indicator(df_out["close"], window=50, fillna=True)
        df_out["ema_200"] = ta.trend.ema_indicator(df_out["close"], window=200, fillna=True)
        df_out["ema_ratio_20_50"] = df_out["ema_20"] / (df_out["ema_50"] + 1e-8)
        df_out["ema_ratio_50_200"] = df_out["ema_50"] / (df_out["ema_200"] + 1e-8)

        # 2. RSI (Relative Strength Index)
        df_out["rsi_14"] = ta.momentum.rsi(df_out["close"], window=14, fillna=True)

        # 3. MACD (Moving Average Convergence Divergence)
        macd_obj = ta.trend.MACD(df_out["close"], window_slow=26, window_fast=12, window_sign=9, fillna=True)
        df_out["macd"] = macd_obj.macd()
        df_out["macd_signal"] = macd_obj.macd_signal()
        df_out["macd_hist"] = macd_obj.macd_diff()

        # 4. ADX & Directional Movement
        adx_obj = ta.trend.ADXIndicator(df_out["high"], df_out["low"], df_out["close"], window=14, fillna=True)
        df_out["adx_14"] = adx_obj.adx()
        df_out["di_plus"] = adx_obj.adx_pos()
        df_out["di_minus"] = adx_obj.adx_neg()

        # 5. ATR (Average True Range)
        df_out["atr_14"] = ta.volatility.average_true_range(df_out["high"], df_out["low"], df_out["close"], window=14, fillna=True)

        # 6. Bollinger Bands
        bb_obj = ta.volatility.BollingerBands(df_out["close"], window=20, window_dev=2, fillna=True)
        df_out["bollinger_hband"] = bb_obj.bollinger_hband()
        df_out["bollinger_lband"] = bb_obj.bollinger_lband()
        df_out["bollinger_pband"] = bb_obj.bollinger_pband()
        df_out["bollinger_wband"] = bb_obj.bollinger_wband()

        # 7. Returns & Volatility
        df_out["returns_1"] = df_out["close"].pct_change(1).fillna(0.0)
        df_out["returns_5"] = df_out["close"].pct_change(5).fillna(0.0)
        df_out["returns_20"] = df_out["close"].pct_change(20).fillna(0.0)
        df_out["log_returns"] = np.log(df_out["close"] / (df_out["close"].shift(1) + 1e-8)).fillna(0.0)
        df_out["volatility_20"] = df_out["log_returns"].rolling(window=20, min_periods=1).std().fillna(0.0) * np.sqrt(252)

        # 8. Volume Features
        df_out["obv"] = ta.volume.on_balance_volume(df_out["close"], df_out["volume"], fillna=True)
        vwap_obj = ta.volume.VolumeWeightedAveragePrice(df_out["high"], df_out["low"], df_out["close"], df_out["volume"], window=14, fillna=True)
        df_out["vwap"] = vwap_obj.volume_weighted_average_price()
        vol_ma20 = df_out["volume"].rolling(window=20, min_periods=1).mean()
        df_out["volume_ma_ratio_20"] = df_out["volume"] / (vol_ma20 + 1e-8)

        # 9. Momentum & Oscillators
        df_out["stoch_k"] = ta.momentum.stoch(df_out["high"], df_out["low"], df_out["close"], window=14, smooth_window=3, fillna=True)
        df_out["stoch_d"] = ta.momentum.stoch_signal(df_out["high"], df_out["low"], df_out["close"], window=14, smooth_window=3, fillna=True)

        return df_out
