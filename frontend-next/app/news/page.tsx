"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  Search,
  Activity,
  Flame,
  Globe2,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
} from "lucide-react";
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
  image_url: string;
  category?: string;
}

function cleanSummaryDisplay(summary?: string, title?: string, category?: string): string {
  if (!summary) {
    return "Executive financial market intelligence covering " + (category || "market movements") + ". Quantitative tracking active across institutional feeds.";
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

  // If after stripping, it still looks like an HTML tag, link, or RSS noise, replace with clean digest
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
    return "Executive market coverage on " + (category || "benchmark equities") + " and macroeconomic catalysts affecting intraday sentiment and sector rotations.";
  }

  if (clean.length > 220) {
    const trimmed = clean.slice(0, 215);
    const lastSpace = trimmed.lastIndexOf(" ");
    return (lastSpace > 100 ? trimmed.slice(0, lastSpace) : trimmed) + "...";
  }

  return clean;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const loadNews = async (query?: string) => {
    try {
      setIsRefreshing(true);
      const res = query && query.trim()
        ? await fetchNews(query.trim(), 30)
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
            summary: cleanSummaryDisplay(a.summary, a.title, a.category),
            image_url:
              a.image_url ||
              "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&auto=format&fit=crop&q=80",
            category: a.category || "Financial Markets",
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
    loadNews(activeTopic);

    // Auto-update real-time news every 45 seconds
    const interval = setInterval(() => {
      loadNews(activeTopic);
    }, 45000);

    return () => clearInterval(interval);
  }, [activeTopic]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTopic(searchQuery);
    setLoading(true);
    loadNews(searchQuery);
  };

  const filteredNews = news.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "POSITIVE") return item.sentiment === "POSITIVE";
    if (filter === "NEGATIVE") return item.sentiment === "NEGATIVE";
    return item.sentiment === "NEUTRAL";
  });

  const featuredStory = filteredNews[0];
  const gridStories = filteredNews.slice(1);

  const quickTopics = [
    { label: "All Markets", val: "" },
    { label: "🇮🇳 NIFTY & SENSEX", val: "nifty sensex india" },
    { label: "🏛️ Fed & Rates", val: "fed interest rates" },
    { label: "⚡ Tech & AI", val: "nvidia ai tech semiconductor" },
    { label: "🪙 Crypto & Bitcoin", val: "bitcoin crypto" },
    { label: "🛢️ Crude & Energy", val: "crude oil energy" },
    { label: "📊 Corporate Earnings", val: "earnings revenue" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* ── 1. HEADER & LIVE STATUS ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/80">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              NEXQUANT GLOBAL NEWS WIRE
            </span>
            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse pulse-indicator-live" />
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface border border-bullish/30 text-bullish font-semibold">
              LIVE FEEDS
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold text-foreground tracking-tight text-gradient-hero">
            Financial News & Media Intelligence
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
            Real-world macroeconomic reporting, central bank announcements, and earnings disclosures with AI-evaluated sentiment.
          </p>
        </div>

        {/* Live Refresh Button */}
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
              Updated {lastUpdated}
            </span>
          )}
          <button
            onClick={() => loadNews(activeTopic)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border text-xs font-mono text-foreground hover:bg-elevated hover:border-accent/40 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={"w-3.5 h-3.5 " + (isRefreshing ? "animate-spin text-accent" : "")} />
            <span>{isRefreshing ? "Syncing..." : "Sync Live Wire"}</span>
          </button>
        </div>
      </div>

      {/* ── 2. QUICK TOPIC CHIPS & KEYWORD SEARCH ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Quick Topics */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {quickTopics.map((topic) => {
            const isSelected = activeTopic === topic.val;
            return (
              <button
                key={topic.label}
                onClick={() => {
                  setActiveTopic(topic.val);
                  setSearchQuery(topic.val ? topic.label : "");
                  setLoading(true);
                  loadNews(topic.val);
                }}
                className={"px-4 py-2 rounded-full text-xs font-mono whitespace-nowrap border transition-all " +
                  (isSelected
                    ? "bg-foreground text-background border-foreground font-semibold shadow-md"
                    : "bg-surface/80 text-muted-foreground border-border hover:text-foreground hover:border-accent/40 hover:bg-elevated")
                }
              >
                {topic.label}
              </button>
            );
          })}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker, company, or event..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent font-mono transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-mono font-medium hover:bg-foreground/90 transition-colors shrink-0 shadow-sm"
          >
            Filter
          </button>
        </form>
      </div>

      {/* ── 3. FILTER TABS & ACTIVE FEED LABEL ── */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Activity className="w-3.5 h-3.5 text-accent" />
          <span>Active Wire:</span>
          <span className="font-semibold text-foreground">
            {activeTopic ? `"${activeTopic}"` : "Global Financial Markets"}
          </span>
          <span className="text-muted-foreground/60">({filteredNews.length} articles)</span>
        </div>

        <div className="flex items-center rounded-lg border border-border bg-surface/80 p-1 text-xs font-mono">
          {["ALL", "POSITIVE", "NEUTRAL", "NEGATIVE"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={"px-3 py-1 rounded-md transition-colors " +
                (filter === f
                  ? "bg-elevated text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. FEATURED HERO STORY (TOP OF PAGE) ── */}
      {!loading && featuredStory && (
        <div className="rounded-2xl border border-border/80 bg-surface/90 glass-card overflow-hidden hover:border-accent/40 transition-all group">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Image Column */}
            <div className="lg:col-span-7 relative h-[280px] sm:h-[360px] lg:h-[420px] overflow-hidden bg-background">
              <img
                src={featuredStory.image_url}
                alt={featuredStory.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent lg:hidden" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-background/85 backdrop-blur-md border border-border/80 text-[11px] font-mono font-semibold text-foreground flex items-center gap-1.5 shadow-md">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> TOP STORY
                </span>
                {featuredStory.category && (
                  <span className="px-3 py-1 rounded-full bg-accent/90 backdrop-blur-md text-white text-[11px] font-mono font-semibold shadow-md">
                    {featuredStory.category}
                  </span>
                )}
              </div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="font-semibold text-foreground text-sm">{featuredStory.source}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {featuredStory.published}
                  </span>
                </div>

                <a
                  href={featuredStory.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xl sm:text-2xl font-semibold text-foreground group-hover:text-accent transition-colors leading-snug"
                >
                  {featuredStory.title}
                </a>

                {featuredStory.summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 font-normal">
                    {cleanSummaryDisplay(featuredStory.summary, featuredStory.title, featuredStory.category)}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={"px-3 py-1 rounded-full text-xs font-mono font-semibold border " +
                      (featuredStory.sentiment === "POSITIVE"
                        ? "bg-bullish/10 text-bullish border-bullish/30"
                        : featuredStory.sentiment === "NEGATIVE"
                          ? "bg-bearish/10 text-bearish border-bearish/30"
                          : "bg-background text-muted-foreground border-border")
                    }
                  >
                    {featuredStory.sentiment}
                  </span>
                  {featuredStory.impact && (
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-background border border-border text-muted-foreground">
                      {featuredStory.impact} IMPACT
                    </span>
                  )}
                </div>

                <a
                  href={featuredStory.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-accent hover:underline"
                >
                  <span>Read Story</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. MAGAZINE CARD GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/80 bg-surface/80 overflow-hidden space-y-3 animate-pulse">
              <div className="h-48 bg-background" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-1/3 bg-background rounded" />
                <div className="h-6 w-full bg-background rounded" />
                <div className="h-10 w-full bg-background rounded" />
              </div>
            </div>
          ))
        ) : gridStories.length > 0 ? (
          gridStories.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border/80 bg-surface/80 glass-card overflow-hidden hover:border-accent/40 transition-all flex flex-col justify-between group space-y-4 shadow-md hover:shadow-xl"
            >
              {/* Thumbnail with overlay tags */}
              <div className="relative h-48 w-full overflow-hidden bg-background">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  {item.category && (
                    <span className="px-2.5 py-0.5 rounded-full bg-background/90 backdrop-blur-md border border-border/80 text-[10px] font-mono font-semibold text-foreground">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-white drop-shadow">
                  <span className="font-semibold">{item.source}</span>
                  <span>{item.published}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
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

                {/* Footer metadata */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                  <span
                    className={"px-2.5 py-0.5 rounded-full text-[10px] font-semibold border " +
                      (item.sentiment === "POSITIVE"
                        ? "bg-bullish/10 text-bullish border-bullish/30"
                        : item.sentiment === "NEGATIVE"
                          ? "bg-bearish/10 text-bearish border-bearish/30"
                          : "bg-background text-muted-foreground border-border")
                    }
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
          <div className="col-span-full p-12 rounded-2xl bg-surface border border-border text-center space-y-4">
            <Newspaper className="w-10 h-10 text-muted-foreground mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">No articles match current filters</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Try switching the sentiment filter to ALL or clearing your search term.
              </p>
            </div>
            <button
              onClick={() => {
                setFilter("ALL");
                setActiveTopic("");
                setSearchQuery("");
                loadNews("");
              }}
              className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-mono font-semibold hover:bg-foreground/90 transition-colors shadow-sm"
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
