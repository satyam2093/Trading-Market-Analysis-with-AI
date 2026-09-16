"""
Trading Style Architecture & Configuration Engine.
Defines horizon parameters, feature weights, sequence lengths, news decay half-lives,
stop-loss/take-profit boundaries, and model ensemble distributions for:
- SCALPER
- INTRADAY TRADER
- SWING TRADER
- INVESTOR
"""

from enum import Enum
from typing import Dict, Any, List
from dataclasses import dataclass, field


class TradingStyle(str, Enum):
    SCALPER = "SCALPER"
    INTRADAY = "INTRADAY"
    SWING = "SWING"
    INVESTOR = "INVESTOR"

    @classmethod
    def from_str(cls, val: str) -> "TradingStyle":
        val_clean = (val or "").strip().upper()
        if "SCALP" in val_clean:
            return cls.SCALPER
        elif "INTRA" in val_clean or "DAY" in val_clean:
            return cls.INTRADAY
        elif "INVEST" in val_clean or "LONG" in val_clean:
            return cls.INVESTOR
        return cls.SWING  # Default to SWING


@dataclass
class TradingStyleConfig:
    style: TradingStyle
    name: str
    description: str
    primary_timeframes: List[str]
    default_timeframe: str
    
    # Prediction horizons in units of candle bars
    regime_horizon_candles: int
    direction_horizons: List[int]
    volatility_horizon_candles: int
    
    # Deep learning sequence lookbacks
    lstm_seq_len: int
    transformer_seq_len: int
    
    # News half-life in hours
    news_half_life_hours: float
    
    # Thresholds
    regime_threshold_pct: float
    stop_loss_pct: float
    take_profit_pct: float
    
    # Backtest fee & slippage assumptions
    fee_pct: float
    slippage_pct: float
    
    # Model ensemble weights (sum to 1.0)
    model_weights: Dict[str, float] = field(default_factory=dict)


# Canonical Institutional Configurations for Each Horizon
STYLE_CONFIGS: Dict[TradingStyle, TradingStyleConfig] = {
    TradingStyle.SCALPER: TradingStyleConfig(
        style=TradingStyle.SCALPER,
        name="Scalper",
        description="Sub-minute to 15-minute high-frequency momentum, order flow, tight ATR volatility bands with immediate news decay.",
        primary_timeframes=["1m", "3m", "5m", "15m"],
        default_timeframe="5m",
        regime_horizon_candles=2,
        direction_horizons=[1, 2, 3],
        volatility_horizon_candles=3,
        lstm_seq_len=12,
        transformer_seq_len=16,
        news_half_life_hours=2.0,
        regime_threshold_pct=0.004,
        stop_loss_pct=0.008,
        take_profit_pct=0.016,
        fee_pct=0.0005,
        slippage_pct=0.0005,
        model_weights={
            "regime_classifier": 0.15,
            "direction_model": 0.25,
            "volatility_model": 0.15,
            "lstm_model": 0.20,
            "transformer_model": 0.15,
            "gnn_model": 0.05,
            "fundamental_score": 0.00,  # Negligible in scalp horizon
            "news_sentiment": 0.05,
        }
    ),
    TradingStyle.INTRADAY: TradingStyleConfig(
        style=TradingStyle.INTRADAY,
        name="Intraday Trader",
        description="Session-based execution focusing on VWAP, intraday price action, same-day wire releases, and session mean-reversion.",
        primary_timeframes=["5m", "15m", "30m", "1h"],
        default_timeframe="15m",
        regime_horizon_candles=5,
        direction_horizons=[3, 5, 8],
        volatility_horizon_candles=6,
        lstm_seq_len=24,
        transformer_seq_len=32,
        news_half_life_hours=8.0,
        regime_threshold_pct=0.010,
        stop_loss_pct=0.015,
        take_profit_pct=0.035,
        fee_pct=0.0005,
        slippage_pct=0.0003,
        model_weights={
            "regime_classifier": 0.20,
            "direction_model": 0.20,
            "volatility_model": 0.15,
            "lstm_model": 0.15,
            "transformer_model": 0.15,
            "gnn_model": 0.05,
            "fundamental_score": 0.02,
            "news_sentiment": 0.08,
        }
    ),
    TradingStyle.SWING: TradingStyleConfig(
        style=TradingStyle.SWING,
        name="Swing Trader",
        description="Multi-day to multi-week trend following balancing momentum, structural support/resistance, earnings growth, and sector rotation.",
        primary_timeframes=["1h", "4h", "1d", "1w"],
        default_timeframe="1d",
        regime_horizon_candles=10,
        direction_horizons=[5, 10, 20],
        volatility_horizon_candles=14,
        lstm_seq_len=40,
        transformer_seq_len=50,
        news_half_life_hours=72.0,  # 3 days
        regime_threshold_pct=0.025,
        stop_loss_pct=0.040,
        take_profit_pct=0.090,
        fee_pct=0.0010,
        slippage_pct=0.0002,
        model_weights={
            "regime_classifier": 0.20,
            "direction_model": 0.15,
            "volatility_model": 0.10,
            "lstm_model": 0.12,
            "transformer_model": 0.15,
            "gnn_model": 0.08,
            "fundamental_score": 0.10,
            "news_sentiment": 0.10,
        }
    ),
    TradingStyle.INVESTOR: TradingStyleConfig(
        style=TradingStyle.INVESTOR,
        name="Investor",
        description="Multi-month to multi-year compound accumulation anchored in audited balance sheets, free cash flow growth, macroeconomic trends, and structural secular tailwinds.",
        primary_timeframes=["1d", "1w", "1M"],
        default_timeframe="1w",
        regime_horizon_candles=30,
        direction_horizons=[20, 40, 60],
        volatility_horizon_candles=30,
        lstm_seq_len=60,
        transformer_seq_len=80,
        news_half_life_hours=720.0,  # 30 days
        regime_threshold_pct=0.060,
        stop_loss_pct=0.120,
        take_profit_pct=0.350,
        fee_pct=0.0010,
        slippage_pct=0.0001,
        model_weights={
            "regime_classifier": 0.25,
            "direction_model": 0.05,
            "volatility_model": 0.05,
            "lstm_model": 0.05,
            "transformer_model": 0.10,
            "gnn_model": 0.15,
            "fundamental_score": 0.25,
            "news_sentiment": 0.10,
        }
    ),
}


def get_trading_style_config(style_input: Any) -> TradingStyleConfig:
    """Safely resolves style from string or enum into full configuration."""
    if isinstance(style_input, TradingStyle):
        return STYLE_CONFIGS[style_input]
    style_enum = TradingStyle.from_str(str(style_input))
    return STYLE_CONFIGS[style_enum]
