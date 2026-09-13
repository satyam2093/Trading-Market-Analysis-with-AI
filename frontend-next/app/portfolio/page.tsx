"use client";

import Link from "next/link";
import { PieChart, Link2, ArrowRight, ShieldAlert } from "lucide-react";

export default function PortfolioPage() {
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

      {/* Connect Portfolio Card */}
      <div className="rounded-2xl border border-border bg-surface p-8 sm:p-14 text-center space-y-6 max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center mx-auto">
          <Link2 className="w-7 h-7 text-muted-foreground" />
        </div>

        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            Connect Your Portfolio
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Portfolio tracking requires a connection to your brokerage or demat account.
            This feature is currently under development.
          </p>
        </div>

        <div className="rounded-xl bg-background border border-border p-6 text-left space-y-4">
          <h3 className="text-sm font-semibold text-foreground font-mono">COMING SOON</h3>
          <ul className="space-y-3 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Link Zerodha, Groww, Upstox, or other Indian brokerage accounts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Connect US broker accounts (Interactive Brokers, Alpaca)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Real-time position tracking with live P&L calculations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Value-at-Risk (VaR), Sharpe ratio, and diversification analysis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Manual portfolio entry with custom cost basis tracking</span>
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground bg-background rounded-lg p-3 border border-border">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>NexQuant does not display fabricated portfolio data. Only real connected account data will be shown here.</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
          >
            Explore Assets <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/watchlist"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-surface border border-border text-sm font-medium text-foreground hover:bg-elevated transition-colors"
          >
            View Watchlist
          </Link>
        </div>
      </div>
    </div>
  );
}
