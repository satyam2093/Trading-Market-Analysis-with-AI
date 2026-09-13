"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  Globe2,
  Newspaper,
  ExternalLink,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { fetchMarketOverview, fetchFeaturedAssets, fetchMarketNews } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
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

interface NewsItem {
  id?: string;
  title: string;
  source: string;
  published: string;
  url: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  impact?: "HIGH" | "MEDIUM" | "LOW";
  summary?: string;
}

const DEFAULT_GLOBAL_CENTERS = {
  india: [
    { symbol: "NIFTY50", name: "NIFTY 50", price: 25790.25, change: 112.4, change_pct: 0.44, currency: "INR", currency_symbol: "₹", exchange: "NSE" },
    { symbol: "SENSEX", name: "BSE SENSEX", price: 84544.31, change: 384.2, change_pct: 0.46, currency: "INR", currency_symbol: "₹", exchange: "BSE" },
    { symbol: "BANKNIFTY", name: "NIFTY Bank", price: 56606.55, change: 134.6, change_pct: 0.24, currency: "INR", currency_symbol: "₹", exchange: "NSE" },
  ],
  us: [
    { symbol: "SP500", name: "S&P 500", price: 7656.98, change: 65.28, change_pct: 0.86, currency: "USD", currency_symbol: "$", exchange: "SNP" },
    { symbol: "NASDAQ", name: "NASDAQ Composite", price: 23150.45, change: 198.3, change_pct: 0.86, currency: "USD", currency_symbol: "$", exchange: "NASDAQ" },
    { symbol: "DOW", name: "Dow Jones Industrial", price: 45890.12, change: 215.1, change_pct: 0.47, currency: "USD", currency_symbol: "$", exchange: "DJI" },
  ],
  china: [
    { symbol: "SHANGHAI", name: "Shanghai Composite", price: 3888.11, change: -46.29, change_pct: -1.18, currency: "CNY", currency_symbol: "¥", exchange: "SSE" },
    { symbol: "HANGSENG", name: "Hang Seng Index", price: 24310.85, change: 82.4, change_pct: 0.34, currency: "HKD", currency_symbol: "HK$", exchange: "HKEX" },
  ],
  russia: [
    { symbol: "MOEX", name: "MOEX Russia Index", price: 2222.51, change: -4.14, change_pct: -0.19, currency: "RUB", currency_symbol: "₽", exchange: "MCX" },
  ],
  global: [
    { symbol: "FTSE100", name: "FTSE 100 Index", price: 8840.12, change: 18.5, change_pct: 0.21, currency: "GBP", currency_symbol: "£", exchange: "LSE" },
    { symbol: "NIKKEI225", name: "Nikkei 225 Index", price: 39680.5, change: -120.4, change_pct: -0.3, currency: "JPY", currency_symbol: "¥", exchange: "TSE" },
    { symbol: "BTC", name: "Bitcoin", price: 76768.0, change: -572.95, change_pct: -0.74, currency: "USD", currency_symbol: "$", exchange: "BINANCE" },
  ],
};

