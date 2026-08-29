import sys
import os
import logging
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.services.asset_discovery import AssetDiscoveryService
from src.services.market_data_service import MarketDataService
from src.models.lstm.lstm_model import SequentialDLModel
from src.models.transformer.transformer_model import TemporalTransformerModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("train_deep_learning")

def train_deep_learning_models():
    logger.info("Starting training pipeline for Deep Learning Models (Models 4 & 5)...")

    discovery_service = AssetDiscoveryService()
    market_service = MarketDataService()

    assets_list = discovery_service.search_assets(limit=50)
    logger.info(f"Retraining Deep Learning models across {len(assets_list)} discovered assets...")

    combined_dfs = []
    for asset_info in assets_list:
        asset_id = asset_info["id"]
        m_data = market_service.fetch_processed_market_data(asset_id, timeframe="1d", limit=300)
        df_full = m_data.get("df")
        if df_full is not None and not df_full.empty:
            combined_dfs.append(df_full)

    if not combined_dfs:
        logger.error("No training data available across asset universe.")
        return

    full_dataset = pd.concat(combined_dfs, ignore_index=True)
    logger.info(f"Combined dataset ready with {len(full_dataset)} total market bars.")

    output_dir = os.path.join("models", "trained")
    os.makedirs(output_dir, exist_ok=True)

    # 1. Train Model 4a (LSTM)
    logger.info("Training Model 4a: PyTorch LSTM Model...")
    lstm_model = SequentialDLModel(cell_type="lstm", seq_length=20, hidden_dim=64)
    lstm_metrics = lstm_model.train(full_dataset, epochs=10, batch_size=64)
    lstm_path = os.path.join(output_dir, "lstm_model.pt")
    lstm_model.save(lstm_path)
    logger.info(f"Model 4a (LSTM) Metrics: {lstm_metrics}")

    # 2. Train Model 4b (GRU)
    logger.info("Training Model 4b: PyTorch GRU Model...")
    gru_model = SequentialDLModel(cell_type="gru", seq_length=20, hidden_dim=64)
    gru_metrics = gru_model.train(full_dataset, epochs=10, batch_size=64)
    gru_path = os.path.join(output_dir, "gru_model.pt")
    gru_model.save(gru_path)
    logger.info(f"Model 4b (GRU) Metrics: {gru_metrics}")

    # 3. Train Model 5 (Temporal Transformer)
    logger.info("Training Model 5: PyTorch Temporal Transformer...")
    transformer_model = TemporalTransformerModel(seq_length=20, d_model=64, nhead=4)
    transformer_metrics = transformer_model.train(full_dataset, epochs=10, batch_size=64)
    transformer_path = os.path.join(output_dir, "temporal_transformer.pt")
    transformer_model.save(transformer_path)
    logger.info(f"Model 5 (Transformer) Metrics: {transformer_metrics}")

    logger.info("Deep Learning Models (Models 4 & 5) trained and checkpoints saved successfully!")

if __name__ == "__main__":
    train_deep_learning_models()
