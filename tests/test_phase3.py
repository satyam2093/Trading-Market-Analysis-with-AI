import os
import pytest
import pandas as pd
import numpy as np

from src.features.technical import TechnicalAnalysisEngine
from src.features.candlestick import CandlestickEngine
from src.models.regime.regime_classifier import MarketRegimeClassifier
from src.models.direction.direction_model import PriceDirectionModel
from src.models.volatility.volatility_model import VolatilityPredictionModel

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

def test_market_regime_classifier(feature_dataset, tmp_path):
    clf = MarketRegimeClassifier(model_type="xgboost")
    metrics = clf.train(feature_dataset)
    
    assert "accuracy" in metrics
    assert clf.is_trained is True

    # Prediction test
    pred = clf.predict(feature_dataset)
    assert "bullish_probability" in pred
    assert "bearish_probability" in pred
    assert "sideways_probability" in pred
    assert pred["predicted_regime"] in ["BULLISH", "BEARISH", "SIDEWAYS"]
    
    # Check probabilities sum approximately to 1.0
    total_prob = pred["bullish_probability"] + pred["bearish_probability"] + pred["sideways_probability"]
    assert pytest.approx(total_prob, abs=1e-2) == 1.0

    # Save & Load test
    save_path = str(tmp_path / "regime.joblib")
    clf.save(save_path)
    assert os.path.exists(save_path)

    loaded_clf = MarketRegimeClassifier()
    loaded_clf.load(save_path)
    loaded_pred = loaded_clf.predict(feature_dataset)
    assert loaded_pred["predicted_regime"] == pred["predicted_regime"]

def test_price_direction_model(feature_dataset, tmp_path):
    dir_model = PriceDirectionModel(model_type="xgboost")
    metrics = dir_model.train(feature_dataset)

    assert dir_model.is_trained is True

    predictions = dir_model.predict(feature_dataset)
    assert "1_candle" in predictions
    assert "5_candle" in predictions
    assert "20_candle" in predictions

    for horizon_key, res in predictions.items():
        assert res["predicted_direction"] in ["UP", "DOWN"]
        assert 0.0 <= res["up_probability"] <= 1.0
        assert 0.0 <= res["down_probability"] <= 1.0

    # Save & Load test
    save_path = str(tmp_path / "direction.joblib")
    dir_model.save(save_path)
    assert os.path.exists(save_path)

    loaded_model = PriceDirectionModel()
    loaded_model.load(save_path)
    loaded_preds = loaded_model.predict(feature_dataset)
    assert loaded_preds["5_candle"]["predicted_direction"] == predictions["5_candle"]["predicted_direction"]

def test_volatility_prediction_model(feature_dataset, tmp_path):
    vol_model = VolatilityPredictionModel(model_type="xgboost")
    metrics = vol_model.train(feature_dataset)

    assert vol_model.is_trained is True

    pred = vol_model.predict(feature_dataset)
    assert "expected_volatility" in pred
    assert pred["expected_volatility"] > 0
    assert pred["volatility_regime"] in ["LOW", "MEDIUM", "HIGH", "EXTREME"]
    assert 0.0 <= pred["risk_score"] <= 100.0

    # Save & Load test
    save_path = str(tmp_path / "volatility.joblib")
    vol_model.save(save_path)
    assert os.path.exists(save_path)

    loaded_vol = VolatilityPredictionModel()
    loaded_vol.load(save_path)
    loaded_pred = loaded_vol.predict(feature_dataset)
    assert loaded_pred["volatility_regime"] == pred["volatility_regime"]
