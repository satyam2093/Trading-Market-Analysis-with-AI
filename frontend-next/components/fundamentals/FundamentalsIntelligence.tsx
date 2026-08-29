"use client";

import { Building2, Award } from "lucide-react";

interface FundamentalsProps {
  score?: number;
  peRatio?: number;
  pbRatio?: number;
  roe?: number;
  debtToEquity?: number;
  netMargin?: number;
  summary?: string;
}

export default function FundamentalsIntelligence({
  score = 82,
  peRatio = 24.5,
  pbRatio = 3.2,
  roe = 18.4,
  debtToEquity = 0.42,
  netMargin = 15.6,
  summary = "Audited financial metrics indicate solid profitability, stable operating cash flow, and healthy liquidity coverage with moderate leverage.",
}: FundamentalsProps) {
  return (
    <div className="p-6 rounded-xl bg-surface border border-border space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-accent" />
            Fundamental Intelligence
          </h3>
          <p className="text-xs text-muted-foreground">Balance sheet health, statement scoring, and profitability</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-background border border-border text-xs font-mono">
          <Award className="w-3.5 h-3.5 text-accent" />
          <span className="text-muted-foreground">Score:</span>
          <span className="font-bold text-foreground">{score} / 100</span>
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-background border border-border text-xs text-muted-foreground leading-relaxed font-normal">
        {summary}
      </div>

      {/* Fundamental Ratios Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
        <div className="p-3 rounded-lg bg-background border border-border text-center space-y-1">
          <span className="text-[10px] text-muted-foreground block">P/E RATIO</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">{peRatio}x</span>
        </div>

        <div className="p-3 rounded-lg bg-background border border-border text-center space-y-1">
          <span className="text-[10px] text-muted-foreground block">P/B RATIO</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">{pbRatio}x</span>
        </div>

        <div className="p-3 rounded-lg bg-background border border-border text-center space-y-1">
          <span className="text-[10px] text-muted-foreground block">ROE %</span>
          <span className="text-sm font-semibold text-bullish tabular-nums">{roe}%</span>
        </div>

        <div className="p-3 rounded-lg bg-background border border-border text-center space-y-1">
          <span className="text-[10px] text-muted-foreground block">DEBT / EQUITY</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">{debtToEquity}</span>
        </div>

        <div className="p-3 rounded-lg bg-background border border-border text-center space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-muted-foreground block">NET MARGIN</span>
          <span className="text-sm font-semibold text-bullish tabular-nums">{netMargin}%</span>
        </div>
      </div>
    </div>
  );
}
