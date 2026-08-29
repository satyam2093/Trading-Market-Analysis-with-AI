import os
import joblib
import logging
from typing import Dict, Any, List
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

logger = logging.getLogger(__name__)

class PriceDirectionModel:
    """
    Model 2: Multi-Horizon Price Direction Model.
    Predicts UP vs DOWN directional probabilities over 1-candle, 5-candle, and 20-candle horizons.
    """

    FEATURE_COLS = [
        "returns_1", "returns_5", "returns_20", "volatility_20",
        "rsi_14", "macd", "macd_signal", "macd_hist", "adx_14",
        "bollinger_pband", "ema_ratio_20_50", "volume_ma_ratio_20"
    ]

    HORIZONS = [1, 5, 20]

    def __init__(self, model_type: str = "xgboost"):
        self.model_type = model_type
        self.models: Dict[int, Any] = {}
        self.is_trained = False

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df_feats = df.copy()
        for col in self.FEATURE_COLS:
            if col not in df_feats.columns:
                df_feats[col] = 0.0
            else:
                df_feats[col] = df_feats[col].astype(float)
        return df_feats[self.FEATURE_COLS].fillna(0.0)

    def create_direction_label(self, df: pd.DataFrame, horizon: int) -> pd.Series:
        """Binary target: 1 if close[i+horizon] > close[i], else 0."""
        fwd_ret = df["close"].pct_change(horizon).shift(-horizon)
        return (fwd_ret > 0).astype(int)

    def train(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Trains individual classifiers for each prediction horizon."""
        X_all = self.prepare_features(df)
        results = {}

        for horizon in self.HORIZONS:
            y_all = self.create_direction_label(df, horizon)
            valid_idx = ~y_all.isnull() & (X_all.index < len(df) - horizon)
            X = X_all[valid_idx]
            y = y_all[valid_idx]

            if len(X) < 20:
                logger.warning(f"Insufficient samples for horizon {horizon} training.")
                continue

            if self.model_type == "xgboost":
                clf = XGBClassifier(n_estimators=80, max_depth=3, learning_rate=0.05, eval_metric="logloss", random_state=42)
            else:
                clf = RandomForestClassifier(n_estimators=80, max_depth=4, random_state=42)

            clf.fit(X, y)
            self.models[horizon] = clf
            acc = float(clf.score(X, y))
            results[f"horizon_{horizon}_accuracy"] = round(acc, 4)

        self.is_trained = True
        logger.info(f"PriceDirectionModel trained for horizons {list(self.models.keys())}.")
        return results

    def predict(self, df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
        """Generates directional predictions across all horizons for the latest bar."""
        if not self.is_trained:
            raise RuntimeError("PriceDirectionModel is not trained.")

        X = self.prepare_features(df)
        latest_X = X.tail(1)

        predictions = {}
        for horizon, clf in self.models.items():
            probs = clf.predict_proba(latest_X)[0]
            # Class 0: DOWN, Class 1: UP
            down_prob = float(probs[0])
            up_prob = float(probs[1]) if len(probs) > 1 else 1.0 - down_prob

            direction = "UP" if up_prob >= 0.50 else "DOWN"
            confidence = max(up_prob, down_prob)

            predictions[f"{horizon}_candle"] = {
                "horizon_candles": horizon,
                "up_probability": round(up_prob, 4),
                "down_probability": round(down_prob, 4),
                "predicted_direction": direction,
                "confidence": round(confidence, 4)
            }

        return predictions

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({"models": self.models, "model_type": self.model_type, "features": self.FEATURE_COLS}, filepath)
        logger.info(f"Saved PriceDirectionModel to {filepath}")

    def load(self, filepath: str):
        data = joblib.load(filepath)
        self.models = data["models"]
        self.model_type = data["model_type"]
        self.is_trained = True
        logger.info(f"Loaded PriceDirectionModel from {filepath}")
