import os
import pytest
import pandas as pd
import numpy as np

from src.features.technical import TechnicalAnalysisEngine
from src.features.candlestick import CandlestickEngine
from src.models.lstm.lstm_model import SequentialDLModel
from src.models.transformer.transformer_model import TemporalTransformerModel

@pytest.fixture
def feature_dataset():
    """Generates synthetic 150-bar dataset with technical indicators & candlestick patterns."""
    np.random.seed(42)
    timestamps = pd.date_range("2024-01-01", periods=150, freq="D", tz="UTC")
    returns = np.random.normal(0.001, 0.02, 150)
    close = 100.0 * np.exp(np.cumsum(returns))
    high = close * (1 + np.abs(np.random.normal(0.005, 0.002, 150)))
    low = close * (1 - np.abs(np.random.normal(0.005, 0.002, 150)))
    open_p = close * (1 + np.random.normal(0, 0.003, 150))
    volume = np.random.uniform(50000, 500000, 150)

    high = np.maximum(high, np.maximum(open_p, close))
    low = np.minimum(low, np.minimum(open_p, close))

    df = pd.DataFrame({
        "timestamp": timestamps,
        "open": open_p,
        "high": high,
        "low": low,
        "close": close,
        "volume": volume
    })

    ta = TechnicalAnalysisEngine()
    cs = CandlestickEngine()
    return cs.detect_patterns(ta.compute_all_indicators(df))

def test_lstm_model(feature_dataset, tmp_path):
    lstm = SequentialDLModel(cell_type="lstm", seq_length=15, hidden_dim=32)
    metrics = lstm.train(feature_dataset, epochs=2, batch_size=16)

    assert "final_loss" in metrics
    assert lstm.is_trained is True

    pred = lstm.predict(feature_dataset)
    assert "bullish_probability" in pred
    assert "bearish_probability" in pred
    assert "sideways_probability" in pred
    assert pred["predicted_regime"] in ["BULLISH", "BEARISH", "SIDEWAYS"]

    total_prob = pred["bullish_probability"] + pred["bearish_probability"] + pred["sideways_probability"]
    assert pytest.approx(total_prob, abs=1e-2) == 1.0

    # Save & Load test
    save_path = str(tmp_path / "lstm.pt")
    lstm.save(save_path)
    assert os.path.exists(save_path)

    loaded_lstm = SequentialDLModel()
    loaded_lstm.load(save_path)
    loaded_pred = loaded_lstm.predict(feature_dataset)
    assert loaded_pred["predicted_regime"] == pred["predicted_regime"]

def test_gru_model(feature_dataset, tmp_path):
    gru = SequentialDLModel(cell_type="gru", seq_length=15, hidden_dim=32)
    metrics = gru.train(feature_dataset, epochs=2, batch_size=16)

    assert gru.is_trained is True
    pred = gru.predict(feature_dataset)
    assert pred["model_type"] == "GRU"

def test_temporal_transformer_model(feature_dataset, tmp_path):
    transformer = TemporalTransformerModel(seq_length=15, d_model=32, nhead=2)
    metrics = transformer.train(feature_dataset, epochs=2, batch_size=16)

    assert "final_loss" in metrics
    assert transformer.is_trained is True

    pred = transformer.predict(feature_dataset)
    assert "bullish_probability" in pred
    assert "bearish_probability" in pred
    assert "sideways_probability" in pred
    assert pred["predicted_regime"] in ["BULLISH", "BEARISH", "SIDEWAYS"]

    total_prob = pred["bullish_probability"] + pred["bearish_probability"] + pred["sideways_probability"]
    assert pytest.approx(total_prob, abs=1e-2) == 1.0

    # Save & Load test
    save_path = str(tmp_path / "transformer.pt")
    transformer.save(save_path)
    assert os.path.exists(save_path)

    loaded_tf = TemporalTransformerModel()
    loaded_tf.load(save_path)
    loaded_pred = loaded_tf.predict(feature_dataset)
    assert loaded_pred["predicted_regime"] == pred["predicted_regime"]
