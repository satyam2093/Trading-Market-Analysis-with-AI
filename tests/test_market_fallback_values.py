from src.services.market_data_service import MarketDataService


def test_market_live_quote_falls_back_to_catalog_price():
    service = MarketDataService()

    btc_quote = service.fetch_live_quote("BTC")
    assert btc_quote["price"] > 0
    assert btc_quote["data_status"] in {"LIVE", "UNAVAILABLE"}

    btc_data = service.fetch_processed_market_data("BTC", timeframe="1d", limit=20)
    assert btc_data["data_status"] in {"LIVE", "UNAVAILABLE"}
    assert "df" in btc_data
