import os
from typing import Dict, List, Any
from pydantic import BaseModel, Field

class AssetConfig(BaseModel):
    id: str
    symbol: str
    name: str
    asset_type: str  # 'STOCK', 'CRYPTO'
    exchange: str    # 'NSE', 'BSE', 'NASDAQ', 'NYSE', 'BINANCE'
    currency: str
    ticker_override: str | None = None  # e.g., 'RELIANCE.NS' for yfinance

# Default supported assets
DEFAULT_ASSETS: List[AssetConfig] = [
    # Indian Stocks
    AssetConfig(id="RELIANCE", symbol="RELIANCE", name="Reliance Industries Ltd.", asset_type="STOCK", exchange="NSE", currency="INR", ticker_override="RELIANCE.NS"),
    AssetConfig(id="TCS", symbol="TCS", name="Tata Consultancy Services", asset_type="STOCK", exchange="NSE", currency="INR", ticker_override="TCS.NS"),
    
    # US Stocks
    AssetConfig(id="AAPL", symbol="AAPL", name="Apple Inc.", asset_type="STOCK", exchange="NASDAQ", currency="USD", ticker_override="AAPL"),
    AssetConfig(id="NVDA", symbol="NVDA", name="NVIDIA Corporation", asset_type="STOCK", exchange="NASDAQ", currency="USD", ticker_override="NVDA"),
    
    # Crypto
    AssetConfig(id="BTC", symbol="BTC", name="Bitcoin", asset_type="CRYPTO", exchange="BINANCE", currency="USD", ticker_override="BTC-USD"),
    AssetConfig(id="ETH", symbol="ETH", name="Ethereum", asset_type="CRYPTO", exchange="BINANCE", currency="USD", ticker_override="ETH-USD"),
    AssetConfig(id="SOL", symbol="SOL", name="Solana", asset_type="CRYPTO", exchange="BINANCE", currency="USD", ticker_override="SOL-USD"),
    AssetConfig(id="BNB", symbol="BNB", name="BNB", asset_type="CRYPTO", exchange="BINANCE", currency="USD", ticker_override="BNB-USD"),
    AssetConfig(id="XRP", symbol="XRP", name="XRP", asset_type="CRYPTO", exchange="BINANCE", currency="USD", ticker_override="XRP-USD"),
    AssetConfig(id="ADA", symbol="ADA", name="Cardano", asset_type="CRYPTO", exchange="BINANCE", currency="USD", ticker_override="ADA-USD"),
    AssetConfig(id="DOGE", symbol="DOGE", name="Dogecoin", asset_type="CRYPTO", exchange="BINANCE", currency="USD", ticker_override="DOGE-USD"),
]

class SystemConfig(BaseModel):
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./ai_market_intelligence.db")
    environment: str = os.getenv("ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    secret_key: str = os.getenv("SECRET_KEY", "super-secret-key")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Asset registry mapping
    assets: List[AssetConfig] = DEFAULT_ASSETS

config = SystemConfig()
