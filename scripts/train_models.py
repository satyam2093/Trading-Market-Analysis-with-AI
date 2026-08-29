import sys
import os
import logging
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.services.asset_discovery import AssetDiscoveryService
from src.services.market_data_service import MarketDataService
from src.models.regime.regime_classifier import MarketRegimeClassifier
from src.models.direction.direction_model import PriceDirectionModel
from src.models.volatility.volatility_model import VolatilityPredictionModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("train_models")

def train_and_save_all_models():
    logger.info("Starting automated training pipeline for Core ML Models 1, 2, and 3...")
    
    discovery_service = AssetDiscoveryService()
    market_service = MarketDataService()

    assets_list = discovery_service.search_assets(limit=50)
    logger.info(f"Retraining models using dataset across {len(assets_list)} discovered assets...")

    combined_dfs = []
    for asset_info in assets_list:
        asset_id = asset_info["id"]
        m_data = market_service.fetch_processed_market_data(asset_id, timeframe="1d", limit=300)
        df_full = m_data.get("df")
        if df_full is not None and not df_full.empty:
            df_full["asset_id"] = asset_id
            combined_dfs.append(df_full)

    if not combined_dfs:
        logger.error("No training data available across asset universe.")
        return

    full_dataset = pd.concat(combined_dfs, ignore_index=True)
    logger.info(f"Combined dataset ready with {len(full_dataset)} total market bars.")

    output_dir = os.path.join("models", "trained")
    os.makedirs(output_dir, exist_ok=True)

    # 1. Train Model 1 (Regime Classifier)
    logger.info("Training Model 1: Market Regime Classifier...")
    regime_model = MarketRegimeClassifier(model_type="xgboost")
    regime_metrics = regime_model.train(full_dataset)
    regime_path = os.path.join(output_dir, "regime_classifier.joblib")
    regime_model.save(regime_path)
    logger.info(f"Model 1 Metrics: {regime_metrics}")

    # 2. Train Model 2 (Price Direction Model)
    logger.info("Training Model 2: Price Direction Model...")
    direction_model = PriceDirectionModel(model_type="xgboost")
    direction_metrics = direction_model.train(full_dataset)
    direction_path = os.path.join(output_dir, "price_direction.joblib")
    direction_model.save(direction_path)
    logger.info(f"Model 2 Metrics: {direction_metrics}")

    # 3. Train Model 3 (Volatility Prediction Model)
    logger.info("Training Model 3: Volatility Prediction Model...")
    volatility_model = VolatilityPredictionModel(model_type="xgboost")
    volatility_metrics = volatility_model.train(full_dataset)
    volatility_path = os.path.join(output_dir, "volatility_prediction.joblib")
    volatility_model.save(volatility_path)
    logger.info(f"Model 3 Metrics: {volatility_metrics}")

    logger.info("All Core ML models (1, 2, 3) trained and saved successfully!")

if __name__ == "__main__":
    train_and_save_all_models()
