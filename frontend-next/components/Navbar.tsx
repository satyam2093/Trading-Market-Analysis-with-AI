"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchAssets } from "@/lib/api";
import AuthModal from "@/components/auth/AuthModal";
import type { AssetInfo } from "@/types/market";

const NAV_LINKS = [
  { href: "/", label: "Markets" },
  { href: "/discover", label: "Discover" },
  { href: "/news", label: "News" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/portfolio", label: "Portfolio" },
];

const POPULAR_SEARCHES = [
  { symbol: "BTC", name: "Bitcoin", exchange: "BINANCE", asset_type: "CRYPTO" },
  { symbol: "ETH", name: "Ethereum", exchange: "BINANCE", asset_type: "CRYPTO" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", asset_type: "STOCK" },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", asset_type: "STOCK" },
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", asset_type: "STOCK" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", exchange: "NSE", asset_type: "STOCK" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", exchange: "NSE", asset_type: "STOCK" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", exchange: "NYSE", asset_type: "ETF" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssetInfo[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setQuery("");
        setResults([]);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      setSelectedIdx(0);
      return;
    }
    const timer = setTimeout(async () => {
      const data = await searchAssets(query);
      setResults(data?.assets || []);
      setSelectedIdx(0);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation in results
  function handleSearchKeyDown(e: React.KeyboardEvent) {
    const activeList = results.length > 0 ? results : POPULAR_SEARCHES;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, activeList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeList[selectedIdx]) {
      window.location.href = `/assets/${activeList[selectedIdx].symbol}`;
      closeSearch();
    }
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
  }

  function openAuth(mode: "signin" | "signup") {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-xl font-semibold tracking-tight text-foreground">
                NEXQUANT
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 ml-8" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3.5 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "text-foreground bg-surface"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Search trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-surface text-muted-foreground text-sm hover:text-foreground transition-colors"
                aria-label="Search assets"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search any stock or crypto...</span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono border border-border rounded bg-background text-muted-foreground">
                  ⌘K
                </kbd>
              </button>

              {/* Functional Auth buttons */}
              <button
                onClick={() => openAuth("signin")}
                className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth("signup")}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/90 transition-colors"
              >
                Get Started
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="px-4 py-4 space-y-1" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-3 py-2.5 rounded-md text-sm font-medium",
                    pathname === link.href
                      ? "text-foreground bg-surface"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-border mt-3 space-y-2">
                <button
                  onClick={() => openAuth("signin")}
                  className="w-full text-left px-3 py-2.5 text-sm text-muted-foreground"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="w-full text-center px-3 py-2.5 text-sm font-medium bg-foreground text-background rounded-md"
                >
                  Get Started
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      {/* Search Command Palette */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-label="Search assets">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSearch} />
          <div className="relative max-w-xl mx-auto mt-[15vh] px-4">
            <div className="bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search any US stock, Indian share, crypto, ETF (e.g. BTC, NVDA, RELIANCE, TSLA)..."
                  className="flex-1 py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono border border-border rounded text-muted-foreground">
                  ESC
                </kbd>
              </div>

              {/* Dynamic Search Results */}
              {results.length > 0 && (
                <ul className="max-h-80 overflow-y-auto py-2 scrollbar-thin">
                  {results.map((asset, idx) => (
                    <li key={asset.id || asset.symbol}>
                      <Link
                        href={`/assets/${asset.symbol}`}
                        onClick={closeSearch}
                        className={cn(
                          "flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                          idx === selectedIdx
                            ? "bg-elevated text-foreground"
                            : "text-muted-foreground hover:bg-elevated hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono font-semibold text-foreground shrink-0">
                            {asset.symbol}
                          </span>
                          <span className="truncate">{asset.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-xs text-muted-foreground">
                            {asset.exchange}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                            {asset.asset_type}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {/* Empty state with auto fallback candidate */}
              {query.length > 0 && results.length === 0 && (
                <div className="p-4">
                  <div className="text-center text-xs text-muted-foreground mb-3">
                    Analyzing real-time ticker &ldquo;{query.toUpperCase()}&rdquo; across global exchanges
                  </div>
                  <Link
                    href={`/assets/${query.trim().toUpperCase()}`}
                    onClick={closeSearch}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-accent text-sm transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-accent">{query.trim().toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">Launch Live Terminal</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-accent" />
                  </Link>
                </div>
              )}

              {/* Quick Trending Suggestions when query is empty */}
              {query.length === 0 && (
                <div className="p-3">
                  <div className="px-2 py-1 text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3 h-3 text-accent" /> Popular Discovered Markets
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {POPULAR_SEARCHES.map((asset) => (
                      <Link
                        key={asset.symbol}
                        href={`/assets/${asset.symbol}`}
                        onClick={closeSearch}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-elevated text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">{asset.symbol}</span>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[90px]">{asset.name}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-background border border-border text-muted-foreground">
                          {asset.asset_type}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
