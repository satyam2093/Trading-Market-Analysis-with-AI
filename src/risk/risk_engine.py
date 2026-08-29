import logging
from typing import Dict, Any
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

class RiskEngine:
    """
    Phase 9: Risk Engine.
    Evaluates market risk, calculates Value at Risk (VaR), Maximum Drawdown,
    and enforces mandatory NO_TRADE overrides during extreme volatility spikes.
    """

    def calculate_var(self, returns: pd.Series, confidence_level: float = 0.95) -> float:
        """Calculates Historical Value at Risk (VaR)."""
        if returns.empty:
            return 0.0
        cutoff = (1.0 - confidence_level) * 100
        var_val = float(np.percentile(returns, cutoff))
        return round(abs(var_val), 4)

    def calculate_max_drawdown(self, prices: pd.Series) -> float:
        """Calculates Maximum Peak-to-Trough Drawdown."""
        if prices.empty or len(prices) < 2:
            return 0.0
        cum_max = prices.cummax()
        drawdowns = (prices - cum_max) / cum_max
        max_dd = float(drawdowns.min())
        return round(abs(max_dd), 4)

    def evaluate_risk(self, df: pd.DataFrame, expected_volatility: float = 0.20) -> Dict[str, Any]:
        """
        Evaluates overall risk profile based on prices, volatility, and returns.
        """
        if df.empty or len(df) < 5:
            return {
                "risk_level": "MEDIUM",
                "risk_score": 50.0,
                "var_95": 0.02,
                "max_drawdown": 0.05,
                "override_no_trade": False,
                "risk_warnings": ["Insufficient historical data for deep risk evaluation."]
            }

        returns = df["close"].pct_change().dropna()
        var_95 = self.calculate_var(returns, confidence_level=0.95)
        max_dd = self.calculate_max_drawdown(df["close"])

        # Determine Risk Score (0-100)
        vol_score = min(40.0, expected_volatility * 100.0)
        var_score = min(30.0, var_95 * 500.0)
        dd_score = min(30.0, max_dd * 100.0)

        risk_score = round(vol_score + var_score + dd_score, 2)
        risk_score = min(100.0, max(0.0, risk_score))

        warnings = []
        override_no_trade = False

        if risk_score >= 80.0 or expected_volatility > 0.60 or max_dd > 0.40:
            risk_level = "EXTREME"
            override_no_trade = True
            warnings.append("EXTREME RISK DETECTED: High volatility spike or severe drawdown. Circuit breaker triggered!")
        elif risk_score >= 60.0:
            risk_level = "HIGH"
            warnings.append("HIGH RISK: Elevated price variance. Exercise caution.")
        elif risk_score >= 30.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "var_95": var_95,
            "max_drawdown": max_dd,
            "expected_volatility": round(expected_volatility, 4),
            "override_no_trade": override_no_trade,
            "risk_warnings": warnings
        }
