import logging
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from src.utils.database import SessionLocal, WatchlistModel, AssetModel
from src.services.asset_discovery import AssetDiscoveryService

logger = logging.getLogger(__name__)

class WatchlistService:
    """
    Phase 16: Watchlist Service.
    Manages user watchlists with database persistence, live sorting, and filtering.
    """

    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.discovery_service = AssetDiscoveryService(db=db)

    def get_user_watchlist(self, user_id: str = "default_user") -> List[Dict[str, Any]]:
        """Retrieves all assets in user's watchlist with asset metadata."""
        session = self.db or SessionLocal()
        try:
            items = session.query(WatchlistModel, AssetModel)\
                           .join(AssetModel, WatchlistModel.asset_id == AssetModel.id)\
                           .filter(WatchlistModel.user_id == user_id)\
                           .all()

            results = []
            for w, a in items:
                results.append({
                    "watchlist_id": w.id,
                    "asset_id": a.id,
                    "symbol": a.symbol,
                    "name": a.name,
                    "asset_type": a.asset_type,
                    "exchange": a.exchange,
                    "currency": a.currency,
                    "provider_symbol": a.provider_symbol or a.symbol,
                    "added_at": w.added_at.strftime("%Y-%m-%d %H:%M UTC") if w.added_at else ""
                })
            return results
        except Exception as e:
            logger.error(f"Error fetching watchlist for {user_id}: {e}")
            return []
        finally:
            if not self.db:
                session.close()

    def add_to_watchlist(self, asset_id: str, user_id: str = "default_user") -> bool:
        """Adds an asset to user's watchlist."""
        session = self.db or SessionLocal()
        try:
            asset = self.discovery_service.get_asset_by_id(asset_id)
            if not asset:
                logger.warning(f"Cannot add non-existent asset {asset_id} to watchlist.")
                return False

            clean_asset_id = asset["id"]
            existing = session.query(WatchlistModel).filter_by(user_id=user_id, asset_id=clean_asset_id).first()
            if existing:
                return True

            watchlist_obj = WatchlistModel(user_id=user_id, asset_id=clean_asset_id, added_at=datetime.datetime.utcnow())
            session.add(watchlist_obj)
            session.commit()
            logger.info(f"Added {clean_asset_id} to user {user_id} watchlist.")
            return True
        except Exception as e:
            session.rollback()
            logger.error(f"Error adding to watchlist: {e}")
            return False
        finally:
            if not self.db:
                session.close()

    def remove_from_watchlist(self, asset_id: str, user_id: str = "default_user") -> bool:
        """Removes an asset from user's watchlist."""
        session = self.db or SessionLocal()
        try:
            existing = session.query(WatchlistModel).filter_by(user_id=user_id, asset_id=asset_id).first()
            if existing:
                session.delete(existing)
                session.commit()
                logger.info(f"Removed {asset_id} from user {user_id} watchlist.")
            return True
        except Exception as e:
            session.rollback()
            logger.error(f"Error removing from watchlist: {e}")
            return False
        finally:
            if not self.db:
                session.close()

    def is_in_watchlist(self, asset_id: str, user_id: str = "default_user") -> bool:
        """Checks if an asset is currently in user's watchlist."""
        session = self.db or SessionLocal()
        try:
            count = session.query(WatchlistModel).filter_by(user_id=user_id, asset_id=asset_id).count()
            return count > 0
        finally:
            if not self.db:
                session.close()
