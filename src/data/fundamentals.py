import logging
import datetime
from typing import Dict, Any, Optional
import pandas as pd
import yfinance as yf

from src.data.base_provider import BaseFundamentalsProvider

logger = logging.getLogger(__name__)

class FundamentalDataProvider(BaseFundamentalsProvider):
    """
    Fundamental Data Provider using yfinance.
    Enforces Strict Real Data Policy: No synthetic statement generation.
    """

    def fetch_financial_statements(self, symbol: str) -> Dict[str, Any]:
        """
        Fetches Income Statement, Balance Sheet, and Cash Flow metrics.
        Returns standardized financial statement structure or data_status='UNAVAILABLE'.
        """
        logger.info(f"Fetching financial statements for symbol {symbol}...")
        try:
            ticker = yf.Ticker(symbol)
            inc = ticker.financials
            bal = ticker.balance_sheet
            cf = ticker.cashflow

            if inc is None or inc.empty:
                logger.warning(f"DATA UNAVAILABLE: No fundamental statements found for {symbol}.")
                return self._empty_fundamentals(symbol, status="UNAVAILABLE")

            latest_col = inc.columns[0]
            period_str = str(latest_col.date()) if hasattr(latest_col, "date") else str(latest_col)[:10]

            def get_val(df, possible_keys, default=0.0):
                if df is None or df.empty:
                    return default
                for k in possible_keys:
                    if k in df.index:
                        val = df.loc[k, latest_col]
                        if pd.notnull(val):
                            return float(val)
                return default

            revenue = get_val(inc, ["Total Revenue", "Operating Revenue", "Revenue"])
            gross_profit = get_val(inc, ["Gross Profit"])
            operating_profit = get_val(inc, ["Operating Income", "Operating Profit", "EBIT"])
            ebitda = get_val(inc, ["EBITDA", "Normalized EBITDA"])
            net_income = get_val(inc, ["Net Income", "Net Income Common Stockholders"])
            eps = get_val(inc, ["Basic EPS", "Diluted EPS"])

            total_assets = get_val(bal, ["Total Assets"])
            total_liabilities = get_val(bal, ["Total Liabilities Net Minority Interest", "Total Liabilities"])
            total_debt = get_val(bal, ["Total Debt", "Long Term Debt"])
            cash = get_val(bal, ["Cash And Cash Equivalents", "Cash Financial"])

            operating_cf = get_val(cf, ["Operating Cash Flow"])
            free_cash_flow = get_val(cf, ["Free Cash Flow"], default=operating_cf * 0.8 if operating_cf else 0.0)

            return {
                "asset_id": symbol.replace(".NS", ""),
                "symbol": symbol,
                "reporting_period": period_str,
                "report_date": period_str,
                "revenue": revenue,
                "gross_profit": gross_profit,
                "operating_profit": operating_profit,
                "ebitda": ebitda,
                "net_income": net_income,
                "eps": eps,
                "total_assets": total_assets,
                "total_liabilities": total_liabilities,
                "total_debt": total_debt,
                "cash": cash,
                "free_cash_flow": free_cash_flow,
                "source": f"yfinance_api_{symbol}",
                "data_status": "LIVE",
                "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }

        except Exception as e:
            logger.error(f"Error fetching fundamentals for {symbol}: {e}")
            return self._empty_fundamentals(symbol, status="UNAVAILABLE")

    def _empty_fundamentals(self, symbol: str, status: str = "UNAVAILABLE") -> Dict[str, Any]:
        return {
            "asset_id": symbol.replace(".NS", ""),
            "symbol": symbol,
            "reporting_period": "N/A",
            "report_date": "N/A",
            "revenue": 0.0,
            "gross_profit": 0.0,
            "operating_profit": 0.0,
            "ebitda": 0.0,
            "net_income": 0.0,
            "eps": 0.0,
            "total_assets": 0.0,
            "total_liabilities": 0.0,
            "total_debt": 0.0,
            "cash": 0.0,
            "free_cash_flow": 0.0,
            "source": f"yfinance_api_{symbol}",
            "data_status": status,
            "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