export default function HomePage() {
  const { isAuthenticated, openAuth, authLoading } = useAuth();

  const [indices, setIndices] = useState<MarketOverviewItem[]>([]);
  const [centers, setCenters] = useState<any>(DEFAULT_GLOBAL_CENTERS);
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [loadingIndices, setLoadingIndices] = useState(true);

  const [featured, setFeatured] = useState<FeaturedAsset[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const refreshMarketData = () => {
    // 1. Fetch Real Market Overview & Global Centers
    fetchMarketOverview().then((res: any) => {
      if (res?.indices && res.indices.length > 0) {
        setIndices(res.indices);
      }
      if (res?.centers) {
        setCenters(res.centers);
      }
      setLoadingIndices(false);
    });

    // 2. Fetch Featured Assets & Signals
    fetchFeaturedAssets().then((res) => {
      if (res?.assets && res.assets.length > 0) {
        setFeatured(res.assets);
      }
      setLoadingFeatured(false);
    });

    // 3. Fetch Real Breaking Financial News
    fetchMarketNews(6).then((res) => {
      if (res?.articles && res.articles.length > 0) {
        setNews(res.articles);
      }
      setLoadingNews(false);
      setLastRefreshed(new Date().toLocaleTimeString());
    });
  };

  useEffect(() => {
    refreshMarketData();

    // Auto-refresh real-time market data every 30 seconds
    const interval = setInterval(() => {
      refreshMarketData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const pipelineStages = [
    { num: "01", name: "MARKET DATA", desc: "Real-time ticks, multi-exchange order books, and OHLCV bars with strict data integrity." },
    { num: "02", name: "STRUCTURE", desc: "17 deterministic candlestick patterns, multi-timeframe moving averages, and support/resistance zones." },
    { num: "03", name: "FUNDAMENTALS", desc: "Audited financial reports, statement ratios, valuation health, and balance sheet scoring." },
    { num: "04", name: "NEWS & SENTIMENT", desc: "Real-time natural language sentiment analysis on global financial news wires." },
    { num: "05", name: "INTELLIGENCE", desc: "8 specialized models: XGBoost regimes, PyTorch Bi-LSTM, Temporal Transformers, and Graph Neural Networks." },
    { num: "06", name: "DECISION", desc: "Ensemble consensus with Value-at-Risk (VaR 95%) quantitative circuit breakers." },
  ];

  // Helper to compile region cards
  const allCenterCards = [
    ...(centers?.india || []).map((c: any) => ({ ...c, regionName: "India", flag: "🇮🇳" })),
    ...(centers?.us || []).map((c: any) => ({ ...c, regionName: "United States", flag: "🇺🇸" })),
    ...(centers?.china || []).map((c: any) => ({ ...c, regionName: "China", flag: "🇨🇳" })),
    ...(centers?.russia || []).map((c: any) => ({ ...c, regionName: "Russia", flag: "🇷🇺" })),
    ...(centers?.global || []).map((c: any) => ({ ...c, regionName: "Global", flag: "🌍" })),
  ];

  const displayedCenters =
    selectedRegion === "ALL"
      ? allCenterCards
      : allCenterCards.filter((c) => c.regionName.toUpperCase() === selectedRegion.toUpperCase());

  return (
    <div className="space-y-20 pb-16">
      {/* ── 1. HERO SECTION ── */}
      <section className="pt-12 md:pt-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-mono text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
            <span>NEXQUANT QUANTITATIVE INTELLIGENCE v2.1</span>
            {lastRefreshed && (
              <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">· Updated {lastRefreshed}</span>
            )}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-foreground leading-[1.05]">
            See the Market.<br />
            <span className="text-muted-foreground">Understand the Signal.</span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl font-normal leading-relaxed pt-2">
            NexQuant synthesizes real-time market data across US, Indian, European, and Asian centers, technical structure, financial news sentiment, and 8 deep learning models into one authoritative intelligence terminal.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/assets/TCS"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Explore Terminal <ArrowRight className="w-4 h-4" />
            </Link>

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

            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Newspaper className="w-4 h-4 text-accent" /> Live News Wire
            </Link>
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

              {indices.length > 0 ? (
                indices.map((item) => {
                  const currSymbol =
                    (item as any).currency_symbol ||
                    (item.symbol.includes(".NS") || ["NIFTY50", "NIFTY", "SENSEX", "BANKNIFTY", "RELIANCE", "TCS"].includes(item.symbol)
                      ? "₹"
                      : "$");
                  const priceStr =
                    typeof item.price === "number" && item.price > 0
                      ? `${currSymbol}${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "Connecting...";

                  const hasChange = item.change_pct !== undefined && !isNaN(item.change_pct);
                  const isPositive = (item.change_pct || 0) >= 0;

                  return (
                    <Link
                      key={item.symbol}
                      href={`/assets/${item.symbol}`}
                      className="flex items-center gap-2 hover:text-foreground transition-colors group text-xs font-mono"
                    >
                      <span className="font-semibold text-foreground">{item.symbol}</span>
                      <span className="tabular-nums text-muted-foreground">{priceStr}</span>
                      {hasChange && (
                        <span className={`inline-flex items-center tabular-nums font-medium ${isPositive ? "text-bullish" : "text-bearish"}`}>
                          {isPositive ? "+" : ""}
                          {item.change_pct!.toFixed(2)}%
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground/60 px-1 py-0.2 rounded bg-background border border-border/40">
                        {item.data_status || "LIVE"}
                      </span>
                    </Link>
                  );
                })
              ) : (
                allCenterCards.slice(0, 8).map((item) => (
                  <Link
                    key={item.symbol}
                    href={`/assets/${item.symbol}`}
                    className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground"
                  >
                    <span className="font-semibold text-foreground">{item.symbol}</span>
                    <span className="tabular-nums">
                      {item.currency_symbol}
                      {item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={item.change_pct >= 0 ? "text-bullish" : "text-bearish"}>
                      {item.change_pct >= 0 ? "+" : ""}
                      {item.change_pct.toFixed(2)}%
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. NEW FEATURE: GLOBAL MARKET CENTERS & INDICES GROWTH MATRIX ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-accent" />
              <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                GLOBAL MARKET CENTERS
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-semibold text-foreground tracking-tight pt-1">
              Major Markets Growth & Benchmarks
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Real-time performance tracking for Sensex, Nifty, Bank Nifty, S&P 500, Nasdaq, Shanghai, and MOEX Russia
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center rounded border border-border bg-surface p-1 text-xs font-mono overflow-x-auto">
            {["ALL", "INDIA", "UNITED STATES", "CHINA", "RUSSIA", "GLOBAL"].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                  selectedRegion === r
                    ? "bg-elevated text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Global Market Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedCenters.map((item: any) => {
            const isPos = (item.change_pct || 0) >= 0;
            const curr = item.currency_symbol || (item.currency === "INR" ? "₹" : "$");
            const priceStr =
              typeof item.price === "number" && item.price > 0
                ? `${curr}${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "Connecting...";

            return (
              <Link
                key={item.symbol}
                href={`/assets/${item.symbol}`}
                className="p-5 rounded-xl bg-surface border border-border hover:border-muted-foreground/40 transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.flag || "🌐"}</span>
                      <div>
                        <span className="font-mono font-bold text-base text-foreground group-hover:text-accent transition-colors">
                          {item.symbol}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate max-w-[160px]">{item.name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-muted-foreground">
                      {item.exchange || item.regionName}
                    </span>
                  </div>

                  <div className="pt-1">
                    <div className="text-2xl font-mono font-semibold text-foreground tabular-nums">{priceStr}</div>
                    {item.change_pct !== undefined && !isNaN(item.change_pct) && (
                      <div className={`text-xs font-mono flex items-center gap-1.5 pt-0.5 ${isPos ? "text-bullish" : "text-bearish"}`}>
                        {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>
                          {isPos ? "+" : ""}
                          {item.change ? `${curr}${Math.abs(item.change).toFixed(2)} ` : ""}
                          ({isPos ? "+" : ""}
                          {item.change_pct.toFixed(2)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>REGIONAL GROWTH</span>
                  <span className={`font-semibold ${isPos ? "text-bullish" : "text-bearish"}`}>
                    {isPos ? "EXPANDING" : "CONTRACTING"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 4. NEW FEATURE: REAL-TIME FINANCIAL NEWS & MARKET PULSE ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-accent" />
              <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                MARKET INTELLIGENCE PULSE
              </span>
              <span className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight pt-1">
              Live Breaking Financial News
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Real-time headlines analyzed for market impact from Bloomberg, Reuters, Financial Times, and WSJ
            </p>
          </div>

          <Link href="/news" className="text-xs font-mono text-accent hover:underline flex items-center gap-1">
            Open Full News Terminal →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingNews ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl bg-surface border border-border space-y-3 animate-pulse">
                <div className="h-4 w-3/4 bg-background rounded" />
                <div className="h-3 w-1/3 bg-background rounded" />
                <div className="h-12 w-full bg-background rounded" />
              </div>
            ))
          ) : news.length > 0 ? (
            news.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-surface border border-border hover:border-muted-foreground/40 transition-all flex flex-col justify-between group space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span className="font-semibold text-foreground/90 truncate max-w-[180px]">{item.source}</span>
                    <span>{item.published}</span>
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug flex items-start justify-between gap-2"
                  >
                    <span>{item.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                  </a>

                  {item.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                      {item.summary}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      item.sentiment === "POSITIVE"
                        ? "bg-bullish/10 text-bullish border-bullish/30"
                        : item.sentiment === "NEGATIVE"
                          ? "bg-bearish/10 text-bearish border-bearish/30"
                          : "bg-background text-muted-foreground border-border"
                    }`}
                  >
                    {item.sentiment}
                  </span>
                  {item.impact && (
                    <span className="text-[10px] text-muted-foreground uppercase">{item.impact} IMPACT</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-8 rounded-xl bg-surface border border-border text-center text-sm text-muted-foreground">
              Live financial news wire updating...
            </div>
          )}
        </div>
      </section>

      {/* ── 5. LIVE QUANTITATIVE INTELLIGENCE (FEATURED ASSETS) ── */}
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
              const formattedPrice =
                asset.price > 0
                  ? `${asset.currency_symbol || "$"}${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "Connecting...";

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
                          {isPositive ? "+" : ""}
                          {asset.change_pct.toFixed(2)}% (24h)
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

      {/* ── 6. PRODUCT STORY (6 STAGES) ── */}
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
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">{stage.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. INSTITUTIONAL METHODOLOGY GRID ── */}
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

      {/* ── 8. CALL TO ACTION ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 space-y-6">
        <h2 className="text-3xl sm:text-5xl font-normal text-foreground tracking-tight max-w-2xl mx-auto">
          Start analyzing with quantitative precision.
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Search over thousands of stocks, ETFs, indices, and crypto pairs on the NexQuant terminal.
        </p>
        <div className="pt-2 flex items-center justify-center gap-4">
          <Link
            href="/assets/TCS"
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
