# NexQuant — Data Provider & Symbol Mapping Reference

## 1. Overview

NexQuant integrates with global financial markets across US Equities, Indian Equities (NSE/BSE), and Global Cryptocurrencies. This document specifies the provider mapping, ticker symbol normalization, and fallback hierarchy.

---

## 2. Asset Class Mapping Matrix

| Asset Class | Raw User Input / Symbol | Backend Yahoo Finance Ticker | TradingView Widget Symbol | Currency | Timezone |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **US Equities** | `NVDA` | `NVDA` | `NASDAQ:NVDA` | USD ($) | America/New_York |
| | `AAPL` | `AAPL` | `NASDAQ:AAPL` | USD ($) | America/New_York |
| | `TSLA` | `TSLA` | `NASDAQ:TSLA` | USD ($) | America/New_York |
| | `MSFT` | `MSFT` | `NASDAQ:MSFT` | USD ($) | America/New_York |
| | `GOOGL` | `GOOGL` | `NASDAQ:GOOGL` | USD ($) | America/New_York |
| **Indian Equities** | `RELIANCE` | `RELIANCE.NS` | `NSE:RELIANCE` | INR (₹) | Asia/Kolkata |
| | `TCS` | `TCS.NS` | `NSE:TCS` | INR (₹) | Asia/Kolkata |
| | `INFY` | `INFY.NS` | `NSE:INFY` | INR (₹) | Asia/Kolkata |
| | `HDFCBANK` | `HDFCBANK.NS` | `NSE:HDFCBANK` | INR (₹) | Asia/Kolkata |
| | `TATAMOTORS` | `TATAMOTORS.NS` | `NSE:TATAMOTORS` | INR (₹) | Asia/Kolkata |
| **Indices** | `^GSPC` / `SPX` | `^GSPC` | `INDEX:SPX` | USD ($) | America/New_York |
| | `^IXIC` / `NDX` | `^IXIC` | `NASDAQ:NDX` | USD ($) | America/New_York |
| | `^NSEI` / `NIFTY` | `^NSEI` | `NSE:NIFTY` | INR (₹) | Asia/Kolkata |
| | `^BSESN` / `SENSEX`| `^BSESN` | `BSE:SENSEX` | INR (₹) | Asia/Kolkata |
| **Crypto** | `BTC` / `BTC-USD` | `BTC-USD` | `BINANCE:BTCUSDT` | USD ($) | Etc/UTC |
| | `ETH` / `ETH-USD` | `ETH-USD` | `BINANCE:ETHUSDT` | USD ($) | Etc/UTC |
| | `SOL` / `SOL-USD` | `SOL-USD` | `BINANCE:SOLUSDT` | USD ($) | Etc/UTC |

---

## 3. Data Pipeline & Resolution Workflow

1. **Client Request**: Frontend passes asset symbol (e.g., `RELIANCE` or `BTC-USD`) to `/api/v1/market-data/{symbol}`.
2. **Backend Normalization**:
   - Checks if Indian equity: appends `.NS` if not present.
   - Checks if Crypto: normalizes to `SYMBOL-USD`.
   - Checks if US equity: preserves clean symbol.
3. **Primary Live Provider**: Queries `yfinance.Ticker.fast_info` to get live quotes directly from exchange servers.
4. **Validation**: Checks that price > 0, currency matches asset class, and change calculation reflects current session.
5. **WebSocket Broadcasting**: Emits normalized payload with `price`, `change`, `change_percent`, `timestamp`, and `currency`.
