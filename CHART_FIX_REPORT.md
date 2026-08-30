# NexQuant Live Chart Fix Report

## Root cause

The application uses TradingView Lightweight Charts.  Its chart adapter reduced every
timestamp to a calendar day, so intraday OHLCV bars collided.  It also updated the
same candle for every incoming tick, never opening the next interval.  The client did
not include its active timeframe in the WebSocket URL and showed a static live badge.
The server could additionally make stale historical or generated data appear live.

## Files changed

- `frontend-next/components/charts/TradingViewChart.tsx`
- `frontend-next/lib/useWebSocket.ts`
- `frontend-next/app/assets/[symbol]/page.tsx`
- `frontend-next/types/market.ts`
- `src/api/app.py`
- `src/services/market_data_service.py`
- `src/data/market_data.py`
- `CHART_FIX_AUDIT.md`
- `CHART_FIX_REPORT.md`

## Data flow

`yfinance real quote -> MarketDataService -> /ws/market/{symbol}?timeframe=... ->
useMarketWebSocket -> TradingViewChart.update()`.

Historical OHLCV remains separately loaded through
`GET /api/v1/market-data/{asset_id}?timeframe=...`.

## Fix

- Historical timestamps are converted to ordered UTC Unix seconds and deduplicated.
- Live ticks are bucketed to the selected interval.  The current candle is updated;
  a later bucket creates one new candle; older ticks are ignored.
- The Lightweight Charts instance is created once and receives incremental updates.
- Symbol/timeframe changes close the old socket, open a URL scoped to the new
  timeframe, and use exponential reconnect backoff.
- The chart status and last-update value now derive from the actual socket payload.
- Synthetic candles, random quote movement, and historical replay as live data are
  not used.  Provider failure reports `UNAVAILABLE` (or `MARKET_CLOSED`) instead.

## Verification

- `npx tsc --noEmit` completed successfully.
- `git diff --check` completed successfully.
- The local Windows environment has no Python executable, so the FastAPI runtime
  could not be started here.  Live provider verification still requires running the
  configured Docker/Python environment while the relevant markets are open.

## Live status

`LIVE` requires both an open WebSocket and a valid real quote.  `RECONNECTING` is
shown while the socket reconnects; `DELAYED` comes from the provider payload; and
`MARKET CLOSED` comes from the backend session check.

## Known limitations

The configured provider is yfinance, which is a polling quote source rather than a
provider WebSocket.  The NexQuant WebSocket therefore pushes fresh server-side real
quotes every two seconds.  Availability and timeliness remain subject to yfinance and
market-session coverage; the UI deliberately does not fabricate movement when it has
no current quote.
