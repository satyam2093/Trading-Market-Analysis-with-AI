"use client";

import { Activity, TrendingUp, TrendingDown, ShieldCheck, Target, AlertOctagon } from "lucide-react";

interface TechnicalSummaryProps {
  trend?: string;
  momentum?: string;
  volatility?: string;
  volume?: string;
  support?: number;
  resistance?: number;
  bullishTrigger?: number;
  bearishTrigger?: number;
  rsi?: number;
  currentPrice?: number;
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
  // Calculate calibrated support and resistance if not explicitly provided
  const realSupport = support && support > 0 ? support : Math.round(currentPrice * 0.945 * 100) / 100;
  const realResistance = resistance && resistance > 0 ? resistance : Math.round(currentPrice * 1.055 * 100) / 100;
  const realBullishTrigger = bullishTrigger && bullishTrigger > 0 ? bullishTrigger : Math.round(realResistance * 1.012 * 100) / 100;
  const realBearishTrigger = bearishTrigger && bearishTrigger > 0 ? bearishTrigger : Math.round(realSupport * 0.988 * 100) / 100;

  const supportDist = (((realSupport - currentPrice) / (currentPrice || 1)) * 100).toFixed(1);
  const resistanceDist = (((realResistance - currentPrice) / (currentPrice || 1)) * 100).toFixed(1);

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
            <span className="text-muted-foreground text-[10px]">{supportDist}% away</span>
          </div>
          <div className="text-xl font-bold font-mono text-bullish tabular-nums">
            {currencySymbol}{realSupport.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] font-mono text-muted-foreground/80 flex items-center justify-between pt-1 border-t border-border/40">
            <span>Breakdown Invalidation:</span>
            <span className="font-semibold text-bearish">{currencySymbol}{realBearishTrigger.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Bearish Key Resistance (Supply Ceiling) */}
        <div className="p-4 rounded-xl bg-background border border-bearish/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-bearish font-bold flex items-center gap-1.5 uppercase text-[11px]">
              <AlertOctagon className="w-4 h-4 text-bearish" /> Key Bearish Resistance Zone
            </span>
            <span className="text-muted-foreground text-[10px]">+{resistanceDist}% away</span>
          </div>
          <div className="text-xl font-bold font-mono text-bearish tabular-nums">
            {currencySymbol}{realResistance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] font-mono text-muted-foreground/80 flex items-center justify-between pt-1 border-t border-border/40">
            <span>Bullish Breakout Confirmation:</span>
            <span className="font-semibold text-bullish">{currencySymbol}{realBullishTrigger.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
