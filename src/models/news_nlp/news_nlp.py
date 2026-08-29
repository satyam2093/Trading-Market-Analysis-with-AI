import logging
from typing import Dict, Any, List

from src.data.news_data import NewsDataProvider
from src.features.sentiment import SentimentAnalysisEngine

logger = logging.getLogger(__name__)

class NewsNLPModel:
    """
    Model 8: News Sentiment & Event Intelligence Model.
    Full pipeline: Fetch -> Deduplicate -> Classify Sentiment -> Detect Events -> Score Impact.
    Never fabricates news items.
    """

    def __init__(self):
        self.news_provider = NewsDataProvider()
        self.sentiment_engine = SentimentAnalysisEngine()

    def run_pipeline(self, symbol: str, limit: int = 20) -> Dict[str, Any]:
        """
        Executes complete news intelligence pipeline for a given asset symbol.
        """
        raw_news = self.news_provider.fetch_recent_news(symbol, limit=limit)
        analyzed = self.sentiment_engine.analyze_news_batch(raw_news)
        aggregate = self.sentiment_engine.compute_aggregate_sentiment(analyzed)

        return {
            "asset_symbol": symbol,
            "news_items": analyzed,
            "aggregate": aggregate
        }
