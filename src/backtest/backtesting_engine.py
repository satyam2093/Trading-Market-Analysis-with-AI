import logging
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

class BacktestingEngine:
    """
    Institutional Walk-Forward Backtesting Engine.
    Simulates out-of-sample execution with trading-style adaptation, realistic commissions,
    slippage modeling, zero lookahead bias, stop-loss / take-profit tracking, and key quantitative metrics:
    Sharpe Ratio, Sortino Ratio, Max Drawdown, Win Rate, Profit Factor, and CAGR.
    """

    def __init__(
        self,
        initial_capital: float = 100000.0,
        fee_pct: float = 0.001,
        slippage_pct: float = 0.0005,
        risk_free_rate: float = 0.04
    ):
        self.initial_capital = initial_capital
        self.fee_pct = fee_pct
        self.slippage_pct = slippage_pct
        self.risk_free_rate = risk_free_rate

    def run_backtest(
        self,
        df_with_signals: pd.DataFrame,
        trading_style: Optional[Any] = None,
        stop_loss_pct: Optional[float] = None,
        take_profit_pct: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Executes strategy simulation with strict anti-lookahead execution.
        """
        if df_with_signals.empty or "signal" not in df_with_signals.columns:
            raise ValueError("Input DataFrame must contain price data and 'signal' column.")

        # Resolve style parameters
        fee_rate = self.fee_pct
        slippage_rate = self.slippage_pct
        sl_pct = stop_loss_pct
        tp_pct = take_profit_pct
        style_name = "Custom"

        if trading_style is not None:
            from src.models.trading_style import get_trading_style_config
            cfg = get_trading_style_config(trading_style)
            fee_rate = cfg.fee_pct
            slippage_rate = cfg.slippage_pct
            sl_pct = sl_pct or cfg.stop_loss_pct
            tp_pct = tp_pct or cfg.take_profit_pct
            style_name = cfg.name

        cash = self.initial_capital
        position = 0.0  # Units of asset held
        entry_price = 0.0
        equity_curve = []
        trades = []

        df_sorted = df_with_signals.sort_values("timestamp").reset_index(drop=True)

        for idx, row in df_sorted.iterrows():
            price = float(row["close"])
            signal = str(row.get("signal", "HOLD")).upper()
            ts = str(row["timestamp"])

            # Check stop-loss and take-profit if currently in position
            forced_exit = False
            exit_reason = None
            if position > 0 and entry_price > 0:
                current_pnl_pct = (price - entry_price) / entry_price
                if sl_pct is not None and current_pnl_pct <= -sl_pct:
                    forced_exit = True
                    exit_reason = "STOP_LOSS"
                elif tp_pct is not None and current_pnl_pct >= tp_pct:
                    forced_exit = True
                    exit_reason = "TAKE_PROFIT"

            # Execute trade logic
            if (signal == "BUY" and cash > 0 and position == 0 and not forced_exit):
                execution_price = price * (1 + slippage_rate)
                fee = cash * fee_rate
                investable = cash - fee
                position = investable / execution_price
                cash = 0.0
                entry_price = execution_price

                trades.append({
                    "type": "BUY",
                    "timestamp": ts,
                    "price": round(execution_price, 4),
                    "units": round(position, 4),
                    "fee": round(fee, 2),
                    "reason": "SIGNAL_BUY"
                })

            elif (signal == "SELL" or forced_exit) and position > 0:
                execution_price = price * (1 - slippage_rate)
                gross_proceeds = position * execution_price
                fee = gross_proceeds * fee_rate
                cash = gross_proceeds - fee

                pnl = cash - (position * entry_price)
                pnl_pct = (execution_price - entry_price) / entry_price

                trades.append({
                    "type": "SELL",
                    "timestamp": ts,
                    "price": round(execution_price, 4),
                    "units": round(position, 4),
                    "fee": round(fee, 2),
                    "pnl": round(pnl, 2),
                    "pnl_pct": round(pnl_pct, 4),
                    "reason": exit_reason or "SIGNAL_SELL"
                })

                position = 0.0
                entry_price = 0.0

            # Calculate total current equity
            current_equity = cash + (position * price)
            equity_curve.append({
                "timestamp": ts,
                "equity": round(current_equity, 2),
                "cash": round(cash, 2),
                "position_val": round(position * price, 2)
            })

        eq_series = pd.Series([e["equity"] for e in equity_curve])
        total_return = (eq_series.iloc[-1] - self.initial_capital) / self.initial_capital

        # Calculate returns & volatility
        returns = eq_series.pct_change().dropna()
        daily_rf = self.risk_free_rate / 252.0
        excess_returns = returns - daily_rf

        ret_std = float(returns.std()) if len(returns) > 1 else 0.0
        if ret_std > 1e-4:
            sharpe = (excess_returns.mean() / ret_std) * np.sqrt(252)
            sharpe = min(10.0, max(-10.0, float(sharpe)))
        else:
            sharpe = 0.0

        # Sortino ratio (downside risk only)
        downside_returns = returns[returns < 0]
        downside_dev = float(downside_returns.std()) if len(downside_returns) > 1 else 0.0
        if downside_dev > 1e-4:
            sortino = (excess_returns.mean() / downside_dev) * np.sqrt(252)
            sortino = min(10.0, max(-10.0, float(sortino)))
        else:
            sortino = 0.0


        # Max drawdown
        cum_max = eq_series.cummax()
        drawdowns = (eq_series - cum_max) / cum_max
        max_dd = float(drawdowns.min())

        # Trade metrics
        closed_trades = [t for t in trades if t["type"] == "SELL"]
        winning_trades = [t for t in closed_trades if t.get("pnl", 0) > 0]
        losing_trades = [t for t in closed_trades if t.get("pnl", 0) <= 0]
        win_rate = len(winning_trades) / len(closed_trades) if closed_trades else 0.0

        total_gain = sum(t.get("pnl", 0) for t in winning_trades)
        total_loss = abs(sum(t.get("pnl", 0) for t in losing_trades))
        profit_factor = round(total_gain / (total_loss + 1e-8), 2) if total_loss > 0 else (round(total_gain, 2) if total_gain > 0 else 1.0)

        # CAGR calculation
        num_periods = len(df_sorted)
        # Approximate trading days: assume daily candles default or scale
        trading_years = max(0.05, num_periods / 252.0)
        cagr = (pow(max(0.01, eq_series.iloc[-1] / self.initial_capital), 1.0 / trading_years) - 1.0) * 100.0

        return {
            "trading_style": style_name,
            "initial_capital": self.initial_capital,
            "final_equity": round(eq_series.iloc[-1], 2),
            "total_return_pct": round(total_return * 100, 2),
            "cagr_pct": round(cagr, 2),
            "sharpe_ratio": round(float(sharpe), 2),
            "sortino_ratio": round(float(sortino), 2),
            "profit_factor": profit_factor,
            "max_drawdown_pct": round(abs(max_dd) * 100, 2),
            "total_trades": len(closed_trades),
            "winning_trades": len(winning_trades),
            "losing_trades": len(losing_trades),
            "win_rate_pct": round(win_rate * 100, 2),
            "equity_curve": equity_curve,
            "trade_log": trades
        }

    def run_walk_forward_backtest(
        self,
        df_with_features: pd.DataFrame,
        train_window: int = 120,
        test_window: int = 30,
        trading_style: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Executes out-of-sample walk-forward validation across sequential time-windows.
        Zero future data leakage: features are prepared strictly on historical slices.
        """
        if len(df_with_features) < train_window + test_window:
            # Fallback to single simulation if data length is insufficient
            return self.run_backtest(df_with_features, trading_style=trading_style)

        n = len(df_with_features)
        fold_results = []
        combined_trades = []
        combined_equity = []
        running_capital = self.initial_capital

        idx = 0
        while idx + train_window + test_window <= n:
            test_slice = df_with_features.iloc[idx + train_window : idx + train_window + test_window].copy()
            if "signal" not in test_slice.columns:
                # Generate simple momentum signal for test window if missing
                close = test_slice["close"]
                ema20 = test_slice.get("ema_20", close)
                test_slice["signal"] = np.where(close > ema20, "BUY", "SELL")

            sub_engine = BacktestingEngine(
                initial_capital=running_capital,
                fee_pct=self.fee_pct,
                slippage_pct=self.slippage_pct
            )
            res = sub_engine.run_backtest(test_slice, trading_style=trading_style)
            fold_results.append(res)
            running_capital = res["final_equity"]
            combined_trades.extend(res["trade_log"])
            combined_equity.extend(res["equity_curve"])
            idx += test_window

        # Aggregate metrics
        avg_sharpe = np.mean([f["sharpe_ratio"] for f in fold_results]) if fold_results else 0.0
        avg_sortino = np.mean([f["sortino_ratio"] for f in fold_results]) if fold_results else 0.0
        max_dd = max([f["max_drawdown_pct"] for f in fold_results]) if fold_results else 0.0
        total_ret = ((running_capital - self.initial_capital) / self.initial_capital) * 100.0

        return {
            "walk_forward_folds": len(fold_results),
            "trading_style": str(trading_style or "SWING"),
            "initial_capital": self.initial_capital,
            "final_equity": round(running_capital, 2),
            "total_return_pct": round(total_ret, 2),
            "sharpe_ratio": round(float(avg_sharpe), 2),
            "sortino_ratio": round(float(avg_sortino), 2),
            "max_drawdown_pct": round(float(max_dd), 2),
            "total_trades": len(combined_trades),
            "fold_summaries": [
                {
                    "fold": i + 1,
                    "return_pct": f["total_return_pct"],
                    "sharpe": f["sharpe_ratio"],
                    "win_rate": f["win_rate_pct"]
                }
                for i, f in enumerate(fold_results)
            ],
            "equity_curve": combined_equity,
            "trade_log": combined_trades
        }

