import logging
import datetime
from typing import List, Optional
import pandas as pd

from src.data.base_provider import BaseMarketDataProvider
from src.data.market_data import StockMarketDataProvider

logger = logging.getLogger(__name__)

class CryptoMarketDataProvider(BaseMarketDataProvider):
    """
    Crypto Market Data Provider supporting Cryptocurrencies.
    Enforces Strict Real Data Policy: No synthetic fake data is generated.
    """

    def __init__(self):
        self._stock_provider = StockMarketDataProvider()

    def get_supported_timeframes(self) -> List[str]:
        return ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "all"]

    def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str = "1d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 500
    ) -> pd.DataFrame:
        formatted_symbol = symbol
        if not symbol.endswith("-USD") and not "/" in symbol:
            formatted_symbol = f"{symbol.upper()}-USD"

        logger.info(f"Fetching crypto market data for {formatted_symbol} ({timeframe})...")
        
        return self._stock_provider.fetch_ohlcv(
            symbol=formatted_symbol,
            timeframe=timeframe,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
