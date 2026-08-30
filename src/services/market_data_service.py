import logging
import datetime
from typing import Dict, Any, Optional
import pandas as pd

from src.data.market_data import StockMarketDataProvider
from src.data.crypto_data import CryptoMarketDataProvider
from src.preprocessing.validation import DataValidator
from src.preprocessing.cleaning import DataCleaner
from src.features.technical import TechnicalAnalysisEngine
from src.features.candlestick import CandlestickEngine
from src.services.asset_discovery import AssetDiscoveryService

logger = logging.getLogger(__name__)

class MarketDataService:
    """
    Phase 4: Market Data Service & Caching Layer.
    Handles data retrieval, caching, validation, indicator computation, and data governance.
    """

    def __init__(self):
        self.stock_provider = StockMarketDataProvider()
        self.crypto_provider = CryptoMarketDataProvider()
        self.validator = DataValidator()
        self.cleaner = DataCleaner()
        self.ta_engine = TechnicalAnalysisEngine()
        self.cs_engine = CandlestickEngine()
        self.discovery_service = AssetDiscoveryService()
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl_seconds = 180  # 3 minutes cache for OHLC bars

    def fetch_processed_market_data(
        self,
        asset_id: str,
        timeframe: str = "1d",
        limit: int = 200,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Fetches OHLCV bars, validates quality, imputes missing values, and computes technical indicators.
        Returns dict containing DataFrame, asset metadata, and data freshness information.
        """
        cache_key = f"{asset_id.upper()}_{timeframe}_{limit}"
        now = datetime.datetime.now(datetime.timezone.utc)

        # Check cache if not forcing refresh
        if not force_refresh and cache_key in self._cache:
            cached_entry = self._cache[cache_key]
            elapsed = (now - cached_entry["cached_at"]).total_seconds()
            if elapsed < self.cache_ttl_seconds:
                logger.info(f"Returning cached market data for {cache_key} (age: {elapsed:.1f}s)")
                return cached_entry["data"]

        # Resolve asset metadata from AssetDiscoveryService
        asset_info = self.discovery_service.get_asset_by_id(asset_id)
        if not asset_info:
            asset_info = {
                "id": asset_id,
                "symbol": asset_id,
                "name": asset_id,
                "asset_type": "CRYPTO" if "-USD" in asset_id or asset_id in ["BTC", "ETH"] else "STOCK",
                "exchange": "NASDAQ",
                "currency": "USD",
                "provider_symbol": asset_id
            }

        asset_type = asset_info["asset_type"]
        provider_symbol = asset_info.get("provider_symbol") or asset_info["symbol"]
        provider = self.stock_provider if asset_type in ["STOCK", "ETF", "INDEX"] else self.crypto_provider

        # Fetch raw OHLCV bars
        df_raw = provider.fetch_ohlcv(symbol=provider_symbol, timeframe=timeframe, limit=limit)
        data_status = df_raw.attrs.get("data_status", "LIVE")

        if df_raw.empty or data_status == "UNAVAILABLE":
            return {
                "asset_info": asset_info,
                "timeframe": timeframe,
                "data_status": "UNAVAILABLE",
                "df": pd.DataFrame(),
                "market_status": "CLOSED",
                "last_updated": now.isoformat(),
                "freshness_seconds": 0,
                "error_message": f"Market data currently unavailable for {asset_id} from provider."
            }

        # Validate & Clean
        self.validator.validate_ohlcv(df_raw, asset_symbol=asset_id)
        df_clean = self.cleaner.clean_ohlcv(df_raw, asset_symbol=asset_id)

        # Compute Technical Indicators & Candlestick Patterns
        df_tech = self.ta_engine.compute_all_indicators(df_clean)
        df_full = self.cs_engine.detect_patterns(df_tech)

        # Calculate data freshness
        latest_ts = df_full["timestamp"].iloc[-1] if not df_full.empty else now
        if isinstance(latest_ts, pd.Timestamp):
            latest_ts = latest_ts.to_pydatetime()
        if latest_ts.tzinfo is None:
            latest_ts = latest_ts.replace(tzinfo=datetime.timezone.utc)

        freshness_seconds = int((now - latest_ts).total_seconds())

        result = {
            "asset_info": asset_info,
            "timeframe": timeframe,
            "data_status": data_status,
            "df": df_full,
            "market_status": "LIVE" if freshness_seconds < 86400 else "CLOSED",
            "last_updated": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "freshness_seconds": max(0, freshness_seconds),
            "source": "yfinance"
        }

        # Store in cache
        self._cache[cache_key] = {"cached_at": now, "data": result}
        return result

    def fetch_live_quote(self, asset_id: str) -> Dict[str, Any]:
        """
        Fetches the latest real-time quote for an asset directly from the provider.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        asset_info = self.discovery_service.get_asset_by_id(asset_id)
        if not asset_info:
            asset_info = {
                "id": asset_id,
                "symbol": asset_id,
                "name": asset_id,
                "asset_type": "CRYPTO" if "-USD" in asset_id or asset_id in ["BTC", "ETH", "SOL"] else "STOCK",
                "exchange": "NASDAQ",
                "currency": "USD",
                "provider_symbol": asset_id
            }

        provider_sym = asset_info.get("provider_symbol") or asset_info["symbol"]
        
        # yfinance is the project's configured provider.  A failed quote is not
        # replaced with an old OHLC bar: that would falsely present stale data as live.
        try:
            import yfinance as yf
            ticker = yf.Ticker(provider_sym)
            fast_info = ticker.fast_info

            if fast_info:
                lookup = fast_info.get if hasattr(fast_info, "get") else lambda key, default=None: getattr(fast_info, key, default)
                last_price = lookup("last_price") or lookup("regular_market_price")
                if last_price and not pd.isna(last_price) and float(last_price) > 0:
                    open_p = lookup("open") or lookup("regular_market_open") or last_price
                    high_p = lookup("day_high") or lookup("regular_market_day_high") or last_price
                    low_p = lookup("day_low") or lookup("regular_market_day_low") or last_price
                    vol = lookup("last_volume") or lookup("three_month_average_volume") or 0.0

                    return {
                        "symbol": asset_id.upper(),
                        "price": round(float(last_price), 2),
                        "open": round(float(open_p), 2),
                        "high": round(float(high_p), 2),
                        "low": round(float(low_p), 2),
                        "volume": float(vol),
                        "timestamp": now.isoformat(),
                        "unix_time": int(now.timestamp()),
                        "data_status": "LIVE",
                        "asset_info": asset_info
                    }
        except Exception as e:
            logger.debug(f"Fast info lookup failed for {asset_id}: {e}")

        return {
            "symbol": asset_id.upper(),
            "price": 0.0,
            "open": 0.0,
            "high": 0.0,
            "low": 0.0,
            "volume": 0.0,
            "timestamp": now.isoformat(),
            "unix_time": int(now.timestamp()),
            "data_status": "UNAVAILABLE",
            "asset_info": asset_info
        }
