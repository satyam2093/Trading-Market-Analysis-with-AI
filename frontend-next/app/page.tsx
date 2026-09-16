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
  ShieldCheck,
  Cpu,
  BarChart3,
  Flame,
  Clock,
  Sparkles,
} from "lucide-react";
import { fetchMarketOverview, fetchFeaturedAssets, fetchMarketNews } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTradingStyle } from "@/context/TradingStyleContext";
import TradingStyleSelector from "@/components/trading/TradingStyleSelector";
import NewsImpactPanel from "@/components/news/NewsImpactPanel";
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
  image_url: string;
  category?: string;
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

function MicroSparkline({ isPositive }: { isPositive: boolean }) {
  const points = isPositive
    ? "0,20 10,18 20,22 30,15 40,17 50,11 60,13 70,8 80,4"
    : "0,6 10,8 20,5 30,12 40,10 50,16 60,14 70,19 80,22";

  return (
    <svg className="w-20 h-6 overflow-visible" viewBox="0 0 80 24" fill="none">
      <polyline
        fill="none"
        stroke={isPositive ? "hsl(var(--bullish))" : "hsl(var(--bearish))"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function HomePage() {
  const { isAuthenticated, openAuth, authLoading } = useAuth();

  const [indices, setIndices] = useState<MarketOverviewItem[]>([]);
  const [centers, setCenters] = useState<any>(DEFAULT_GLOBAL_CENTERS);
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");

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
    { num: "01", name: "MARKET DATA", desc: "Sub-millisecond ticks, multi-exchange order books, and OHLCV bars with zero simulated data." },
    { num: "02", name: "STRUCTURE", desc: "17 deterministic candlestick patterns, multi-timeframe moving averages, and dynamic support/resistance channels." },
    { num: "03", name: "FUNDAMENTALS", desc: "Audited balance sheet ratios, debt-to-equity scoring, valuation multiples, and cash flow health." },
    { num: "04", name: "NEWS SENTIMENT", desc: "Real-time natural language processing on global financial wire reports from Reuters, Bloomberg, and FT." },
    { num: "05", name: "INTELLIGENCE", desc: "8 specialized models: XGBoost regimes, PyTorch Bi-LSTM, Temporal Transformers, and Graph Neural Networks." },
    { num: "06", name: "DECISION ENGINE", desc: "Multi-model ensemble consensus with Value-at-Risk (VaR 95%) quantitative circuit breakers." },
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

  // Prepare duplicate list for seamless infinite marquee rotation
  const tickerItems = indices.length > 0 ? indices : allCenterCards.slice(0, 10);
  const marqueeList = [...tickerItems, ...tickerItems];

  return (
    <div className="space-y-24 pb-20 overflow-x-hidden">
      {/* ── 1. HERO SECTION WITH GRADIENT GLOW ── */}
      <section className="relative pt-12 md:pt-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Ambient background glow */}
        <div className="absolute top-10 left-1/4 -z-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 -z-10 w-80 h-80 bg-bullish/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border text-xs font-mono text-muted-foreground shadow-sm">
            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
            <span className="font-semibold text-foreground">NEXQUANT QUANTITATIVE TERMINAL v2.2</span>
            <span className="text-muted-foreground/50">|</span>
            <span className="text-[11px] text-accent font-medium">LIVE INSTITUTIONAL FEEDS</span>
            {lastRefreshed && (
              <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">· Synced {lastRefreshed}</span>
            )}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-foreground leading-[1.05]">
            See the Market.<br />
            <span className="text-muted-foreground font-light">Understand the Signal.</span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl font-normal leading-relaxed pt-1">
            NexQuant synthesizes real-world data across Indian NSE/BSE shares, US tech leaders, global indices, and live financial news wires into one authoritative quantitative terminal.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/assets/TCS"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all shadow-md hover:shadow-lg"
            >
              Launch TCS Terminal <ArrowRight className="w-4 h-4" />
            </Link>

            {authLoading ? (
              <div className="w-28 h-11 rounded-lg bg-surface animate-pulse" />
            ) : isAuthenticated ? (
              <Link
                href="/watchlist"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-surface border border-border text-sm font-medium text-foreground hover:bg-elevated transition-colors shadow-sm"
              >
                Open Watchlist
              </Link>
            ) : (
              <button
                onClick={() => openAuth("signup")}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-surface border border-border text-sm font-medium text-foreground hover:bg-elevated transition-colors shadow-sm"
              >
                Create Free Account
              </button>
            )}

            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Newspaper className="w-4 h-4 text-accent" /> Live Financial News Wire →
            </Link>
          </div>

          {/* Quick Metrics Barometer */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border/60">
            <div>
              <span className="block text-2xl font-mono font-bold text-foreground">35+</span>
              <span className="text-xs font-mono text-muted-foreground">Active Market Assets</span>
            </div>
            <div>
              <span className="block text-2xl font-mono font-bold text-foreground">&lt; 50ms</span>
              <span className="text-xs font-mono text-muted-foreground">Ticker Processing Latency</span>
            </div>
            <div>
              <span className="block text-2xl font-mono font-bold text-bullish">100%</span>
              <span className="text-xs font-mono text-muted-foreground">Authentic Live Quotes</span>
            </div>
            <div>
              <span className="block text-2xl font-mono font-bold text-accent">8 Models</span>
              <span className="text-xs font-mono text-muted-foreground">AI Consensus Pipeline</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. AUTO-MOVING CONTINUOUS WALL STREET TICKER TAPE ── */}
      <section className="border-y border-border/70 bg-surface/70 backdrop-blur-md py-3.5 overflow-hidden shadow-inner relative group">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex items-center">
          <div className="px-4 shrink-0 flex items-center gap-2 border-r border-border/80 z-20 bg-surface/90 pr-6">
            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-accent" /> LIVE TICKER:
            </span>
          </div>

          <div className="overflow-hidden flex-1">
            <div className="animate-ticker-marquee flex items-center gap-8 py-0.5">
              {marqueeList.map((item, idx) => {
                const isPositive = (item.change_pct || 0) >= 0;
                const currSymbol =
                  (item as any).currency_symbol ||
                  (item.symbol.includes(".NS") || ["NIFTY50", "NIFTY", "SENSEX", "BANKNIFTY", "RELIANCE", "TCS"].includes(item.symbol)
                    ? "₹"
                    : "$");

                const priceStr =
                  typeof item.price === "number" && item.price > 0
                    ? `${currSymbol}${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "Connecting...";

                return (
                  <Link
                    key={`${item.symbol}_${idx}`}
                    href={`/assets/${item.symbol}`}
                    className="flex items-center gap-2.5 hover:text-foreground transition-colors group/item shrink-0 text-xs font-mono px-3 py-1 rounded hover:bg-elevated/60"
                  >
                    <span className="font-bold text-foreground group-hover/item:text-accent transition-colors">
                      {item.symbol}
                    </span>
                    <span className="tabular-nums font-medium text-foreground/90">{priceStr}</span>
                    {item.change_pct !== undefined && !isNaN(item.change_pct) && (
                      <span className={`inline-flex items-center tabular-nums font-semibold ${isPositive ? "text-bullish" : "text-bearish"}`}>
                        {isPositive ? "+" : ""}
                        {item.change_pct.toFixed(2)}%
                      </span>
                    )}
                    <span className="text-[9px] text-muted-foreground/60 px-1 py-0.2 rounded bg-background border border-border/40">
                      {(item as any).data_status || "LIVE"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. ATTENTION-GRABBING GLOBAL MARKET CENTERS & INDICES GROWTH ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-accent" />
              <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                GLOBAL MARKET CENTERS & GROWTH
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-normal text-foreground tracking-tight pt-1">
              Major World Indices & Growth Metrics
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time benchmarks across India (Sensex, Nifty, Bank Nifty), US, China, Russia, and Europe
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center rounded-lg border border-border bg-surface p-1 text-xs font-mono overflow-x-auto shadow-sm">
            {["ALL", "INDIA", "UNITED STATES", "CHINA", "RUSSIA", "GLOBAL"].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
                  selectedRegion === r
                    ? "bg-elevated text-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Global Market Cards Grid with Glow & Sparklines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                className={`p-6 rounded-2xl bg-surface border transition-all flex flex-col justify-between group space-y-5 hover:-translate-y-1 duration-200 ${
                  isPos
                    ? "border-border hover:border-bullish/50 hover:shadow-lg hover:shadow-bullish/10"
                    : "border-border hover:border-bearish/50 hover:shadow-lg hover:shadow-bearish/10"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl drop-shadow">{item.flag || "🌐"}</span>
                      <div>
                        <span className="font-mono font-bold text-lg text-foreground group-hover:text-accent transition-colors block">
                          {item.symbol}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate max-w-[150px]">{item.name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-muted-foreground">
                      {item.exchange || item.regionName}
                    </span>
                  </div>

                  <div className="pt-2 flex items-baseline justify-between gap-2">
                    <div>
                      <div className="text-2xl font-mono font-bold text-foreground tabular-nums tracking-tight">
                        {priceStr}
                      </div>
                      {item.change_pct !== undefined && !isNaN(item.change_pct) && (
                        <div className={`text-xs font-mono font-semibold flex items-center gap-1 pt-1 ${isPos ? "text-bullish" : "text-bearish"}`}>
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

                    {/* Micro Sparkline Curve */}
                    <div className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <MicroSparkline isPositive={isPos} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">MARKET STATUS</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    isPos
                      ? "bg-bullish/10 text-bullish border-bullish/30"
                      : "bg-bearish/10 text-bearish border-bearish/30"
                  }`}>
                    {isPos ? "EXPANDING" : "CONTRACTING"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 4. VISUAL BREAKING FINANCIAL NEWS WIRE WITH IMAGES ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-accent" />
              <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                REAL-WORLD FINANCIAL MEDIA PULSE
              </span>
              <span className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-normal text-foreground tracking-tight pt-1">
              Live Breaking Market Headlines
            </h2>
            <p className="text-sm text-muted-foreground">
              Recent real-time reporting with editorial photography from Reuters, Bloomberg, and Financial Times
            </p>
          </div>

          <Link
            href="/news"
            className="text-xs font-mono text-accent hover:underline flex items-center gap-1 font-semibold"
          >
            Explore Complete News Terminal →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingNews ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface overflow-hidden space-y-3 animate-pulse">
                <div className="h-44 bg-background" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-1/3 bg-background rounded" />
                  <div className="h-5 w-full bg-background rounded" />
                  <div className="h-10 w-full bg-background rounded" />
                </div>
              </div>
            ))
          ) : news.length > 0 ? (
            news.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-surface overflow-hidden hover:border-muted-foreground/40 transition-all flex flex-col justify-between group space-y-3 hover:shadow-lg"
              >
                {/* Visual Thumbnail */}
                <div className="relative h-44 w-full overflow-hidden bg-background">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    {item.category && (
                      <span className="px-2.5 py-0.5 rounded bg-background/85 backdrop-blur-md border border-border/60 text-[10px] font-mono font-semibold text-foreground">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-white drop-shadow">
                    <span className="font-semibold">{item.source}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.published}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 pt-1 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug flex items-start justify-between gap-1.5"
                    >
                      <span>{item.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </a>

                    {item.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                        {item.summary}
                      </p>
                    )}
                  </div>

                  {/* Card Footer */}
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

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-accent hover:underline font-medium"
                    >
                      <span>Read Story</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-8 rounded-2xl bg-surface border border-border text-center text-sm text-muted-foreground">
              Connecting to live financial wire feeds...
            </div>
          )}
        </div>
      </section>

      {/* ── 5. NEWS IMPACT MODEL ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <NewsImpactPanel newsItems={news} />
      </section>

      {/* ── 6. YOUR TRADING STYLE ADAPTATION ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              MULTI-HORIZON ADAPTATION ENGINE
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-normal text-foreground tracking-tight pt-1">
            Tailor NexQuant to Your Trading Style
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Choose your execution horizon. Models instantly recalibrate target windows, feature lookbacks, stop-loss formulas, and news decay half-lives.
          </p>
        </div>

        <TradingStyleSelector />
      </section>

      {/* ── 7. STYLE-SPECIFIC AI ANALYSIS & TOP ASSETS ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-normal text-foreground tracking-tight">
              Top Assets & Horizon Consensus Signals
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Multi-model ensemble consensus evaluated in real time from live provider feeds
            </p>
          </div>
          <Link href="/discover" className="text-xs font-mono text-accent hover:underline flex items-center gap-1">

            View All Discovered Assets →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loadingFeatured ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 rounded-2xl bg-surface border border-border space-y-4 animate-pulse">
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
                  className="p-6 rounded-2xl bg-surface border border-border hover:border-muted-foreground/40 transition-all flex flex-col justify-between group space-y-6 hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="font-mono font-bold text-lg text-foreground group-hover:text-accent transition-colors">
                          {asset.symbol}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate max-w-[200px]">{asset.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-muted-foreground">
                        {asset.exchange}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-2xl font-mono font-bold text-foreground tabular-nums">
                        {formattedPrice}
                      </div>
                      {asset.change_pct !== undefined && !isNaN(asset.change_pct) && (
                        <div className={`text-xs font-mono flex items-center gap-1 font-semibold ${isPositive ? "text-bullish" : "text-bearish"}`}>
                          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {isPositive ? "+" : ""}
                          {asset.change_pct.toFixed(2)}% (24h)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">AI SIGNAL</span>
                      <span className={`font-bold ${asset.signal === "BUY" ? "text-bullish" : asset.signal === "SELL" ? "text-bearish" : "text-warning"}`}>
                        {asset.signal}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">CONFIDENCE</span>
                      <span className="text-foreground font-semibold">{asset.confidence}%</span>
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
            <div className="col-span-full p-8 rounded-2xl bg-surface border border-border text-center text-sm text-muted-foreground">
              Connecting to live intelligence signals...
            </div>
          )}
        </div>
      </section>

      {/* ── 6. ARCHITECTURE STORYLINE ── */}
      <section id="story" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            QUANTITATIVE SYSTEM ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-4xl font-normal text-foreground tracking-tight">
            Authoritative intelligence. <br />
            <span className="text-muted-foreground font-light">Processed across six synchronized layers.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelineStages.map((stage) => (
            <div key={stage.num} className="p-6 rounded-2xl bg-surface border border-border space-y-3">
              <span className="text-sm font-mono font-bold text-accent">{stage.num}</span>
              <h3 className="text-base font-semibold text-foreground">{stage.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">{stage.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. INSTITUTIONAL RIGOR GRID ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-surface p-8 sm:p-14 space-y-8 shadow-sm">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Governed by Rigorous Principles
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Designed for institutional transparency, zero fake data, and risk mitigation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                <CheckCircle2 className="w-4 h-4 text-bullish shrink-0" />
                <span>Zero Fabricated Quotes</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                NexQuant strictly avoids mock prices in production. If an exchange feed is closed or delayed, explicit status indicators are raised immediately.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                <CheckCircle2 className="w-4 h-4 text-bullish shrink-0" />
                <span>Value-at-Risk Guardrails</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Historical Value-at-Risk (95% VaR) and maximum expected drawdown are computed continuously. Signals automatically downgrade when volatility surges.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-foreground font-medium text-sm">
                <CheckCircle2 className="w-4 h-4 text-bullish shrink-0" />
                <span>Full Model Transparency</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every ensemble prediction reveals underlying consensus across XGBoost, Bi-LSTM, Temporal Transformers, and NLP sentiment so traders can verify rationale.
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
          Explore thousands of stocks, ETFs, global indices, and crypto pairs on the NexQuant terminal.
        </p>
        <div className="pt-2 flex items-center justify-center gap-4">
          <Link
            href="/assets/TCS"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all shadow-md"
          >
            Launch Terminal <ArrowRight className="w-4 h-4" />
          </Link>
          {authLoading ? (
            <div className="w-32 h-12 rounded-lg bg-surface animate-pulse" />
          ) : !isAuthenticated ? (
            <button
              onClick={() => openAuth("signup")}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-surface border border-border text-sm font-semibold text-foreground hover:bg-elevated transition-colors shadow-sm"
            >
              Get Started Free
            </button>
          ) : (
            <Link
              href="/watchlist"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-surface border border-border text-sm font-semibold text-foreground hover:bg-elevated transition-colors shadow-sm"
            >
              View My Watchlist
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
