"use client";

import { Building2, DollarSign, Award, CheckCircle2 } from "lucide-react";

interface FundProps {
  score?: number;
  peRatio?: number;
  pbRatio?: number;
  roe?: number;
  debtToEquity?: number;
  netMargin?: number;
  summary?: string;
}

export default function FundamentalsCard({
  score = 82,
  peRatio = 24.5,
  pbRatio = 3.2,
  roe = 18.4,
  debtToEquity = 0.42,
  netMargin = 15.6,
  summary = "Audited financial metrics indicate solid profitability, stable operating cash flow, and healthy liquidity coverage."
}: FundProps) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-400" />
          Fundamental Statement Intelligence
        </h3>
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
            Score: {score} / 100
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-4 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        {summary}
      </p>

      {/* Fundamental Ratios Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block">P/E RATIO</span>
          <span className="text-sm font-bold text-slate-200">{peRatio}x</span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block">P/B RATIO</span>
          <span className="text-sm font-bold text-slate-200">{pbRatio}x</span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block">ROE %</span>
          <span className="text-sm font-bold text-emerald-400">{roe}%</span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 block">DEBT / EQUITY</span>
          <span className="text-sm font-bold text-slate-200">{debtToEquity}</span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 block">NET MARGIN</span>
          <span className="text-sm font-bold text-emerald-400">{netMargin}%</span>
        </div>
      </div>
    </div>
  );
}
