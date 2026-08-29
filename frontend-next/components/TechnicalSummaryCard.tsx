"use client";

import { Gauge, Shield, Zap, Activity } from "lucide-react";

interface TechProps {
  trend?: string;
  momentum?: string;
  volatility?: string;
  volume?: string;
  support?: number;
  resistance?: number;
  rsi?: number;
}

export default function TechnicalSummaryCard({
  trend = "Strong Bullish",
  momentum = "Positive Momentum",
  volatility = "Medium Volatility (24.2%)",
  volume = "Above Average (+18%)",
  support = 104200,
  resistance = 112500,
  rsi = 62.4
}: TechProps) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Gauge className="w-5 h-5 text-cyan-400" />
          Technical Analysis Summary
        </h3>
        <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
          RSI: {rsi}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Trend Indicator */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> Primary Trend
          </span>
          <span className="text-sm font-semibold text-emerald-400">{trend}</span>
        </div>

        {/* Momentum Indicator */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> Momentum Status
          </span>
          <span className="text-sm font-semibold text-cyan-400">{momentum}</span>
        </div>

        {/* Volatility Indicator */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Volatility Profile</span>
          <span className="text-sm font-semibold text-amber-400">{volatility}</span>
        </div>

        {/* Volume Metric */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Volume Metric</span>
          <span className="text-sm font-semibold text-slate-200">{volume}</span>
        </div>
      </div>

      {/* Support & Resistance Boundaries */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs font-mono">
        <div>
          <span className="text-slate-400 block text-[10px]">KEY SUPPORT</span>
          <span className="text-emerald-400 font-bold">${support.toLocaleString()}</span>
        </div>
        <div className="h-6 w-[1px] bg-slate-800" />
        <div className="text-right">
          <span className="text-slate-400 block text-[10px]">KEY RESISTANCE</span>
          <span className="text-rose-400 font-bold">${resistance.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
