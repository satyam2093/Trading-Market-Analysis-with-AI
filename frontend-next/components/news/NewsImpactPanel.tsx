"use client";

import React from "react";
import { Zap, AlertTriangle, Clock, ArrowUpRight, Flame } from "lucide-react";
import { useTradingStyle } from "@/context/TradingStyleContext";

interface Props {
  newsItems: any[];
}

export default function NewsImpactPanel({ newsItems }: Props) {
  const { style, styleInfo } = useTradingStyle();

  const items = newsItems && newsItems.length > 0 ? newsItems.slice(0, 4) : [];

  const getDecayFactor = (publishedAt: string) => {
    try {
      const pubDate = new Date(publishedAt).getTime();
      const now = Date.now();
      const ageHours = Math.max(0, (now - pubDate) / (1000 * 60 * 60));
      const halfLife = style === "SCALPER" ? 2 : style === "INTRADAY" ? 8 : style === "SWING" ? 72 : 720;
      const decay = Math.pow(0.5, ageHours / halfLife);
      return Math.min(100, Math.max(5, Math.round(decay * 100)));
    } catch {
      return 85;
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              NEWS IMPACT MODEL (MODEL 8)
            </span>
          </div>
          <h3 className="text-xl font-semibold text-foreground tracking-tight">
            Horizon-Specific News Event Decay
          </h3>
          <p className="text-xs text-muted-foreground">
            News sentiment impacts trading models with exponential half-life calibrated to your selected horizon ({styleInfo.name}: {styleInfo.newsHalfLife})
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-mono text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span>Half-life:</span>
          <span className="font-semibold text-foreground">{styleInfo.newsHalfLife.split("(")[0]}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => {
          const effectiveWeight = getDecayFactor(item.published);
          const isPos = item.sentiment === "POSITIVE";
          const isNeg = item.sentiment === "NEGATIVE";

          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-background/60 border border-border/70 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-muted-foreground">{item.source || "Financial Wire"}</span>
                  <span className={`px-2 py-0.5 rounded font-semibold border ${
                    isPos ? "bg-bullish/10 text-bullish border-bullish/30" : isNeg ? "bg-bearish/10 text-bearish border-bearish/30" : "bg-surface text-muted-foreground border-border"
                  }`}>
                    {item.sentiment} IMPACT
                  </span>
                </div>

                <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                  {item.title}
                </h4>
              </div>

              <div className="pt-2 border-t border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Horizon Weight Decay:</span>
                  <span className={`font-bold ${effectiveWeight > 60 ? "text-bullish" : effectiveWeight > 30 ? "text-warning" : "text-muted-foreground"}`}>
                    {effectiveWeight}% active
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden border border-border/50">
                  <div
                    className={`h-full rounded-full transition-all ${
                      effectiveWeight > 60 ? "bg-accent" : effectiveWeight > 30 ? "bg-warning" : "bg-muted-foreground/50"
                    }`}
                    style={{ width: `${effectiveWeight}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
