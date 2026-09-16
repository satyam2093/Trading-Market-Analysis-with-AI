# REDESIGN_AUDIT.md — NexQuant Architectural & Operational Audit

**Audit Date**: September 2026  
**System**: NexQuant Institutional Quantitative Intelligence Platform  
**Auditors**: Quantitative Research, ML Engineering, Frontend Architecture & Quant Dev Team  

---

## 1. Executive Summary

NexQuant is an institutional-grade financial analytics and market intelligence terminal combining multi-source real-time tick/OHLCV streaming, global market benchmark tracking, real-world financial wire news feeds, an ensemble of 8 specialized machine learning / deep learning models, and an execution backtesting simulation engine.

This audit evaluates the codebase's existing infrastructure against the required transformation:
1. **Trading-Style Adaptation**: Seamless adaptation across 4 distinct trading horizons (`SCALPER`, `INTRADAY TRADER`, `SWING TRADER`, `INVESTOR`), altering features, prediction horizons, labels, sequence lengths, news decay half-lives, model weights, and risk profiles.
2. **8-Model AI Pipeline**: Horizon-aware feature engineering, target labeling, and ensemble weighting across Regime Classification, Multi-Horizon Price Direction, Volatility Modeling, PyTorch LSTM/GRU, Temporal Attention Transformers, Graph Neural Networks, Financial Statement NLP, and News Sentiment Intelligence.
3. **Institutional Walk-Forward Backtesting**: Out-of-sample backtest simulation with realistic transaction fees, dynamic slippage, style-specific metrics (Sharpe, Sortino, Max Drawdown, Win Rate, Profit Factor, CAGR), and multi-horizon validation across benchmark assets.
4. **Design System & Theme Purity**: Complete removal of the Day/Night switcher, removing theme bifurcation and establishing a single, high-contrast institutional dark theme.
5. **Data Quality Assurance**: Zero tolerance for `0.00` fallbacks, unauthenticated CTA leaks for logged-in sessions, or synthetic price fabrications.

---

## 2. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph DataIngestion [1. Data Ingestion & Normalization Layer]
        YF[Yahoo Finance Engine]
        CC[Crypto / Global Websockets]
        NewsWire[Real Financial News Wire]
        SEC[SEC / Annual Statement Filings]
        Val[Data Validation & Sanitizer: Non-zero checks]
    end

    subgraph StyleConfig [2. Centralized Trading Style Layer]
        TSC[TradingStyleConfig: Scalper | Intraday | Swing | Investor]
    end

    subgraph FeatureEngineering [3. Dynamic Feature & Horizon Pipeline]
        FeatCalc[TA-Lib / Custom Math: EMA, RSI, MACD, ATR, Volatility]
        SeqPrep[Time-series sliding windows & Lookback formulation]
        DecayCalc[News Half-life Exponential Decay: 2h to 30d]
    end

    subgraph Models8 [4. 8-Model Multi-Horizon AI Ensemble]
        M1[Model 1: Market Regime XGBoost]
        M2[Model 2: Directional Probabilities]
        M3[Model 3: Volatility & VaR Regressor]
        M4[Model 4: PyTorch Bi-LSTM / GRU]
        M5[Model 5: Temporal Attention Transformer]
        M6[Model 6: Correlation Graph Neural Network]
        M7[Model 7: Financial Statement NLP]
        M8[Model 8: Event Sentiment NLP]
    end

    subgraph DecisionRisk [5. Quantitative Risk & Decision Engine]
        StyleWeights[Horizon Model Weight Allocator]
        EnsEngine[Ensemble Consensus Engine: BUY / SELL / HOLD / NO_TRADE]
        RiskCircuit[Risk Engine: 95% VaR & Volatility Circuit Breakers]
    end

    subgraph ExecutionBacktest [6. Walk-Forward Backtest Simulator]
        WFE[Walk-Forward Window Engine]
        ExecCost[Transaction Fee & Slippage Model]
        Metrics[Performance Stats: Sharpe, Sortino, Drawdown, Profit Factor]
    end

    subgraph Presentation [7. Frontend Terminal & API]
        NextApp[Next.js 14 Institutional Dark Terminal]
        FastAPI[FastAPI Production Gateway]
        VercelAPI[Serverless Microservices API]
        LightChart[Lightweight Charts Native Canvas Engine]
    end

    YF --> Val
    CC --> Val
    NewsWire --> Val
    SEC --> Val

    Val --> FeatCalc
    TSC --> FeatCalc
    FeatCalc --> SeqPrep
    FeatCalc --> DecayCalc

    SeqPrep --> M1 & M2 & M3 & M4 & M5 & M6
    SEC --> M7
    DecayCalc --> M8

    M1 & M2 & M3 & M4 & M5 & M6 & M7 & M8 --> StyleWeights
    TSC --> StyleWeights
    StyleWeights --> EnsEngine
    EnsEngine --> RiskCircuit

    RiskCircuit --> WFE
    WFE --> ExecCost --> Metrics

    RiskCircuit --> FastAPI & VercelAPI
    FastAPI & VercelAPI --> NextApp
    NextApp --> LightChart
