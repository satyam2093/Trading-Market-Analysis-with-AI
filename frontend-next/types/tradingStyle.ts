export type TradingStyle = "SCALPER" | "INTRADAY" | "SWING" | "INVESTOR";

export interface TradingStyleInfo {
  id: TradingStyle;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  timeframes: string[];
  defaultTimeframe: string;
  predictionHorizon: string;
  keyIndicators: string[];
  newsHalfLife: string;
  stopLossDefault: string;
  takeProfitDefault: string;
  modelEmphasis: {
    primary: string;
    secondary: string;
    fundamentalWeight: string;
  };
}

export interface StyleEnsembleAnalysis {
  trading_style: TradingStyle;
  signal: "BUY" | "SELL" | "HOLD" | "NO_TRADE";
  regime: "BULLISH" | "BEARISH" | "SIDEWAYS";
  confidence: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  risk_score: number;
  bullish_prob: number;
  bearish_prob: number;
  sideways_prob: number;
  timeframe: string;
  explanation: string[];
}
