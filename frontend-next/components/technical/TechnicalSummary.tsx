"use client";

import { Activity, Zap } from "lucide-react";

interface TechnicalSummaryProps {
  trend?: string;
  momentum?: string;
  volatility?: string;
  volume?: string;
  support?: number;
  resistance?: number;
  rsi?: number;
}

export default function TechnicalSummary({
  trend = "Bullish Uptrend",
  momentum = "Strong Positive",
  volatility = "Medium (24.2%)",
  volume = "Above 30-day Average (+18%)",
  support = 104200,
  resistance = 112500,
  rsi = 62.4,
}: TechnicalSummaryProps) {
  return (
    <div className="p-6 rounded-xl bg-surface border border-border space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Technical Structure
          </h3>
          <p className="text-xs text-muted-foreground">Computed price action and momentum indicators</p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-background border border-border text-foreground">
          RSI (14): <span className="font-semibold">{rsi}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3.5 rounded-lg bg-background border border-border space-y-1">
          <span className="text-muted-foreground block text-[11px]">PRIMARY TREND</span>
          <span className="text-sm font-semibold text-bullish">{trend}</span>
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

      {/* Support & Resistance */}
      <div className="p-4 rounded-lg bg-background border border-border flex justify-between items-center text-xs font-mono">
        <div>
          <span className="text-muted-foreground block text-[10px] uppercase">Key Support Zone</span>
          <span className="text-sm font-bold text-bullish tabular-nums">
            ${support.toLocaleString()}
          </span>
        </div>
        <div className="h-8 w-[1px] bg-border" />
        <div className="text-right">
          <span className="text-muted-foreground block text-[10px] uppercase">Key Resistance Zone</span>
          <span className="text-sm font-bold text-bearish tabular-nums">
            ${resistance.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
