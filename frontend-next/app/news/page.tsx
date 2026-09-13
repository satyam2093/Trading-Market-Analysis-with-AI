"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, ExternalLink, RefreshCw, Search, ArrowRight, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { fetchNews, fetchMarketNews } from "@/lib/api";

interface NewsArticle {
  id?: string;
  title: string;
  source: string;
  published: string;
  url: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  impact?: "HIGH" | "MEDIUM" | "LOW";
  summary?: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSymbol, setActiveSymbol] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const loadNews = async (symbolQuery?: string) => {
    try {
      setIsRefreshing(true);
      const res = symbolQuery && symbolQuery.trim()
        ? await fetchNews(symbolQuery.trim(), 30)
        : await fetchMarketNews(35);

      if (res?.articles && Array.isArray(res.articles)) {
        setNews(
          res.articles.map((a: any) => ({
            id: a.id || a.title,
            title: a.title || "Untitled Financial Event",
            source: a.source || "Financial Wire",
            published: a.published || "Recently",
            url: a.url || "#",
            sentiment: normalizeSentiment(a.sentiment),
            impact: a.impact || "MEDIUM",
            summary: a.summary || "",
          }))
        );
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Failed to load real-time financial news:", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews(activeSymbol);

    // Auto-update real-time news every 60 seconds
    const interval = setInterval(() => {
      loadNews(activeSymbol);
    }, 60000);

    return () => clearInterval(interval);
  }, [activeSymbol]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSymbol(searchQuery);
    setLoading(true);
    loadNews(searchQuery);
  };

  const filteredNews = news.filter((item) => {
    const matchesSentiment =
      filter === "ALL"
        ? true
        : filter === "POSITIVE"
          ? item.sentiment === "POSITIVE"
          : filter === "NEGATIVE"
            ? item.sentiment === "NEGATIVE"
            : item.sentiment === "NEUTRAL";

    return matchesSentiment;
  });

  const popularTopics = ["All Markets", "NIFTY", "SENSEX", "BANKNIFTY", "FED", "TCS", "RELIANCE", "BITCOIN", "CRUDE OIL"];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              REAL-TIME FINANCIAL INTELLIGENCE WIRE
            </span>
            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-normal text-foreground tracking-tight">
            Financial News & Market Sentiment
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Live breaking macroeconomic reports, corporate disclosures, and global central bank developments
          </p>
        </div>

        {/* Live Refresh Status */}
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
              Updated {lastUpdated}
            </span>
          )}
          <button
            onClick={() => loadNews(activeSymbol)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border text-xs font-mono text-foreground hover:bg-elevated transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-accent" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh Live Feed"}</span>
          </button>
        </div>
      </div>

      {/* Topic Filter Chips & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Quick Topic Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {popularTopics.map((topic) => {
            const isAll = topic === "All Markets";
            const isSelected = (isAll && !activeSymbol) || activeSymbol.toUpperCase() === topic.toUpperCase();
            return (
              <button
                key={topic}
                onClick={() => {
                  const val = isAll ? "" : topic;
                  setActiveSymbol(val);
                  setSearchQuery(val);
                  setLoading(true);
                  loadNews(val);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap border transition-all ${
                  isSelected
                    ? "bg-foreground text-background border-foreground font-semibold"
                    : "bg-surface text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/50"
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>

        {/* Custom Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword (e.g. GDP, Tariff)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-mono font-medium hover:bg-foreground/90 transition-colors shrink-0"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Sentiment Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
          <Activity className="w-3.5 h-3.5 text-accent" />
          <span>Active Feed:</span>
          <span className="font-semibold text-foreground">
            {activeSymbol ? `Filtered for "${activeSymbol}"` : "Global Financial Markets"}
          </span>
          <span className="text-muted-foreground/60">({filteredNews.length} articles)</span>
        </div>

        <div className="flex items-center rounded border border-border bg-surface p-1 text-xs font-mono">
          {["ALL", "POSITIVE", "NEUTRAL", "NEGATIVE"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === f
                  ? "bg-elevated text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* News Feed Grid */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-surface border border-border space-y-3 animate-pulse">
              <div className="h-5 w-3/4 bg-background rounded" />
              <div className="h-3 w-1/4 bg-background rounded" />
              <div className="h-3 w-1/2 bg-background rounded" />
            </div>
          ))
        ) : filteredNews.length > 0 ? (
          filteredNews.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl bg-surface border border-border hover:border-muted-foreground/40 transition-all space-y-3 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 max-w-4xl">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-semibold text-foreground group-hover:text-accent transition-colors leading-snug flex items-baseline gap-1.5"
                  >
                    <span>{item.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 inline" />
                  </a>

                  <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground pt-0.5">
                    <span className="font-semibold text-foreground/90">{item.source}</span>
                    <span>•</span>
                    <span>{item.published}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold border ${
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
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-muted-foreground hidden sm:inline">
                      {item.impact} IMPACT
                    </span>
                  )}
                </div>
              </div>

              {item.summary && (
                <p className="text-xs text-muted-foreground leading-relaxed pt-1 max-w-4xl">
                  {item.summary}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 rounded-xl bg-surface border border-border text-center space-y-4">
            <Newspaper className="w-8 h-8 text-muted-foreground mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">No articles matching current filter</p>
              <p className="text-xs text-muted-foreground">
                Try resetting sentiment filters or clearing the search keyword.
              </p>
            </div>
            <button
              onClick={() => {
                setFilter("ALL");
                setActiveSymbol("");
                setSearchQuery("");
                loadNews("");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-xs font-mono font-semibold hover:bg-foreground/90 transition-colors"
            >
              Reset to Global Wire
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeSentiment(raw: string | undefined): "POSITIVE" | "NEGATIVE" | "NEUTRAL" {
  if (!raw) return "NEUTRAL";
  const upper = raw.toUpperCase();
  if (upper === "POSITIVE" || upper === "BULLISH") return "POSITIVE";
  if (upper === "NEGATIVE" || upper === "BEARISH") return "NEGATIVE";
  return "NEUTRAL";
}
