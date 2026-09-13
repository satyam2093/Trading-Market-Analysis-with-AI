"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, Activity, CheckCircle2, ShieldCheck, Cpu } from "lucide-react";
import { fetchMarketOverview, fetchFeaturedAssets } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import type { MarketOverviewItem } from "@/types/market";

interface FeaturedAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  currency: string;
  currency_symbol: string;
  exchange: string;
  asset_type: string;
  signal: string;
  confidence: number;
  regime: string;
  risk_level: string;
  data_status: string;
}

export default function HomePage() {
  const { isAuthenticated, openAuth, authLoading } = useAuth();
  
  const [indices, setIndices] = useState<MarketOverviewItem[]>([]);
  const [loadingIndices, setLoadingIndices] = useState(true);
  const [featured, setFeatured] = useState<FeaturedAsset[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // 1. Fetch Real Market Overview
    fetchMarketOverview().then((res) => {
      if (mounted) {
        if (res?.indices && res.indices.length > 0) {
          setIndices(res.indices);
        }
        setLoadingIndices(false);
      }
    });

    // 2. Fetch Real Featured Assets & Signals
    fetchFeaturedAssets().then((res) => {
      if (mounted) {
        if (res?.assets && res.assets.length > 0) {
          setFeatured(res.assets);
        }
        setLoadingFeatured(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const pipelineStages = [
    { num: "01", name: "MARKET DATA", desc: "Real-time ticks, multi-exchange order books, and OHLCV bars with strict data integrity." },
    { num: "02", name: "STRUCTURE", desc: "17 deterministic candlestick patterns, multi-timeframe moving averages, and support/resistance zones." },
    { num: "03", name: "FUNDAMENTALS", desc: "Audited financial reports, statement ratios, valuation health, and balance sheet scoring." },
    { num: "04", name: "NEWS & SENTIMENT", desc: "FinBERT neural natural language processing on real-time earnings news and macro events." },
    { num: "05", name: "INTELLIGENCE", desc: "8 specialized models: XGBoost regimes, PyTorch Bi-LSTM, Temporal Transformers, and Graph Neural Networks." },
    { num: "06", name: "DECISION", desc: "Ensemble consensus with Value-at-Risk (VaR 95%) quantitative circuit breakers." },
  ];

  return (
    <div className="space-y-24 pb-16">
      {/* ── 1. HERO SECTION ── */}
      <section className="pt-12 md:pt-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-mono text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
            <span>NEXQUANT QUANTITATIVE INTELLIGENCE v2.1</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-foreground leading-[1.05]">
            See the Market.<br />
            <span className="text-muted-foreground">Understand the Signal.</span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl font-normal leading-relaxed pt-2">
            NexQuant synthesizes real-time market data, technical structure, financial statements, and 8 deep learning models into one unambiguous intelligence terminal.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/assets/BTC"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Explore Markets <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Authenticated vs Unauthenticated Hero CTA */}
            {authLoading ? (
              <div className="w-28 h-11 rounded-md bg-surface animate-pulse" />
            ) : isAuthenticated ? (
              <Link
                href="/watchlist"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-surface border border-border text-sm font-medium text-foreground hover:bg-elevated transition-colors"
              >
                Go to My Terminal
              </Link>
            ) : (
              <button
                onClick={() => openAuth("signup")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-surface border border-border text-sm font-medium text-foreground hover:bg-elevated transition-colors"
              >
                Get Started
              </button>
            )}

            <a
              href="#story"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── 2. LIVE MARKET TICKER STRIP ── */}
      <section className="border-y border-border/50 bg-surface/50 py-3">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-thin">
            <div className="flex items-center gap-6 min-w-max py-1">
              <span className="text-xs font-mono font-semibold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-accent" />
                Live Feeds:
              </span>

              {loadingIndices ? (
                <div className="flex items-center gap-6 text-xs text-muted-foreground font-mono">
                  <span className="animate-pulse">Connecting to live market data gateway...</span>
                </div>
              ) : indices.length > 0 ? (
                indices.map((item) => {
                  const currSymbol = (item as any).currency_symbol || (item.symbol.includes(".NS") || ["NIFTY50", "SENSEX", "RELIANCE"].includes(item.symbol) ? "₹" : "$");
                  const priceStr = item.price > 0 ? `${currSymbol}${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "Price unavailable";

                  return (
                    <Link
                      key={item.symbol}
                      href={`/assets/${item.symbol}`}
                      className="flex items-center gap-2.5 hover:text-foreground transition-colors group text-xs font-mono"
                    >
                      <span className="font-semibold text-foreground">{item.symbol}</span>
                      <span className="tabular-nums text-muted-foreground">{priceStr}</span>
                      {item.change_pct !== undefined && !isNaN(item.change_pct) && (
                        <span className={`inline-flex items-center tabular-nums ${item.change_pct >= 0 ? "text-bullish" : "text-bearish"}`}>
                          {item.change_pct >= 0 ? "+" : ""}{item.change_pct.toFixed(2)}%
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground/50 px-1 py-0.2 rounded bg-background border border-border/40">
                        {item.data_status || "LIVE"}
                      </span>
                    </Link>
                  );
                })
              ) : (
                <div className="text-xs text-muted-foreground font-mono">
                  Market indices connecting to gateway (Port 8000)...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. EDITORIAL STATEMENT ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border border-border/60 rounded-2xl bg-surface/30 p-8 sm:p-14 space-y-6">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block">
            THE PROBLEM & THE SOLUTION
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-normal text-foreground leading-tight tracking-tight max-w-4xl">
            Markets generate thousands of disconnected signals. <br className="hidden sm:inline" />
            <span className="text-muted-foreground">NexQuant unifies them into one authoritative picture.</span>
          </h2>
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono text-muted-foreground">
            <div className="p-3 rounded-lg bg-background border border-border/50">Market Data</div>
            <div className="p-3 rounded-lg bg-background border border-border/50">Technical Structure</div>
            <div className="p-3 rounded-lg bg-background border border-border/50">Fundamentals</div>
            <div className="p-3 rounded-lg bg-background border border-border/50">News Sentiment</div>
            <div className="p-3 rounded-lg bg-background border border-border/50">AI Ensemble</div>
            <div className="p-3 rounded-lg bg-background border border-border/50">Risk Controls</div>
          </div>
        </div>
      </section>

      {/* ── 4. LIVE QUANTITATIVE INTELLIGENCE (FEATURED ASSETS) ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              Featured Quantitative Signals
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Multi-model ensemble consensus evaluated in real time from live provider feeds
            </p>
          </div>
          <Link href="/discover" className="text-xs font-mono text-accent hover:underline flex items-center gap-1">
            View All Discovered Assets →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingFeatured ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl bg-surface border border-border space-y-4 animate-pulse">
                <div className="h-5 w-24 bg-background rounded" />
                <div className="h-8 w-32 bg-background rounded" />
                <div className="h-12 w-full bg-background rounded" />
              </div>
            ))
          ) : featured.length > 0 ? (
            featured.map((asset) => {
              const isPositive = asset.change_pct >= 0;
              const formattedPrice = asset.price > 0
                ? `${asset.currency_symbol || "$"}${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                : "Price unavailable";

              return (
                <Link
                  key={asset.symbol}
                  href={`/assets/${asset.symbol}`}
                  className="p-5 rounded-xl bg-surface border border-border hover:border-muted-foreground/40 transition-all flex flex-col justify-between group space-y-6"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="font-mono font-bold text-base text-foreground group-hover:text-accent transition-colors">
                          {asset.symbol}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate max-w-[200px]">{asset.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-muted-foreground">
                        {asset.exchange}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-2xl font-mono font-semibold text-foreground tabular-nums">
                        {formattedPrice}
                      </div>
                      {asset.change_pct !== undefined && !isNaN(asset.change_pct) && (
                        <div className={`text-xs font-mono flex items-center gap-1 ${isPositive ? "text-bullish" : "text-bearish"}`}>
                          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {isPositive ? "+" : ""}{asset.change_pct.toFixed(2)}% (24h)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">SIGNAL</span>
                      <span className={`font-bold ${asset.signal === "BUY" ? "text-bullish" : asset.signal === "SELL" ? "text-bearish" : "text-warning"}`}>
                        {asset.signal}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">CONFIDENCE</span>
                      <span className="text-foreground">{asset.confidence}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">REGIME</span>
                      <span className="text-foreground">{asset.regime}</span>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full p-8 rounded-xl bg-surface border border-border text-center text-sm text-muted-foreground">
              Connecting to live intelligence signals...
            </div>
          )}
        </div>
      </section>

      {/* ── 5. PRODUCT STORY (6 STAGES) ── */}
      <section id="story" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            SYSTEM ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-4xl font-normal text-foreground tracking-tight">
            Everything the market is saying. <br />
            <span className="text-muted-foreground">Processed in six synchronized stages.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelineStages.map((stage) => (
            <div key={stage.num} className="p-6 rounded-xl bg-surface border border-border space-y-3">
              <span className="text-sm font-mono font-bold text-accent">{stage.num}</span>
              <h3 className="text-base font-semibold text-foreground">{stage.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                {stage.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. INSTITUTIONAL METHODOLOGY GRID ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-surface p-8 sm:p-12 space-y-8">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Governed by Rigorous Principles
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Designed for institutional clarity, transparency, and risk prevention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                <CheckCircle2 className="w-4 h-4 text-bullish shrink-0" />
                <span>Zero Fabricated Data</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                NexQuant never generates placeholder prices or simulated statements in production. If an exchange feed is offline, explicit status indicators are raised immediately.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                <CheckCircle2 className="w-4 h-4 text-bullish shrink-0" />
                <span>Circuit-Breaker Risk Engine</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Historical Value-at-Risk (95% VaR) and maximum expected drawdown are computed continuously. Signals are automatically downgraded when volatility exceeds safety thresholds.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                <CheckCircle2 className="w-4 h-4 text-bullish shrink-0" />
                <span>Full Model Transparency</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every ensemble signal reveals model consensus across XGBoost, Bi-LSTM, Temporal Transformers, and NLP sentiment so quantitative traders can audit underlying rationale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. CALL TO ACTION ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 space-y-6">
        <h2 className="text-3xl sm:text-5xl font-normal text-foreground tracking-tight max-w-2xl mx-auto">
          Start analyzing with quantitative precision.
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Search over thousands of stocks, ETFs, indices, and crypto pairs on the NexQuant terminal.
        </p>
        <div className="pt-2 flex items-center justify-center gap-4">
          <Link
            href="/assets/BTC"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
          >
            Launch Terminal <ArrowRight className="w-4 h-4" />
          </Link>
          {authLoading ? (
            <div className="w-32 h-12 rounded-md bg-surface animate-pulse" />
          ) : !isAuthenticated ? (
            <button
              onClick={() => openAuth("signup")}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-surface border border-border text-sm font-semibold text-foreground hover:bg-elevated transition-colors"
            >
              Get Started Free
            </button>
          ) : (
            <Link
              href="/watchlist"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-surface border border-border text-sm font-semibold text-foreground hover:bg-elevated transition-colors"
            >
              View My Watchlist
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
