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
            # Do NOT generate fake/calibrated data. Return empty with clear UNAVAILABLE status.
            logger.warning(f"No real OHLCV data available for {asset_id}. Returning UNAVAILABLE status.")
            result = {
                "asset_info": asset_info,
                "timeframe": timeframe,
                "data_status": "UNAVAILABLE",
                "df": pd.DataFrame(columns=["timestamp", "open", "high", "low", "close", "volume"]),
                "market_status": "UNAVAILABLE",
                "last_updated": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
                "freshness_seconds": 0,
                "source": "yfinance"
            }
            self._cache[cache_key] = {"cached_at": now, "data": result}
            return result

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
        Never returns simulated or catalog fallback prices.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        asset_info = self.discovery_service.get_asset_by_id(asset_id)
        if not asset_info:
            is_crypto = "-USD" in asset_id or asset_id.upper() in ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "BNB"]
            is_indian = ".NS" in asset_id or ".BO" in asset_id or asset_id.upper() in ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS", "SBIN", "BHARTIARTL", "ITC", "WIPRO", "BAJFINANCE"]
            asset_info = {
                "id": asset_id,
                "symbol": asset_id,
                "name": asset_id,
                "asset_type": "CRYPTO" if is_crypto else "STOCK",
                "exchange": "BINANCE" if is_crypto else ("NSE" if is_indian else "NASDAQ"),
                "currency": "INR" if is_indian else "USD",
                "provider_symbol": f"{asset_id}-USD" if is_crypto and not asset_id.endswith("-USD") else (f"{asset_id}.NS" if is_indian and not asset_id.endswith(".NS") else asset_id)
            }

        provider_sym = asset_info.get("provider_symbol") or asset_info["symbol"]
        tickers_to_try = [provider_sym]
        if not provider_sym.endswith(".NS") and not provider_sym.endswith("-USD"):
            tickers_to_try.append(f"{provider_sym}.NS")
            tickers_to_try.append(f"{provider_sym}-USD")

        import yfinance as yf

        for t_sym in tickers_to_try:
            try:
                ticker = yf.Ticker(t_sym)
                fast_info = ticker.fast_info

                if fast_info:
                    lookup = fast_info.get if hasattr(fast_info, "get") else lambda key, default=None: getattr(fast_info, key, default)
                    last_price = lookup("last_price") or lookup("regular_market_price")
                    if last_price and not pd.isna(last_price) and float(last_price) > 0:
                        last_p = float(last_price)
                        prev_close = lookup("previous_close") or lookup("regular_market_previous_close")
                        prev_p = float(prev_close) if prev_close and not pd.isna(prev_close) else last_p
                        chg = last_p - prev_p
                        chg_pct = (chg / prev_p * 100.0) if prev_p > 0 else 0.0

                        open_p = lookup("open") or lookup("regular_market_open") or last_p
                        high_p = lookup("day_high") or lookup("regular_market_day_high") or last_p
                        low_p = lookup("day_low") or lookup("regular_market_day_low") or last_p
                        vol = lookup("last_volume") or lookup("three_month_average_volume") or 0.0

                        currency = lookup("currency") or asset_info.get("currency", "USD")
                        asset_info["currency"] = currency
                        asset_info["provider_symbol"] = t_sym

                        return {
                            "symbol": asset_id.upper(),
                            "price": round(last_p, 2),
                            "previous_close": round(prev_p, 2),
                            "change": round(chg, 2),
                            "change_percent": round(chg_pct, 2),
                            "open": round(float(open_p), 2),
                            "high": round(float(high_p), 2),
                            "low": round(float(low_p), 2),
                            "volume": float(vol),
                            "currency": currency,
                            "currency_symbol": "₹" if currency == "INR" else "$",
                            "timestamp": now.isoformat(),
                            "unix_time": int(now.timestamp()),
                            "data_status": "LIVE",
                            "asset_info": asset_info
                        }

                # Fallback to recent history for valid close
                hist = ticker.history(period="5d", interval="1d")
                if hist is not None and not hist.empty and len(hist) > 0:
                    last_row = hist.iloc[-1]
                    last_p = float(last_row["Close"])
                    prev_p = float(hist.iloc[-2]["Close"]) if len(hist) > 1 else last_p
                    chg = last_p - prev_p
                    chg_pct = (chg / prev_p * 100.0) if prev_p > 0 else 0.0
                    currency = asset_info.get("currency", "INR" if ".NS" in t_sym else "USD")

                    return {
                        "symbol": asset_id.upper(),
                        "price": round(last_p, 2),
                        "previous_close": round(prev_p, 2),
                        "change": round(chg, 2),
                        "change_percent": round(chg_pct, 2),
                        "open": round(float(last_row["Open"]), 2),
                        "high": round(float(last_row["High"]), 2),
                        "low": round(float(last_row["Low"]), 2),
                        "volume": float(last_row["Volume"]),
                        "currency": currency,
                        "currency_symbol": "₹" if currency == "INR" else "$",
                        "timestamp": now.isoformat(),
                        "unix_time": int(now.timestamp()),
                        "data_status": "DELAYED",
                        "asset_info": asset_info
                    }
            except Exception as e:
                logger.debug(f"Live quote lookup error for {t_sym}: {e}")

        # Real provider could not provide price - return explicit UNAVAILABLE, never fake/catalog prices
        logger.warning(f"Market data provider could not retrieve live quote for {asset_id}. Returning UNAVAILABLE.")
        return {
            "symbol": asset_id.upper(),
            "price": None,
            "previous_close": None,
            "change": None,
            "change_percent": None,
            "open": None,
            "high": None,
            "low": None,
            "volume": None,
            "currency": asset_info.get("currency", "USD"),
            "currency_symbol": "₹" if asset_info.get("currency") == "INR" else "$",
            "timestamp": now.isoformat(),
            "unix_time": int(now.timestamp()),
            "data_status": "UNAVAILABLE",
            "asset_info": asset_info
        }
