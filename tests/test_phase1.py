import pytest
import datetime
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from configs.config import config, DEFAULT_ASSETS
from src.utils.database import Base, AssetModel, MarketPriceModel, init_db
from src.data.market_data import StockMarketDataProvider
from src.data.crypto_data import CryptoMarketDataProvider
from src.preprocessing.validation import DataValidator
from src.preprocessing.cleaning import DataCleaner

@pytest.fixture(scope="module")
def test_db():
    """Sets up an in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()

def test_config_and_assets():
    assert config.database_url is not None
    assert len(config.assets) >= 10
    asset_ids = [a.id for a in config.assets]
    assert "RELIANCE" in asset_ids
    assert "AAPL" in asset_ids
    assert "BTC" in asset_ids

def test_stock_data_provider():
    provider = StockMarketDataProvider()
    df = provider.fetch_ohlcv("AAPL", timeframe="1d", limit=20)
    assert isinstance(df, pd.DataFrame)
    assert not df.empty
    assert len(df) == 20
    required_cols = ["timestamp", "open", "high", "low", "close", "volume"]
    for col in required_cols:
        assert col in df.columns

def test_crypto_data_provider():
    provider = CryptoMarketDataProvider()
    df = provider.fetch_ohlcv("BTC", timeframe="1d", limit=20)
    assert isinstance(df, pd.DataFrame)
    assert not df.empty
    assert len(df) == 20
    assert (df["high"] >= df["low"]).all()

def test_data_validator():
    validator = DataValidator()
    
    # Valid dataframe test
    valid_df = pd.DataFrame({
        "timestamp": pd.date_range("2024-01-01", periods=5, tz="UTC"),
        "open": [100, 101, 102, 103, 104],
        "high": [105, 106, 107, 108, 109],
        "low": [99, 100, 101, 102, 103],
        "close": [102, 103, 104, 105, 106],
        "volume": [1000, 1100, 1200, 1300, 1400]
    })
    report = validator.validate_ohlcv(valid_df, "TEST_ASSET")
    assert report["is_valid"] is True
    assert report["invalid_ohlc_rows"] == 0

    # Invalid dataframe test (High < Low)
    invalid_df = valid_df.copy()
    invalid_df.loc[0, "high"] = 50.0  # Invalid High < Low
    invalid_report = validator.validate_ohlcv(invalid_df, "TEST_INVALID")
    assert invalid_report["is_valid"] is False
    assert invalid_report["invalid_ohlc_rows"] > 0

def test_data_cleaner():
    cleaner = DataCleaner()
    raw_df = pd.DataFrame({
        "timestamp": ["2024-01-01 00:00:00", "2024-01-01 00:00:00", "2024-01-02 00:00:00"],
        "open": [100, 100, None],
        "high": [105, 105, 108],
        "low": [99, 99, 101],
        "close": [102, 102, 104],
        "volume": [1000, 1000, None]
    })
    cleaned_df = cleaner.clean_ohlcv(raw_df, "TEST_CLEAN")
    assert len(cleaned_df) == 2  # Duplicate dropped
    assert cleaned_df["open"].isnull().sum() == 0  # Imputed
    assert cleaned_df["volume"].isnull().sum() == 0

def test_database_persistence(test_db):
    asset = AssetModel(
        id="TEST_COIN",
        symbol="TEST",
        name="Test Coin",
        asset_type="CRYPTO",
        exchange="BINANCE",
        currency="USD"
    )
    test_db.add(asset)
    test_db.commit()

    price = MarketPriceModel(
        asset_id="TEST_COIN",
        timestamp=datetime.datetime.now(datetime.timezone.utc),
        timeframe="1d",
        open=100.0,
        high=110.0,
        low=95.0,
        close=105.0,
        volume=50000.0
    )
    test_db.add(price)
    test_db.commit()

    saved_asset = test_db.query(AssetModel).filter_by(id="TEST_COIN").first()
    assert saved_asset is not None
    assert saved_asset.symbol == "TEST"

    saved_price = test_db.query(MarketPriceModel).filter_by(asset_id="TEST_COIN").first()
    assert saved_price is not None
    assert saved_price.close == 105.0
