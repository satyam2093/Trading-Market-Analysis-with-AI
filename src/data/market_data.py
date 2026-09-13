import logging
import datetime
import re
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import yfinance as yf

from src.data.base_provider import BaseMarketDataProvider

logger = logging.getLogger(__name__)

# Known Baseline Symbol & Exchange Catalog for Dynamic Provider Mapping
ASSET_PRICE_CATALOG: Dict[str, Dict[str, Any]] = {
    # Indian Stocks (in INR ₹)
    "TATATECH": {"currency": "INR", "exchange": "NSE", "provider_symbol": "TATATECH.NS", "name": "Tata Technologies Ltd."},
    "TATAMOTORS": {"currency": "INR", "exchange": "NSE", "provider_symbol": "TATAMOTORS.NS", "name": "Tata Motors Ltd."},
    "TCS": {"currency": "INR", "exchange": "NSE", "provider_symbol": "TCS.NS", "name": "Tata Consultancy Services"},
    "INFY": {"currency": "INR", "exchange": "NSE", "provider_symbol": "INFY.NS", "name": "Infosys Limited"},
    "RELIANCE": {"currency": "INR", "exchange": "NSE", "provider_symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd."},
    "HDFCBANK": {"currency": "INR", "exchange": "NSE", "provider_symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd."},
    "ICICIBANK": {"currency": "INR", "exchange": "NSE", "provider_symbol": "ICICIBANK.NS", "name": "ICICI Bank Ltd."},
    "SBIN": {"currency": "INR", "exchange": "NSE", "provider_symbol": "SBIN.NS", "name": "State Bank of India"},
    "BHARTIARTL": {"currency": "INR", "exchange": "NSE", "provider_symbol": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd."},
    "ITC": {"currency": "INR", "exchange": "NSE", "provider_symbol": "ITC.NS", "name": "ITC Limited"},
    "WIPRO": {"currency": "INR", "exchange": "NSE", "provider_symbol": "WIPRO.NS", "name": "Wipro Limited"},
    "BAJFINANCE": {"currency": "INR", "exchange": "NSE", "provider_symbol": "BAJFINANCE.NS", "name": "Bajaj Finance Ltd."},
    "ZOMATO": {"currency": "INR", "exchange": "NSE", "provider_symbol": "ZOMATO.NS", "name": "Zomato Limited"},
    "PAYTM": {"currency": "INR", "exchange": "NSE", "provider_symbol": "PAYTM.NS", "name": "One97 Communications"},
    "HAL": {"currency": "INR", "exchange": "NSE", "provider_symbol": "HAL.NS", "name": "Hindustan Aeronautics Ltd."},
    "BEL": {"currency": "INR", "exchange": "NSE", "provider_symbol": "BEL.NS", "name": "Bharat Electronics Ltd."},
    "ADANIENT": {"currency": "INR", "exchange": "NSE", "provider_symbol": "ADANIENT.NS", "name": "Adani Enterprises Ltd."},
    "LT": {"currency": "INR", "exchange": "NSE", "provider_symbol": "LT.NS", "name": "Larsen & Toubro Ltd."},
    "MARUTI": {"currency": "INR", "exchange": "NSE", "provider_symbol": "MARUTI.NS", "name": "Maruti Suzuki India Ltd."},
    "TITAN": {"currency": "INR", "exchange": "NSE", "provider_symbol": "TITAN.NS", "name": "Titan Company Ltd."},

    # US Stocks (in USD $)
    "NVDA": {"currency": "USD", "exchange": "NASDAQ", "provider_symbol": "NVDA", "name": "NVIDIA Corporation"},
    "AAPL": {"currency": "USD", "exchange": "NASDAQ", "provider_symbol": "AAPL", "name": "Apple Inc."},
    "MSFT": {"currency": "USD", "exchange": "NASDAQ", "provider_symbol": "MSFT", "name": "Microsoft Corporation"},
    "GOOGL": {"currency": "USD", "exchange": "NASDAQ", "provider_symbol": "GOOGL", "name": "Alphabet Inc."},
    "AMZN": {"currency": "USD", "exchange": "NASDAQ", "provider_symbol": "AMZN", "name": "Amazon.com Inc."},
    "TSLA": {"currency": "USD", "exchange": "NASDAQ", "provider_symbol": "TSLA", "name": "Tesla Inc."},
    "META": {"currency": "USD", "exchange": "NASDAQ", "provider_symbol": "META", "name": "Meta Platforms Inc."},
    "AMD": {"currency": "USD", "exchange": "NASDAQ", "provider_symbol": "AMD", "name": "Advanced Micro Devices Inc."},
    "NFLX": {"currency": "USD", "exchange": "NASDAQ", "provider_symbol": "NFLX", "name": "Netflix Inc."},
    "PLTR": {"currency": "USD", "exchange": "NYSE", "provider_symbol": "PLTR", "name": "Palantir Technologies Inc."},
    "COIN": {"currency": "USD", "exchange": "NASDAQ", "provider_symbol": "COIN", "name": "Coinbase Global Inc."},
    "SPY": {"currency": "USD", "exchange": "NYSE", "provider_symbol": "SPY", "name": "SPDR S&P 500 ETF Trust"},
    "QQQ": {"currency": "USD", "exchange": "NASDAQ", "provider_symbol": "QQQ", "name": "Invesco QQQ Trust"},

    # Crypto Assets (in USD $)
    "BTC": {"currency": "USD", "exchange": "BINANCE", "provider_symbol": "BTC-USD", "name": "Bitcoin"},
    "ETH": {"currency": "USD", "exchange": "BINANCE", "provider_symbol": "ETH-USD", "name": "Ethereum"},
    "SOL": {"currency": "USD", "exchange": "BINANCE", "provider_symbol": "SOL-USD", "name": "Solana"},
    "BNB": {"currency": "USD", "exchange": "BINANCE", "provider_symbol": "BNB-USD", "name": "BNB"},
    "XRP": {"currency": "USD", "exchange": "BINANCE", "provider_symbol": "XRP-USD", "name": "XRP"},
    "ADA": {"currency": "USD", "exchange": "BINANCE", "provider_symbol": "ADA-USD", "name": "Cardano"},
    "DOGE": {"currency": "USD", "exchange": "BINANCE", "provider_symbol": "DOGE-USD", "name": "Dogecoin"},
    "AVAX": {"currency": "USD", "exchange": "BINANCE", "provider_symbol": "AVAX-USD", "name": "Avalanche"},
    "LINK": {"currency": "USD", "exchange": "BINANCE", "provider_symbol": "LINK-USD", "name": "Chainlink"},
    "NEAR": {"currency": "USD", "exchange": "BINANCE", "provider_symbol": "NEAR-USD", "name": "NEAR Protocol"},
    "SUI": {"currency": "USD", "exchange": "BINANCE", "provider_symbol": "SUI-USD", "name": "Sui Network"},
}

class StockMarketDataProvider(BaseMarketDataProvider):
    """
    Stock Market Data Provider utilizing yfinance.
    Supports US Stocks, Indian Stocks (NSE/BSE), ETFs, and Indices.
    """

    TIMEFRAME_MAP = {
        "1m": "1m",
        "5m": "5m",
        "15m": "15m",
        "30m": "30m",
        "1h": "60m",
        "4h": "60m",
        "1d": "1d",
        "1w": "1wk",
        "all": "1d"
    }

    def get_supported_timeframes(self) -> List[str]:
        return list(self.TIMEFRAME_MAP.keys())

    def _resolve_tickers_to_try(self, symbol: str) -> List[str]:
        sym = symbol.strip().upper()
        # Clean up spaces
        sym_clean = re.sub(r"\s+", "", sym)
        tickers = [sym, sym_clean]

        # Check catalog
        for k, v in ASSET_PRICE_CATALOG.items():
            if sym_clean == k or sym_clean == v["name"].upper().replace(" ", ""):
                tickers.insert(0, v["provider_symbol"])

        if not sym_clean.endswith(".NS") and not sym_clean.endswith(".BO") and not sym_clean.endswith("-USD"):
            tickers.append(f"{sym_clean}.NS")
            tickers.append(f"{sym_clean}-USD")

        return list(dict.fromkeys(tickers))

    def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str = "1d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 500
    ) -> pd.DataFrame:
        normalized_timeframe = timeframe.lower()
        if normalized_timeframe not in self.TIMEFRAME_MAP:
            raise ValueError(f"Unsupported timeframe: {timeframe}. Must be one of {self.get_supported_timeframes()}")

        yf_interval = self.TIMEFRAME_MAP[normalized_timeframe]
        tickers_to_try = self._resolve_tickers_to_try(symbol)

        df = None
        for t_sym in tickers_to_try:
            try:
                logger.info(f"Trying to fetch market data for {t_sym} from yfinance...")
                ticker = yf.Ticker(t_sym)
                if start_date and end_date:
                    res = ticker.history(start=start_date, end=end_date, interval=yf_interval)
                elif start_date:
                    res = ticker.history(start=start_date, interval=yf_interval)
                else:
                    period = "max" if normalized_timeframe == "all" else ("2y" if normalized_timeframe in ["1d", "1w"] else "60d")
                    res = ticker.history(period=period, interval=yf_interval)

                if res is not None and not res.empty and len(res) > 3:
                    df = res
                    logger.info(f"Successfully fetched {len(df)} bars for {t_sym}")
                    break
            except Exception as e:
                logger.debug(f"Failed to fetch {t_sym}: {e}")

        # If yfinance returned data, format and return
        if df is not None and not df.empty:
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
            df = df[[c for c in required_cols if c in df.columns]]
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

        # If symbol is explicitly invalid or test symbol, return UNAVAILABLE
        if "INVALID" in symbol.upper() or "XYZ_9999" in symbol.upper():
            return self._empty_ohlcv_dataframe(symbol, timeframe, status="UNAVAILABLE")

        logger.warning("No real OHLCV data available for %s", symbol)
        return self._empty_ohlcv_dataframe(symbol, timeframe, status="UNAVAILABLE")

    def _empty_ohlcv_dataframe(self, symbol: str, timeframe: str, status: str = "UNAVAILABLE") -> pd.DataFrame:
        """Returns empty DataFrame with metadata attributes indicating data unavailability."""
        df = pd.DataFrame(columns=["timestamp", "open", "high", "low", "close", "volume"])
        df.attrs["data_status"] = status
        df.attrs["symbol"] = symbol
        df.attrs["source"] = "yfinance"
        df.attrs["timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return df
