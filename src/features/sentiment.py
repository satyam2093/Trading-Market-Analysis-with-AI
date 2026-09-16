import logging
import re
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Financial keyword lexicons for rule-based sentiment baseline
POSITIVE_KEYWORDS = {
    "beat", "beats", "beating", "exceeded", "surpass", "upgrade", "upgraded", "buy",
    "growth", "strong", "profit", "gains", "rally", "bullish", "soar", "surge",
    "record", "high", "expansion", "partnership", "innovation", "breakout",
    "outperform", "positive", "optimistic", "recovery", "dividend", "boost"
}
NEGATIVE_KEYWORDS = {
    "miss", "missed", "decline", "loss", "losses", "downgrade", "sell", "bearish",
    "crash", "fall", "plunge", "drop", "weak", "lawsuit", "investigation", "fraud",
    "bankruptcy", "hack", "breach", "penalty", "fine", "recession", "layoff",
    "warning", "risk", "negative", "pessimistic", "cut", "slump", "debt"
}
EVENT_KEYWORDS = {
    "earnings": "Earnings", "quarterly": "Earnings", "results": "Earnings",
    "acquisition": "Acquisition", "acquire": "Acquisition", "merger": "Acquisition",
    "lawsuit": "Lawsuit", "sue": "Lawsuit", "legal": "Lawsuit",
    "regulation": "Regulation", "regulatory": "Regulation", "sec": "Regulation",
    "launch": "Product Launch", "product": "Product Launch", "release": "Product Launch",
    "partnership": "Partnership", "partner": "Partnership", "collaboration": "Partnership",
    "ceo": "Management Change", "resign": "Management Change", "appoint": "Management Change",
    "bankruptcy": "Bankruptcy", "insolvent": "Bankruptcy",
    "hack": "Cyberattack", "breach": "Cyberattack", "cyber": "Cyberattack",
    "etf": "ETF Development", "approval": "ETF Development",
    "government": "Government Announcement", "policy": "Government Announcement"
}

class SentimentAnalysisEngine:
    """
    Financial News Sentiment & Event Classification Engine.
    Uses keyword-based scoring as baseline (FinBERT can be swapped in later).
    """

    def analyze_news_item(self, news_item: Dict[str, Any]) -> Dict[str, Any]:
        headline = news_item.get("headline", "").lower()
        summary = news_item.get("summary", "").lower()
        combined_text = f"{headline} {summary}"
        words = set(re.findall(r'\b[a-z]+\b', combined_text))

        pos_hits = words & POSITIVE_KEYWORDS
        neg_hits = words & NEGATIVE_KEYWORDS

        pos_count = len(pos_hits)
        neg_count = len(neg_hits)
        total = pos_count + neg_count + 1e-8

        sentiment_score = (pos_count - neg_count) / total
        sentiment_score = max(-1.0, min(1.0, sentiment_score))

        if sentiment_score > 0.15:
            sentiment = "POSITIVE"
        elif sentiment_score < -0.15:
            sentiment = "NEGATIVE"
        else:
            sentiment = "NEUTRAL"

        # Event detection
        event_type = None
        for kw, ev in EVENT_KEYWORDS.items():
            if kw in combined_text:
                event_type = ev
                break

        # Impact scoring
        impact_score = abs(sentiment_score)
        if impact_score > 0.5:
            impact_level = "HIGH"
        elif impact_score > 0.2:
            impact_level = "MEDIUM"
        else:
            impact_level = "LOW"

        confidence = min(1.0, 0.5 + impact_score * 0.5)

        return {
            "id": news_item.get("id"),
            "asset_id": news_item.get("asset_symbol", "").replace("-USD", "").replace(".NS", ""),
            "headline": news_item.get("headline", ""),
            "summary": news_item.get("summary", ""),
            "source": news_item.get("source", "Unknown"),
            "url": news_item.get("url", ""),
            "published_at": news_item.get("published_at", ""),
            "sentiment": sentiment,
            "sentiment_score": round(sentiment_score, 4),
            "event_type": event_type,
            "impact_level": impact_level,
            "confidence": round(confidence, 4)
        }

    def analyze_news_batch(self, news_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [self.analyze_news_item(item) for item in news_items]

    def compute_aggregate_sentiment(
        self,
        analyzed_items: List[Dict[str, Any]],
        trading_style: Any = None,
        half_life_hours: float = 24.0
    ) -> Dict[str, Any]:
        if not analyzed_items:
            return {"aggregate_sentiment": "NEUTRAL", "aggregate_score": 0.0, "news_count": 0}

        if trading_style is not None:
            from src.models.trading_style import get_trading_style_config
            cfg = get_trading_style_config(trading_style)
            half_life_hours = cfg.news_half_life_hours

        # Compute decay weights: w_i = 0.5 ^ (age_hours / half_life_hours)
        total_weight = 0.0
        weighted_score_sum = 0.0
        decay_constant = 0.693147 / max(0.1, half_life_hours)

        import datetime
        now = datetime.datetime.now(datetime.timezone.utc)

        for item in analyzed_items:
            pub = item.get("published_at")
            age_hours = 0.0
            if pub:
                try:
                    pub_dt = datetime.datetime.fromisoformat(str(pub).replace("Z", "+00:00"))
                    age_hours = max(0.0, (now - pub_dt).total_seconds() / 3600.0)
                except Exception:
                    age_hours = 0.0

            weight = 2.71828 ** (-decay_constant * age_hours)
            weighted_score_sum += item["sentiment_score"] * weight
            total_weight += weight

        avg_score = weighted_score_sum / max(1e-8, total_weight)
        high_impact = sum(1 for item in analyzed_items if item["impact_level"] == "HIGH")

        if avg_score > 0.15:
            agg_sent = "POSITIVE"
        elif avg_score < -0.15:
            agg_sent = "NEGATIVE"
        else:
            agg_sent = "NEUTRAL"

        return {
            "aggregate_sentiment": agg_sent,
            "aggregate_score": round(avg_score, 4),
            "news_count": len(analyzed_items),
            "half_life_hours": half_life_hours,
            "high_impact_count": high_impact,
            "positive_count": sum(1 for i in analyzed_items if i["sentiment"] == "POSITIVE"),
            "negative_count": sum(1 for i in analyzed_items if i["sentiment"] == "NEGATIVE"),
            "neutral_count": sum(1 for i in analyzed_items if i["sentiment"] == "NEUTRAL")
        }

