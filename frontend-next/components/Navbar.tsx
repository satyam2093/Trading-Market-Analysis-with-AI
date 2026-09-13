"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, ArrowRight, TrendingUp, User, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchAssets } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
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
  const { authLoading, isAuthenticated, user, authModalOpen, authMode, openAuth, closeAuth, login, logout } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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

              {/* Reactive Auth Buttons */}
              {authLoading ? (
                <div className="hidden sm:inline-flex w-24 h-9 rounded-md bg-surface/50 animate-pulse" />
              ) : !isAuthenticated ? (
                <>
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
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/watchlist"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-surface transition-colors"
                  >
                    <span>Watchlist</span>
                  </Link>
                  <Link
                    href="/portfolio"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-surface transition-colors"
                  >
                    <span>Portfolio</span>
                  </Link>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono text-foreground px-3 py-1.5 rounded-md bg-surface border border-border">
                    <User className="w-3.5 h-3.5 text-accent" />
                    <span>{user?.name?.split(" ")[0] || "Trader"}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-background border border-border/50 text-accent font-semibold">PRO</span>
                  </div>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-bearish px-2.5 py-1.5 rounded-md hover:bg-surface transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}

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
                {authLoading ? (
                  <div className="w-full h-10 rounded-md bg-surface/50 animate-pulse" />
                ) : !isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        openAuth("signin");
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm text-muted-foreground"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        openAuth("signup");
                      }}
                      className="w-full text-center px-3 py-2.5 text-sm font-medium bg-foreground text-background rounded-md"
                    >
                      Get Started
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2 text-xs font-mono text-muted-foreground flex items-center justify-between">
                      <span>Logged in as {user?.name || "Trader"}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border uppercase text-accent">PRO</span>
                    </div>
                    <Link
                      href="/"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-left px-3 py-2 text-sm text-foreground bg-surface rounded-md"
                    >
                      Dashboard & Markets
                    </Link>
                    <Link
                      href="/watchlist"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-left px-3 py-2 text-sm text-foreground bg-surface rounded-md"
                    >
                      My Watchlist
                    </Link>
                    <Link
                      href="/portfolio"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-left px-3 py-2 text-sm text-foreground bg-surface rounded-md"
                    >
                      Portfolio Intelligence
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm text-bearish hover:bg-surface rounded-md flex items-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuth}
        initialMode={authMode}
        onAuthenticated={() => {
          login();
          closeAuth();
        }}
      />

      {/* ⌘K Command Palette / Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={closeSearch} />
          <div className="relative w-full max-w-2xl rounded-xl bg-surface border border-border shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center px-4 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search by ticker (e.g. BTC, RELIANCE, NVDA, TCS, ETH, TSLA)..."
                className="w-full px-3 py-4 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                  }}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {results.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Matching Global Assets ({results.length})
                  </div>
                  {results.map((asset, idx) => (
                    <Link
                      key={asset.id || asset.symbol}
                      href={`/assets/${asset.symbol}`}
                      onClick={closeSearch}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                        selectedIdx === idx ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-foreground">{asset.symbol}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[280px]">{asset.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                          {asset.exchange}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                          {asset.asset_type}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No predefined asset found for &ldquo;<span className="text-foreground font-mono">{query}</span>&rdquo;.
                  </p>
                  <Link
                    href={`/assets/${query.trim().toUpperCase()}`}
                    onClick={closeSearch}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-mono font-medium hover:bg-foreground/90 transition-colors"
                  >
                    Launch Live Terminal for &ldquo;{query.trim().toUpperCase()}&rdquo; <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Popular Global Markets
                  </div>
                  {POPULAR_SEARCHES.map((item, idx) => (
                    <Link
                      key={item.symbol}
                      href={`/assets/${item.symbol}`}
                      onClick={closeSearch}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                        selectedIdx === idx ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-foreground">{item.symbol}</span>
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                          {item.exchange}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                          {item.asset_type}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-border/50 bg-background/50 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>Navigate with <kbd className="px-1 py-0.5 bg-surface border border-border rounded text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-surface border border-border rounded text-[10px]">↓</kbd></span>
              <span>Open terminal with <kbd className="px-1 py-0.5 bg-surface border border-border rounded text-[10px]">Enter</kbd></span>
              <span>Close with <kbd className="px-1 py-0.5 bg-surface border border-border rounded text-[10px]">ESC</kbd></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
