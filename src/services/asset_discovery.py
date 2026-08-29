import logging
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from configs.config import AssetConfig
from src.utils.database import SessionLocal, AssetModel, init_db

logger = logging.getLogger(__name__)

# Expanded Seed Universe for initial population across US, NSE, ETFs, Indices & Cryptos
EXPANDED_ASSET_UNIVERSE: List[Dict[str, Any]] = [
    # Indian NSE Stocks
    {"id": "RELIANCE", "symbol": "RELIANCE", "name": "Reliance Industries Ltd.", "asset_type": "STOCK", "exchange": "NSE", "country": "India", "sector": "Energy", "currency": "INR", "provider_symbol": "RELIANCE.NS"},
    {"id": "TCS", "symbol": "TCS", "name": "Tata Consultancy Services", "asset_type": "STOCK", "exchange": "NSE", "country": "India", "sector": "Technology", "currency": "INR", "provider_symbol": "TCS.NS"},
    {"id": "INFY", "symbol": "INFY", "name": "Infosys Limited", "asset_type": "STOCK", "exchange": "NSE", "country": "India", "sector": "Technology", "currency": "INR", "provider_symbol": "INFY.NS"},
    {"id": "HDFCBANK", "symbol": "HDFCBANK", "name": "HDFC Bank Limited", "asset_type": "STOCK", "exchange": "NSE", "country": "India", "sector": "Financial Services", "currency": "INR", "provider_symbol": "HDFCBANK.NS"},
    {"id": "ICICIBANK", "symbol": "ICICIBANK", "name": "ICICI Bank Limited", "asset_type": "STOCK", "exchange": "NSE", "country": "India", "sector": "Financial Services", "currency": "INR", "provider_symbol": "ICICIBANK.NS"},
    {"id": "TATAMOTORS", "symbol": "TATAMOTORS", "name": "Tata Motors Limited", "asset_type": "STOCK", "exchange": "NSE", "country": "India", "sector": "Automotive", "currency": "INR", "provider_symbol": "TATAMOTORS.NS"},
    
    # US Stocks
    {"id": "AAPL", "symbol": "AAPL", "name": "Apple Inc.", "asset_type": "STOCK", "exchange": "NASDAQ", "country": "United States", "sector": "Technology", "currency": "USD", "provider_symbol": "AAPL"},
    {"id": "NVDA", "symbol": "NVDA", "name": "NVIDIA Corporation", "asset_type": "STOCK", "exchange": "NASDAQ", "country": "United States", "sector": "Semiconductors", "currency": "USD", "provider_symbol": "NVDA"},
    {"id": "MSFT", "symbol": "MSFT", "name": "Microsoft Corporation", "asset_type": "STOCK", "exchange": "NASDAQ", "country": "United States", "sector": "Technology", "currency": "USD", "provider_symbol": "MSFT"},
    {"id": "GOOGL", "symbol": "GOOGL", "name": "Alphabet Inc.", "asset_type": "STOCK", "exchange": "NASDAQ", "country": "United States", "sector": "Communication Services", "currency": "USD", "provider_symbol": "GOOGL"},
    {"id": "AMZN", "symbol": "AMZN", "name": "Amazon.com Inc.", "asset_type": "STOCK", "exchange": "NASDAQ", "country": "United States", "sector": "Consumer Cyclical", "currency": "USD", "provider_symbol": "AMZN"},
    {"id": "TSLA", "symbol": "TSLA", "name": "Tesla Inc.", "asset_type": "STOCK", "exchange": "NASDAQ", "country": "United States", "sector": "Automotive", "currency": "USD", "provider_symbol": "TSLA"},
    {"id": "META", "symbol": "META", "name": "Meta Platforms Inc.", "asset_type": "STOCK", "exchange": "NASDAQ", "country": "United States", "sector": "Communication Services", "currency": "USD", "provider_symbol": "META"},
    
    # ETFs & Indices
    {"id": "SPY", "symbol": "SPY", "name": "SPDR S&P 500 ETF Trust", "asset_type": "ETF", "exchange": "NYSE", "country": "United States", "sector": "Index ETF", "currency": "USD", "provider_symbol": "SPY"},
    {"id": "QQQ", "symbol": "QQQ", "name": "Invesco QQQ Trust (Nasdaq-100)", "asset_type": "ETF", "exchange": "NASDAQ", "country": "United States", "sector": "Tech ETF", "currency": "USD", "provider_symbol": "QQQ"},
    {"id": "NIFTY50", "symbol": "NIFTY50", "name": "NIFTY 50 Index", "asset_type": "INDEX", "exchange": "NSE", "country": "India", "sector": "Market Index", "currency": "INR", "provider_symbol": "^NSEI"},
    {"id": "SENSEX", "symbol": "SENSEX", "name": "S&P BSE SENSEX Index", "asset_type": "INDEX", "exchange": "BSE", "country": "India", "sector": "Market Index", "currency": "INR", "provider_symbol": "^BSESN"},

    # Cryptocurrencies
    {"id": "BTC", "symbol": "BTC", "name": "Bitcoin", "asset_type": "CRYPTO", "exchange": "BINANCE", "country": "Global", "sector": "Layer 1 Cryptocurrency", "currency": "USD", "provider_symbol": "BTC-USD"},
    {"id": "ETH", "symbol": "ETH", "name": "Ethereum", "asset_type": "CRYPTO", "exchange": "BINANCE", "country": "Global", "sector": "Layer 1 Smart Contracts", "currency": "USD", "provider_symbol": "ETH-USD"},
    {"id": "SOL", "symbol": "SOL", "name": "Solana", "asset_type": "CRYPTO", "exchange": "BINANCE", "country": "Global", "sector": "Layer 1 Smart Contracts", "currency": "USD", "provider_symbol": "SOL-USD"},
    {"id": "BNB", "symbol": "BNB", "name": "BNB", "asset_type": "CRYPTO", "exchange": "BINANCE", "country": "Global", "sector": "Exchange Token / L1", "currency": "USD", "provider_symbol": "BNB-USD"},
    {"id": "XRP", "symbol": "XRP", "name": "XRP", "asset_type": "CRYPTO", "exchange": "BINANCE", "country": "Global", "sector": "Payments", "currency": "USD", "provider_symbol": "XRP-USD"},
    {"id": "ADA", "symbol": "ADA", "name": "Cardano", "asset_type": "CRYPTO", "exchange": "BINANCE", "country": "Global", "sector": "Layer 1 Smart Contracts", "currency": "USD", "provider_symbol": "ADA-USD"},
    {"id": "DOGE", "symbol": "DOGE", "name": "Dogecoin", "asset_type": "CRYPTO", "exchange": "BINANCE", "country": "Global", "sector": "Memecoin / Payments", "currency": "USD", "provider_symbol": "DOGE-USD"},
    {"id": "AVAX", "symbol": "AVAX", "name": "Avalanche", "asset_type": "CRYPTO", "exchange": "BINANCE", "country": "Global", "sector": "Layer 1 Smart Contracts", "currency": "USD", "provider_symbol": "AVAX-USD"},
    {"id": "LINK", "symbol": "LINK", "name": "Chainlink", "asset_type": "CRYPTO", "exchange": "BINANCE", "country": "Global", "sector": "Oracle Network", "currency": "USD", "provider_symbol": "LINK-USD"},
]


