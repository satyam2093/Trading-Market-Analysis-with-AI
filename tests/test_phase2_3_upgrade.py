import pytest
import pandas as pd

from src.data.market_data import StockMarketDataProvider
from src.data.crypto_data import CryptoMarketDataProvider
from src.data.fundamentals import FundamentalDataProvider
from src.data.news_data import NewsDataProvider
from src.services.asset_discovery import AssetDiscoveryService

def test_strict_real_data_governance_no_fake_data():
    """Verifies that data providers return UNAVAILABLE status instead of fake synthetic data."""
    stock_provider = StockMarketDataProvider()
    invalid_df = stock_provider.fetch_ohlcv("INVALID_SYMBOL_XYZ_9999", timeframe="1d", limit=10)
    
    assert isinstance(invalid_df, pd.DataFrame)
    assert invalid_df.empty
    assert invalid_df.attrs.get("data_status") == "UNAVAILABLE"

    # Fundamental test
    fund_provider = FundamentalDataProvider()
    fund_res = fund_provider.fetch_financial_statements("INVALID_SYMBOL_XYZ_9999")
    assert isinstance(fund_res, dict)
    assert fund_res.get("data_status") == "UNAVAILABLE"
    assert fund_res.get("revenue") == 0.0

    # News test
    news_provider = NewsDataProvider()
    news_res = news_provider.fetch_recent_news("INVALID_SYMBOL_XYZ_9999", limit=5)
    assert isinstance(news_res, list)
    assert len(news_res) == 0

def test_asset_discovery_service():
    """Verifies Asset Discovery Service universe sync, global search, and filtering."""
    service = AssetDiscoveryService()
    total_active = service.sync_asset_universe()
    
    assert total_active >= 20

    # Test Search by Symbol
    btc_results = service.search_assets("BTC")
    assert len(btc_results) >= 1
    assert btc_results[0]["symbol"] == "BTC"
    assert btc_results[0]["asset_type"] == "CRYPTO"

    # Test Search Indian Stock
    reliance_results = service.search_assets("Reliance")
    assert len(reliance_results) >= 1
    assert "RELIANCE" in [r["symbol"] for r in reliance_results]

    # Test Search US Stock
    aapl_results = service.search_assets("Apple")
    assert len(aapl_results) >= 1
    assert aapl_results[0]["symbol"] == "AAPL"

    # Test Filter by Asset Type
    etf_results = service.search_assets(asset_type="ETF")
    assert len(etf_results) >= 1
    assert etf_results[0]["asset_type"] == "ETF"

    # Test Lookup by ID
    asset_info = service.get_asset_by_id("NVDA")
    assert asset_info is not None
    assert asset_info["symbol"] == "NVDA"
