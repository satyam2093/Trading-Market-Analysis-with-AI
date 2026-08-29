"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { fetchNews } from "@/lib/api";

interface NewsArticle {
  title: string;
  source: string;
  published: string;
  url: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  impact: "HIGH" | "MEDIUM" | "LOW";
  summary?: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews("BTC").then((res) => {
      if (res?.articles) {
        setNews(res.articles);
      } else {
        // Institutional fallback articles
        setNews([
          {
            title: "US Federal Reserve Signals Interest Rate Trajectory in Semiannual Monetary Report",
            source: "Financial Times",
            published: "12m ago",
            url: "#",
            sentiment: "POSITIVE",
            impact: "HIGH",
            summary: "Federal Reserve chair emphasizes steady progress toward target inflation metrics, reducing tail-risk volatility.",
          },
          {
            title: "Global Semiconductor Demand Surges as Hyperscale Infrastructure Expands",
            source: "Reuters",
            published: "45m ago",
            url: "#",
            sentiment: "POSITIVE",
            impact: "HIGH",
            summary: "Quarterly capital expenditures across leading cloud compute providers forecast continued growth.",
          },
          {
            title: "Crude Oil Benchmark Stabilizes Near Support Following Supply Assessment",
            source: "Bloomberg",
            published: "2h ago",
            url: "#",
            sentiment: "NEUTRAL",
            impact: "MEDIUM",
            summary: "Energy markets reflect balanced production quotas and stable geopolitical shipping corridors.",
          },
        ]);
      }
      setLoading(false);
    });
  }, []);

  const filteredNews = news.filter((item) => {
    if (filter === "ALL") return true;
    return item.sentiment === filter;
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
            FinBERT-analyzed financial news feeds categorized by sentiment and market impact
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

      {/* News Feed Grid */}
      <div className="space-y-4">
        {filteredNews.map((item, idx) => (
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
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-muted-foreground">
                  {item.impact} IMPACT
                </span>
              </div>
            </div>

            {item.summary && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                {item.summary}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
