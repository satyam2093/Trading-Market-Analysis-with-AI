# MARKET_DATA_ROOT_CAUSE_REPORT.md — NexQuant Critical Data & Auth Audit

## 1. Executive Summary
An exhaustive audit of NexQuant's data ingestion, API contracts, WebSocket pipelines, and frontend components was conducted to identify the sources of incorrect stock prices, simulated live data, `0.00` display bugs, homepage inaccuracies, and the persistent "Get Started" button for authenticated users.

---

## 2. Root Cause Analysis by Area

### A. Incorrect Stock, Crypto & Index Prices
* **Root Cause 1 — Hardcoded Demo Arrays on Frontend**:
  - `frontend-next/app/page.tsx` contained a hardcoded `featuredAssets` array with static demo prices (`BTC = 108421.32`, `NVDA = 128.50`, `RELIANCE.NS = 2980.40`, `ETH = 3450.80`).
  - `frontend-next/app/discover/page.tsx` contained a hardcoded `defaultTrending` array with static demo prices (`BTC = $108,421.32`, `AAPL = $224.20`, `TCS.NS = ₹4,120.10`).
  - These static values conflicted directly with the real live provider data (e.g., actual NVDA ~$218.29, RELIANCE ~$1,257.50, BTC ~$77,246).
* **Root Cause 2 — Static Fallback Catalog in Backend**:
  - `src/data/market_data.py` contained `ASSET_PRICE_CATALOG` with outdated baseline numbers that were occasionally returned when yfinance fast info was bypassed.

### B. Display of `0.00` for Missing or Pending Prices
* **Root Cause**:
  - In `app/assets/[symbol]/page.tsx` and various asset cards, numeric properties (`price`, `change`, `open`, `volume`) were defaulted to `0` or numeric `0.00`.
  - When data was still loading or temporarily unavailable from the provider, the UI formatted numeric `0` as `$0.00` or `₹0.00` instead of rendering a descriptive state (`Loading price…`, `Price unavailable`, or `Market closed`).

### C. Real-Time WebSocket Streaming & Simulated Ticks
* **Root Cause**:
  - In `src/api/app.py`, `@app.websocket("/ws/market/{symbol}")` ran a background task that fetched 30-day historical data every 3 seconds and injected synthetic pseudo-random jitter `(np.random.rand() - 0.49) * 0.0004 * price`.
  - This violated the real-data governance rule by fabricating ticks rather than emitting genuine provider quotes.
  - The WebSocket endpoint did not adapt to the user's active timeframe (`1m`, `5m`, `15m`, `1h`, `1d`).

### D. Asset Symbol & Exchange Mapping
* **Root Cause**:
  - Symbols without exchange suffixes (e.g. `RELIANCE` vs `RELIANCE.NS`, `BTC` vs `BTC-USD`) were resolved inconsistently across different endpoints.
  - Indian NSE equities require `.NS` on Yahoo Finance, Cryptos require `-USD`, and US equities use raw symbols.
  - Without a centralized normalization layer, some searches sent unformatted symbols directly to the provider, resulting in 404 / empty responses that cascaded into `0.00` fallbacks.

### E. Authenticated UI Showing "Get Started"
* **Root Cause 1 — Hero Section Missing Auth Check**:
  - In `frontend-next/app/page.tsx`, the Hero CTA button `<button onClick={() => setAuthOpen(true)}>Get Started</button>` was rendered unconditionally without checking `isAuthenticated`.
* **Root Cause 2 — Client-Side Hydration Flash in Navbar**:
  - In `frontend-next/components/Navbar.tsx`, `isAuthenticated` was initialized to `false` (`useState(false)`). During server rendering and before client `useEffect` executed, the logged-out state ("Sign In" & "Get Started") was rendered, causing a flash and hydration mismatch.
* **Root Cause 3 — Lack of Centralized Auth Context**:
  - Auth state was stored in `localStorage` without a shared React context or event emitter, meaning changes in auth status in one component did not immediately update other components without a full page reload.

---

## 3. Traced Asset Profiles

| Asset | Type | Exchange | Expected Currency | Real Provider Price | Previous Static Bug |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RELIANCE** | Stock | NSE | INR (₹) | ₹1,257.50 | Hardcoded ₹2,980.40 on homepage |
| **NVDA** | Stock | NASDAQ | USD ($) | $218.29 | Hardcoded $128.50 on homepage |
| **BTC** | Crypto | Global/Binance | USD ($) | $77,246.56 | Hardcoded $108,421.32 on homepage |
| **TCS** | Stock | NSE | INR (₹) | ₹2,200.80 | Hardcoded ₹4,120.10 on discover page |

---

## 4. Remediation Plan
1. **Centralized Market Data Service & Normalization (`src/services/market_data_service.py`, `src/api/app.py`)**:
   - Provide a single unified endpoint `/api/v1/market/overview` and `/api/v1/market-data/{symbol}` returning real, validated provider quotes with currency and session status.
   - Remove all fake random noise from WebSockets; stream genuine live quotes.
2. **Remove All Frontend Hardcoded Arrays**:
   - Replace static `featuredAssets` on Homepage with dynamic live query to `/api/v1/market/overview` and `/api/v1/market-data`.
   - Replace static `defaultTrending` on Discover page with live asset search results.
3. **No `0.00` Fallbacks**:
   - Handle `null`, `undefined`, `0`, and loading states explicitly with skeleton loaders and "Price unavailable" badges.
4. **Centralized Authentication Context & Reactive State (`frontend-next/context/AuthContext.tsx`)**:
   - Implement `AuthContext` supporting `authLoading`, `isAuthenticated`, `user`, `login()`, `logout()`.
   - Update `Navbar.tsx` and `HomePage` hero / CTA sections to show "Dashboard" / "My Watchlist" / "Sign Out" when authenticated, and "Sign In" / "Get Started" only when unauthenticated.
