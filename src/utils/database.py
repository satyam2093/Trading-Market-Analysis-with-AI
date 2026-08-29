import datetime
from typing import Generator
from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, Boolean, Text, JSON, UniqueConstraint, ForeignKey, Index
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from configs.config import config

Base = declarative_base()

class AssetModel(Base):
    __tablename__ = "assets"

    id = Column(String(64), primary_key=True)
    symbol = Column(String(32), nullable=False, index=True)
    name = Column(String(128), nullable=False, index=True)
    asset_type = Column(String(16), nullable=False, index=True)  # 'STOCK', 'ETF', 'INDEX', 'CRYPTO'
    exchange = Column(String(32), nullable=False, index=True)    # 'NSE', 'BSE', 'NASDAQ', 'NYSE', 'BINANCE'
    currency = Column(String(8), nullable=False)
    country = Column(String(64), default="Global")
    sector = Column(String(64), default="General")
    provider_symbol = Column(String(64), nullable=True)          # e.g., 'RELIANCE.NS', 'BTC-USD'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class MarketPriceModel(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    timeframe = Column(String(8), nullable=False)  # '1m', '5m', '15m', '1h', '4h', '1d', '1w'
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint("asset_id", "timeframe", "timestamp", name="uq_asset_timeframe_timestamp"),
    )

class TechnicalFeatureModel(Base):
    __tablename__ = "technical_features"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    timeframe = Column(String(8), nullable=False)
    rsi_14 = Column(Float)
    macd = Column(Float)
    macd_signal = Column(Float)
    macd_hist = Column(Float)
    ema_20 = Column(Float)
    ema_50 = Column(Float)
    ema_200 = Column(Float)
    adx_14 = Column(Float)
    atr_14 = Column(Float)
    bollinger_hband = Column(Float)
    bollinger_lband = Column(Float)
    returns_1 = Column(Float)
    volatility_20 = Column(Float)

    __table_args__ = (
        UniqueConstraint("asset_id", "timeframe", "timestamp", name="uq_tech_asset_timeframe_timestamp"),
    )

class CandlestickPatternModel(Base):
    __tablename__ = "candlestick_patterns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    timeframe = Column(String(8), nullable=False)
    pattern_name = Column(String(64), nullable=False)
    implication = Column(String(16), nullable=False)
    strength = Column(Float, nullable=False)
    historical_win_rate = Column(Float)

    __table_args__ = (
        UniqueConstraint("asset_id", "timeframe", "timestamp", "pattern_name", name="uq_candlestick_pattern"),
    )

class FundamentalModel(Base):
    __tablename__ = "fundamentals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    reporting_period = Column(String(16), nullable=False)
    report_date = Column(DateTime, nullable=False)
    revenue = Column(Float)
    gross_profit = Column(Float)
    operating_profit = Column(Float)
    ebitda = Column(Float)
    net_income = Column(Float)
    eps = Column(Float)
    total_assets = Column(Float)
    total_liabilities = Column(Float)
    free_cash_flow = Column(Float)
    roe = Column(Float)
    roce = Column(Float)
    debt_to_equity = Column(Float)
    fundamental_score = Column(Float)
    source = Column(String(128), nullable=False)

    __table_args__ = (
        UniqueConstraint("asset_id", "reporting_period", name="uq_asset_reporting_period"),
    )

class NewsModel(Base):
    __tablename__ = "news"

    id = Column(String(128), primary_key=True)
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    headline = Column(Text, nullable=False)
    summary = Column(Text)
    source = Column(String(64), nullable=False)
    url = Column(Text)
    published_at = Column(DateTime, nullable=False)
    sentiment = Column(String(16), nullable=False)
    sentiment_score = Column(Float, nullable=False)
    event_type = Column(String(64))
    impact_level = Column(String(16))
    confidence = Column(Float)

class ModelPredictionModel(Base):
    __tablename__ = "model_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    model_name = Column(String(64), nullable=False)
    bullish_prob = Column(Float, nullable=False)
    bearish_prob = Column(Float, nullable=False)
    sideways_prob = Column(Float, nullable=False)
    predicted_regime = Column(String(16), nullable=False)
    confidence = Column(Float, nullable=False)
    raw_output = Column(JSON)

class SignalModel(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    timeframe = Column(String(8), nullable=False)
    signal = Column(String(16), nullable=False)
    regime = Column(String(16), nullable=False)
    bullish_prob = Column(Float, nullable=False)
    bearish_prob = Column(Float, nullable=False)
    sideways_prob = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_level = Column(String(16), nullable=False)
    explanation = Column(JSON, nullable=False)

class WatchlistModel(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), default="default_user", index=True)
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    added_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "asset_id", name="uq_user_asset_watchlist"),
    )

class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), default="default_user", index=True)
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    alert_type = Column(String(32), nullable=False)  # 'PRICE', 'SIGNAL', 'VOLATILITY', 'NEWS'
    condition = Column(String(32), nullable=False)   # 'ABOVE', 'BELOW', 'EQUALS'
    threshold_value = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

engine = create_engine(
    config.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in config.database_url else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Ensure schema matches current models by creating missing tables/columns
    Base.metadata.create_all(bind=engine)
    # Check if assets table needs migration
    with engine.connect() as conn:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        if "assets" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("assets")]
            if "country" not in columns:
                conn.execute(text("ALTER TABLE assets ADD COLUMN country VARCHAR(64) DEFAULT 'Global'"))
            if "sector" not in columns:
                conn.execute(text("ALTER TABLE assets ADD COLUMN sector VARCHAR(64) DEFAULT 'General'"))
            if "provider_symbol" not in columns:
                conn.execute(text("ALTER TABLE assets ADD COLUMN provider_symbol VARCHAR(64)"))
            if "last_updated" not in columns:
                conn.execute(text("ALTER TABLE assets ADD COLUMN last_updated DATETIME"))
            conn.commit()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
