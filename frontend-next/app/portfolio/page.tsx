"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PieChart, TrendingUp, ShieldCheck, ArrowUpRight } from "lucide-react";
import { fetchFeaturedAssets } from "@/lib/api";

export default function PortfolioPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulated holdings units
  const holdingsConfig: Record<string, { units: number; costBasis: number; alloc: string }> = {
    BTC: { units: 0.7, costBasis: 68000, alloc: "35%" },
    NVDA: { units: 175, costBasis: 185, alloc: "25%" },
    RELIANCE: { units: 25, costBasis: 1200, alloc: "20%" },
    ETH: { units: 12, costBasis: 2300, alloc: "20%" },
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchFeaturedAssets().then((res) => {
      if (active && res?.assets) {
        const livePositions = Object.entries(holdingsConfig).map(([sym, cfg]) => {
          const assetData = res.assets.find((a: any) => a.symbol === sym || a.symbol.startsWith(sym));
          const currentPrice = assetData?.price && assetData.price > 0 ? assetData.price : cfg.costBasis;
          const posVal = currentPrice * cfg.units;
          const costVal = cfg.costBasis * cfg.units;
          const pnl = posVal - costVal;
          const pnlPct = (pnl / costVal) * 100;
          const currSym = assetData?.currency_symbol || (sym.includes("RELIANCE") ? "₹" : "$");

          return {
            symbol: sym,
            name: assetData?.name || sym,
            allocation: cfg.alloc,
            currentPrice,
            value: `${currSym}${posVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            profit: `${pnl >= 0 ? "+" : ""}${currSym}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pnl >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%)`,
            isProfit: pnl >= 0,
            status: assetData?.regime || "BULLISH",
            currencySymbol: currSym,
          };
        });
        setPositions(livePositions);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              QUANTITATIVE PORTFOLIO
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-normal text-foreground tracking-tight">
            Portfolio Risk & Allocation
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Multi-asset exposure analytics, value-at-risk profiling, and diversification health
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-6 rounded-xl bg-surface border border-border space-y-1">
          <span className="text-xs text-muted-foreground">TOTAL PORTFOLIO VALUE</span>
          <div className="text-2xl font-semibold text-foreground">$154,890.66</div>
          <span className="text-xs text-bullish flex items-center gap-1 pt-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% (All Time)
          </span>
        </div>

        <div className="p-6 rounded-xl bg-surface border border-border space-y-1">
          <span className="text-xs text-muted-foreground">PORTFOLIO VAR (95% 1-DAY)</span>
          <div className="text-2xl font-semibold text-foreground">$3,872.00</div>
          <span className="text-xs text-muted-foreground">Within Target Range (2.5%)</span>
        </div>

        <div className="p-6 rounded-xl bg-surface border border-border space-y-1">
          <span className="text-xs text-muted-foreground">SHARPE RATIO</span>
          <div className="text-2xl font-semibold text-foreground">2.42</div>
          <span className="text-xs text-bullish">Institutional Grade Risk-Adjusted</span>
        </div>
      </div>

      {/* Positions Table */}
      <div className="rounded-xl bg-surface border border-border overflow-hidden">
        <div className="p-4 border-b border-border text-xs font-mono font-semibold text-foreground uppercase">
          Allocated Holdings
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-background/50">
                <th className="p-4 font-semibold">ASSET</th>
                <th className="p-4 font-semibold">ALLOCATION</th>
                <th className="p-4 font-semibold">POSITION VALUE</th>
                <th className="p-4 font-semibold">UNREALIZED P&L</th>
                <th className="p-4 font-semibold text-right">REGIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground font-mono animate-pulse">
                    Calculating live portfolio allocations & risk profiles...
                  </td>
                </tr>
              ) : (
                positions.map((p) => (
                  <tr key={p.symbol} className="hover:bg-elevated/40 transition-colors">
                    <td className="p-4 font-medium text-foreground">
                      <Link href={`/assets/${p.symbol}`} className="hover:text-accent flex items-center gap-1.5">
                        <span className="font-bold">{p.symbol}</span>{" "}
                        <span className="text-muted-foreground text-[11px]">({p.name})</span>
                      </Link>
                    </td>
                    <td className="p-4 text-foreground font-semibold">{p.allocation}</td>
                    <td className="p-4 text-foreground tabular-nums">{p.value}</td>
                    <td className={`p-4 tabular-nums ${p.isProfit ? "text-bullish" : "text-bearish"}`}>{p.profit}</td>
                    <td className="p-4 text-right">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          p.status === "BULLISH"
                            ? "text-bullish bg-bullish/10 border-bullish/20"
                            : p.status === "BEARISH"
                            ? "text-bearish bg-bearish/10 border-bearish/20"
                            : "text-warning bg-warning/10 border-warning/20"
                        }`}
                      >
                        {p.status}
                      </span>
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
