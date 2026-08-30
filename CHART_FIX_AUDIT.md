# CHART_FIX_AUDIT.md — NexQuant Live Market Chart Diagnosis

## 1. Current Chart Architecture
- **Frontend Chart Library**: TradingView Lightweight Charts (`lightweight-charts` v5.0.9).
- **Frontend Components**:
  - `frontend-next/components/charts/TradingViewChart.tsx`: Lightweight Charts wrapper rendering CandlestickSeries, HistogramSeries (Volume), and LineSeries (EMA 20 & EMA 50).
  - `frontend-next/app/assets/[symbol]/page.tsx`: Asset terminal managing historical load via REST API and live updates via WebSocket.
  - `frontend-next/lib/useWebSocket.ts`: Hook for WebSocket connection management (`useMarketWebSocket`).
- **Backend Streaming & API Layer**:
  - `src/api/app.py`:
    - REST: `GET /api/v1/market-data/{asset_id}?timeframe={tf}&limit={limit}`
    - WebSocket: `ws://localhost:8000/ws/market/{symbol}?timeframe={tf}`
  - `src/services/market_data_service.py`: Caching and orchestration layer.
  - `src/data/market_data.py` & `src/data/crypto_data.py`: Providers fetching real OHLCV data from `yfinance`.
  - `src/services/asset_discovery.py`: Symbol metadata and exchange catalog.

---

## 2. Current Historical Data Flow
1. User opens `/assets/[symbol]` (or changes timeframe `1m`, `5m`, `15m`, `1h`, `1d`, `1w`).
2. `AssetTerminalPage` calls `fetchMarketData(symbol, timeframe)`.
3. Backend `get_market_data` fetches historical OHLCV from `MarketDataService`.
4. Indicators (EMA 20, EMA 50, RSI 14, MACD, Candlestick patterns) are computed server-side and returned as an array of JSON records.
5. Frontend passes records to `TradingViewChart` via `data` prop.

---

## 3. Current Live Data Flow
1. `AssetTerminalPage` invokes `useMarketWebSocket(symbol)`.
2. Client opens WebSocket connection to `ws://localhost:8000/ws/market/{symbol}`.
3. Backend `websocket_market` launches background task `_sender()` in an async loop.
4. Backend emits JSON payload every few seconds with `{ price, open, high, low, volume, timestamp, data_status }`.
5. Frontend receives payload in `useMarketWebSocket`, updating `price` in `page.tsx`, which triggers `livePrice` prop update on `TradingViewChart`.

---

## 4. Exact Failure Points & Root Causes

### Issue 1: Intraday Timestamp Incompatibility in Lightweight Charts
- **Root Cause**: `TradingViewChart.tsx` truncated all timestamps to `YYYY-MM-DD` strings (`dateStr = date.toISOString().split("T")[0]`).
- **Impact**: For intraday timeframes (`1m`, `5m`, `15m`, `1h`), all intraday candles on the same day had identical string keys (`"2026-08-30"`). Lightweight Charts strictly requires Unix timestamps in seconds (e.g. `1725000000` as a number) for intraday data, causing candle collisions and failed chart rendering.

### Issue 2: Improper Live Candle Update & Creation Logic
- **Root Cause**: In `TradingViewChart.tsx`, incoming ticks only modified `lastCandleRef.current` with `time: current.time`. It never compared `incoming.time` against `current.time`.
- **Impact**: When a new minute/hour/day candle interval began, the chart never appended a new candle bar; instead, it continued overwriting the old candle.

### Issue 3: Simulated Jitter & Timeframe Decoupling in Backend WebSocket
- **Root Cause**: Backend `websocket_market` in `src/api/app.py` applied artificial random noise `(np.random.rand() - 0.49) * 0.0004 * price` and always fetched `timeframe="1d"`, ignoring the user's selected timeframe on the chart.
- **Impact**: WebSocket was not sending real market quotes/ticks matching the active chart timeframe, violating the strict real-data rule.

### Issue 4: Inefficient Chart Re-creation on Prop Changes
- **Root Cause**: `useEffect` in `TradingViewChart.tsx` had `rawCandles.length` in its dependency array and called `chartRef.current.remove()` on every update.
- **Impact**: The entire chart canvas was destroyed and recreated on each update cycle, causing UI flickers, broken tooltips, and lost pan/zoom state.

### Issue 5: Disconnected Live Status UI
- **Root Cause**: The chart header displayed a static `<span className="...">LIVE STREAM</span>` without checking true WebSocket connection state, reconnection status, or market open/closed status.

---

## 5. Minimal Surgical Fix Plan
1. **Backend (`src/api/app.py` & `src/data/`)**:
   - Update `/ws/market/{symbol}` to support query parameter `timeframe` (default `"1d"`).
   - In WebSocket streaming loop, obtain real live market ticks (via live fast quote / Binance live stream for crypto / real exchange ticker for equities) without artificial random increments.
   - Accurately tag session status (`LIVE`, `MARKET_CLOSED`, `DELAYED`).
   - Format timestamps as integer UTC Unix timestamps (in seconds) for intraday timeframes and `YYYY-MM-DD` for daily/weekly.
2. **Frontend WebSocket Hook (`frontend-next/lib/useWebSocket.ts`)**:
   - Support `timeframe` in `useMarketWebSocket(symbol, timeframe)`.
   - Track connection states (`CONNECTED`, `RECONNECTING`, `CLOSED`) and provide `lastUpdated` timestamp.
   - Cleanly close and reconnect WebSocket when symbol or timeframe changes with backoff.
3. **Frontend Chart Component (`frontend-next/components/charts/TradingViewChart.tsx`)**:
   - Support both Unix seconds (`number`) and `YYYY-MM-DD` dates cleanly based on timeframe.
   - Implement genuine candle update logic: if incoming tick timestamp matches current candle interval, update `high`, `low`, `close`, `volume`; if incoming tick timestamp exceeds current candle interval, start and append a new candle.
   - Incrementally update series via `series.update()` without tearing down the chart instance.
   - Render dynamic live status badge (`● LIVE`, `○ RECONNECTING`, `◷ DELAYED`, `○ MARKET CLOSED`) and `Last update: HH:MM:SS`.
4. **Asset Page (`frontend-next/app/assets/[symbol]/page.tsx`)**:
   - Connect `timeframe` to `useMarketWebSocket(symbol, timeframe)`.
   - Pass live WebSocket connection status and real ticks to `TradingViewChart`.
