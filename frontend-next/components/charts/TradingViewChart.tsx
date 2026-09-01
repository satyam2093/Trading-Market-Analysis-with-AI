"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CandleData, WSMarketPayload } from "@/types/market";

type StreamState = "CONNECTED" | "RECONNECTING" | "DISCONNECTED";

interface Props {
  symbol: string;
  data?: CandleData[];
  liveTick?: WSMarketPayload | null;
  streamState?: StreamState;
  currencySymbol?: string;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
}

const intervalMap: Record<string, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "4h": "240",
  "1d": "D",
  "1w": "W",
  all: "D",
};

function resolveTradingViewSymbol(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) return "BINANCE:BTCUSDT";

  const base = normalized.replace(/\.[A-Z]+$/, "");

  if (normalized.endsWith(".NS")) return `NSE:${base}`;
  if (normalized.endsWith(".BO")) return `BSE:${base}`;
  if (["BTC", "ETH", "SOL", "ADA", "XRP", "BNB", "DOGE", "LINK", "AVAX", "DOT"].includes(normalized)) return `BINANCE:${normalized}USDT`;
  if (["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "NFLX", "WMT", "AMD", "INTC"].includes(normalized)) return `NASDAQ:${normalized}`;
  if (["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "ITC", "LTIM", "SUNPHARMA"].includes(normalized)) return `NSE:${normalized}`;
  if (normalized.includes(":")) return normalized;

  return `BINANCE:${normalized}USDT`;
}

export default function TradingViewChart({
  symbol,
  data = [],
  liveTick,
  streamState = "DISCONNECTED",
  currencySymbol = "$",
  timeframe = "1d",
  onTimeframeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<any>(null);
  const widgetId = useId();
  const [isScriptReady, setIsScriptReady] = useState(false);

  useEffect(() => {
    const loadWidget = () => {
      if (!containerRef.current || typeof window === "undefined") return;
      const target = containerRef.current;
      const TradingView = (window as any).TradingView;
      if (!TradingView?.widget) return;

      target.innerHTML = "";
      widgetRef.current = new TradingView.widget({
        autosize: true,
        symbol: resolveTradingViewSymbol(symbol),
        interval: intervalMap[timeframe] || "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        save_image: false,
        withdateranges: true,
        allow_symbol_change: false,
        details: true,
        container_id: widgetId,
        studies: ["Volume@tv-basicstudies", "RSI@tv-basicstudies"],
      });
    };

    const scriptUrl = "https://s3.tradingview.com/tv.js";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);

    if ((window as any).TradingView?.widget) {
      setIsScriptReady(true);
      loadWidget();
      return;
    }

    if (existing) {
      existing.addEventListener("load", () => {
        setIsScriptReady(true);
        loadWidget();
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      setIsScriptReady(true);
      loadWidget();
    };
    script.onerror = () => setIsScriptReady(false);
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [symbol, timeframe, widgetId]);

  const status =
    liveTick?.market_status === "MARKET_CLOSED"
      ? "MARKET CLOSED"
      : liveTick?.data_status === "DELAYED"
        ? "DELAYED"
        : liveTick?.data_status === "UNAVAILABLE"
          ? "FEED UNAVAILABLE"
          : streamState === "CONNECTED" && liveTick
            ? "LIVE"
            : "RECONNECTING";

  const lastUpdate = liveTick?.timestamp ? new Date(liveTick.timestamp).toLocaleTimeString() : "--:--:--";

  return (
    <div className="p-6 rounded-xl bg-surface border border-border space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground">TradingView Advanced Chart</h3>
            <span className="text-xs font-mono text-accent">({symbol})</span>
            <span className="px-2 py-0.5 rounded-full bg-bullish/10 border border-bullish/30 text-bullish text-[10px] font-mono">
              {status === "LIVE" ? "●" : "○"} {status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Last update: {lastUpdate}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded border border-border bg-background p-0.5">
            {Object.keys(intervalMap).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange?.(tf)}
                className={`px-2 py-0.5 rounded text-xs font-mono uppercase ${timeframe === tf ? "bg-elevated text-foreground font-semibold" : "text-muted-foreground"}`}
              >
                {tf === "all" ? "ALL" : tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        id={widgetId}
        ref={containerRef}
        className="w-full h-[420px] rounded-lg overflow-hidden border border-border/50 bg-background"
      />

      {!isScriptReady && (
        <div className="flex items-center justify-center h-[64px] rounded-lg border border-dashed border-border text-xs font-mono text-muted-foreground">
          Loading TradingView chart...
        </div>
      )}

      <div className="flex items-center gap-6 pt-2 border-t border-border/40 text-xs font-mono text-muted-foreground">
        <span><span className="w-2.5 h-2.5 inline-block rounded-sm bg-bullish" /> Bullish Candle</span>
        <span><span className="w-2.5 h-2.5 inline-block rounded-sm bg-bearish" /> Bearish Candle</span>
        {liveTick?.price ? (
          <span className="ml-auto text-foreground font-semibold">
            Live Tick: {currencySymbol}{liveTick.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
