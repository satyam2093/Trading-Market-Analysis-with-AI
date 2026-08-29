import sys
import os
import logging
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.utils.database import init_db, SessionLocal, MarketPriceModel
from src.services.asset_discovery import AssetDiscoveryService
from src.data.market_data import StockMarketDataProvider
from src.data.crypto_data import CryptoMarketDataProvider
from src.preprocessing.validation import DataValidator
from src.preprocessing.cleaning import DataCleaner

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("init_db")

def seed_database():
    """Initializes tables and populates asset universe using AssetDiscoveryService."""
    logger.info("Initializing database schema...")
    init_db()

    discovery_service = AssetDiscoveryService()
    total_assets = discovery_service.sync_asset_universe()
    logger.info(f"Asset universe initialized with {total_assets} assets.")

    session = SessionLocal()
    stock_provider = StockMarketDataProvider()
    crypto_provider = CryptoMarketDataProvider()
    validator = DataValidator()
    cleaner = DataCleaner()

    try:
        assets_list = discovery_service.search_assets(limit=100)
        logger.info(f"Ingesting initial historical market data for {len(assets_list)} assets...")
        total_bars_saved = 0

        for asset_info in assets_list:
            asset_id = asset_info["id"]
            asset_type = asset_info["asset_type"]
            fetch_symbol = asset_info["provider_symbol"]

            provider = stock_provider if asset_type in ["STOCK", "ETF", "INDEX"] else crypto_provider
            df = provider.fetch_ohlcv(symbol=fetch_symbol, timeframe="1d", limit=100)
            
            if df.empty:
                logger.warning(f"[{asset_id}] No market price data available from provider.")
                continue

            # Validate & Clean Data
            report = validator.validate_ohlcv(df, asset_symbol=asset_id)
            df_clean = cleaner.clean_ohlcv(df, asset_symbol=asset_id)

            bars_added = 0
            for idx, row in df_clean.iterrows():
                ts = row["timestamp"].to_pydatetime()
                existing_bar = session.query(MarketPriceModel).filter_by(
                    asset_id=asset_id,
                    timeframe="1d",
                    timestamp=ts
                ).first()

                if not existing_bar:
                    price_bar = MarketPriceModel(
                        asset_id=asset_id,
                        timestamp=ts,
                        timeframe="1d",
                        open=float(row["open"]),
                        high=float(row["high"]),
                        low=float(row["low"]),
                        close=float(row["close"]),
                        volume=float(row["volume"])
                    )
                    session.add(price_bar)
                    bars_added += 1

            session.commit()
            total_bars_saved += bars_added
            logger.info(f"[{asset_id}] Ingested {bars_added} real market price bars.")

        logger.info(f"Database initialization complete! Total price bars in DB: {total_bars_saved}")

    except Exception as e:
        session.rollback()
        logger.error(f"Error seeding database: {e}")
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    seed_database()
