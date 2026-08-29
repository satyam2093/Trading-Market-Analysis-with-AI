import pytest

from src.data.fundamentals import FundamentalDataProvider
from src.features.fundamental import FundamentalAnalysisEngine
from src.models.financial_nlp.financial_nlp import FinancialNLPModel

def test_fundamental_data_provider():
    provider = FundamentalDataProvider()
    stmt = provider.fetch_financial_statements("AAPL")

    assert isinstance(stmt, dict)
    assert "revenue" in stmt
    assert "net_income" in stmt
    assert "reporting_period" in stmt
    assert stmt["revenue"] > 0

def test_fundamental_analysis_engine():
    provider = FundamentalDataProvider()
    engine = FundamentalAnalysisEngine()

    # Test Stock Scoring
    stock_stmt = provider.fetch_financial_statements("RELIANCE.NS")
    stock_res = engine.compute_ratios_and_score(stock_stmt, asset_type="STOCK")

    assert "fundamental_score" in stock_res
    assert 0.0 <= stock_res["fundamental_score"] <= 100.0
    assert stock_res["operating_margin"] is not None

    # Test Crypto Neutral Scoring
    crypto_res = engine.compute_ratios_and_score({"asset_id": "BTC"}, asset_type="CRYPTO")
    assert crypto_res["fundamental_score"] == 50.0

def test_financial_nlp_model():
    provider = FundamentalDataProvider()
    nlp_model = FinancialNLPModel()

    curr_stmt = provider.fetch_financial_statements("NVDA")
    nlp_res = nlp_model.analyze_financial_report(curr_stmt)

    assert "overall_outlook" in nlp_res
    assert nlp_res["overall_outlook"] in ["POSITIVE", "NEUTRAL", "NEGATIVE"]
    assert "audit_metadata" in nlp_res
    assert nlp_res["audit_metadata"]["verified_no_hallucination"] is True
    assert "source" in nlp_res["audit_metadata"]
    assert "reporting_period" in nlp_res["audit_metadata"]
    assert "date" in nlp_res["audit_metadata"]
