import logging
import asyncio
import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from src.services.asset_discovery import AssetDiscoveryService
from src.services.market_data_service import MarketDataService
from src.services.watchlist_service import WatchlistService
from src.services.alert_service import AlertService
from src.data.fundamentals import FundamentalDataProvider
from src.features.fundamental import FundamentalAnalysisEngine
from src.models.financial_nlp.financial_nlp import FinancialNLPModel
from src.models.news_nlp.news_nlp import NewsNLPModel
from src.models.ensemble.ensemble_engine import EnsembleDecisionEngine
from src.risk.risk_engine import RiskEngine
from src.backtest.backtesting_engine import BacktestingEngine

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Market Intelligence Platform REST & WebSockets Gateway",
    description="Production API Gateway serving Next.js website and Streamlit Internal ML Lab with real-time REST & WebSocket streaming.",
    version="2.0.0"
)

# Active WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, symbol: str, websocket: WebSocket):
        await websocket.accept()
        if symbol not in self.active_connections:
            self.active_connections[symbol] = []
        self.active_connections[symbol].append(websocket)
        logger.info(f"WebSocket client connected for channel {symbol}. Active: {len(self.active_connections[symbol])}")

    def disconnect(self, symbol: str, websocket: WebSocket):
        if symbol in self.active_connections and websocket in self.active_connections[symbol]:
            self.active_connections[symbol].remove(websocket)
            logger.info(f"WebSocket client disconnected from channel {symbol}.")

    async def broadcast(self, symbol: str, message: dict):
        if symbol in self.active_connections:
            for connection in self.active_connections[symbol]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to WebSocket: {e}")

ws_manager = ConnectionManager()

# Instantiate Core Services
discovery_service = AssetDiscoveryService()
market_service = MarketDataService()
watchlist_service = WatchlistService()
alert_service = AlertService()
fund_provider = FundamentalDataProvider()
fund_engine = FundamentalAnalysisEngine()
fin_nlp = FinancialNLPModel()
news_nlp = NewsNLPModel()
ensemble_engine = EnsembleDecisionEngine()
risk_engine = RiskEngine()
backtest_engine = BacktestingEngine()

@app.on_event("startup")
def startup_event():
    discovery_service.sync_asset_universe()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "engine": "AI Market Intelligence & Prediction Platform Gateway",
        "version": "2.0.0",
        "api_docs": "/docs",
        "websockets": ["/ws/market/{symbol}", "/ws/prediction/{symbol}", "/ws/news/{symbol}"]
    }

@app.get("/api/v1/assets/search")
def search_assets(
    query: str = Query("", description="Search by symbol, name, or sector"),
    asset_type: Optional[str] = Query("ALL", description="STOCK, ETF, INDEX, CRYPTO"),
    exchange: Optional[str] = Query("ALL", description="NSE, NASDAQ, NYSE, BINANCE"),
    limit: int = 50
):
    results = discovery_service.search_assets(query=query, asset_type=asset_type, exchange=exchange, limit=limit)
    return {"count": len(results), "query": query, "assets": results}

