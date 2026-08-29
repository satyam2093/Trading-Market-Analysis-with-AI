import os
import joblib
import logging
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier

logger = logging.getLogger(__name__)

class MarketRegimeClassifier:
    """
    Model 1: Market Regime Classifier.
    Predicts probabilities for BULLISH, BEARISH, and SIDEWAYS market regimes.
    """

    FEATURE_COLS = [
        "returns_1", "returns_5", "returns_20", "volatility_20",
        "rsi_14", "macd", "macd_signal", "macd_hist", "adx_14", "di_plus", "di_minus",
        "atr_14", "bollinger_pband", "bollinger_wband", "ema_ratio_20_50", "ema_ratio_50_200",
        "volume_ma_ratio_20",
        "pattern_doji", "pattern_hammer", "pattern_bullish_engulfing", "pattern_bearish_engulfing",
        "pattern_morning_star", "pattern_evening_star"
    ]

    REGIME_MAP = {0: "SIDEWAYS", 1: "BULLISH", 2: "BEARISH"}

    def __init__(self, model_type: str = "xgboost"):
        self.model_type = model_type
        self.model = None
        self.is_trained = False

    def create_regime_labels(self, df: pd.DataFrame, forward_horizon: int = 5, threshold: float = 0.015) -> pd.Series:
        """
        Creates target regime labels:
        1 (BULLISH)  : forward return > threshold
        2 (BEARISH)  : forward return < -threshold
        0 (SIDEWAYS) : -threshold <= forward return <= threshold
        """
        fwd_return = df["close"].pct_change(forward_horizon).shift(-forward_horizon)
        labels = np.zeros(len(df), dtype=int)
        labels[fwd_return > threshold] = 1
        labels[fwd_return < -threshold] = 2
        return pd.Series(labels, index=df.index)

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extracts and cleans feature set from input DataFrame."""
        df_feats = df.copy()
        # Convert boolean pattern columns to float (0.0 / 1.0)
        for col in self.FEATURE_COLS:
            if col in df_feats.columns:
                df_feats[col] = df_feats[col].astype(float)
            else:
                df_feats[col] = 0.0
        return df_feats[self.FEATURE_COLS].fillna(0.0)

    def train(self, df: pd.DataFrame, forward_horizon: int = 5, threshold: float = 0.015) -> Dict[str, Any]:
        """Trains the regime classification model."""
        X = self.prepare_features(df)
        y = self.create_regime_labels(df, forward_horizon=forward_horizon, threshold=threshold)

        # Drop last N rows where target label is NaN due to shift
        valid_idx = ~y.isnull() & (X.index < len(df) - forward_horizon)
        X = X[valid_idx]
        y = y[valid_idx]

        if len(X) < 30:
            raise ValueError(f"Insufficient samples for training regime model ({len(X)} samples).")

        if self.model_type == "xgboost":
            self.model = XGBClassifier(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.05,
                eval_metric="mlogloss",
                random_state=42
            )
        elif self.model_type == "rf":
            self.model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
        else:
            self.model = LogisticRegression(max_iter=1000, random_state=42)

        self.model.fit(X, y)
        self.is_trained = True

        acc = float(self.model.score(X, y))
        logger.info(f"MarketRegimeClassifier ({self.model_type}) trained on {len(X)} samples. Accuracy: {acc:.4f}")
        
        return {"samples": len(X), "accuracy": round(acc, 4)}

    def predict(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generates regime prediction probabilities on current/latest market state.
        """
        if not self.is_trained or self.model is None:
            raise RuntimeError("Model is not trained. Call train() or load() before predict().")

        X = self.prepare_features(df)
        latest_X = X.tail(1)

        probs = self.model.predict_proba(latest_X)[0]
        # Handle cases where not all 3 classes were seen during training
        classes = getattr(self.model, "classes_", [0, 1, 2])
        prob_dict = {0: 0.0, 1: 0.0, 2: 0.0}
        for cls, pr in zip(classes, probs):
            prob_dict[int(cls)] = float(pr)

        sideways_prob = prob_dict[0]
        bullish_prob = prob_dict[1]
        bearish_prob = prob_dict[2]

        pred_cls = int(np.argmax([sideways_prob, bullish_prob, bearish_prob]))
        pred_regime = self.REGIME_MAP[pred_cls]
        confidence = float(max([sideways_prob, bullish_prob, bearish_prob]))

        return {
            "bullish_probability": round(bullish_prob, 4),
            "bearish_probability": round(bearish_prob, 4),
            "sideways_probability": round(sideways_prob, 4),
            "predicted_regime": pred_regime,
            "confidence": round(confidence, 4)
        }

    def save(self, filepath: str):
        """Saves model checkpoint to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({"model": self.model, "model_type": self.model_type, "features": self.FEATURE_COLS}, filepath)
        logger.info(f"Saved MarketRegimeClassifier model to {filepath}")

    def load(self, filepath: str):
        """Loads model checkpoint from disk."""
        data = joblib.load(filepath)
        self.model = data["model"]
        self.model_type = data["model_type"]
        self.is_trained = True
        logger.info(f"Loaded MarketRegimeClassifier model from {filepath}")
