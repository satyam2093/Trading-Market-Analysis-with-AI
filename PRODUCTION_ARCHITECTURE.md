# PRODUCTION ARCHITECTURE: AI Market Intelligence Platform

**Architecture Version:** 2.0 Enterprise Monorepo  
**Target Environment:** Production Docker Multi-Container Architecture  

---

## 1. System High-Level Topology

```text
                                        USERS / CLIENTS
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       │                                               │
                       ▼                                               ▼
          ┌─────────────────────────┐                     ┌─────────────────────────┐
          │     NEXT.JS / REACT     │                     │        STREAMLIT        │
          │ User-Facing Web Terminal│                     │ Internal Research & ML  │
          │  (Port 3000 / Next.js)  │                     │   Lab (Port 8501)       │
          └────────────┬────────────┘                     └────────────┬────────────┘
                       │                                               │
               REST / WebSockets                               REST Calls
                       │                                               │
                       └───────────────────────┬───────────────────────┘
                                               │
                                               ▼
                                  ┌─────────────────────────┐
                                  │       FASTAPI API       │
                                  │      GATEWAY SERVER     │
                                  │       (Port 8000)       │
                                  └────────────┬────────────┘
                                               │
                      ┌────────────────────────┼────────────────────────┐
                      ▼                        ▼                        ▼
           ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
           │ Market Data Engine │   │   AI / ML Engine   │   │  News & Event NLP  │
           │  (yfinance / CCXT) │   │ (8 Core AI Models) │   │  Sentiment Engine  │
           └──────────┬─────────┘   └──────────┬─────────┘   └──────────┬─────────┘
                      │                        │                        │
                      └────────────────────────┼────────────────────────┘
                                               │
                                               ▼
                                  ┌─────────────────────────┐
                                  │    REDIS EVENT & CACHE  │
                                  │    (Pub/Sub & Price LRU)│
                                  └────────────┬────────────┘
                                               │
                                               ▼
                                  ┌─────────────────────────┐
                                  │    POSTGRESQL / SQLITE  │
                                  │    Master Database DB   │
                                  └─────────────────────────┘
```

---

## 2. Shared Subsystem Responsibilities

### 2.1 Next.js 14 Production Website (`frontend-next/` or `frontend/`)
- Primary user-facing web application.
- Server components & client components using TanStack Query, TradingView Lightweight Charts, and Tailwind CSS.
- Connects to FastAPI via REST APIs and WebSockets (`/ws/market/{symbol}`, `/ws/prediction/{symbol}`).

### 2.2 Streamlit Internal ML Lab (`streamlit/` / `dashboard/`)
- Permanent Internal Data Science, Research, Model Monitoring, EDA, and Experimentation Platform.
- Communicates with the same backend APIs and database without duplicating model logic.

### 2.3 FastAPI API Gateway (`backend/` / `src/api/`)
- Unified API-first backend server handling authentication, data orchestration, rate limiting, REST endpoints, and WebSocket streaming.

### 2.4 Shared Python AI & Market Engine (`src/` / `backend/app/ml/`)
- Core quantitative library: Technical Engine, 17 Candlestick Engine, 8 ML/DL Models, Ensemble Decision Engine, Risk Engine (VaR 95%), and Backtester.

### 2.5 PostgreSQL & Redis Data Layer
- **PostgreSQL**: Master persistent store for assets, market prices, technicals, candlesticks, fundamentals, news, predictions, signals, watchlists, portfolios, and alerts.
- **Redis**: High-speed cache for hot prices, indicator calculations, WebSocket event broadcasting, and rate-limiting.
