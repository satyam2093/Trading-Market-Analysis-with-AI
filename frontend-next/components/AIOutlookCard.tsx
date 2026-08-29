"use client";

import { ShieldCheck, AlertTriangle, TrendingUp, TrendingDown, Minus, Cpu } from "lucide-react";

interface AIOutlookProps {
  symbol: string;
  signal?: "BUY" | "SELL" | "HOLD" | "NO_TRADE";
  regime?: "BULLISH" | "BEARISH" | "SIDEWAYS";
  confidence?: number;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  explanation?: string[];
  bullishProb?: number;
  bearishProb?: number;
  sidewaysProb?: number;
}

export default function AIOutlookCard({
  symbol,
  signal = "BUY",
  regime = "BULLISH",
  confidence = 82,
  riskLevel = "MEDIUM",
  explanation = [
    "Price is maintaining robust momentum above EMA 20 and EMA 50 trend baselines.",
    "RSI indicator (62.4) confirms healthy buying pressure without extreme overbought saturation.",
    "High model agreement across XGBoost Regime Classifier and PyTorch Temporal Transformer.",
    "Audited financial statements show strong operating cash flow and resilient net margins."
  ]
}: AIOutlookProps) {
  const getSignalBadgeClass = () => {
    switch (signal) {
      case "BUY":
        return "bg-gradient-to-r from-[#Fe3Dce]/20 to-[#26Afe6]/20 text-[#Fe3Dce] border-[#Fe3Dce]/50 glow-magenta";
      case "SELL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40 glow-red";
      case "HOLD":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40 glow-yellow";
      default:
        return "bg-[#131923] text-slate-300 border-[#2b313a]";
    }
  };

  const getRiskBadgeClass = () => {
    switch (riskLevel) {
      case "LOW":
        return "bg-[#26Afe6]/10 text-[#26Afe6] border-[#26Afe6]/30";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "HIGH":
      case "EXTREME":
        return "bg-[#Fe3Dce]/10 text-[#Fe3Dce] border-[#Fe3Dce]/30";
      default:
        return "bg-[#131923] text-slate-400 border-[#2b313a]";
    }
  };

  return (
    <div className="glass-panel-glow rounded-2xl p-6 relative overflow-hidden">
      {/* Background Ambient Beam Effect */}
      <div className="absolute -right-20 -top-20 w-72 h-72 bg-gradient-to-br from-[#Fe3Dce]/20 via-[#9989Ff]/20 to-[#26Afe6]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#2b313a]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-[#Fe3Dce]" />
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              NEXQUANT <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#Fe3Dce] to-[#26Afe6]">AI OUTLOOK</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time ensemble signal synthesized from 8 quantitative AI models & Value-at-Risk controls
          </p>
        </div>

        {/* Primary Signal Badge */}
        <div className="flex items-center gap-4">
          <div className={`px-6 py-3 rounded-2xl border font-black text-2xl tracking-wider text-center flex items-center gap-2.5 ${getSignalBadgeClass()}`}>
            {signal === "BUY" && <TrendingUp className="w-7 h-7 text-[#Fe3Dce]" />}
            {signal === "SELL" && <TrendingDown className="w-7 h-7" />}
            {signal === "HOLD" && <Minus className="w-7 h-7" />}
            {signal === "NO_TRADE" && <AlertTriangle className="w-7 h-7" />}
            {signal}
          </div>
        </div>
      </div>

      {/* Probability Metrics & Risk Ratings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-[#2b313a]">
        {/* Confidence Meter */}
        <div className="bg-[#0b111b]/80 p-4 rounded-xl border border-[#2b313a]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400 font-medium">Confidence Score</span>
            <span className="text-sm font-bold font-mono text-[#26Afe6]">{confidence}%</span>
          </div>
          <div className="w-full bg-[#131923] rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#Fe3Dce] via-[#9989Ff] to-[#26Afe6] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        {/* Market Regime */}
        <div className="bg-[#0b111b]/80 p-4 rounded-xl border border-[#2b313a]">
          <span className="text-xs text-slate-400 font-medium block mb-1">Market Regime</span>
          <span className="text-sm font-bold text-white uppercase flex items-center gap-1.5 font-mono">
            {regime === "BULLISH" && <TrendingUp className="w-4 h-4 text-[#26Afe6]" />}
            {regime === "BEARISH" && <TrendingDown className="w-4 h-4 text-rose-400" />}
            {regime === "SIDEWAYS" && <Minus className="w-4 h-4 text-amber-400" />}
            {regime} REGIME
          </span>
        </div>

        {/* Risk Assessment */}
        <div className="bg-[#0b111b]/80 p-4 rounded-xl border border-[#2b313a]">
          <span className="text-xs text-slate-400 font-medium block mb-1">Risk Rating</span>
          <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold font-mono border ${getRiskBadgeClass()}`}>
            {riskLevel} RISK
          </span>
        </div>
      </div>

      {/* Rationale Bullet Points */}
      <div className="pt-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#Fe3Dce]" />
          Why this signal? (Audited AI Rationale)
        </h3>
        <ul className="space-y-2">
          {explanation.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
              <span className="text-[#Fe3Dce] font-bold mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 pt-3 border-t border-[#2b313a]/50 flex justify-between items-center text-[11px] text-slate-500 font-mono">
        <span>NexQuant Engine: v2.0 Ensemble Calibrated</span>
        <span>Predictions are probabilistic models and do not guarantee returns.</span>
      </div>
    </div>
  );
}
