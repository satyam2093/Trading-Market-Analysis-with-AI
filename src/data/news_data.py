import logging
import hashlib
import datetime
from typing import List, Dict, Any
import yfinance as yf

from src.data.base_provider import BaseNewsProvider

logger = logging.getLogger(__name__)

class NewsDataProvider(BaseNewsProvider):
    """
    News Data Provider using yfinance news feed with deduplication.
    Enforces Strict Real Data Policy: No synthetic news is generated.
    """

    def fetch_recent_news(self, symbol: str, limit: int = 20) -> List[Dict[str, Any]]:
        logger.info(f"Fetching recent news for {symbol}...")
        try:
            ticker = yf.Ticker(symbol)
            raw_news = ticker.news
            if not raw_news:
                logger.warning(f"DATA UNAVAILABLE: No news items found for {symbol}.")
                return []

            items = []
            seen_ids = set()
            for item in raw_news[:limit]:
                content = item.get("content", {})
                title = content.get("title", item.get("title", ""))
                provider_name = content.get("provider", {}).get("displayName", "Unknown")
                pub_date = content.get("pubDate", "")
                url = content.get("canonicalUrl", {}).get("url", item.get("link", ""))
                summary = content.get("summary", "")

                if not title:
                    continue

                news_id = hashlib.md5(f"{title}_{pub_date}".encode()).hexdigest()
                if news_id in seen_ids:
                    continue
                seen_ids.add(news_id)

                items.append({
                    "id": news_id,
                    "headline": title,
                    "summary": summary,
                    "source": provider_name,
                    "url": url,
                    "published_at": pub_date if pub_date else datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "asset_symbol": symbol,
                    "data_status": "LIVE"
                })

            return items

        except Exception as e:
            logger.error(f"Error fetching news for {symbol}: {e}")
            return []
