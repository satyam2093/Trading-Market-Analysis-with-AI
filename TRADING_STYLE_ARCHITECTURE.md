# TRADING_STYLE_ARCHITECTURE.md — Multi-Horizon Trading Adaptation Architecture

**Platform**: NexQuant Institutional Quantitative Intelligence  
**Author**: Quantitative Research & ML Engineering Team  
**System Version**: 2.2.0-Production  

---

## 1. Executive Summary

Financial market dynamics differ radically across investment and trading horizons. A price pattern or order flow imbalance that produces an edge over a 3-minute timeframe is virtually meaningless to a multi-month fundamental investor; conversely, quarterly revenue revisions and debt/equity ratios offer zero predictive value for an intraday scalper.

NexQuant addresses this structural reality by treating **Trading Style** as a first-class quantitative system primitive rather than an aesthetic UI label. Selecting a trading style dynamically alters:
1. **Target Candle Horizons**: The forward prediction window shifts from 1–3 bars (Scalper) to 20–60 bars (Investor).
2. **Feature Engineering Pipelines**: High-frequency micro-indicators (Order Flow, ATR, 9/21 EMA) take priority for short horizons, whereas long horizons emphasize audited statement metrics, valuation multiples, and macro cycle indicators.
3. **Deep Learning Sequence Lookback**: Sequence lengths ($T$) adapt across LSTM, GRU, and Temporal Transformers (from $T=12$ to $T=80$).
4. **News Sentiment Half-Life Decay**: Information decay rates vary from aggressive intraday decay ($t_{1/2} = 2\text{ hours}$) to fundamental persistent thesis narratives ($t_{1/2} = 30\text{ days}$).
5. **Model Weight Distribution**: The 8-model ensemble dynamically redistributes confidence weights according to horizon predictive efficacy.
6. **Quantitative Risk Circuit Breakers**: Stop-loss boundaries, Value-at-Risk limits, and take-profit targets automatically calibrate to the asset's horizon volatility.

---

## 2. Quantitative Trading-Style Matrix

| Attribute | SCALPER | INTRADAY TRADER | SWING TRADER | INVESTOR |
|---|---|---|---|---|
| **Execution Philosophy** | Micro-momentum, order flow, ATR bands | Session structure, VWAP, liquidity pools | Multi-day structural waves, earnings | Balance sheets, free cash flow, secular cycles |
| **Primary Timeframes** | 1m, 3m, 5m, 15m | 5m, 15m, 30m, 1h | 1h, 4h, 1D, 1W | 1D, 1W, 1M |
| **Default Timeframe** | 5m | 15m | 1D | 1W |
| **Prediction Horizon** | 1 – 3 Candles | 3 – 8 Candles | 5 – 20 Candles | 20 – 60 Candles |
| **Regime Threshold** | $\pm 0.40\%$ | $\pm 1.00\%$ | $\pm 2.50\%$ | $\pm 6.00\%$ |
| **LSTM Lookback ($T$)** | 12 Candles | 24 Candles | 40 Candles | 60 Candles |
| **Transformer Lookback** | 16 Candles | 32 Candles | 50 Candles | 80 Candles |
| **News Half-Life ($t_{1/2}$)** | 2 Hours | 8 Hours | 72 Hours (3 Days) | 720 Hours (30 Days) |
| **Stop-Loss Calibration** | 0.5% – 0.8% (Tight ATR) | 1.0% – 1.5% (Session Boundary) | 3.0% – 4.5% (Structural Support) | 8.0% – 12.0% (Thesis Breakdown) |
| **Take-Profit Target** | 1.2% – 1.6% (1:2 R/R) | 2.5% – 3.5% (1:2.3 R/R) | 7.0% – 10.0% (1:2.5 R/R) | 25.0% – 50.0%+ (Compounding Run) |
| **Commission Fee Assumption** | 0.05% | 0.05% | 0.10% | 0.10% |
| **Slippage Assumption** | 0.05% | 0.03% | 0.02% | 0.01% |

---

## 3. Dynamic Ensemble Model Weights by Style

| Model Component | SCALPER | INTRADAY | SWING | INVESTOR |
|---|---|---|---|---|
| **Model 1: Market Regime Classifier** | 15% | 20% | 20% | 25% |
| **Model 2: Multi-Horizon Direction** | 25% | 20% | 15% | 5% |
| **Model 3: Volatility & Risk Model** | 15% | 15% | 10% | 5% |
| **Model 4: PyTorch Bi-LSTM / GRU** | 20% | 15% | 12% | 5% |
| **Model 5: Temporal Attention Transformer** | 15% | 15% | 15% | 10% |
| **Model 6: Correlation Graph Neural Network** | 5% | 5% | 8% | 15% |
| **Model 7: Financial Statement NLP** | 0% *(Bypassed)* | 2% *(Negligible)* | 10% *(Moderate)* | 25% *(Dominant)* |
| **Model 8: News Sentiment Intelligence** | 5% *(High decay)* | 8% *(Session)* | 10% *(Multi-day)* | 10% *(Macro)* |
| **Total Allocation** | **100%** | **100%** | **100%** | **100%** |

---

## 4. Frontend & Backend Synchronization

To guarantee end-to-end coherence:
- **Backend Hub**: `src/models/trading_style.py` defines the canonical `TradingStyle` enum, dataclasses, and configuration mappings.
- **Frontend Hub**: `frontend-next/types/tradingStyle.ts` and `frontend-next/lib/tradingStyleConfig.ts` mirror backend parameters with identical keys and logic.
- **Global Context Provider**: `TradingStyleProvider` persists the user's selected style in `localStorage` across page navigations and synchronizes the TradingView chart timeframe, AI consensus cards, and backtest simulations.
