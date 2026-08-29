# MASTER IMPLEMENTATION ROADMAP: AI Market Intelligence Platform

---

## Migration Strategy & Execution Order (Section 78 & 85)

```text
STEP 1: Audit Existing Project (PROJECT_AUDIT.md) ➔ [COMPLETED]
STEP 2: Define Monorepo Architecture (PRODUCTION_ARCHITECTURE.md) ➔ [COMPLETED]
STEP 3: Protect & Refactor Streamlit Application ➔ [COMPLETED]
STEP 4: Create FastAPI Backend Foundation & WebSockets ➔ [IN PROGRESS]
STEP 5: Create Next.js Production Web Foundation (`frontend-next/`) ➔ [COMPLETED]
STEP 6: End-to-End Single Asset Integration Pipeline Test (`BTC`) ➔ [NEXT IMMEDIATE STEP]
STEP 7: Expand to Full Dynamic Asset Universe (US/Indian Stocks, ETFs, Indices, Cryptos)
STEP 8: Production Multi-Container Packaging (Docker Compose, PostgreSQL, Redis)
```

---

## Step-by-Step Task Breakdown

### Phase 1: Foundation & Audit Verification (Completed)
- Audit all files, models, providers, database tables, and UI components (`PROJECT_AUDIT.md`).
- Define production monorepo architecture (`PRODUCTION_ARCHITECTURE.md`).

### Phase 2: End-to-End Single Asset Integration Pipeline Test (`BTC`)
- Connect one real asset (`BTC`) cleanly end-to-end across the full architecture:
  ```text
  Market Data Provider -> FastAPI -> AI Engine -> PostgreSQL/SQLite -> WebSocket -> Next.js / Streamlit
  ```
- Verify real-time price ingestion, technical calculation, 8-model inference, risk circuit breaker, ensemble signal generation, REST endpoint, and WebSocket stream for `BTC`.

### Phase 3: WebSockets Real-Time Data & Prediction Streaming
- Add WebSockets to FastAPI backend:
  - `/ws/market/{symbol}`: Streams live price updates and timestamp.
  - `/ws/prediction/{symbol}`: Streams live ensemble signals and model probabilities.
  - `/ws/news/{symbol}`: Streams live news sentiment feeds.

### Phase 4: Next.js Production UI Enhancement (`frontend-next/`)
- Build production Next.js pages consuming FastAPI REST & WebSocket endpoints:
  - `/` (Home page with market overview NIFTY/SENSEX/NASDAQ/BTC/ETH, top movers, market regime)
  - `/assets/[symbol]` (Primary asset analysis terminal with live candlestick chart, AI Outlook badge, confidence, technicals, fundamentals, news sentiment, risk, and model consensus)
  - `/watchlist` (User watchlist management)
  - `/portfolio` (Portfolio position tracking & asset allocation)
  - `/backtest` (Walk-forward strategy backtest simulator)
  - `/news` (Real-time news intelligence feed)

### Phase 5: Streamlit Internal Research & ML Lab (`dashboard/app.py`)
- Retain Streamlit as the internal research and model monitoring lab.
- Connect to shared backend services.

### Phase 6: Multi-Container Production Packaging
- Update `Dockerfile` and `docker-compose.yml` for Next.js, FastAPI, Streamlit, PostgreSQL, Redis, and Worker.
