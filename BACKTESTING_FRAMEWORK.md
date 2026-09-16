# BACKTESTING_FRAMEWORK.md — Institutional Walk-Forward Backtesting Specification

**Platform**: NexQuant Quantitative Intelligence  
**Author**: Quantitative Researcher & Quant Developer Team  
**System Version**: 2.2.0-Production  

---

## 1. Core Principles & Anti-Lookahead Guarantee

Backtesting within NexQuant operates under strict institutional controls designed to prevent look-ahead bias, data snooping, and unrealistic execution assumptions.

1. **Strict Temporal Separation**: No future information is exposed to model feature engineering or signal evaluation. Normalization scalers (mean, variance) and feature tables are computed exclusively on past data slices up to timestamp $t$.
2. **Dynamic Slippage & Commission Model**:
   - Every market order incurs realistic broker commission fees and market execution slippage tailored to asset liquidity and trading style turnover frequency.
   - Scalping simulations incorporate $0.05\%$ fee + $0.05\%$ slippage per fill ($0.10\%$ round-turn cost) to properly stress-test high-turnover fragility.
   - Investor simulations incorporate $0.10\%$ fee + $0.01\%$ slippage per fill.
3. **Walk-Forward Out-of-Sample Windowing**:
   - Rather than testing on the same continuous historical sample used for model fitting, the engine utilizes sequential sliding train/test folds ($K$ folds).
   - In-sample training window: $N_{\text{train}}$ bars (e.g., 120 bars).
   - Out-of-sample evaluation window: $N_{\text{test}}$ bars (e.g., 30 bars).
   - Performance metrics are aggregated exclusively across out-of-sample slices.

---

## 2. Mathematical Performance Formulations

### 2.1 Sharpe Ratio (Annualized)
$$\text{Sharpe} = \frac{\mathbb{E}[R_p - R_f]}{\sigma_p} \cdot \sqrt{252}$$
Where $R_p$ is daily strategy return, $R_f = 4.0\%$ is risk-free hurdle rate, and $\sigma_p$ is return volatility.

### 2.2 Sortino Ratio (Downside Risk Only)
$$\text{Sortino} = \frac{\mathbb{E}[R_p - R_f]}{\sigma_d} \cdot \sqrt{252}$$
Where downside deviation $\sigma_d = \sqrt{\frac{1}{N}\sum_{t=1}^N \min(0, R_{p,t} - R_{f,t})^2}$.

### 2.3 Maximum Drawdown ($DD_{\max}$)
$$DD_t = \frac{E_t - \max_{\tau \le t} E_\tau}{\max_{\tau \le t} E_\tau}, \quad DD_{\max} = \min_{t} DD_t$$
Where $E_t$ represents the strategy equity curve at time $t$.

### 2.4 Profit Factor
$$\text{Profit Factor} = \frac{\sum \text{Gross Profits}}{\sum |\text{Gross Losses}|}$$

### 2.5 Compound Annual Growth Rate (CAGR)
$$\text{CAGR} = \left( \frac{E_{\text{end}}}{E_{\text{start}}} \right)^{\frac{1}{\text{Years}}} - 1$$

---

## 3. Architecture & API Implementation

The framework is implemented in `src/backtest/backtesting_engine.py` with two core entrypoints:
- `run_backtest(df_with_signals, trading_style, stop_loss_pct, take_profit_pct)`: Single strategy run with active stop-loss and take-profit trade management.
- `run_walk_forward_backtest(df_with_features, train_window, test_window, trading_style)`: Full out-of-sample rolling cross-validation engine returning fold breakdowns and cumulative equity.

Available via REST API:
`GET /api/v1/backtest/{asset_id}?trading_style=SWING&walk_forward=true`
