# AI_8_MODEL_AUDIT.md — Complete Audit of 8 Quantitative AI Models

**Platform**: NexQuant Quantitative Intelligence  
**System Version**: 2.2.0-Production  

---

## 1. Inventory & Health Status

| Model # | Model Identifier | Architecture | Code Location | Status | Horizon Adaptability |
|---|---|---|---|---|---|
| **Model 1** | Market Regime Classifier | XGBoost / Random Forest | `src/models/regime/` | OPERATIONAL | Dynamic forward return window (2 to 30 bars) |
| **Model 2** | Multi-Horizon Direction | Probabilistic Classifiers | `src/models/direction/` | OPERATIONAL | Configurable candle targets ($[1, 2, 3]$ to $[20, 40, 60]$) |
| **Model 3** | Volatility & Risk Engine | Gradient Boosted Regressor | `src/models/volatility/` | OPERATIONAL | Style-scaled volatility targets & 95% VaR |
| **Model 4** | PyTorch Bi-LSTM / GRU | Recurrent Neural Network | `src/models/lstm/` | OPERATIONAL | Sliding window sequence length $T \in [12, 60]$ |
| **Model 5** | Temporal Attention Transformer | Multi-Head Self-Attention | `src/models/transformer/` | OPERATIONAL | Lookback tokens $T \in [16, 80]$ with sinusoidal PE |
| **Model 6** | Market Graph Neural Net | 2-Layer GCN | `src/models/gnn/` | OPERATIONAL | Cross-asset correlation topology without data leakage |
| **Model 7** | Financial Statement NLP | Ratio & Growth Analyzer | `src/models/financial_nlp/` | OPERATIONAL | Dynamic weighting (0% Scalp to 25% Investor) |
| **Model 8** | News Sentiment NLP | Continuous Half-Life Decay | `src/models/news_nlp/` | OPERATIONAL | Exponential half-life $t_{1/2} \in [2\text{h}, 720\text{h}]$ |

All 8 models verified with automated pytest test suites and zero lookahead bias.
