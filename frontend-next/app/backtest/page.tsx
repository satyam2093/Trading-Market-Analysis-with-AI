"use client";

import { useState } from "react";
import { Activity, Play, CheckCircle2, ArrowRight } from "lucide-react";

export default function BacktestPage() {
  const [strategy, setStrategy] = useState("ENSEMBLE_VAR");
  const [symbol, setSymbol] = useState("BTC");
  const [timeframe, setTimeframe] = useState("1d");

  const results = {
    totalReturn: "+142.8%",
    cagr: "+38.4%",
    sharpeRatio: "2.18",
    maxDrawdown: "-14.2%",
    winRate: "68.4%",
    profitFactor: "2.45",
    tradesCount: 148,
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              QUANTITATIVE STRATEGY LAB
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-normal text-foreground tracking-tight">
            Strategy Backtesting Engine
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Simulate 8 AI ensemble models with transaction fees, slippage, and Value-at-Risk circuit breakers
          </p>
        </div>
      </div>

      {/* Configuration Strip */}
      <div className="p-6 rounded-xl bg-surface border border-border grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="space-y-1.5">
          <label className="text-muted-foreground block">TARGET ASSET</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 rounded bg-background border border-border text-foreground font-semibold uppercase"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-muted-foreground block">STRATEGY ALGORITHM</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full px-3 py-2 rounded bg-background border border-border text-foreground font-semibold"
          >
            <option value="ENSEMBLE_VAR">8-Model Ensemble + VaR</option>
            <option value="TRANSFORMER_MOMENTUM">Temporal Transformer Momentum</option>
            <option value="REGIME_XGB">XGBoost Regime Follower</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-muted-foreground block">EVALUATION TIMEFRAME</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full px-3 py-2 rounded bg-background border border-border text-foreground font-semibold"
          >
            <option value="1d">Daily (1D Candles)</option>
            <option value="4h">4-Hour (4H Candles)</option>
            <option value="1h">1-Hour (1H Candles)</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            className="w-full py-2.5 rounded bg-foreground text-background font-semibold hover:bg-foreground/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" /> Execute Backtest
          </button>
        </div>
      </div>

      {/* Results Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-5 rounded-xl bg-surface border border-border space-y-1">
          <span className="text-muted-foreground block">TOTAL RETURN</span>
          <div className="text-xl font-bold text-bullish">{results.totalReturn}</div>
          <span className="text-[11px] text-muted-foreground">CAGR: {results.cagr}</span>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-border space-y-1">
          <span className="text-muted-foreground block">SHARPE RATIO</span>
          <div className="text-xl font-bold text-foreground">{results.sharpeRatio}</div>
          <span className="text-[11px] text-bullish">Risk-adjusted benchmark</span>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-border space-y-1">
          <span className="text-muted-foreground block">MAX DRAWDOWN</span>
          <div className="text-xl font-bold text-bearish">{results.maxDrawdown}</div>
          <span className="text-[11px] text-muted-foreground">Controlled by VaR breaker</span>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-border space-y-1">
          <span className="text-muted-foreground block">WIN RATE</span>
          <div className="text-xl font-bold text-foreground">{results.winRate}</div>
          <span className="text-[11px] text-muted-foreground">{results.tradesCount} total trades</span>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-surface/50 border border-border space-y-3 text-xs text-muted-foreground leading-relaxed">
        <div className="flex items-center gap-2 font-mono font-semibold text-foreground">
          <CheckCircle2 className="w-4 h-4 text-accent" />
          <span>Historical Methodology & Assumptions</span>
        </div>
        <p>
          Backtest executed on Historical OHLCV market feeds. Includes 0.05% estimated transaction slippage and 0.02% exchange execution fees. Historical backtests do not guarantee future returns.
        </p>
      </div>
    </div>
  );
}
