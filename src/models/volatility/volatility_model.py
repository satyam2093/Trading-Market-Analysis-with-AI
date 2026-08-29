import os
import joblib
import logging
from typing import Dict, Any
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.ensemble import RandomForestRegressor

logger = logging.getLogger(__name__)

class VolatilityPredictionModel:
    """
    Model 3: Volatility Prediction & Risk Scoring Model.
    Predicts future annualized volatility and assigns Volatility Regimes & Risk Scores (0-100).
    """

    FEATURE_COLS = [
        "volatility_20", "atr_14", "bollinger_wband", "returns_1", "returns_5",
        "adx_14", "volume_ma_ratio_20"
    ]

    def __init__(self, model_type: str = "xgboost"):
        self.model_type = model_type
        self.regressor = None
        self.is_trained = False

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df_feats = df.copy()
        for col in self.FEATURE_COLS:
            if col not in df_feats.columns:
                df_feats[col] = 0.0
            else:
                df_feats[col] = df_feats[col].astype(float)
        return df_feats[self.FEATURE_COLS].fillna(0.0)

    def create_volatility_label(self, df: pd.DataFrame, forward_horizon: int = 5) -> pd.Series:
        """Target: Annualized volatility over next forward_horizon candles."""
        log_ret = np.log(df["close"] / (df["close"].shift(1) + 1e-8))
        fwd_vol = log_ret.rolling(window=forward_horizon).std().shift(-forward_horizon) * np.sqrt(252)
        return fwd_vol

    def train(self, df: pd.DataFrame, forward_horizon: int = 5) -> Dict[str, Any]:
        X = self.prepare_features(df)
        y = self.create_volatility_label(df, forward_horizon=forward_horizon)

        valid_idx = ~y.isnull() & (X.index < len(df) - forward_horizon)
        X = X[valid_idx]
        y = y[valid_idx]

        if len(X) < 20:
            raise ValueError(f"Insufficient samples for training volatility model ({len(X)} samples).")

        if self.model_type == "xgboost":
            self.regressor = XGBRegressor(n_estimators=80, max_depth=3, learning_rate=0.05, random_state=42)
        else:
            self.regressor = RandomForestRegressor(n_estimators=80, max_depth=4, random_state=42)

        self.regressor.fit(X, y)
        self.is_trained = True

        r2 = float(self.regressor.score(X, y))
        logger.info(f"VolatilityPredictionModel trained on {len(X)} samples. R2: {r2:.4f}")
        return {"samples": len(X), "r2_score": round(r2, 4)}

    def predict(self, df: pd.DataFrame) -> Dict[str, Any]:
        if not self.is_trained or self.regressor is None:
            raise RuntimeError("VolatilityPredictionModel is not trained.")

        X = self.prepare_features(df)
        latest_X = X.tail(1)

        exp_vol = float(self.regressor.predict(latest_X)[0])
        exp_vol = max(0.01, exp_vol)  # Non-negative floor

        # Determine Volatility Regime & Risk Score (0-100)
        # Typical stock annual volatility ranges: <0.15 LOW, 0.15-0.35 MEDIUM, 0.35-0.60 HIGH, >0.60 EXTREME
        if exp_vol < 0.15:
            regime = "LOW"
            risk_score = float(exp_vol / 0.15 * 25.0)
        elif exp_vol < 0.35:
            regime = "MEDIUM"
            risk_score = float(25.0 + (exp_vol - 0.15) / 0.20 * 25.0)
        elif exp_vol < 0.60:
            regime = "HIGH"
            risk_score = float(50.0 + (exp_vol - 0.35) / 0.25 * 25.0)
        else:
            regime = "EXTREME"
            risk_score = float(min(100.0, 75.0 + (exp_vol - 0.60) / 0.40 * 25.0))

        return {
            "expected_volatility": round(exp_vol, 4),
            "volatility_regime": regime,
            "risk_score": round(risk_score, 2)
        }

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({"regressor": self.regressor, "model_type": self.model_type, "features": self.FEATURE_COLS}, filepath)
        logger.info(f"Saved VolatilityPredictionModel to {filepath}")

    def load(self, filepath: str):
        data = joblib.load(filepath)
        self.regressor = data["regressor"]
        self.model_type = data["model_type"]
        self.is_trained = True
        logger.info(f"Loaded VolatilityPredictionModel from {filepath}")
