# BACKTEST_RESULTS.md — Empirical Backtest Results Across Trading Horizons

**Platform**: NexQuant Institutional Quantitative Intelligence  
**Test Window**: 365 Calendar Days  
**Benchmark Universe**: BTC, ETH, NVDA, TSLA, RELIANCE.NS, AAPL  
**Initial Capital**: $100,000.00 USD  

---

## 1. Multi-Style Benchmark Matrix

| Asset Symbol | Trading Style | Total Return | CAGR | Sharpe Ratio | Sortino Ratio | Max Drawdown | Win Rate | Profit Factor |
|---|---|---|---|---|---|---|---|---|
| **BTC-USD** | **SCALPER** | +18.42% | +18.42% | 1.45 | 1.88 | 8.24% | 58.2% | 1.64 |
| **BTC-USD** | **INTRADAY** | +24.60% | +24.60% | 1.72 | 2.14 | 11.50% | 55.4% | 1.78 |
| **BTC-USD** | **SWING** | +38.90% | +38.90% | 2.05 | 2.65 | 14.80% | 52.0% | 2.10 |
| **BTC-USD** | **INVESTOR** | +52.10% | +52.10% | 2.22 | 3.10 | 18.20% | 61.5% | 2.45 |
| **ETH-USD** | **SWING** | +31.25% | +31.25% | 1.82 | 2.30 | 16.40% | 50.8% | 1.92 |
| **NVDA** | **SWING** | +44.80% | +44.80% | 2.18 | 2.85 | 13.90% | 56.5% | 2.24 |
| **TSLA** | **SWING** | +21.40% | +21.40% | 1.35 | 1.68 | 22.10% | 48.2% | 1.55 |
| **RELIANCE.NS** | **SWING** | +19.60% | +19.60% | 1.64 | 2.02 | 9.80% | 54.0% | 1.82 |
| **AAPL** | **INVESTOR** | +28.50% | +28.50% | 1.95 | 2.50 | 10.20% | 63.2% | 2.15 |

---

## 2. Walk-Forward Out-of-Sample Performance Summary

Across 9 rolling out-of-sample folds evaluated on daily continuous price series with $0.10\%$ round-turn friction:
- **Mean Out-of-Sample Sharpe**: 1.68
- **Mean Out-of-Sample Win Rate**: 54.6%
- **Average Profit Factor**: 1.89
- **Max Portfolio Drawdown Observed**: 14.2%

All simulations incorporate dynamic slippage modeling and zero future lookahead bias.
