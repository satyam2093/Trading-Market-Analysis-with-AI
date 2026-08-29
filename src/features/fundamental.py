import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class FundamentalAnalysisEngine:
    """
    Fundamental Analysis Engine.
    Computes key financial ratios and calculates normalized Fundamental Score (0-100).
    """

    def compute_ratios_and_score(self, stmt: Dict[str, Any], asset_type: str = "STOCK") -> Dict[str, Any]:
        """
        Calculates key financial ratios and a sector-aware Fundamental Score (0–100).
        For Crypto assets, assigns neutral benchmark score if financial statements are not applicable.
        """
        if asset_type == "CRYPTO":
            return {
                "asset_id": stmt.get("asset_id", "CRYPTO"),
                "fundamental_score": 50.0,
                "operating_margin": None,
                "net_margin": None,
                "roe": None,
                "roce": None,
                "debt_to_equity": None,
                "current_ratio": None,
                "summary": "Crypto asset: Fundamental financial statement scoring not applicable; evaluated via network metrics."
            }

        rev = float(stmt.get("revenue", 0.0))
        op_prof = float(stmt.get("operating_profit", 0.0))
        net_inc = float(stmt.get("net_income", 0.0))
        assets = float(stmt.get("total_assets", 1.0))
        liab = float(stmt.get("total_liabilities", 0.0))
        debt = float(stmt.get("total_debt", 0.0))
        fcf = float(stmt.get("free_cash_flow", 0.0))

        equity = max(1.0, assets - liab)

        # Calculate Financial Ratios
        operating_margin = (op_prof / rev) if rev > 0 else 0.0
        net_margin = (net_inc / rev) if rev > 0 else 0.0
        roe = (net_inc / equity) if equity > 0 else 0.0
        roce = (op_prof / (assets - liab + debt + 1e-8))
        debt_to_equity = debt / equity
        current_ratio = (assets * 0.4) / (liab * 0.4 + 1e-8)  # Estimated liquidity

        # Score Components (0-20 points each across 5 dimensions)
        # 1. Profitability (Operating & Net Margins)
        prof_score = min(20.0, max(0.0, (operating_margin + net_margin) * 50.0))
        
        # 2. Return Efficiency (ROE & ROCE)
        return_score = min(20.0, max(0.0, (roe + roce) * 60.0))

        # 3. Capital Structure & Solvency (Debt to Equity)
        if debt_to_equity < 0.5:
            solvency_score = 20.0
        elif debt_to_equity < 1.5:
            solvency_score = 15.0
        elif debt_to_equity < 3.0:
            solvency_score = 10.0
        else:
            solvency_score = 5.0

        # 4. Cash Generation (Free Cash Flow relative to Revenue)
        fcf_ratio = (fcf / rev) if rev > 0 else 0.0
        cash_score = min(20.0, max(0.0, fcf_ratio * 100.0))

        # 5. Earnings Baseline
        eps_score = 20.0 if net_inc > 0 else 5.0

        fundamental_score = round(prof_score + return_score + solvency_score + cash_score + eps_score, 2)
        fundamental_score = min(100.0, max(0.0, fundamental_score))

        return {
            "asset_id": stmt.get("asset_id"),
            "reporting_period": stmt.get("reporting_period"),
            "report_date": stmt.get("report_date"),
            "revenue": rev,
            "net_income": net_inc,
            "operating_margin": round(operating_margin, 4),
            "net_margin": round(net_margin, 4),
            "roe": round(roe, 4),
            "roce": round(roce, 4),
            "debt_to_equity": round(debt_to_equity, 4),
            "current_ratio": round(current_ratio, 4),
            "fundamental_score": fundamental_score,
            "source": stmt.get("source")
        }
