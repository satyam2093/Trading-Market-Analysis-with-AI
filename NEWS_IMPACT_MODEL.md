# NEWS_IMPACT_MODEL.md — Horizon-Calibrated News Impact & Sentiment Architecture

**Platform**: NexQuant Quantitative Intelligence  
**Author**: NLP Engineering & Financial Data Architecture Team  
**System Version**: 2.2.0-Production  

---

## 1. Executive Summary

Financial news releases exert non-linear temporal decay on asset prices. A breaking regulatory order or earnings surprise generates severe initial price volatility that fades quickly for intraday market participants, yet establishes a sustained fundamental valuation trend that persists for months for institutional investors.

NexQuant Model 8 (`src/models/news_nlp/news_nlp.py` & `src/features/sentiment.py`) replaces static unweighted sentiment with a **Continuous Half-Life Exponential Decay Engine**.

---

## 2. Exponential Decay Formulation

For any news item $i$ published at timestamp $t_i$, its effective sentiment weight $w_i(t)$ at evaluation time $t$ is formulated as:

$$w_i(t) = \exp\left( -\lambda \cdot \Delta t_i \right) = 0.5^{\frac{\Delta t_i}{t_{1/2}}}$$

Where:
- $\Delta t_i = t - t_i$ is the age of the news item in hours ($\Delta t_i \ge 0$).
- $t_{1/2}$ is the trading-style half-life in hours.
- $\lambda = \frac{\ln(2)}{t_{1/2}}$ is the exponential decay constant.

The aggregate sentiment score $S_{\text{agg}}$ is computed via weighted kernel expectation:

$$S_{\text{agg}} = \frac{\sum_{i=1}^M w_i(t) \cdot s_i}{\sum_{i=1}^M w_i(t) + \epsilon}$$

Where $s_i \in [-1.0, +1.0]$ is the calibrated sentiment polarity score of item $i$, and $M$ is the number of validated news items.

---

## 3. Style-Specific Decay Constants

| Trading Style | Half-Life ($t_{1/2}$) | Decay Constant ($\lambda$) | Rationale |
|---|---|---|---|
| **SCALPER** | 2 Hours | $0.3466\text{ hr}^{-1}$ | High-frequency traders react only to breaking wire flashes. News older than 4 hours is fully priced in and constitutes dead noise. |
| **INTRADAY** | 8 Hours | $0.0866\text{ hr}^{-1}$ | Intraday traders hold through session closes. News within the same trading session dictates opening drive and lunch-hour liquidity. |
| **SWING** | 72 Hours (3 Days) | $0.0096\text{ hr}^{-1}$ | Multi-day structural waves follow earnings guidance revisions, macro rate decisions, and geopolitical negotiations over several days. |
| **INVESTOR** | 720 Hours (30 Days) | $0.00096\text{ hr}^{-1}$ | Long-term capital allocation reflects quarterly disclosures, antitrust rulings, balance sheet restructuring, and cyclical sector shifts. |

---

## 4. News Pipeline Integrity

1. **Zero News Fabrication**: Only real-world articles retrieved from verified financial feeds (Reuters, Bloomberg, FT, SEC EDGAR, Google News RSS) are ingested.
2. **Deterministic Event Classification**: Articles are classified across 11 financial event taxonomies (Earnings, Mergers, Lawsuits, Regulations, Product Releases, Management Changes, Cyber Incidents, ETF Filings, Government Policy).
3. **Impact Gating**: Low-relevance headlines are assigned fractional impact scores ($< 0.20$), preventing routine PR noise from triggering false ensemble signals.
