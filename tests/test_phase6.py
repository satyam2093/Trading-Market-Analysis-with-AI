import pytest
from src.data.news_data import NewsDataProvider
from src.features.sentiment import SentimentAnalysisEngine
from src.models.news_nlp.news_nlp import NewsNLPModel

def test_news_data_provider():
    provider = NewsDataProvider()
    items = provider.fetch_recent_news("AAPL", limit=5)
    assert isinstance(items, list)
    assert len(items) >= 1
    assert "headline" in items[0]
    assert "id" in items[0]

def test_sentiment_analysis_engine():
    engine = SentimentAnalysisEngine()

    pos_item = {"id": "1", "headline": "Company beats earnings, strong growth and record profits", "summary": "", "asset_symbol": "TEST"}
    pos_res = engine.analyze_news_item(pos_item)
    assert pos_res["sentiment"] == "POSITIVE"
    assert pos_res["sentiment_score"] > 0

    neg_item = {"id": "2", "headline": "Company faces lawsuit, losses mount amid fraud investigation", "summary": "", "asset_symbol": "TEST"}
    neg_res = engine.analyze_news_item(neg_item)
    assert neg_res["sentiment"] == "NEGATIVE"
    assert neg_res["sentiment_score"] < 0

def test_event_detection():
    engine = SentimentAnalysisEngine()
    item = {"id": "3", "headline": "Company announces acquisition of rival firm", "summary": "", "asset_symbol": "TEST"}
    res = engine.analyze_news_item(item)
    assert res["event_type"] == "Acquisition"

def test_aggregate_sentiment():
    engine = SentimentAnalysisEngine()
    items = [
        {"id": "1", "headline": "Strong growth and profit surge", "summary": "", "asset_symbol": "T"},
        {"id": "2", "headline": "Record earnings beat estimates", "summary": "", "asset_symbol": "T"},
        {"id": "3", "headline": "Market update for the sector", "summary": "", "asset_symbol": "T"},
    ]
    analyzed = engine.analyze_news_batch(items)
    agg = engine.compute_aggregate_sentiment(analyzed)
    assert agg["news_count"] == 3
    assert agg["aggregate_sentiment"] in ["POSITIVE", "NEGATIVE", "NEUTRAL"]

def test_news_nlp_model_pipeline():
    model = NewsNLPModel()
    result = model.run_pipeline("BTC-USD", limit=5)
    assert "news_items" in result
    assert "aggregate" in result
    assert result["aggregate"]["news_count"] >= 1
    for item in result["news_items"]:
        assert item["sentiment"] in ["POSITIVE", "NEGATIVE", "NEUTRAL"]
        assert item["impact_level"] in ["HIGH", "MEDIUM", "LOW"]
