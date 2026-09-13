/**
 * NexQuant API Service Layer
 * Resilient client with automatic failover between Render backend and Vercel serverless API routes.
 * Guaranteed zero node connectivity crashes.
 */

export function getApiBase(): string {
  // In the browser, always use relative URLs ("") so requests go directly to Next.js API routes on Vercel or localhost
  if (typeof window !== "undefined") {
    return "";
  }

  // During server-side execution on Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "";
}

async function apiFetch<T>(path: string): Promise<T | null> {
  // 1. If an active custom Render backend is configured, attempt it with a strict timeout
  const renderUrl = process.env.NEXT_PUBLIC_RENDER_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (renderUrl && !renderUrl.includes("trading-market-analysis-with-ai.onrender.com")) {
    try {
      const cleanRender = renderUrl.replace(/\/$/, "");
      const res = await fetch(`${cleanRender}${path}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        return (await res.json()) as T;
      }
    } catch {
      // Seamlessly fall through to Vercel Next.js routes
    }
  }

  // 2. Query Vercel Next.js API Routes (Serverless Functions)
  try {
    const base = getApiBase();
    const res = await fetch(`${base}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function apiDelete<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}${path}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── Market ───────────────────────────────────

import type {
  MarketOverviewResponse,
  MarketDataResponse,
  AssetSearchResult,
  EnsembleResponse,
  FundamentalsResponse,
  SystemStatus,
} from "@/types/market";

export function fetchMarketOverview() {
  return apiFetch<MarketOverviewResponse>("/api/v1/market/overview");
}

export function fetchFeaturedAssets() {
  return apiFetch<{ timestamp: string; assets: any[] }>("/api/v1/market/featured");
}

export function fetchHealth() {
  return apiFetch<{
    status: string;
    timestamp: string;
    database: string;
    market_data_service: string;
    websocket_gateway: string;
  }>("/api/v1/health");
}

export function fetchMarketData(symbol: string, timeframe = "1d", limit = 100) {
  return apiFetch<MarketDataResponse>(
    `/api/v1/market-data/${symbol}?timeframe=${timeframe}&limit=${limit}`
  );
}

export function searchAssets(query: string, assetType = "ALL", limit = 60) {
  return apiFetch<AssetSearchResult>(
    `/api/v1/assets/search?query=${encodeURIComponent(query)}&asset_type=${assetType}&limit=${limit}`
  );
}

// ── Predictions ──────────────────────────────

export function fetchEnsembleSignal(symbol: string, timeframe = "1d") {
  return apiFetch<EnsembleResponse>(
    `/api/v1/ensemble/${symbol}?timeframe=${timeframe}`
  );
}

// ── Fundamentals ─────────────────────────────

export function fetchFundamentals(symbol: string) {
  return apiFetch<FundamentalsResponse>(`/api/v1/fundamentals/${symbol}`);
}

// ── Real-Time Financial News ─────────────────

export function fetchNews(symbol?: string, limit = 12) {
  const query = symbol ? `?symbol=${encodeURIComponent(symbol)}&limit=${limit}` : `?limit=${limit}`;
  return apiFetch<{ articles: any[]; symbol?: string; timestamp: string }>(`/api/v1/news${query}`);
}

export function fetchMarketNews(limit = 15) {
  return apiFetch<{ articles: any[]; timestamp: string }>(`/api/v1/news?limit=${limit}`);
}

// ── Watchlist ────────────────────────────────

export function fetchWatchlist(userId = "default_user") {
  return apiFetch<any>(`/api/v1/watchlist?user_id=${userId}`);
}

export function addToWatchlist(assetId: string, userId = "default_user") {
  return apiPost<any>("/api/v1/watchlist/add", { asset_id: assetId, user_id: userId });
}

export function removeFromWatchlist(assetId: string, userId = "default_user") {
  return apiDelete<any>("/api/v1/watchlist/remove", { asset_id: assetId, user_id: userId });
}

// ── System ───────────────────────────────────

export function fetchSystemStatus() {
  return apiFetch<SystemStatus>("/api/v1/system/status");
}

// ── WebSocket URLs ───────────────────────────

export function getWsBase(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_RENDER_WS_URL) return process.env.NEXT_PUBLIC_RENDER_WS_URL.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocal) {
      return "ws://localhost:8000";
    }
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}`;
  }

  return "ws://localhost:8000";
}

export function getMarketWSUrl(symbol: string) {
  return `${getWsBase()}/ws/market/${symbol}`;
}

export function getPredictionWSUrl(symbol: string) {
  return `${getWsBase()}/ws/prediction/${symbol}`;
}
