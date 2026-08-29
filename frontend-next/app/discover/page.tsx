"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Compass, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { searchAssets } from "@/lib/api";
import type { AssetInfo } from "@/types/market";

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    searchAssets(query, typeFilter, 50).then((res) => {
      if (active) {
        setAssets(res?.assets || []);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [query, typeFilter]);

  const defaultTrending = [
    { symbol: "BTC", name: "Bitcoin", exchange: "BINANCE", asset_type: "CRYPTO", price: "$108,421.32", change: "+2.31%", signal: "BUY" },
    { symbol: "NVDA", name: "NVIDIA Corp", exchange: "NASDAQ", asset_type: "STOCK", price: "$128.50", change: "+1.85%", signal: "BUY" },
    { symbol: "RELIANCE.NS", name: "Reliance Industries", exchange: "NSE", asset_type: "STOCK", price: "₹2,980.40", change: "+0.82%", signal: "BUY" },
    { symbol: "ETH", name: "Ethereum", exchange: "BINANCE", asset_type: "CRYPTO", price: "$3,450.80", change: "+2.65%", signal: "BUY" },
    { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", asset_type: "STOCK", price: "$224.20", change: "+0.45%", signal: "HOLD" },
    { symbol: "TCS.NS", name: "Tata Consultancy Services", exchange: "NSE", asset_type: "STOCK", price: "₹4,120.10", change: "+0.32%", signal: "BUY" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              MARKET UNIVERSE
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-normal text-foreground tracking-tight">
            Discover & Screen Assets
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Search dynamically across US equities, Indian NSE shares, cryptocurrencies, and index ETFs
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ticker symbol or company name (e.g. BTC, RELIANCE, NVDA)..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground"
          />
        </div>

        <div className="flex items-center rounded border border-border bg-surface p-1 text-xs font-mono w-full sm:w-auto">
          {["ALL", "STOCK", "CRYPTO", "ETF", "INDEX"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded transition-colors flex-1 sm:flex-initial ${
                typeFilter === t
                  ? "bg-elevated text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.length > 0 ? (
          assets.map((asset) => (
            <Link
              key={asset.id || asset.symbol}
              href={`/assets/${asset.symbol}`}
              className="p-5 rounded-xl bg-surface border border-border hover:border-muted-foreground/40 transition-all flex items-center justify-between group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-foreground group-hover:text-accent transition-colors">
                    {asset.symbol}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                    {asset.asset_type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {asset.name}
                </p>
                <span className="text-[11px] font-mono text-muted-foreground/70 block">
                  {asset.exchange} • {asset.country}
                </span>
              </div>

              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          ))
        ) : (
          defaultTrending.map((asset) => (
            <Link
              key={asset.symbol}
              href={`/assets/${asset.symbol}`}
              className="p-5 rounded-xl bg-surface border border-border hover:border-muted-foreground/40 transition-all flex items-center justify-between group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-foreground group-hover:text-accent transition-colors">
                    {asset.symbol}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                    {asset.asset_type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{asset.name}</p>
                <div className="flex items-center gap-2 text-xs font-mono pt-1">
                  <span className="text-foreground font-semibold">{asset.price}</span>
                  <span className="text-bullish">{asset.change}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-bullish/10 text-bullish border border-bullish/20">
                  {asset.signal}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
