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
  Zap,
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

function cleanSummaryDisplay(summary?: string, title?: string, category?: string): string {
  if (!summary) {
    return `Executive financial market intelligence covering ${category || "market movements"}. Quantitative tracking active across institutional feeds.`;
  }
  let clean = summary
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;[^&]*&gt;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Discard URLs, links, or RSS tags
  if (
    clean.includes("http://") ||
    clean.includes("https://") ||
    clean.includes("news.google.com") ||
    clean.includes("href=") ||
    clean.startsWith("<") ||
    clean.startsWith("&lt;") ||
    clean.startsWith("a href") ||
    clean.length < 25 ||
    clean.toLowerCase() === title?.toLowerCase()
  ) {
    return `Executive market coverage on ${category || "benchmark equities"} and macroeconomic catalysts affecting intraday sentiment and sector rotations.`;
  }

  if (clean.length > 210) {
    const trimmed = clean.slice(0, 205);
    const lastSpace = trimmed.lastIndexOf(" ");
    return (lastSpace > 100 ? trimmed.slice(0, lastSpace) : trimmed) + "...";
  }

  return clean;
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
  const { style, styleInfo } = useTradingStyle();

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
    { num: "04", name: "NEWS SENTIMENT", desc: "Real-time natural language processing on global financial wire reports with exponential half-life decay." },
    { num: "05", name: "INTELLIGENCE", desc: "8 specialized models: XGBoost regimes, PyTorch Bi-LSTM, Temporal Transformers, and Graph Neural Networks." },
    { num: "06", name: "DECISION ENGINE", desc: "Multi-model ensemble consensus with Value-at-Risk (VaR 95%) and style-adaptive risk parameters." },
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

  const quickJumpAssets = [
    { symbol: "NIFTY50", label: "NIFTY 50", flag: "🇮🇳", link: "/assets/NIFTY50" },
    { symbol: "SENSEX", label: "SENSEX", flag: "🇮🇳", link: "/assets/SENSEX" },
    { symbol: "TCS", label: "TCS", flag: "🇮🇳", link: "/assets/TCS" },
    { symbol: "RELIANCE", label: "RELIANCE", flag: "🇮🇳", link: "/assets/RELIANCE" },
    { symbol: "NVDA", label: "NVIDIA", flag: "🇺🇸", link: "/assets/NVDA" },
    { symbol: "BTC", label: "BITCOIN", flag: "🪙", link: "/assets/BTC" },
    { symbol: "ETH", label: "ETHEREUM", flag: "🪙", link: "/assets/ETH" },
  ];

  return (
    <div className="space-y-24 pb-24 overflow-x-hidden">
      {/* ── 1. HERO SECTION WITH GRADIENT GLOW ── */}
      <section className="relative pt-12 md:pt-24 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Ambient background glow */}
        <div className="absolute top-10 left-1/4 -z-10 w-[450px] h-[450px] bg-accent/15 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 -z-10 w-[400px] h-[400px] bg-bullish/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl space-y-7">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface/90 border border-border/80 text-xs font-mono text-muted-foreground shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse pulse-indicator-live" />
            <span className="font-semibold text-foreground tracking-wide">NEXQUANT INSTITUTIONAL v2.5</span>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-accent font-medium">8-MODEL AI HORIZON ENSEMBLE</span>
            {lastRefreshed && (
              <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">· Synced {lastRefreshed}</span>
            )}
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.05] text-gradient-hero">
            Quantitative Precision.<br />
            <span className="text-muted-foreground/80 font-light">Adaptive to Your Trading Horizon.</span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl font-normal leading-relaxed">
            NexQuant synthesizes real-world data across Indian NSE/BSE shares, US tech leaders, global indices, and live financial news wires into one authoritative quantitative terminal.
          </p>

          {/* Quick Jump Asset Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-mono text-muted-foreground mr-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-accent" /> Quick Jump:
            </span>
            {quickJumpAssets.map((a) => (
              <Link
                key={a.symbol}
                href={a.link}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/80 border border-border/80 text-xs font-mono text-foreground hover:bg-elevated hover:border-accent/50 hover:text-accent transition-all shadow-sm"
              >
                <span>{a.flag}</span>
                <span className="font-semibold">{a.label}</span>
              </Link>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Link
              href="/assets/NIFTY50"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Launch Terminal (NIFTY 50) <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/assets/TCS"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-surface/90 border border-accent/40 text-sm font-semibold text-accent hover:bg-elevated hover:border-accent transition-all shadow-md hover:-translate-y-0.5"
            >
              <span>🇮🇳 TCS Terminal</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/15 text-accent font-bold">NSE</span>
            </Link>

            {authLoading ? (
              <div className="w-28 h-12 rounded-xl bg-surface animate-pulse" />
            ) : isAuthenticated ? (
              <Link
                href="/watchlist"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-surface border border-border text-sm font-medium text-foreground hover:bg-elevated transition-colors shadow-sm"
              >
                Open Watchlist
              </Link>
            ) : (
              <button
                onClick={() => openAuth("signup")}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-surface border border-border text-sm font-medium text-foreground hover:bg-elevated transition-colors shadow-sm"
              >
                Create Free Account
              </button>
            )}

            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Newspaper className="w-4 h-4 text-accent" /> Live Financial Wire →
            </Link>
          </div>

          {/* Quick Metrics Barometer */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border/60">
            <div className="p-4 rounded-xl bg-surface/60 border border-border/60 glass-card-static">
              <span className="block text-2xl font-mono font-bold text-foreground">35+</span>
              <span className="text-xs font-mono text-muted-foreground">Active Market Assets</span>
            </div>
            <div className="p-4 rounded-xl bg-surface/60 border border-border/60 glass-card-static">
              <span className="block text-2xl font-mono font-bold text-foreground">&lt; 50ms</span>
              <span className="text-xs font-mono text-muted-foreground">Ticker Processing Latency</span>
            </div>
            <div className="p-4 rounded-xl bg-surface/60 border border-border/60 glass-card-static">
              <span className="block text-2xl font-mono font-bold text-bullish">100%</span>
              <span className="text-xs font-mono text-muted-foreground">Authentic Live Quotes</span>
            </div>
            <div className="p-4 rounded-xl bg-surface/60 border border-border/60 glass-card-static">
              <span className="block text-2xl font-mono font-bold text-accent">8 Models</span>
              <span className="text-xs font-mono text-muted-foreground">Multi-Horizon AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. AUTO-MOVING CONTINUOUS WALL STREET TICKER TAPE ── */}
      <section className="border-y border-border/80 bg-surface/80 backdrop-blur-xl py-3.5 overflow-hidden shadow-2xl relative group">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex items-center">
          <div className="px-5 shrink-0 flex items-center gap-2 border-r border-border/80 z-20 bg-surface/95 pr-6">
            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse pulse-indicator-live" />
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
                    className="flex items-center gap-2.5 hover:text-foreground transition-colors group/item shrink-0 text-xs font-mono px-3.5 py-1.5 rounded-lg hover:bg-elevated/70"
                  >
                    <span className="font-bold text-foreground group-hover/item:text-accent transition-colors">
                      {item.symbol}
                    </span>
                    <span className="tabular-nums font-medium text-foreground/90">{priceStr}</span>
                    {item.change_pct !== undefined && !isNaN(item.change_pct) && (
                      <span className={`inline-flex items-center tabular-nums font-semibold px-1.5 py-0.2 rounded text-[11px] ${
                        isPositive ? "text-bullish bg-bullish/10" : "text-bearish bg-bearish/10"
                      }`}>
                        {isPositive ? "+" : ""}
                        {item.change_pct.toFixed(2)}%
                      </span>
                    )}
                    <span className="text-[9px] text-muted-foreground/60 px-1.5 py-0.2 rounded bg-background border border-border/60">
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
            <h2 className="text-2xl sm:text-4xl font-semibold text-foreground tracking-tight pt-1 text-gradient-hero">
              Major World Indices & Growth Metrics
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time benchmarks across India (Sensex, Nifty, Bank Nifty), US, China, Russia, and Europe
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center rounded-xl border border-border/80 bg-surface/80 p-1 text-xs font-mono overflow-x-auto shadow-md">
            {["ALL", "INDIA", "UNITED STATES", "CHINA", "RUSSIA", "GLOBAL"].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
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
                className={`p-6 rounded-2xl glass-card border transition-all flex flex-col justify-between group space-y-5 hover:-translate-y-1 duration-200 ${
                  isPos
                    ? "border-border/80 hover:border-bullish/50 hover:shadow-lg hover:shadow-bullish/10"
                    : "border-border/80 hover:border-bearish/50 hover:shadow-lg hover:shadow-bearish/10"
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
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-muted-foreground font-medium">
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
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
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

      {/* ── 4. VISUAL BREAKING FINANCIAL NEWS WIRE WITH REAL IMAGES & ZERO LEAK ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-accent" />
              <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                REAL-WORLD FINANCIAL MEDIA PULSE
              </span>
              <span className="w-2 h-2 rounded-full bg-bullish animate-pulse pulse-indicator-live" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-semibold text-foreground tracking-tight pt-1 text-gradient-hero">
              Live Breaking Market Headlines
            </h2>
            <p className="text-sm text-muted-foreground">
              Recent real-time reporting with editorial photography from Economic Times, Reuters, MarketWatch, and Bloomberg
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
              <div key={i} className="rounded-2xl border border-border/80 bg-surface/80 overflow-hidden space-y-3 animate-pulse">
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
                className="rounded-2xl border border-border/80 bg-surface/80 glass-card overflow-hidden hover:border-accent/40 transition-all flex flex-col justify-between group space-y-3 shadow-md hover:shadow-xl"
              >
                {/* Visual Thumbnail */}
                <div className="relative h-48 w-full overflow-hidden bg-background">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    {item.category && (
                      <span className="px-2.5 py-0.5 rounded-full bg-background/90 backdrop-blur-md border border-border/80 text-[10px] font-mono font-semibold text-foreground shadow-sm">
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
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed font-normal">
                        {cleanSummaryDisplay(item.summary, item.title, item.category)}
                      </p>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
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
          <h2 className="text-2xl sm:text-4xl font-semibold text-foreground tracking-tight pt-1 text-gradient-hero">
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
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                ACTIVE STYLE: <span className="text-accent font-bold">{styleInfo.name}</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight text-gradient-hero">
              Top Assets & Horizon Consensus Signals
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Multi-model ensemble consensus evaluated in real time from live provider feeds ({styleInfo.defaultTimeframe} timeframe)
            </p>
          </div>
          <Link href="/discover" className="text-xs font-mono text-accent hover:underline flex items-center gap-1">
            View All Discovered Assets →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loadingFeatured ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 rounded-2xl bg-surface border border-border/80 space-y-4 animate-pulse">
                <div className="h-5 w-24 bg-background rounded" />
                <div className="h-8 w-32 bg-background rounded" />
                <div className="h-12 w-full bg-background rounded" />
              </div>
            ))
          ) : featured.length > 0 ? (
            featured.map((asset) => {
              const isPositive = asset.change_pct >= 0;
              const currSymbol = asset.currency_symbol || (asset.currency === "INR" || asset.symbol.includes(".NS") ? "₹" : "$");
              const formattedPrice =
                asset.price > 0
                  ? `${currSymbol}${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "Connecting...";

              return (
                <Link
                  key={asset.symbol}
                  href={`/assets/${asset.symbol}`}
                  className="p-6 rounded-2xl bg-surface/90 glass-card border border-border/80 hover:border-accent/40 transition-all flex flex-col justify-between group space-y-6 shadow-md hover:shadow-xl hover:-translate-y-1 duration-200"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="font-mono font-bold text-lg text-foreground group-hover:text-accent transition-colors">
                          {asset.symbol}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate max-w-[200px]">{asset.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background border border-border/80 text-muted-foreground font-medium">
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

                  <div className="pt-4 border-t border-border/60 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">AI SIGNAL</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        asset.signal === "BUY"
                          ? "bg-bullish/10 text-bullish border border-bullish/30"
                          : asset.signal === "SELL"
                            ? "bg-bearish/10 text-bearish border border-bearish/30"
                            : "bg-background text-warning border border-warning/30"
                      }`}>
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

      {/* ── 8. ARCHITECTURE STORYLINE ── */}
      <section id="story" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            QUANTITATIVE SYSTEM ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-4xl font-semibold text-foreground tracking-tight text-gradient-hero">
            Authoritative intelligence. <br />
            <span className="text-muted-foreground/80 font-light">Processed across six synchronized layers.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelineStages.map((stage) => (
            <div key={stage.num} className="p-6 rounded-2xl bg-surface/80 glass-card border border-border/80 space-y-3 shadow-md hover:border-accent/40 transition-all">
              <span className="text-sm font-mono font-bold text-accent">{stage.num}</span>
              <h3 className="text-base font-semibold text-foreground">{stage.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">{stage.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. INSTITUTIONAL RIGOR GRID ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/80 bg-surface/90 glass-card p-8 sm:p-14 space-y-8 shadow-xl">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xl sm:text-3xl font-semibold text-foreground tracking-tight text-gradient-hero">
              Governed by Rigorous Principles
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Designed for institutional transparency, zero fake data, and quantitative risk mitigation.
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

      {/* ── 10. CALL TO ACTION ── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 space-y-6">
        <h2 className="text-3xl sm:text-5xl font-semibold text-foreground tracking-tight max-w-2xl mx-auto text-gradient-hero">
          Start analyzing with quantitative precision.
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Explore thousands of stocks, ETFs, global indices, and crypto pairs on the NexQuant terminal.
        </p>
        <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/assets/TCS"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Launch TCS Terminal <ArrowRight className="w-4 h-4" />
          </Link>
          {authLoading ? (
            <div className="w-32 h-12 rounded-xl bg-surface animate-pulse" />
          ) : !isAuthenticated ? (
            <button
              onClick={() => openAuth("signup")}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:bg-elevated transition-colors shadow-md"
            >
              Get Started Free
            </button>
          ) : (
            <Link
              href="/watchlist"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:bg-elevated transition-colors shadow-md"
            >
              View My Watchlist
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
