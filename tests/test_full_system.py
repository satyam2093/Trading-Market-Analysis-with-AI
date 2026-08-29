import pytest
import pandas as pd
import numpy as np

from configs.config import DEFAULT_ASSETS
from src.data.market_data import StockMarketDataProvider
from src.data.crypto_data import CryptoMarketDataProvider
from src.features.technical import TechnicalAnalysisEngine
from src.features.candlestick import CandlestickEngine
from src.data.fundamentals import FundamentalDataProvider
from src.features.fundamental import FundamentalAnalysisEngine
from src.models.financial_nlp.financial_nlp import FinancialNLPModel
from src.models.news_nlp.news_nlp import NewsNLPModel
from src.models.gnn.gnn_model import GNNModel
from src.models.ensemble.ensemble_engine import EnsembleDecisionEngine
from src.risk.risk_engine import RiskEngine
from src.backtest.backtesting_engine import BacktestingEngine

def test_full_system_integration():
    # 1. Multi-asset Ingestion
    stock_p = StockMarketDataProvider()
    crypto_p = CryptoMarketDataProvider()

    aapl_df = stock_p.fetch_ohlcv("AAPL", limit=50)
    btc_df = crypto_p.fetch_ohlcv("BTC", limit=50)
    assert not aapl_df.empty
    assert not btc_df.empty

    # 2. Feature Engineering
    ta = TechnicalAnalysisEngine()
    cs = CandlestickEngine()
    aapl_tech = ta.compute_all_indicators(aapl_df)
    aapl_full = cs.detect_patterns(aapl_tech)
    assert "rsi_14" in aapl_full.columns
    assert "pattern_doji" in aapl_full.columns

    # 3. GNN Model
    gnn = GNNModel(hidden_dim=16, embed_dim=8)
    price_dict = {"AAPL": aapl_full["close"], "BTC": btc_df["close"]}
    feat_dict = {
        "AAPL": {"returns_1": 0.01, "volatility_20": 0.2, "rsi_14": 55},
        "BTC": {"returns_1": -0.02, "volatility_20": 0.5, "rsi_14": 42}
    }
    label_dict = {"AAPL": 1, "BTC": 2}
    gnn.train(price_dict, feat_dict, label_dict, epochs=2)
    gnn_preds = gnn.predict(price_dict, feat_dict)
    assert "AAPL" in gnn_preds
    assert "predicted_regime" in gnn_preds["AAPL"]

    # 4. Fundamental NLP & Sentiment
    fund_p = FundamentalDataProvider()
    fund_fe = FundamentalAnalysisEngine()
    fin_nlp = FinancialNLPModel()
    stmt = fund_p.fetch_financial_statements("AAPL")
    scored = fund_fe.compute_ratios_and_score(stmt, asset_type="STOCK")
    nlp_summary = fin_nlp.analyze_financial_report(stmt)

    assert scored["fundamental_score"] > 0
    assert nlp_summary["audit_metadata"]["verified_no_hallucination"] is True

    # 5. News NLP
    news_nlp = NewsNLPModel()
    news_res = news_nlp.run_pipeline("AAPL", limit=3)
    assert "aggregate" in news_res

    # 6. Ensemble Decision Engine & Risk Engine
    risk = RiskEngine()
    ensemble = EnsembleDecisionEngine()

    risk_eval = risk.evaluate_risk(aapl_full, expected_volatility=0.25)
    mock_preds = {
        "regime_classifier": {"bullish_probability": 0.70, "bearish_probability": 0.10, "sideways_probability": 0.20},
        "gnn_model": gnn_preds["AAPL"]
    }
    signal_res = ensemble.generate_signal(mock_preds, risk_info=risk_eval)
    assert signal_res["signal"] in ["BUY", "SELL", "HOLD", "NO_TRADE"]
    assert "explanation" in signal_res

    # 7. Backtest Engine
    aapl_full["signal"] = "HOLD"
    aapl_full.iloc[5, aapl_full.columns.get_loc("signal")] = "BUY"
    aapl_full.iloc[20, aapl_full.columns.get_loc("signal")] = "SELL"
    bt = BacktestingEngine(initial_capital=50000)
    bt_res = bt.run_backtest(aapl_full)
    assert "final_equity" in bt_res
    assert len(bt_res["trade_log"]) > 0