class AssetDiscoveryService:
    """
    Asset Discovery & Management Service.
    Retrieves, normalizes, stores, and searches assets across exchanges and asset classes.
    """

    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def sync_asset_universe(self) -> int:
        """
        Populates and updates the database assets table with the asset universe.
        Returns total number of active assets in database.
        """
        init_db()
        session = self.db or SessionLocal()
        try:
            added_or_updated = 0
            for item in EXPANDED_ASSET_UNIVERSE:
                existing = session.query(AssetModel).filter_by(id=item["id"]).first()
                if not existing:
                    asset_obj = AssetModel(
                        id=item["id"],
                        symbol=item["symbol"],
                        name=item["name"],
                        asset_type=item["asset_type"],
                        exchange=item["exchange"],
                        country=item.get("country", "Global"),
                        sector=item.get("sector", "General"),
                        currency=item["currency"],
                        provider_symbol=item.get("provider_symbol", item["symbol"]),
                        is_active=True,
                        last_updated=datetime.datetime.utcnow()
                    )
                    session.add(asset_obj)
                    added_or_updated += 1
                else:
                    # Update fields if changed
                    existing.provider_symbol = item.get("provider_symbol", existing.provider_symbol)
                    existing.country = item.get("country", existing.country)
                    existing.sector = item.get("sector", existing.sector)
                    existing.last_updated = datetime.datetime.utcnow()
                    added_or_updated += 1

            session.commit()
            total_active = session.query(AssetModel).filter_by(is_active=True).count()
            logger.info(f"Asset Discovery Service synced {added_or_updated} assets. Total active assets in DB: {total_active}")
            return total_active

        except Exception as e:
            session.rollback()
            logger.error(f"Error syncing asset universe: {e}")
            raise e
        finally:
            if not self.db:
                session.close()

    def search_assets(
        self,
        query: str = "",
        asset_type: Optional[str] = None,
        exchange: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Global asset search matching symbol, name, sector, or provider symbol.
        Supports filtering by asset_type (STOCK, ETF, INDEX, CRYPTO) and exchange.
        """
        session = self.db or SessionLocal()
        try:
            q = session.query(AssetModel).filter(AssetModel.is_active == True)

            if asset_type and asset_type.upper() != "ALL":
                q = q.filter(AssetModel.asset_type == asset_type.upper())

            if exchange and exchange.upper() != "ALL":
                q = q.filter(AssetModel.exchange == exchange.upper())

            if query:
                search_pattern = f"%{query.strip()}%"
                q = q.filter(
                    (AssetModel.symbol.ilike(search_pattern)) |
                    (AssetModel.name.ilike(search_pattern)) |
                    (AssetModel.sector.ilike(search_pattern)) |
                    (AssetModel.provider_symbol.ilike(search_pattern))
                )

            assets = q.limit(limit).all()

            # If search query yields no DB results, dynamically create a candidate asset object for yfinance
            if not assets and query and len(query) <= 15:
                clean_q = query.strip().upper()
                candidate_type = "CRYPTO" if "-USD" in clean_q or clean_q in ["BTC", "ETH", "SOL"] else "STOCK"
                candidate_ex = "NSE" if ".NS" in clean_q else ("NASDAQ" if candidate_type == "STOCK" else "BINANCE")
                return [{
                    "id": clean_q.replace(".NS", "").replace("-USD", ""),
                    "symbol": clean_q.replace(".NS", "").replace("-USD", ""),
                    "name": f"{clean_q} Asset",
                    "asset_type": candidate_type,
                    "exchange": candidate_ex,
                    "country": "Global",
                    "sector": "General",
                    "currency": "USD" if candidate_type == "CRYPTO" or candidate_ex != "NSE" else "INR",
                    "provider_symbol": clean_q
                }]

            results = []
            for a in assets:
                results.append({
                    "id": a.id,
                    "symbol": a.symbol,
                    "name": a.name,
                    "asset_type": a.asset_type,
                    "exchange": a.exchange,
                    "country": a.country,
                    "sector": a.sector,
                    "currency": a.currency,
                    "provider_symbol": a.provider_symbol or a.symbol
                })

            return results

        except Exception as e:
            logger.error(f"Error searching assets: {e}")
            return []
        finally:
            if not self.db:
                session.close()

    def get_asset_by_id(self, asset_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves asset metadata by ID or symbol."""
        results = self.search_assets(query=asset_id, limit=5)
        for r in results:
            if r["id"].upper() == asset_id.upper() or r["symbol"].upper() == asset_id.upper():
                return r
        return results[0] if results else None
