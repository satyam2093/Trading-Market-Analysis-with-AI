"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Compass, ArrowRight } from "lucide-react";
import { searchAssets } from "@/lib/api";
import type { AssetInfo } from "@/types/market";

const DEFAULT_POPULAR: AssetInfo[] = [
  { id: "NIFTY50", symbol: "NIFTY50", name: "NIFTY 50 Index", asset_type: "INDEX", exchange: "NSE", country: "India", currency: "INR" },
  { id: "SENSEX", symbol: "SENSEX", name: "BSE SENSEX 30", asset_type: "INDEX", exchange: "BSE", country: "India", currency: "INR" },
  { id: "BANKNIFTY", symbol: "BANKNIFTY", name: "NIFTY Bank Index", asset_type: "INDEX", exchange: "NSE", country: "India", currency: "INR" },
  { id: "TCS", symbol: "TCS", name: "Tata Consultancy Services", asset_type: "STOCK", exchange: "NSE", country: "India", currency: "INR" },
  { id: "RELIANCE", symbol: "RELIANCE", name: "Reliance Industries Ltd.", asset_type: "STOCK", exchange: "NSE", country: "India", currency: "INR" },
  { id: "SP500", symbol: "SP500", name: "S&P 500 Index", asset_type: "INDEX", exchange: "SNP", country: "United States", currency: "USD" },
  { id: "NASDAQ", symbol: "NASDAQ", name: "NASDAQ Composite", asset_type: "INDEX", exchange: "NASDAQ", country: "United States", currency: "USD" },
  { id: "DOW", symbol: "DOW", name: "Dow Jones Industrial Average", asset_type: "INDEX", exchange: "DJI", country: "United States", currency: "USD" },
  { id: "SHANGHAI", symbol: "SHANGHAI", name: "Shanghai Composite Index", asset_type: "INDEX", exchange: "SSE", country: "China", currency: "CNY" },
  { id: "HANGSENG", symbol: "HANGSENG", name: "Hang Seng Index", asset_type: "INDEX", exchange: "HKEX", country: "China", currency: "HKD" },
  { id: "MOEX", symbol: "MOEX", name: "MOEX Russia Index", asset_type: "INDEX", exchange: "MCX", country: "Russia", currency: "RUB" },
  { id: "NVDA", symbol: "NVDA", name: "NVIDIA Corporation", asset_type: "STOCK", exchange: "NASDAQ", country: "United States", currency: "USD" },
  { id: "AAPL", symbol: "AAPL", name: "Apple Inc.", asset_type: "STOCK", exchange: "NASDAQ", country: "United States", currency: "USD" },
  { id: "BTC", symbol: "BTC", name: "Bitcoin", asset_type: "CRYPTO", exchange: "BINANCE", country: "Global", currency: "USD" },
  { id: "ETH", symbol: "ETH", name: "Ethereum", asset_type: "CRYPTO", exchange: "BINANCE", country: "Global", currency: "USD" },
];

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [assets, setAssets] = useState<AssetInfo[]>(DEFAULT_POPULAR);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    searchAssets(query, typeFilter, 60).then((res) => {
      if (active) {
        if (res?.assets && res.assets.length > 0) {
          setAssets(res.assets);
        } else if (!query) {
          setAssets(DEFAULT_POPULAR);
        } else {
          setAssets([]);
        }
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [query, typeFilter]);

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
            Search dynamically across Indian equities, US tech leaders, global indices (Sensex, Nifty, Bank Nifty), and cryptocurrencies
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
            placeholder="Search by ticker symbol or company name (e.g. TCS, NIFTY, SENSEX, RELIANCE, NVDA)..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground font-mono"
          />
        </div>

        <div className="flex items-center rounded border border-border bg-surface p-1 text-xs font-mono w-full sm:w-auto">
          {["ALL", "INDEX", "STOCK", "CRYPTO", "ETF"].map((t) => (
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
        {loading && assets.length === 0 ? (
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl bg-surface border border-border space-y-3 animate-pulse">
              <div className="h-5 w-20 bg-background rounded" />
              <div className="h-4 w-40 bg-background rounded" />
              <div className="h-3 w-28 bg-background rounded" />
            </div>
          ))
        ) : assets.length > 0 ? (
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
                    {asset.asset_type || (asset as any).assetType || "ASSET"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                  {asset.name}
                </p>
                <span className="text-[11px] font-mono text-muted-foreground/70 block">
                  {asset.exchange} • {asset.currency || (asset.exchange === "NSE" ? "INR" : "USD")}
                </span>
              </div>

              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          ))
        ) : (
          <div className="col-span-full p-8 text-center bg-surface rounded-xl border border-border space-y-3">
            <p className="text-sm text-muted-foreground">
              No discovered assets matching filter &ldquo;{query}&rdquo;.
            </p>
            {query.trim() && (
              <Link
                href={`/assets/${query.trim().toUpperCase()}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-mono font-medium hover:bg-foreground/90 transition-colors"
              >
                Launch Direct Terminal for &ldquo;{query.trim().toUpperCase()}&rdquo; <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
