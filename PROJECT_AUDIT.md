# MASTER PROJECT AUDIT: AI Market Intelligence Platform

**Audit Date:** August 29, 2026  
**Auditor:** Senior AI Financial Systems Architect & Full-Stack Engineer  
**Workspace:** `c:\Users\satya\OneDrive\Desktop\Market Analysis Project\`

---

## 1. Executive Summary & Component Classification

Every existing file, component, model, database table, provider, and UI page in the codebase has been audited and tagged with one of the four required migration actions:
- **REUSE**: Working production component; kept as-is.
- **REFACTOR**: Component needs architectural adjustment or enhancement (e.g. connecting to shared backend / adding metadata).
- **REBUILD**: Component requires complete redesign for enterprise scalability (e.g. Next.js production UI).
- **REMOVE**: Obsolete legacy files or synthetic mock generators.

---

## 2. Comprehensive Component Audit Matrix

| Component / File Path | Current Functionality | Classification Tag | Target Action & Migration Strategy |
| :--- | :--- | :--- | :--- |
| **`configs/config.py`** | System & Asset configuration parameters | **REFACTOR** | Expand to support environment variables (`.env`) for PostgreSQL, Redis, API keys, and rate limits. |
| **`src/utils/database.py`** | SQLAlchemy ORM Models (8 base tables + Watchlist & Alerts) | **REFACTOR** | Add Alembic migration support, PostgreSQL indices, and tables for `portfolios`, `portfolio_positions`, `model_versions`, `system_events`. |
| **`src/data/base_provider.py`** | Abstract base classes for Market Data, Fundamentals, News | **REUSE** | Core abstraction interfaces; standardized contracts for `data_status` and metadata. |
| **`src/data/market_data.py`** | `StockMarketDataProvider` (yfinance) | **REUSE** | Fetches real OHLCV data for US/NSE stocks, ETFs, Indices with strict data governance. |
| **`src/data/crypto_data.py`** | `CryptoMarketDataProvider` (yfinance / CCXT) | **REUSE** | Ingests real crypto OHLCV bars. |
| **`src/data/fundamentals.py`** | `FundamentalDataProvider` (Scrapes statement metrics) | **REFACTOR** | Add QoQ and YoY multi-quarter comparison metrics. |
| **`src/data/news_data.py`** | `NewsDataProvider` (Yahoo Finance feed) | **REFACTOR** | Add news deduplication, categorization, and URL citations. |
| **`src/services/asset_discovery.py`**| `AssetDiscoveryService` | **REUSE** | Dynamic asset discovery and symbol/name global search. |
| **`src/services/market_data_service.py`**| `MarketDataService` | **REUSE** | Handles data validation, cleaning, technical calculation, and caching. |
| **`src/services/watchlist_service.py`**| `WatchlistService` | **REUSE** | DB-backed user watchlist management. |
| **`src/services/alert_service.py`** | `AlertService` | **REUSE** | Price, signal, volatility, and news alert management. |
| **`src/features/technical.py`** | `TechnicalAnalysisEngine` (RSI, MACD, EMAs, ADX, ATR, BB) | **REUSE** | Comprehensive indicator calculation engine. |
| **`src/features/candlestick.py`** | `CandlestickEngine` (17 pattern variations + win rate) | **REUSE** | Pattern recognition engine with historical win rates. |
| **`src/features/fundamental.py`** | `FundamentalAnalysisEngine` (Fundamental Score 0-100) | **REUSE** | Sector-aware ratio calculator and fundamental scoring. |
| **`src/features/sentiment.py`** | `SentimentAnalysisEngine` (FinBERT/Keyword Sentiment) | **REUSE** | News sentiment polarity, impact levels, event detection. |
| **`src/models/regime/regime_classifier.py`** | **Model 1: Market Regime Classifier (XGBoost)** | **REUSE** | Trained multi-class XGBoost model (`Bullish`, `Bearish`, `Sideways`). |
| **`src/models/direction/direction_model.py`** | **Model 2: Price Direction Model (XGBoost)** | **REUSE** | Trained multi-horizon direction classifier (1, 5, 20 candles). |
| **`src/models/volatility/volatility_model.py`** | **Model 3: Volatility Model (XGBoost Regressor)** | **REUSE** | Trained volatility regressor predicting risk scores. |
| **`src/models/lstm/lstm_model.py`** | **Model 4: PyTorch LSTM & GRU Models** | **REUSE** | Trained PyTorch sequence classification models. |
| **`src/models/transformer/transformer_model.py`**| **Model 5: PyTorch Temporal Transformer** | **REUSE** | Trained multi-head self-attention sequence transformer. |
| **`src/models/gnn/gnn_model.py`** | **Model 6: PyTorch Market Graph GNN** | **REUSE** | Correlation GNN building asset relationship embeddings. |
| **`src/models/financial_nlp/financial_nlp.py`**| **Model 7: Financial Statement NLP** | **REUSE** | Non-hallucinated audited financial statement summaries. |
| **`src/models/news_nlp/news_nlp.py`** | **Model 8: News & Event NLP** | **REUSE** | News sentiment scoring and event classification pipeline. |
| **`src/models/ensemble/ensemble_engine.py`**| `EnsembleDecisionEngine` | **REUSE** | Weighted meta-classifier generating `BUY`/`SELL`/`HOLD`/`NO_TRADE` + confidence & AI rationale. |
| **`src/risk/risk_engine.py`** | `RiskEngine` | **REUSE** | VaR 95%, Max Drawdown, and mandatory `NO_TRADE` circuit breaker. |
| **`src/backtest/backtesting_engine.py`**| `BacktestingEngine` | **REUSE** | Walk-forward strategy backtest simulator with fees & slippage. |
| **`src/api/app.py`** | FastAPI REST API Gateway | **REFACTOR** | Expand with WebSocket endpoints (`/ws/market/{symbol}`, `/ws/prediction/{symbol}`, `/ws/news/{symbol}`) and Pydantic schemas. |
| **`dashboard/app.py`** | Streamlit Dashboard (12 pages) | **REFACTOR** | Retain as permanent **Internal Data Science, Research, Model Monitoring & Experimentation Lab** (`streamlit/`). |
| **`frontend-next/`** | Next.js + React + TypeScript + Tailwind CSS | **REBUILD** | Upgrade into full production-grade primary web application. |
| **`Dockerfile` & `docker-compose.yml`** | Container packaging | **REFACTOR** | Multi-container compose including Next.js, FastAPI, Streamlit, PostgreSQL, Redis, Worker. |
