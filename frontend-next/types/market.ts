/* ============================================
 * NexQuant — Shared TypeScript Types
 * Keep synchronized with FastAPI backend schemas
 * ============================================ */

// ── Market Enums ─────────────────────────────

export type MarketRegime = "BULLISH" | "BEARISH" | "SIDEWAYS";
export type TradingSignal = "BUY" | "SELL" | "HOLD" | "NO_TRADE";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
export type DataStatus = "LIVE" | "DELAYED" | "STALE" | "UNAVAILABLE" | "MARKET_CLOSED";
export type AssetType = "STOCK" | "CRYPTO" | "ETF" | "INDEX";

// ── Asset ────────────────────────────────────

export interface AssetInfo {
  id: string;
  symbol: string;
  name: string;
  asset_type: AssetType;
  exchange: string;
  country: string;
  provider_symbol?: string;
}

export interface AssetSearchResult {
  count: number;
  query: string;
  assets: AssetInfo[];
}

// ── Market Data ──────────────────────────────

export interface CandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema_20?: number;
  ema_50?: number;
  ema_200?: number;
  rsi_14?: number;
  macd?: number;
  macd_signal?: number;
  bollinger_upper?: number;
  bollinger_lower?: number;
  volatility_20?: number;
}

export interface MarketDataResponse {
  asset_info: AssetInfo;
  timeframe: string;
  data_status: DataStatus;
  market_status: string;
  last_updated: string;
  data: CandleData[];
}

export interface MarketOverviewItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  data_status: DataStatus;
}

export interface MarketOverviewResponse {
  timestamp: string;
  indices: MarketOverviewItem[];
}

// ── Predictions ──────────────────────────────

export interface EnsembleAnalysis {
  signal: TradingSignal;
  regime: MarketRegime;
  confidence: number;
  bullish_probability: number;
  bearish_probability: number;
  sideways_probability: number;
  risk_score: number;
  risk_level: RiskLevel;
  explanation?: string[];
}

export interface EnsembleResponse {
  asset_id: string;
  data_status: DataStatus;
  analysis: EnsembleAnalysis;
}

// ── Fundamentals ─────────────────────────────

export interface FundamentalMetrics {
  score: number;
  pe_ratio?: number;
  pb_ratio?: number;
  roe?: number;
  debt_to_equity?: number;
  net_margin?: number;
  revenue_growth?: number;
  profit_growth?: number;
}

export interface FundamentalsResponse {
  asset_id: string;
  data_status: DataStatus;
  metrics: FundamentalMetrics;
  nlp_summary: {
    financial_summary: string;
  };
}

// ── News ─────────────────────────────────────

export interface NewsItem {
  title: string;
  source: string;
  published: string;
  url: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  impact: "HIGH" | "MEDIUM" | "LOW";
  summary?: string;
}

export interface NewsResponse {
  symbol: string;
  articles: NewsItem[];
  overall_sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

// ── WebSocket Payloads ───────────────────────

export interface WSMarketPayload {
  channel: "market";
  symbol: string;
  price: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
  data_status: DataStatus;
}

export interface WSPredictionPayload {
  channel: "prediction";
  symbol: string;
  signal: TradingSignal;
  regime: MarketRegime;
  confidence: number;
  bullish_prob: number;
  bearish_prob: number;
  sideways_prob: number;
  risk_score: number;
  risk_level: RiskLevel;
  timestamp: string;
}

// ── Watchlist ────────────────────────────────

export interface WatchlistItem {
  asset_id: string;
  added_at: string;
}

// ── System ───────────────────────────────────

export interface SystemStatus {
  status: string;
  models: { name: string; version: string; status: string }[];
  database: string;
  data_freshness: string;
}
