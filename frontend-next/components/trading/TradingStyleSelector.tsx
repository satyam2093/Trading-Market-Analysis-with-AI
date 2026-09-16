"use client";

import React from "react";
import { Zap, Clock, TrendingUp, Landmark, ShieldAlert, Target, Layers, Radio } from "lucide-react";
import { useTradingStyle } from "@/context/TradingStyleContext";
import { TRADING_STYLE_CONFIGS } from "@/lib/tradingStyleConfig";
import { TradingStyle } from "@/types/tradingStyle";

interface Props {
  onStyleChange?: (style: TradingStyle) => void;
  compact?: boolean;
}

export default function TradingStyleSelector({ onStyleChange, compact = false }: Props) {
  const { style, styleInfo, setStyle } = useTradingStyle();

  const handleSelect = (s: TradingStyle) => {
    setStyle(s);
    if (onStyleChange) onStyleChange(s);
  };

  const getStyleIcon = (id: TradingStyle) => {
    switch (id) {
      case "SCALPER": return <Zap className="w-4 h-4 text-amber-400" />;
      case "INTRADAY": return <Clock className="w-4 h-4 text-blue-400" />;
      case "SWING": return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case "INVESTOR": return <Landmark className="w-4 h-4 text-purple-400" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border">
        {(Object.keys(TRADING_STYLE_CONFIGS) as TradingStyle[]).map((s) => {
          const isSelected = style === s;
          const info = TRADING_STYLE_CONFIGS[s];
          return (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                isSelected
                  ? "bg-elevated text-foreground shadow-sm border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              }`}
            >
              {getStyleIcon(s)}
              <span>{info.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(TRADING_STYLE_CONFIGS) as TradingStyle[]).map((s) => {
          const isSelected = style === s;
          const info = TRADING_STYLE_CONFIGS[s];

          return (
            <div
              key={s}
              onClick={() => handleSelect(s)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-0.5 duration-200 ${
                isSelected
                  ? "bg-elevated/70 border-accent shadow-lg shadow-accent/10 ring-1 ring-accent"
                  : "bg-surface border-border hover:border-border/80 hover:bg-surface/80"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-background border border-border text-muted-foreground">
                    {info.badge}
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    isSelected ? "border-accent bg-accent" : "border-border"
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-background border border-border">
                    {getStyleIcon(s)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-base tracking-tight">{info.name}</h3>
                    <span className="text-[11px] text-muted-foreground font-mono block">
                      Default TF: {info.defaultTimeframe}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {info.tagline}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Horizon:</span>
                  <span className="text-foreground font-medium">{info.predictionHorizon}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>News Decay:</span>
                  <span className="text-foreground font-medium">{info.newsHalfLife.split(" ")[0]} hrs</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Model Lead:</span>
                  <span className="text-accent truncate max-w-[130px] font-medium">{info.modelEmphasis.primary.split(" ")[0]}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Dive Panel for Active Style */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-background border border-border">
              {getStyleIcon(style)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-semibold text-foreground">{styleInfo.name} Intelligence Configuration</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent font-semibold">
                  ACTIVE PIPELINE
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{styleInfo.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">Synchronized Timeframes:</span>
            <div className="flex gap-1">
              {styleInfo.timeframes.map((tf) => (
                <span
                  key={tf}
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                    tf === styleInfo.defaultTimeframe
                      ? "bg-foreground text-background font-semibold border-foreground"
                      : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {tf}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Detail Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-background/50 border border-border/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Layers className="w-3.5 h-3.5 text-accent" />
              <span>KEY INDICATORS</span>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {styleInfo.keyIndicators.map((ind) => (
                <span key={ind} className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                  {ind}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background/50 border border-border/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <ShieldAlert className="w-3.5 h-3.5 text-warning" />
              <span>STOP-LOSS LOGIC</span>
            </div>
            <div className="text-sm font-mono font-bold text-foreground">
              {styleInfo.stopLossDefault}
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Automated circuit breaker cuts positions if adverse volatility crosses boundary.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background/50 border border-border/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Target className="w-3.5 h-3.5 text-bullish" />
              <span>PROFIT TARGET LOGIC</span>
            </div>
            <div className="text-sm font-mono font-bold text-foreground">
              {styleInfo.takeProfitDefault}
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Dynamic multi-take profit triggers based on horizon structural expansion.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background/50 border border-border/70 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Radio className="w-3.5 h-3.5 text-accent" />
              <span>AI ENSEMBLE WEIGHTS</span>
            </div>
            <div className="text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Core:</span>
                <span className="text-foreground font-medium">{styleInfo.modelEmphasis.primary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fundamentals:</span>
                <span className="text-foreground font-medium">{styleInfo.modelEmphasis.fundamentalWeight}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