```

---

## 3. Comprehensive File Audit & Gap Analysis

### 3.1 Python Backend (`src/`)

| File Path | Role in Pipeline | Current Limitation | Required Adaptation |
|---|---|---|---|
| `src/models/trading_style.py` | Trading Style Hub | **Does not exist** | Create centralized `TradingStyle` enum, dataclasses for style parameters (timeframes, lookbacks, target horizons, fee models, model weights, news decay). |
| `src/models/regime/regime_classifier.py` | Model 1: Market Regime | Fixed `forward_horizon=5`, `threshold=0.015`. | Accept `TradingStyleConfig` to dynamically parameterize horizon and threshold based on trading style. |
| `src/models/direction/direction_model.py` | Model 2: Price Direction | Fixed horizons `[1, 5, 20]`. | Dynamically configure target candle horizons and evaluate style-relevant confidence metrics. |
| `src/models/volatility/volatility_model.py` | Model 3: Volatility & Risk | Target fixed at 5 candles, hardcoded annualization scaler. | Scale volatility labels and regime thresholds to trading style timeframes. |
| `src/models/lstm/lstm_model.py` | Model 4: LSTM / GRU | Fixed sequence length (20). | Adapt sequence lengths: Scalper (10-15), Intraday (20-30), Swing (30-50), Investor (60-120). |
| `src/models/transformer/transformer_model.py` | Model 5: Temporal Transformer | Fixed sequence length & fixed lookback. | Adapt multi-head self-attention lookback and token embeddings to trading horizon. |
| `src/models/gnn/gnn_model.py` | Model 6: Market GNN | Fixed window correlation graph. | Ensure zero look-ahead bias and horizon-matched temporal graph windowing. |
| `src/models/financial_nlp/financial_nlp.py` | Model 7: Financial NLP | Evaluated identically regardless of trading style. | Weight heavily for Investor and Swing styles; down-weight or bypass in high-frequency Scalper style. |
| `src/models/news_nlp/news_nlp.py` | Model 8: News Sentiment | Linear/unweighted decay across all horizons. | Implement exponential half-life decay: Scalper ($t_{1/2}=2\text{h}$)$, Intraday ($t_{1/2}=8\text{h}$)$, Swing ($t_{1/2}=72\text{h}$)$, Investor ($t_{1/2}=720\text{h}$). |
| `src/models/ensemble/ensemble_engine.py` | Multi-Model Ensemble | Static `DEFAULT_WEIGHTS` dictionary. | Implement style-driven dynamic weighting: Scalper focuses on momentum/LSTM/Transformer; Investor focuses on Regime/Fundamentals/Macro. |
| `src/backtest/backtesting_engine.py` | Backtesting Engine | Single pass simulation without out-of-sample walk-forward slices or Sortino/Profit Factor/CAGR. | Implement full `WalkForwardBacktester` class with style parameters, slippage, and institutional metrics. |
| `src/api/app.py` | FastAPI Gateway | Endpoints lack `?trading_style=` parameter in `/api/v1/ensemble/{symbol}` and `/api/v1/featured`. | Expose trading style selector across all prediction and market routes. |

---

## 4. Trading-Style Matrix Specifications

| Attribute | SCALPER | INTRADAY TRADER | SWING TRADER | INVESTOR |
|---|---|---|---|---|
| **Primary Timeframes** | 1m, 3m, 5m, 15m | 5m, 15m, 30m, 1h | 1h, 4h, 1D, 1W | 1D, 1W, 1M |
| **Prediction Horizon** | 1 to 3 candles | 4 to 8 candles | 5 to 20 candles | 20 to 60 candles |
| **Key Indicators** | Order flow, ATR, VWAP, EMA 9/21, RSI 7 | VWAP, RSI 14, MACD, Volume Profile, Pivot Points | EMA 20/50/200, MACD, ADX, Bollinger Bands | 50/200 SMA, Weekly EMA, PE, PB, ROE, FCF yield |
| **News Half-Life ($t_{1/2}$)** | 2 Hours | 8 Hours | 3 Days (72 Hours) | 30 Days (720 Hours) |
| **Fundamental Weight** | 0.00 (Negligible) | 0.05 (Low) | 0.20 (Moderate) | 0.35 (High) |
| **Technical/DL Weight** | 0.80 (High) | 0.70 (High) | 0.55 (Balanced) | 0.35 (Moderate) |
| **News Sentiment Weight** | 0.20 (Immediate impact) | 0.25 (Intraday catalyst) | 0.25 (Multi-day narrative) | 0.30 (Long-term thesis) |
| **Stop-Loss Calibration** | 0.5% - 1.0% (Tight ATR) | 1.0% - 2.0% (Swing low/high) | 2.5% - 5.0% (Structural support) | 8.0% - 15.0% (Fundamental thesis change) |
| **Profit Target Calibration** | 1.0% - 2.0% (1:2 R/R) | 2.0% - 4.0% (1:2 R/R) | 6.0% - 12.0% (1:2.5 R/R) | 25.0% - 60.0%+ (Long-term compounding) |

---

## 5. Walk-Forward Backtesting Framework Design

The walk-forward engine executes sliding out-of-sample window evaluations:
- **Lookback Training Window**: Variable by style ($N_{\text{train}}$ = 120 bars for Scalper, 360 bars for Investor).
- **Out-of-Sample Test Window**: Variable by style ($N_{\text{test}}$ = 30 bars for Scalper, 90 bars for Investor).
- **Slippage & Cost**:
  - Scalper: 0.05% fee + 0.05% slippage per turn (high turnover penalty).
  - Intraday: 0.05% fee + 0.03% slippage per turn.
  - Swing: 0.10% fee + 0.02% slippage per turn.
  - Investor: 0.10% fee + 0.01% slippage per turn.
- **Institutional Metrics Computed**:
  - Sharpe Ratio ($R_f = 4.0\%$)
  - Sortino Ratio (downside deviation only)
  - Maximum Drawdown ($DD_{\max}$)
  - Win Rate % ($N_{\text{win}} / N_{\text{closed}}$)
  - Profit Factor ($\sum \text{Gains} / \sum \text{Losses}$)
  - Compound Annual Growth Rate (CAGR)

---

## 6. Implementation Sequence & Execution Roadmap

1. **Purge Theme Bifurcation**: Delete `ThemeContext.tsx`, sanitize `providers.tsx`, `Navbar.tsx`, and `globals.css`.
2. **Implement Backend Trading Style Engine**: Create `src/models/trading_style.py` with configurations, weights, and horizons.
3. **Adapt 8 AI Models**: Refactor `regime_classifier.py`, `direction_model.py`, `volatility_model.py`, `lstm_model.py`, `transformer_model.py`, `gnn_model.py`, `financial_nlp.py`, `news_nlp.py`, and `ensemble_engine.py`.
4. **Implement Walk-Forward Backtester**: Build out `src/backtest/backtesting_engine.py` with complete metrics and validation suite.
5. **Create Frontend Trading Style Architecture**: Implement TypeScript models, style context, and persistent style switchers across terminal and homepage.
6. **Update Homepage Layout**: Implement exact requested section flow (Overview -> Indices -> Assets -> News Wire -> News Impact -> Trading Style -> AI Analysis).
7. **Generate Required 16 Reports**: Produce all required system documentation files in markdown.
8. **Test, Build & Commit**: Run automated pytest tests, verify frontend `npm run build`, and push changes to GitHub.
