import logging
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from src.utils.database import SessionLocal, AlertModel, AssetModel

logger = logging.getLogger(__name__)

class AlertService:
    """
    Phase 16: Alert Trigger Service.
    Manages price thresholds, regime changes, BUY/SELL signals, and high volatility alerts.
    """

    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def get_user_alerts(self, user_id: str = "default_user") -> List[Dict[str, Any]]:
        """Retrieves active alerts configured by the user."""
        session = self.db or SessionLocal()
        try:
            alerts = session.query(AlertModel, AssetModel)\
                            .join(AssetModel, AlertModel.asset_id == AssetModel.id)\
                            .filter(AlertModel.user_id == user_id, AlertModel.is_active == True)\
                            .all()

            results = []
            for alt, a in alerts:
                results.append({
                    "alert_id": alt.id,
                    "asset_id": a.id,
                    "symbol": a.symbol,
                    "name": a.name,
                    "alert_type": alt.alert_type,
                    "condition": alt.condition,
                    "threshold_value": alt.threshold_value,
                    "created_at": alt.created_at.strftime("%Y-%m-%d %H:%M UTC") if alt.created_at else ""
                })
            return results
        except Exception as e:
            logger.error(f"Error fetching alerts: {e}")
            return []
        finally:
            if not self.db:
                session.close()

    def create_alert(
        self,
        asset_id: str,
        alert_type: str,
        condition: str,
        threshold_value: Optional[float] = None,
        user_id: str = "default_user"
    ) -> bool:
        """Creates a new price or signal alert trigger rule."""
        session = self.db or SessionLocal()
        try:
            alert_obj = AlertModel(
                user_id=user_id,
                asset_id=asset_id,
                alert_type=alert_type.upper(),
                condition=condition.upper(),
                threshold_value=threshold_value,
                is_active=True,
                created_at=datetime.datetime.utcnow()
            )
            session.add(alert_obj)
            session.commit()
            logger.info(f"Created alert for {asset_id}: {alert_type} {condition} {threshold_value}")
            return True
        except Exception as e:
            session.rollback()
            logger.error(f"Error creating alert: {e}")
            return False
        finally:
            if not self.db:
                session.close()

    def delete_alert(self, alert_id: int, user_id: str = "default_user") -> bool:
        """Deletes an existing alert rule by ID."""
        session = self.db or SessionLocal()
        try:
            existing = session.query(AlertModel).filter_by(id=alert_id, user_id=user_id).first()
            if existing:
                session.delete(existing)
                session.commit()
                logger.info(f"Deleted alert ID {alert_id}")
            return True
        except Exception as e:
            session.rollback()
            logger.error(f"Error deleting alert {alert_id}: {e}")
            return False
        finally:
            if not self.db:
                session.close()
