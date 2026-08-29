import pytest
import pandas as pd
import numpy as np

from src.features.technical import TechnicalAnalysisEngine
from src.features.candlestick import CandlestickEngine

@pytest.fixture
def sample_ohlcv_df():
    """Generates synthetic 100-bar OHLCV dataframe for technical testing."""
    np.random.seed(42)
    timestamps = pd.date_range("2024-01-01", periods=100, freq="D", tz="UTC")
    returns = np.random.normal(0.001, 0.02, 100)
    close = 100.0 * np.exp(np.cumsum(returns))
    high = close * (1 + np.abs(np.random.normal(0.005, 0.002, 100)))
    low = close * (1 - np.abs(np.random.normal(0.005, 0.002, 100)))
    open_p = close * (1 + np.random.normal(0, 0.003, 100))
    volume = np.random.uniform(50000, 500000, 100)

    # Ensure logical high/low boundaries
    high = np.maximum(high, np.maximum(open_p, close))
    low = np.minimum(low, np.minimum(open_p, close))

    return pd.DataFrame({
        "timestamp": timestamps,
        "open": open_p,
        "high": high,
        "low": low,
        "close": close,
        "volume": volume
    })

def test_technical_analysis_engine(sample_ohlcv_df):
    ta_engine = TechnicalAnalysisEngine()
    df_tech = ta_engine.compute_all_indicators(sample_ohlcv_df)

    expected_cols = [
        "ema_20", "ema_50", "ema_200", "ema_ratio_20_50", "rsi_14",
        "macd", "macd_signal", "macd_hist", "adx_14", "atr_14",
        "bollinger_hband", "bollinger_lband", "returns_1", "returns_5",
        "volatility_20", "obv", "vwap"
    ]
    for col in expected_cols:
        assert col in df_tech.columns

    # Verify no NaN values in tail (after warmup)
    assert not df_tech[expected_cols].tail(50).isnull().any().any()

def test_candlestick_doji_detection():
    # Construct candle where open == close (Doji)
    df_doji = pd.DataFrame({
        "timestamp": pd.date_range("2024-01-01", periods=5, tz="UTC"),
        "open": [100.0, 101.0, 102.0, 103.0, 100.0],
        "high": [105.0, 106.0, 107.0, 108.0, 105.0],
        "low": [95.0, 96.0, 97.0, 98.0, 95.0],
        "close": [102.0, 103.0, 104.0, 105.0, 100.001],  # 5th candle open ~ close
        "volume": [1000] * 5
    })
    cs_engine = CandlestickEngine()
    df_patterns = cs_engine.detect_patterns(df_doji)

    assert "pattern_doji" in df_patterns.columns
    assert df_patterns["pattern_doji"].iloc[-1] == True

def test_candlestick_bullish_engulfing_detection():
    # Construct 2-candle pattern: Red candle then large Green candle engulfing 1st
    df_engulfing = pd.DataFrame({
        "timestamp": pd.date_range("2024-01-01", periods=5, tz="UTC"),
        "open": [100.0, 100.0, 100.0, 102.0, 98.0],
        "high": [105.0, 105.0, 105.0, 103.0, 106.0],
        "low": [95.0, 95.0, 95.0, 98.0, 97.0],
        "close": [102.0, 102.0, 102.0, 99.0, 104.0],  # 4th red (102->99), 5th green (98->104)
        "volume": [1000] * 5
    })
    cs_engine = CandlestickEngine()
    df_patterns = cs_engine.detect_patterns(df_engulfing)

    assert "pattern_bullish_engulfing" in df_patterns.columns
    assert df_patterns["pattern_bullish_engulfing"].iloc[-1] == True

def test_candlestick_pattern_performance(sample_ohlcv_df):
    cs_engine = CandlestickEngine()
    df_patterns = cs_engine.detect_patterns(sample_ohlcv_df)
    report = cs_engine.calculate_pattern_performance(df_patterns, forward_horizon=5)

    assert isinstance(report, dict)
    assert len(report) >= 15
    for pattern_key, metrics in report.items():
        assert "win_rate" in metrics
        assert "frequency" in metrics
        assert 0.0 <= metrics["win_rate"] <= 1.0
