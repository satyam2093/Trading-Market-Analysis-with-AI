import logging
from typing import Dict, Any, List, Optional
import numpy as np

logger = logging.getLogger(__name__)

class EnsembleDecisionEngine:
    """
    Phase 8: Ensemble Decision Engine.
    Aggregates predictions from all available models into a unified signal:
    BUY, SELL, HOLD, or NO_TRADE with calibrated probabilities and confidence.
    """

    DEFAULT_WEIGHTS = {
        "regime_classifier": 0.20,
        "direction_model": 0.15,
        "volatility_model": 0.10,
        "lstm_model": 0.15,
        "transformer_model": 0.15,
        "gnn_model": 0.10,
        "fundamental_score": 0.08,
        "news_sentiment": 0.07,
    }

    REGIME_MAP = {0: "SIDEWAYS", 1: "BULLISH", 2: "BEARISH"}

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or self.DEFAULT_WEIGHTS

    def generate_signal(
        self,
        model_predictions: Dict[str, Dict[str, Any]],
        risk_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Produces a unified trading signal from multiple model outputs.

        model_predictions keys correspond to model names; each value contains:
          bullish_probability, bearish_probability, sideways_probability

        Returns signal dict with BUY/SELL/HOLD/NO_TRADE, probabilities, confidence, risk, explanation.
        """
        weighted_bullish = 0.0
        weighted_bearish = 0.0
        weighted_sideways = 0.0
        total_weight = 0.0
        contributing_models = []

        for model_name, pred in model_predictions.items():
            w = self.weights.get(model_name, 0.05)
            bp = float(pred.get("bullish_probability", 0.33))
            brp = float(pred.get("bearish_probability", 0.33))
            sp = float(pred.get("sideways_probability", 0.34))

            weighted_bullish += w * bp
            weighted_bearish += w * brp
            weighted_sideways += w * sp
            total_weight += w
            contributing_models.append(model_name)

        if total_weight > 0:
            weighted_bullish /= total_weight
            weighted_bearish /= total_weight
            weighted_sideways /= total_weight

        # Normalize to sum = 1.0
        prob_sum = weighted_bullish + weighted_bearish + weighted_sideways + 1e-8
        bullish_prob = weighted_bullish / prob_sum
        bearish_prob = weighted_bearish / prob_sum
        sideways_prob = weighted_sideways / prob_sum

        # Determine predicted regime
        probs = [sideways_prob, bullish_prob, bearish_prob]
        pred_cls = int(np.argmax(probs))
        regime = self.REGIME_MAP[pred_cls]
        confidence = float(max(probs))

        # Generate trading signal
        risk_level = "MEDIUM"
        if risk_info:
            risk_level = risk_info.get("risk_level", "MEDIUM")
            risk_score = risk_info.get("risk_score", 50.0)
        else:
            risk_score = 50.0

        signal = self._determine_signal(regime, confidence, risk_level, risk_score)

        # Build explanation
        explanation = self._build_explanation(
            signal, regime, confidence, bullish_prob, bearish_prob,
            sideways_prob, risk_level, contributing_models
        )

        return {
            "signal": signal,
            "regime": regime,
            "bullish_probability": round(bullish_prob, 4),
            "bearish_probability": round(bearish_prob, 4),
            "sideways_probability": round(sideways_prob, 4),
            "confidence": round(confidence, 4),
            "risk_level": risk_level,
            "risk_score": round(risk_score, 2),
            "contributing_models": contributing_models,
            "explanation": explanation
        }

    def _determine_signal(self, regime: str, confidence: float, risk_level: str, risk_score: float) -> str:
        # NO_TRADE overrides
        if risk_level == "EXTREME" or risk_score >= 85.0:
            return "NO_TRADE"
        if confidence < 0.40:
            return "HOLD"

        if regime == "BULLISH":
            if confidence >= 0.55:
                return "BUY"
            else:
                return "HOLD"
        elif regime == "BEARISH":
            if confidence >= 0.55:
                return "SELL"
            else:
                return "HOLD"
        else:  # SIDEWAYS
            return "HOLD"

    def _build_explanation(self, signal, regime, confidence, bp, brp, sp, risk, models) -> Dict[str, Any]:
        factors = []
        if regime == "BULLISH":
            factors.append(f"Ensemble indicates BULLISH regime with {bp:.1%} probability.")
        elif regime == "BEARISH":
            factors.append(f"Ensemble indicates BEARISH regime with {brp:.1%} probability.")
        else:
            factors.append(f"Ensemble indicates SIDEWAYS regime with {sp:.1%} probability.")

        factors.append(f"Overall confidence: {confidence:.1%}.")
        factors.append(f"Risk level: {risk}.")
        factors.append(f"Models contributing: {len(models)} ({', '.join(models)}).")

        if signal == "NO_TRADE":
            factors.append("Signal overridden to NO_TRADE due to extreme risk conditions.")
        elif signal == "HOLD":
            factors.append("Confidence below threshold or regime is sideways — recommending HOLD.")

        return {
            "signal_rationale": signal,
            "factors": factors,
            "disclaimer": "This is a probabilistic AI prediction, NOT guaranteed financial advice. Always verify independently."
        }
