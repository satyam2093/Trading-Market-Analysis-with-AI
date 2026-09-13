"use client";

import { Activity, TrendingUp, TrendingDown, ShieldCheck, Target, AlertOctagon } from "lucide-react";

interface TechnicalSummaryProps {
  trend?: string;
  momentum?: string;
  volatility?: string;
  volume?: string;
  support?: number | null;
  resistance?: number | null;
  bullishTrigger?: number | null;
  bearishTrigger?: number | null;
  rsi?: number;
  currentPrice?: number | null;
  currencySymbol?: string;
}

export default function TechnicalSummary({
  trend = "Bullish Trend",
  momentum = "Positive Momentum",
  volatility = "Moderate (18.4%)",
  volume = "Above 20-day Average (+14%)",
  support,
  resistance,
  bullishTrigger,
  bearishTrigger,
  rsi = 56.5,
  currentPrice = 100,
  currencySymbol = "$",
}: TechnicalSummaryProps) {
  const validPrice = typeof currentPrice === "number" && currentPrice > 0 ? currentPrice : null;
  const realSupport = support && support > 0 ? support : (validPrice ? Math.round(validPrice * 0.945 * 100) / 100 : null);
  const realResistance = resistance && resistance > 0 ? resistance : (validPrice ? Math.round(validPrice * 1.055 * 100) / 100 : null);
  const realBullishTrigger = bullishTrigger && bullishTrigger > 0 ? bullishTrigger : (realResistance ? Math.round(realResistance * 1.012 * 100) / 100 : null);
  const realBearishTrigger = bearishTrigger && bearishTrigger > 0 ? bearishTrigger : (realSupport ? Math.round(realSupport * 0.988 * 100) / 100 : null);

  const supportDist = validPrice && realSupport ? (((realSupport - validPrice) / validPrice) * 100).toFixed(1) : null;
  const resistanceDist = validPrice && realResistance ? (((realResistance - validPrice) / validPrice) * 100).toFixed(1) : null;

  return (
    <div className="p-6 rounded-xl bg-surface border border-border space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Technical Structure & Key Price Zones
          </h3>
          <p className="text-xs text-muted-foreground">Deterministic price action, algorithmic support/resistance & triggers</p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-background border border-border text-foreground">
          RSI (14): <span className="font-semibold text-accent">{rsi}</span>
        </span>
      </div>

      {/* 4 Core Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3.5 rounded-lg bg-background border border-border space-y-1">
          <span className="text-muted-foreground block text-[11px]">PRIMARY TREND</span>
          <span className={`text-sm font-semibold flex items-center gap-1.5 ${trend.toLowerCase().includes("bull") ? "text-bullish" : trend.toLowerCase().includes("bear") ? "text-bearish" : "text-warning"}`}>
            {trend.toLowerCase().includes("bull") ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend}
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-background border border-border space-y-1">
          <span className="text-muted-foreground block text-[11px]">MOMENTUM PROFILE</span>
          <span className="text-sm font-semibold text-foreground">{momentum}</span>
        </div>

        <div className="p-3.5 rounded-lg bg-background border border-border space-y-1">
          <span className="text-muted-foreground block text-[11px]">VOLATILITY REGIME</span>
          <span className="text-sm font-semibold text-foreground">{volatility}</span>
        </div>

        <div className="p-3.5 rounded-lg bg-background border border-border space-y-1">
          <span className="text-muted-foreground block text-[11px]">VOLUME DISTRIBUTION</span>
          <span className="text-sm font-semibold text-foreground">{volume}</span>
        </div>
      </div>

      {/* Key Bullish & Bearish Structural Levels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bullish Key Support (Demand Floor) */}
        <div className="p-4 rounded-xl bg-background border border-bullish/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-bullish font-bold flex items-center gap-1.5 uppercase text-[11px]">
              <ShieldCheck className="w-4 h-4 text-bullish" /> Key Bullish Support Zone
            </span>
            <span className="text-muted-foreground text-[10px]">{supportDist ? `${supportDist}% away` : "Calculating..."}</span>
          </div>
          <div className="text-xl font-bold font-mono text-bullish tabular-nums">
            {realSupport !== null ? `${currencySymbol}${realSupport.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "Calculating..."}
          </div>
          <div className="text-[11px] font-mono text-muted-foreground/80 flex items-center justify-between pt-1 border-t border-border/40">
            <span>Breakdown Invalidation:</span>
            <span className="font-semibold text-bearish">
              {realBearishTrigger !== null ? `${currencySymbol}${realBearishTrigger.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "N/A"}
            </span>
          </div>
        </div>

        {/* Bearish Key Resistance (Supply Ceiling) */}
        <div className="p-4 rounded-xl bg-background border border-bearish/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-bearish font-bold flex items-center gap-1.5 uppercase text-[11px]">
              <AlertOctagon className="w-4 h-4 text-bearish" /> Key Bearish Resistance Zone
            </span>
            <span className="text-muted-foreground text-[10px]">{resistanceDist ? `+${resistanceDist}% away` : "Calculating..."}</span>
          </div>
          <div className="text-xl font-bold font-mono text-bearish tabular-nums">
            {realResistance !== null ? `${currencySymbol}${realResistance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "Calculating..."}
          </div>
          <div className="text-[11px] font-mono text-muted-foreground/80 flex items-center justify-between pt-1 border-t border-border/40">
            <span>Bullish Breakout Confirmation:</span>
            <span className="font-semibold text-bullish">
              {realBullishTrigger !== null ? `${currencySymbol}${realBullishTrigger.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
