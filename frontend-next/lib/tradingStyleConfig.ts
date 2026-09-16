import { TradingStyle, TradingStyleInfo } from "@/types/tradingStyle";

export const TRADING_STYLE_CONFIGS: Record<TradingStyle, TradingStyleInfo> = {
  SCALPER: {
    id: "SCALPER",
    name: "Scalper",
    badge: "⚡ HIGH FREQUENCY",
    tagline: "Sub-minute to 15m order flow & momentum",
    description: "Operates on micro-structure, tight ATR breakouts, and rapid momentum shifts. News sentiment decays within 2 hours; fundamentals are disregarded.",
    timeframes: ["1m", "3m", "5m", "15m"],
    defaultTimeframe: "5m",
    predictionHorizon: "1 – 3 Candles Ahead",
    keyIndicators: ["Order Flow", "EMA 9 / 21", "RSI (7-period)", "ATR Bands", "Volume Spikes"],
    newsHalfLife: "2 Hours (Aggressive Decay)",
    stopLossDefault: "0.5% – 0.8% (Tight ATR)",
    takeProfitDefault: "1.2% – 1.6% (1:2 R/R)",
    modelEmphasis: {
      primary: "Direction Model & Bi-LSTM (45%)",
      secondary: "Regime & Volatility (30%)",
      fundamentalWeight: "0% (Bypassed)",
    },
  },
  INTRADAY: {
    id: "INTRADAY",
    name: "Intraday Trader",
    badge: "⏱ SESSION STRUCTURE",
    tagline: "5m to 1h session mean-reversion & VWAP",
    description: "Focuses on opening drive, liquidity pools, session VWAP, and same-day wire news. All positions flat before market close.",
    timeframes: ["5m", "15m", "30m", "1h"],
    defaultTimeframe: "15m",
    predictionHorizon: "3 – 8 Candles Ahead",
    keyIndicators: ["Session VWAP", "RSI (14)", "MACD (12/26/9)", "Volume Profile", "Pivot Points"],
    newsHalfLife: "8 Hours (Session Decay)",
    stopLossDefault: "1.0% – 1.5% (Session Low/High)",
    takeProfitDefault: "2.5% – 3.5% (1:2.3 R/R)",
    modelEmphasis: {
      primary: "Regime Classifier & Direction (40%)",
      secondary: "Transformer & News (23%)",
      fundamentalWeight: "2% (Negligible)",
    },
  },
  SWING: {
    id: "SWING",
    name: "Swing Trader",
    badge: "📈 MULTI-DAY TREND",
    tagline: "1h to 1D structural waves & sector momentum",
    description: "Captures multi-day trend continuation across major support/resistance levels, earnings revisions, and 3-day news narratives.",
    timeframes: ["1h", "4h", "1d", "1w"],
    defaultTimeframe: "1d",
    predictionHorizon: "5 – 20 Candles Ahead",
    keyIndicators: ["EMA 20 / 50 / 200", "MACD Histogram", "ADX (Trend Strength)", "Bollinger Bands", "Support/Resistance Channels"],
    newsHalfLife: "72 Hours (3 Days)",
    stopLossDefault: "3.0% – 4.5% (Swing Low Anchor)",
    takeProfitDefault: "7.0% – 10.0% (1:2.5 R/R)",
    modelEmphasis: {
      primary: "XGBoost Regime & Transformer (35%)",
      secondary: "Direction & Volatility (25%)",
      fundamentalWeight: "10% (Moderate)",
    },
  },
  INVESTOR: {
    id: "INVESTOR",
    name: "Investor",
    badge: "🏛 LONG-TERM COMPOUND",
    tagline: "1D to 1M fundamentals, cash flow & macro",
    description: "Anchored in audited financial statements, balance sheet health, free cash flow yields, and macroeconomic secular tailwinds over months to years.",
    timeframes: ["1d", "1w", "1M"],
    defaultTimeframe: "1w",
    predictionHorizon: "20 – 60 Candles Ahead",
    keyIndicators: ["SMA 50 / 200 (Golden Cross)", "P/E & P/B Ratios", "Free Cash Flow Yield", "ROE & Debt/Equity", "Quarterly Statement Growth"],
    newsHalfLife: "720 Hours (30 Days)",
    stopLossDefault: "8.0% – 12.0% (Thesis Breakdown)",
    takeProfitDefault: "25.0% – 50.0%+ (Secular Run)",
    modelEmphasis: {
      primary: "Financial NLP & Regime (50%)",
      secondary: "Market GNN Correlation (15%)",
      fundamentalWeight: "25% (Dominant Factor)",
    },
  },
};

export function getTradingStyleConfig(style: TradingStyle): TradingStyleInfo {
  return TRADING_STYLE_CONFIGS[style] || TRADING_STYLE_CONFIGS.SWING;
}
