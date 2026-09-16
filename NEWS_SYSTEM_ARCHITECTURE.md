# NEWS_SYSTEM_ARCHITECTURE.md — Live Financial News Wire Architecture

**Platform**: NexQuant Quantitative Intelligence  
**System Version**: 2.2.0-Production  

---

## 1. Multi-Source Financial Media Ingestion

NexQuant ingests news from verified global financial media:
- **Global Reuters Wire**
- **Bloomberg Markets RSS**
- **Financial Times Macro**
- **Google News Financial Aggregation**
- **SEC EDGAR Form 8-K & 10-Q Disclosures**

## 2. Real-Time Editorial Photography

To ensure attention-grabbing visual fidelity, news items are matched with verified editorial photography from global wire repositories representing market exchanges, central banks, and technology leaders.

## 3. Natural Language Processing Pipeline

Each headline and summary undergoes:
1. **Deduplication & Sanitization**: Stripping HTML artifacts, tracking hashes, and duplicates.
2. **Lexical & FinBERT Sentiment Scoring**: Determining polarity $s_i \in [-1.0, +1.0]$.
3. **Event Extraction**: Categorizing corporate actions, earnings surprises, and macro policy.
4. **Continuous Horizon Half-Life Decay**: Feeding directly into Model 8 with style-specific decay rates ($t_{1/2} \in [2\text{h}, 720\text{h}]$).