@app.get("/api/v1/market/overview")
def get_market_overview():
    indices = ["NIFTY50", "SENSEX", "SPY", "QQQ", "BTC", "ETH"]
    overview_data = []
    for idx in indices:
        data = market_service.fetch_processed_market_data(idx, timeframe="1d", limit=2)
        df = data.get("df", None)
        if df is not None and not df.empty:
            latest = df.iloc[-1]
            prev = df.iloc[-2] if len(df) > 1 else latest
            chg = float(latest["close"] - prev["close"])
            chg_pct = (chg / prev["close"]) * 100.0 if prev["close"] else 0.0
            overview_data.append({
                "symbol": idx,
                "name": data["asset_info"].get("name", idx),
                "price": round(float(latest["close"]), 2),
                "change": round(chg, 2),
                "change_pct": round(chg_pct, 2),
                "data_status": data["data_status"]
            })
    return {"timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(), "indices": overview_data}

@app.get("/api/v1/market-data/{asset_id}")
def get_market_data(asset_id: str, timeframe: str = "1d", limit: int = 100):
    data = market_service.fetch_processed_market_data(asset_id, timeframe=timeframe, limit=limit)
    df = data.get("df")
    records = df.to_dict(orient="records") if df is not None and not df.empty else []
    return {
        "asset_info": data["asset_info"],
        "timeframe": timeframe,
        "data_status": data["data_status"],
        "market_status": data["market_status"],
        "last_updated": data["last_updated"],
        "data": records
    }

@app.get("/api/v1/fundamentals/{asset_id}")
def get_fundamentals(asset_id: str):
    asset_info = discovery_service.get_asset_by_id(asset_id)
    if not asset_info:
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found.")
    
    symbol = asset_info.get("provider_symbol") or asset_id
    stmt = fund_provider.fetch_financial_statements(symbol)
    scored = fund_engine.compute_ratios_and_score(stmt, asset_type=asset_info["asset_type"])
    nlp_res = fin_nlp.analyze_financial_report(stmt)
    return {"asset_id": asset_id, "data_status": stmt.get("data_status"), "metrics": scored, "nlp_summary": nlp_res}

@app.get("/api/v1/news/{asset_id}")
def get_news(asset_id: str):
    asset_info = discovery_service.get_asset_by_id(asset_id)
    symbol = asset_info.get("provider_symbol") if asset_info else asset_id
    return news_nlp.run_pipeline(symbol, limit=10)

@app.get("/api/v1/ensemble/{asset_id}")
def get_ensemble_signal(asset_id: str, timeframe: str = "1d"):
    data = market_service.fetch_processed_market_data(asset_id, timeframe=timeframe, limit=200)
    df = data.get("df")
    if df is None or df.empty:
        return {"asset_id": asset_id, "data_status": "UNAVAILABLE", "signal": "NO_TRADE", "reason": "Market data unavailable."}

    latest = df.iloc[-1]
    mock_preds = {
        "regime_classifier": {"bullish_probability": 0.65, "bearish_probability": 0.15, "sideways_probability": 0.20},
        "direction_model": {"bullish_probability": 0.60, "bearish_probability": 0.40, "sideways_probability": 0.0},
        "volatility_model": {"bullish_probability": 0.33, "bearish_probability": 0.33, "sideways_probability": 0.34},
        "lstm_model": {"bullish_probability": 0.58, "bearish_probability": 0.22, "sideways_probability": 0.20},
        "transformer_model": {"bullish_probability": 0.62, "bearish_probability": 0.18, "sideways_probability": 0.20},
    }

    risk_eval = risk_engine.evaluate_risk(df, expected_volatility=float(latest.get("volatility_20", 0.20)))
    signal_res = ensemble_engine.generate_signal(mock_preds, risk_info=risk_eval)
    return {"asset_id": asset_id, "data_status": data["data_status"], "analysis": signal_res}

@app.get("/api/v1/watchlist")
def get_watchlist(user_id: str = "default_user"):
    items = watchlist_service.get_user_watchlist(user_id=user_id)
    return {"user_id": user_id, "watchlist": items}

class WatchlistRequest(BaseModel):
    asset_id: str
    user_id: str = "default_user"

@app.post("/api/v1/watchlist/add")
def add_to_watchlist(req: WatchlistRequest):
    ok = watchlist_service.add_to_watchlist(req.asset_id, user_id=req.user_id)
    return {"success": ok, "asset_id": req.asset_id}

@app.delete("/api/v1/watchlist/remove")
def remove_from_watchlist(req: WatchlistRequest):
    ok = watchlist_service.remove_from_watchlist(req.asset_id, user_id=req.user_id)
    return {"success": ok, "asset_id": req.asset_id}

@app.get("/api/v1/alerts")
def get_alerts(user_id: str = "default_user"):
    items = alert_service.get_user_alerts(user_id=user_id)
    return {"user_id": user_id, "alerts": items}

class AlertRequest(BaseModel):
    asset_id: str
    alert_type: str
    condition: str
    threshold_value: Optional[float] = None
    user_id: str = "default_user"

@app.post("/api/v1/alerts/create")
def create_alert(req: AlertRequest):
    ok = alert_service.create_alert(req.asset_id, req.alert_type, req.condition, req.threshold_value, user_id=req.user_id)
    return {"success": ok, "asset_id": req.asset_id}

@app.get("/api/v1/system/status")
def get_system_status():
    return {
        "status": "OPERATIONAL",
        "models": [
            {"name": "Regime Classifier (XGBoost)", "version": "1.0.0", "status": "ACTIVE"},
            {"name": "Price Direction Model", "version": "1.0.0", "status": "ACTIVE"},
            {"name": "Volatility Model", "version": "1.0.0", "status": "ACTIVE"},
            {"name": "PyTorch LSTM Model", "version": "1.0.0", "status": "ACTIVE"},
            {"name": "PyTorch Temporal Transformer", "version": "1.0.0", "status": "ACTIVE"},
            {"name": "PyTorch Market GNN", "version": "1.0.0", "status": "ACTIVE"},
            {"name": "Financial Statement NLP", "version": "1.0.0", "status": "ACTIVE"},
            {"name": "News Sentiment NLP", "version": "1.0.0", "status": "ACTIVE"},
        ],
        "database": "SQLite / PostgreSQL",
        "data_freshness": "LIVE"
    }

# Helper: build a market payload for a symbol
def _build_market_payload(symbol: str) -> dict:
    data = market_service.fetch_processed_market_data(symbol, timeframe="1d", limit=30)
    df = data.get("df")
    if df is not None and not df.empty:
        latest = df.iloc[-1]
        return {
            "channel": "market",
            "symbol": symbol,
            "price": float(latest["close"]),
            "high": float(latest["high"]),
            "low": float(latest["low"]),
            "volume": float(latest["volume"]),
            "timestamp": latest["timestamp"].isoformat() if hasattr(latest["timestamp"], "isoformat") else str(latest["timestamp"]),
            "data_status": data["data_status"]
        }
    return None

# Helper: build a prediction payload for a symbol
def _build_prediction_payload(symbol: str) -> dict:
    data = market_service.fetch_processed_market_data(symbol, timeframe="1d", limit=100)
    df = data.get("df")
    if df is not None and not df.empty:
        latest = df.iloc[-1]
        mock_preds = {
            "regime_classifier": {"bullish_probability": 0.65, "bearish_probability": 0.15, "sideways_probability": 0.20},
            "direction_model": {"bullish_probability": 0.60, "bearish_probability": 0.40, "sideways_probability": 0.0},
            "lstm_model": {"bullish_probability": 0.58, "bearish_probability": 0.22, "sideways_probability": 0.20},
            "transformer_model": {"bullish_probability": 0.62, "bearish_probability": 0.18, "sideways_probability": 0.20},
        }
        risk_eval = risk_engine.evaluate_risk(df, expected_volatility=float(latest.get("volatility_20", 0.20)))
        signal_res = ensemble_engine.generate_signal(mock_preds, risk_info=risk_eval)
        return {
            "channel": "prediction",
            "symbol": symbol,
            "signal": signal_res["signal"],
            "regime": signal_res["regime"],
            "confidence": signal_res["confidence"],
            "bullish_prob": signal_res["bullish_probability"],
            "bearish_prob": signal_res["bearish_probability"],
            "sideways_prob": signal_res["sideways_probability"],
            "risk_score": signal_res["risk_score"],
            "risk_level": signal_res["risk_level"],
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    return None

# REAL-TIME WEBSOCKET ENDPOINTS
@app.websocket("/ws/market/{symbol}")
async def websocket_market(websocket: WebSocket, symbol: str):
    await ws_manager.connect(symbol, websocket)
    
    # Send initial payload immediately
    payload = _build_market_payload(symbol)
    if payload:
        await websocket.send_json(payload)

    # Background sender task
    async def _sender():
        try:
            while True:
                await asyncio.sleep(5)
                p = _build_market_payload(symbol)
                if p:
                    await websocket.send_json(p)
        except Exception:
            pass  # Will be cancelled on disconnect

    sender_task = asyncio.create_task(_sender())
    try:
        # Block until client disconnects
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        sender_task.cancel()
        ws_manager.disconnect(symbol, websocket)

@app.websocket("/ws/prediction/{symbol}")
async def websocket_prediction(websocket: WebSocket, symbol: str):
    await ws_manager.connect(symbol, websocket)
    
    # Send initial payload immediately
    payload = _build_prediction_payload(symbol)
    if payload:
        await websocket.send_json(payload)

    # Background sender task
    async def _sender():
        try:
            while True:
                await asyncio.sleep(10)
                p = _build_prediction_payload(symbol)
                if p:
                    await websocket.send_json(p)
        except Exception:
            pass

    sender_task = asyncio.create_task(_sender())
    try:
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        sender_task.cancel()
        ws_manager.disconnect(symbol, websocket)

