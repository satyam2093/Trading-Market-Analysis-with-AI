"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import type { TradingSignal, MarketRegime, RiskLevel } from "@/types/market";

interface AIOutlookProps {
  symbol: string;
  signal?: TradingSignal;
  regime?: MarketRegime;
  confidence?: number;
  riskLevel?: RiskLevel;
  explanation?: string[];
  bullishProb?: number;
  bearishProb?: number;
  sidewaysProb?: number;
}

export default function AIOutlook({
  symbol,
  signal = "BUY",
  regime = "BULLISH",
  confidence = 82,
  riskLevel = "MEDIUM",
  explanation = [
    "Multi-timeframe price action maintains structural support above the 20-day and 50-day exponential moving averages.",
    "Regime classifier indicates low probability of immediate breakdown into bearish contraction.",
    "Temporal Transformer and Bi-LSTM models project sustained directional momentum over the next evaluation window.",
    "Value-at-Risk (95% VaR) remains within standard deviation bounds, permitting automated signal validation."
  ],
  bullishProb = 0.65,
  bearishProb = 0.15,
  sidewaysProb = 0.20,
}: AIOutlookProps) {
  const [expanded, setExpanded] = useState(true);

  const getSignalBadge = () => {
    switch (signal) {
      case "BUY":
        return {
          bg: "bg-bullish/10 text-bullish border-bullish/30",
          icon: <TrendingUp className="w-5 h-5" />,
          label: "BUY OUTLOOK",
        };
      case "SELL":
        return {
          bg: "bg-bearish/10 text-bearish border-bearish/30",
          icon: <TrendingDown className="w-5 h-5" />,
          label: "SELL OUTLOOK",
        };
      case "HOLD":
        return {
          bg: "bg-warning/10 text-warning border-warning/30",
          icon: <Minus className="w-5 h-5" />,
          label: "HOLD OUTLOOK",
        };
      default:
        return {
          bg: "bg-surface text-muted-foreground border-border",
          icon: <AlertTriangle className="w-5 h-5" />,
          label: "NO TRADE / UNCERTAIN",
        };
    }
  };

  const badge = getSignalBadge();

  return (
    <div className="p-6 rounded-xl bg-surface border border-border space-y-6">
      {/* Header & Primary Signal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-accent uppercase tracking-wider">
              QUANTITATIVE SYNTHESIS
            </span>
          </div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            NexQuant AI Outlook
          </h2>
          <p className="text-xs text-muted-foreground">
            Multi-model ensemble consensus evaluated against quantitative risk controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-5 py-2.5 rounded-lg border font-mono font-bold text-sm tracking-wide flex items-center gap-2 ${badge.bg}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Confidence Meter */}
        <div className="p-4 rounded-lg bg-background border border-border space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-muted-foreground">CONFIDENCE SCORE</span>
            <span className="font-bold text-foreground">{confidence}%</span>
          </div>
          <div className="w-full bg-elevated rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-accent h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        {/* Market Regime */}
        <div className="p-4 rounded-lg bg-background border border-border space-y-1">
          <span className="text-xs font-mono text-muted-foreground block">MARKET REGIME</span>
          <span className="text-sm font-mono font-semibold text-foreground uppercase flex items-center gap-1.5">
            {regime === "BULLISH" && <TrendingUp className="w-4 h-4 text-bullish" />}
            {regime === "BEARISH" && <TrendingDown className="w-4 h-4 text-bearish" />}
            {regime === "SIDEWAYS" && <Minus className="w-4 h-4 text-warning" />}
            {regime} REGIME
          </span>
        </div>

        {/* Risk Rating */}
        <div className="p-4 rounded-lg bg-background border border-border space-y-1">
          <span className="text-xs font-mono text-muted-foreground block">RISK EVALUATION</span>
          <span className="text-sm font-mono font-semibold text-foreground uppercase">
            {riskLevel} RISK
          </span>
        </div>
      </div>

      {/* Expandable Audited Rationale */}
      <div className="pt-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-accent" />
            WHY THIS SIGNAL? (AUDITED AI RATIONALE)
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground/90 font-normal leading-relaxed border-t border-border/50 pt-3">
            {explanation.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-accent font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Model Probabilities Strip */}
      <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>P(Bullish): {(bullishProb * 100).toFixed(0)}%</span>
          <span>P(Bearish): {(bearishProb * 100).toFixed(0)}%</span>
          <span>P(Sideways): {(sidewaysProb * 100).toFixed(0)}%</span>
        </div>
        <span>Probabilistic model output — Not financial advice</span>
      </div>
    </div>
  );
}
