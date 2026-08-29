from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import pandas as pd

class BaseMarketDataProvider(ABC):
    """
    Abstract Base Class for Market Data Ingestion.
    Enforces standardized contracts and strict data governance (No Synthetic Data).
    """

    @abstractmethod
    def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str = "1d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 500
    ) -> pd.DataFrame:
        """
        Fetch OHLCV historical market data.
        Returned DataFrame MUST contain canonical columns:
        ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        with 'timestamp' in UTC datetime format.
        If data is unavailable, returns empty DataFrame with data_status attribute.
        """
        pass

    @abstractmethod
    def get_supported_timeframes(self) -> List[str]:
        """Returns list of supported timeframe codes."""
        pass


class BaseFundamentalsProvider(ABC):
    """
    Abstract Base Class for Fundamental Financial Data Ingestion.
    """

    @abstractmethod
    def fetch_financial_statements(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch Income Statement, Balance Sheet, and Cash Flow data.
        Returns dict containing financial metrics or data_status='UNAVAILABLE'.
        """
        pass


class BaseNewsProvider(ABC):
    """
    Abstract Base Class for News & Sentiment Ingestion.
    """

    @abstractmethod
    def fetch_recent_news(self, symbol: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetch recent news items for the given symbol.
        Returns list of news items or empty list if unavailable.
        """
        pass
