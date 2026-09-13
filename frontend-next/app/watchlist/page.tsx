"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, TrendingUp, TrendingDown, Trash2, Plus, ArrowUpRight } from "lucide-react";
import { fetchFeaturedAssets, removeFromWatchlist } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchFeaturedAssets().then((res) => {
      if (active) {
        if (res?.assets && res.assets.length > 0) {
          setWatchlist(
            res.assets.map((a: any) => ({
              symbol: a.symbol,
              name: a.name,
              price: a.price,
              changePct: a.change_pct,
              regime: a.regime,
              signal: a.signal,
              risk: a.risk_level,
              currency: a.currency,
              currency_symbol: a.currency_symbol || (a.currency === "INR" ? "₹" : "$"),
              data_status: a.data_status,
            }))
          );
        }
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleRemove = (symbol: string) => {
    setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
    removeFromWatchlist(symbol);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              PORTFOLIO MONITORING
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-normal text-foreground tracking-tight">
            Institutional Watchlist
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track key assets with live price updates and real-time quantitative signal consensus
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-xs font-mono font-semibold hover:bg-foreground/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Asset
        </Link>
      </div>

      {/* Watchlist Table */}
      <div className="rounded-xl bg-surface border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-background/50">
                <th className="p-4 font-semibold">ASSET</th>
                <th className="p-4 font-semibold">LAST PRICE</th>
                <th className="p-4 font-semibold">24H CHANGE</th>
                <th className="p-4 font-semibold">MARKET REGIME</th>
                <th className="p-4 font-semibold">AI SIGNAL</th>
                <th className="p-4 font-semibold">RISK LEVEL</th>
                <th className="p-4 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground font-mono animate-pulse">
                    Connecting to live institutional feeds...
                  </td>
                </tr>
              ) : watchlist.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground font-mono">
                    No assets currently in watchlist.
                  </td>
                </tr>
              ) : (
                watchlist.map((item) => (
                  <tr key={item.symbol} className="hover:bg-elevated/40 transition-colors">
                    <td className="p-4 font-medium text-foreground">
                      <Link href={`/assets/${item.symbol}`} className="hover:text-accent flex items-center gap-1.5">
                        <span className="font-bold">{item.symbol}</span>
                        <span className="text-muted-foreground text-[11px]">({item.name})</span>
                      </Link>
                    </td>
                    <td className="p-4 text-foreground font-semibold tabular-nums">
                      {item.price !== null && item.price > 0
                        ? `${item.currency_symbol || "$"}${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "Price unavailable"}
                    </td>
                    <td className="p-4 tabular-nums">
                      {item.changePct !== undefined && !isNaN(item.changePct) ? (
                        <span className={`inline-flex items-center gap-1 ${item.changePct >= 0 ? "text-bullish" : "text-bearish"}`}>
                          {item.changePct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {item.changePct >= 0 ? "+" : ""}{item.changePct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 text-foreground">{item.regime}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          item.signal === "BUY"
                            ? "bg-bullish/10 text-bullish border-bullish/20"
                            : item.signal === "SELL"
                            ? "bg-bearish/10 text-bearish border-bearish/20"
                            : "bg-background text-muted-foreground border-border"
                        }`}
                      >
                        {item.signal}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{item.risk}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRemove(item.symbol)}
                        className="p-1 text-muted-foreground hover:text-bearish transition-colors"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
