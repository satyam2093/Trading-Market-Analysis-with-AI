# AI_MODEL_OPTIMIZATION_REPORT.md — Quantitative Model Tuning & Calibration

**Platform**: NexQuant Quantitative Intelligence  
**System Version**: 2.2.0-Production  

---

## 1. Hyperparameter Calibration Matrix

1. **XGBoost Regime Classifier**:
   - `max_depth = 4`, `learning_rate = 0.05`, `n_estimators = 100`, `eval_metric = "mlogloss"`.
   - Prevented leaf overfitting on high-frequency noise while capturing sharp volatility regime boundaries.
2. **PyTorch Temporal Transformer**:
   - `d_model = 64`, `nhead = 4`, `dim_feedforward = 128`, `dropout = 0.20`.
   - Global average pooling across temporal dimensions ensures translation invariance to market cycles.
3. **Bi-LSTM / GRU**:
   - `hidden_dim = 64`, `num_layers = 2`, `dropout = 0.30`.
   - Layer Normalization placed at input projection to stabilize gradients during extreme market shocks.
4. **Ensemble Probability Calibration**:
   - Softmax scaling normalized with epsilon $\epsilon = 10^{-8}$ prevents numerical underflow.
   - Convex combination guarantees $\sum_C P(C) = 1.0$.
