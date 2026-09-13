"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { fetchNews } from "@/lib/api";

interface NewsArticle {
  title: string;
  source: string;
  published: string;
  url: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "BULLISH" | "BEARISH";
  impact?: "HIGH" | "MEDIUM" | "LOW";
  summary?: string;
  score?: number;
  published_at?: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchNews("BTC")
      .then((res) => {
        if (mounted) {
          if (res?.articles && Array.isArray(res.articles) && res.articles.length > 0) {
            setNews(
              res.articles.map((a: any) => ({
                title: a.title || "Untitled",
                source: a.source || "Market Intelligence",
                published: a.published || a.published_at || "",
                url: a.url || "#",
                sentiment: normalizeSentiment(a.sentiment),
                impact: a.impact || "MEDIUM",
                summary: a.summary || "",
                score: a.score,
              }))
            );
          }
          // No fake fallback — if no articles, leave array empty
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredNews = news.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "POSITIVE") return item.sentiment === "POSITIVE" || item.sentiment === "BULLISH";
    if (filter === "NEGATIVE") return item.sentiment === "NEGATIVE" || item.sentiment === "BEARISH";
    return item.sentiment === "NEUTRAL";
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              NATURAL LANGUAGE INTELLIGENCE
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-normal text-foreground tracking-tight">
            Financial News & Sentiment
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            News feeds analyzed for sentiment and market impact
          </p>
        </div>

        {/* Sentiment Filter Tabs */}
        <div className="flex items-center rounded border border-border bg-surface p-1 text-xs font-mono">
          {["ALL", "POSITIVE", "NEUTRAL", "NEGATIVE"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded transition-colors ${
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

      {/* News Feed */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-surface border border-border space-y-3 animate-pulse">
              <div className="h-5 w-3/4 bg-background rounded" />
              <div className="h-3 w-1/3 bg-background rounded" />
              <div className="h-3 w-1/2 bg-background rounded" />
            </div>
          ))
        ) : filteredNews.length > 0 ? (
          filteredNews.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl bg-surface border border-border hover:border-muted-foreground/30 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 max-w-3xl">
                  <h3 className="text-base font-semibold text-foreground leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.source}</span>
                    {item.published && (
                      <>
                        <span>•</span>
                        <span>{item.published}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold border ${
                      item.sentiment === "POSITIVE" || item.sentiment === "BULLISH"
                        ? "bg-bullish/10 text-bullish border-bullish/30"
                        : item.sentiment === "NEGATIVE" || item.sentiment === "BEARISH"
                        ? "bg-bearish/10 text-bearish border-bearish/30"
                        : "bg-background text-muted-foreground border-border"
                    }`}
                  >
                    {item.sentiment}
                  </span>
                  {item.impact && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-muted-foreground">
                      {item.impact} IMPACT
                    </span>
                  )}
                </div>
              </div>

              {item.summary && (
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  {item.summary}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 rounded-xl bg-surface border border-border text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">No news articles available</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                News sentiment analysis requires a live news API connection. Visit individual asset terminal pages 
                for asset-specific market intelligence.
              </p>
            </div>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-xs font-mono font-semibold hover:bg-foreground/90 transition-colors"
            >
              Explore Assets
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeSentiment(raw: string | undefined): "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "BULLISH" | "BEARISH" {
  if (!raw) return "NEUTRAL";
  const upper = raw.toUpperCase();
  if (upper === "POSITIVE" || upper === "BULLISH") return "POSITIVE";
  if (upper === "NEGATIVE" || upper === "BEARISH") return "NEGATIVE";
  return "NEUTRAL";
}
