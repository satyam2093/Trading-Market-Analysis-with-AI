import logging
from typing import Dict, Any, List
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

class BacktestingEngine:
    """
    Phase 10: Walk-Forward Backtesting Engine.
    Simulates historical execution using model signals with realistic transaction costs & slippage.
    """

    def __init__(self, initial_capital: float = 100000.0, fee_pct: float = 0.001, slippage_pct: float = 0.0005):
        self.initial_capital = initial_capital
        self.fee_pct = fee_pct
        self.slippage_pct = slippage_pct

    def run_backtest(self, df_with_signals: pd.DataFrame) -> Dict[str, Any]:
        """
        Executes strategy simulation.
        Input DataFrame must contain 'timestamp', 'close', and 'signal' ('BUY', 'SELL', 'HOLD', 'NO_TRADE').
        """
        if df_with_signals.empty or "signal" not in df_with_signals.columns:
            raise ValueError("Input DataFrame must contain price data and 'signal' column.")

        cash = self.initial_capital
        position = 0.0  # Units of asset held
        entry_price = 0.0
        equity_curve = []
        trades = []

        for idx, row in df_with_signals.iterrows():
            price = float(row["close"])
            signal = str(row.get("signal", "HOLD")).upper()
            ts = str(row["timestamp"])

            # Execute trade logic
            if signal == "BUY" and cash > 0 and position == 0:
                # Buy asset
                execution_price = price * (1 + self.slippage_pct)
                fee = cash * self.fee_pct
                investable = cash - fee
                position = investable / execution_price
                cash = 0.0
                entry_price = execution_price

                trades.append({
                    "type": "BUY",
                    "timestamp": ts,
                    "price": round(execution_price, 4),
                    "units": round(position, 4),
                    "fee": round(fee, 2)
                })

            elif signal == "SELL" and position > 0:
                # Sell asset
                execution_price = price * (1 - self.slippage_pct)
                gross_proceeds = position * execution_price
                fee = gross_proceeds * self.fee_pct
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
                    "pnl_pct": round(pnl_pct, 4)
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

        # Calculate metrics
        returns = eq_series.pct_change().dropna()
        sharpe = (returns.mean() / (returns.std() + 1e-8)) * np.sqrt(252) if len(returns) > 1 else 0.0

        cum_max = eq_series.cummax()
        max_dd = float(((eq_series - cum_max) / cum_max).min())

        closed_trades = [t for t in trades if t["type"] == "SELL"]
        winning_trades = [t for t in closed_trades if t.get("pnl", 0) > 0]
        win_rate = len(winning_trades) / len(closed_trades) if closed_trades else 0.0

        return {
            "initial_capital": self.initial_capital,
            "final_equity": round(eq_series.iloc[-1], 2),
            "total_return_pct": round(total_return * 100, 2),
            "sharpe_ratio": round(float(sharpe), 2),
            "max_drawdown_pct": round(abs(max_dd) * 100, 2),
            "total_trades": len(closed_trades),
            "win_rate_pct": round(win_rate * 100, 2),
            "equity_curve": equity_curve,
            "trade_log": trades
        }
