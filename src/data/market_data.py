import logging
import datetime
from typing import List, Optional
import pandas as pd
import yfinance as yf

from src.data.base_provider import BaseMarketDataProvider

logger = logging.getLogger(__name__)

class StockMarketDataProvider(BaseMarketDataProvider):
    """
    Stock Market Data Provider utilizing yfinance.
    Supports US Stocks, Indian Stocks (NSE/BSE), ETFs, and Indices.
    Enforces Strict Real Data Policy: No synthetic fake data is generated.
    """

    TIMEFRAME_MAP = {
        "1m": "1m",
        "5m": "5m",
        "15m": "15m",
        "30m": "30m",
        "1h": "60m",
        "4h": "60m",  # Will resample to 4h
        "1d": "1d",
        "1w": "1wk"
    }

    def get_supported_timeframes(self) -> List[str]:
        return list(self.TIMEFRAME_MAP.keys())

    def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str = "1d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 500
    ) -> pd.DataFrame:
        if timeframe not in self.TIMEFRAME_MAP:
            raise ValueError(f"Unsupported timeframe: {timeframe}. Must be one of {self.get_supported_timeframes()}")

        yf_interval = self.TIMEFRAME_MAP[timeframe]
        
        try:
            logger.info(f"Fetching stock market data for {symbol} ({timeframe}) from yfinance...")
            ticker = yf.Ticker(symbol)
            
            if start_date and end_date:
                df = ticker.history(start=start_date, end=end_date, interval=yf_interval)
            elif start_date:
                df = ticker.history(start=start_date, interval=yf_interval)
            else:
                period = "2y" if timeframe in ["1d", "1w"] else "60d"
                df = ticker.history(period=period, interval=yf_interval)

            if df is None or df.empty:
                logger.warning(f"DATA UNAVAILABLE: No market data returned for {symbol} from provider.")
                return self._empty_ohlcv_dataframe(symbol, timeframe, status="UNAVAILABLE")

            # Reset index and standardize columns
            df = df.reset_index()
            
            col_map = {
                "Date": "timestamp",
                "Datetime": "timestamp",
                "Open": "open",
                "High": "high",
                "Low": "low",
                "Close": "close",
                "Volume": "volume"
            }
            df = df.rename(columns=col_map)
            
            required_cols = ["timestamp", "open", "high", "low", "close", "volume"]
            missing = [c for c in required_cols if c not in df.columns]
            if missing:
                logger.warning(f"DATA CORRUPT: Missing columns {missing} for {symbol}.")
                return self._empty_ohlcv_dataframe(symbol, timeframe, status="CORRUPT")

            df = df[required_cols]
            df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)

            if timeframe == "4h":
                df = df.set_index("timestamp").resample("4h").agg({
                    "open": "first",
                    "high": "max",
                    "low": "min",
                    "close": "last",
                    "volume": "sum"
                }).dropna().reset_index()

            if limit and len(df) > limit:
                df = df.tail(limit).reset_index(drop=True)

            df.attrs["data_status"] = "LIVE"
            df.attrs["source"] = "yfinance"
            df.attrs["timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            return df

        except Exception as e:
            logger.error(f"Error fetching real market data for {symbol}: {e}")
            return self._empty_ohlcv_dataframe(symbol, timeframe, status="UNAVAILABLE")

    def _empty_ohlcv_dataframe(self, symbol: str, timeframe: str, status: str = "UNAVAILABLE") -> pd.DataFrame:
        """Returns empty DataFrame with metadata attributes indicating data unavailability."""
        df = pd.DataFrame(columns=["timestamp", "open", "high", "low", "close", "volume"])
        df.attrs["data_status"] = status
        df.attrs["symbol"] = symbol
        df.attrs["source"] = "yfinance"
        df.attrs["timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return df
