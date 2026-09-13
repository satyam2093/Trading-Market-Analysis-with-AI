"use client";

import { useEffect, useRef, useState } from "react";
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

function resolveMarketTimezone(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) return "Etc/UTC";

  if (
    normalized.endsWith(".NS") ||
    normalized.endsWith(".BO") ||
    [
      "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "ITC", "WIPRO",
      "BAJFINANCE", "TATAMOTORS", "LT", "MARUTI", "TITAN", "HAL", "BEL", "ADANIENT",
      "NIFTY50", "NIFTY", "SENSEX", "BANKNIFTY"
    ].includes(normalized)
  ) {
    return "Asia/Kolkata";
  }

  if (
    [
      "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "NFLX", "AMD",
      "INTC", "WMT", "PLTR", "COIN", "SPY", "QQQ", "DIA", "DJI", "SPX"
    ].includes(normalized)
  ) {
    return "America/New_York";
  }

  if (["MOEX", "IMOEX"].includes(normalized)) return "Europe/Moscow";
  if (["SHANGHAI", "000001.SS", "HSI", "HANGSENG"].includes(normalized)) return "Asia/Hong_Kong";

  return "Etc/UTC";
}

export function resolveTradingViewSymbol(symbol: string): string {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) return "BINANCE:BTCUSDT";

  // Already prefixed with exchange
  if (normalized.includes(":")) return normalized;

  // Indian Indices
  if (["NIFTY", "NIFTY50", "^NSEI"].includes(normalized)) return "NSE:NIFTY";
  if (["BANKNIFTY", "BANK_NIFTY", "^NSEBANK"].includes(normalized)) return "NSE:BANKNIFTY";
  if (["SENSEX", "^BSESN"].includes(normalized)) return "BSE:SENSEX";

  // Global Indices
  if (["SPY", "^GSPC", "S&P500", "SPX"].includes(normalized)) return "AMEX:SPY";
  if (["QQQ", "^IXIC", "NASDAQ"].includes(normalized)) return "NASDAQ:QQQ";
  if (["DIA", "^DJI", "DOW", "DOWJONES"].includes(normalized)) return "INDEX:DJI";
  if (["MOEX", "IMOEX", "IMOEX.ME"].includes(normalized)) return "MOEX:IMOEX";
  if (["SHANGHAI", "000001.SS"].includes(normalized)) return "SSE:000001";
  if (["HSI", "^HSI", "HANGSENG"].includes(normalized)) return "HSI:HSI";
  if (["FTSE", "^FTSE"].includes(normalized)) return "INDEX:FTSE";
  if (["N225", "^N225", "NIKKEI"].includes(normalized)) return "INDEX:N225";

  // Indian Equities
  const indianEquities = [
    "TCS", "RELIANCE", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "BHARTIARTL",
    "ITC", "WIPRO", "BAJFINANCE", "TATAMOTORS", "LT", "MARUTI", "TITAN",
    "HAL", "BEL", "ADANIENT", "SUNPHARMA", "LTIM", "KOTAKBANK", "AXISBANK",
    "ASIANPAINT", "HCLTECH", "NTPC", "POWERGRID"
  ];
  if (indianEquities.includes(normalized)) return `NSE:${normalized}`;
  if (normalized.endsWith(".NS")) return `NSE:${normalized.replace(".NS", "")}`;
  if (normalized.endsWith(".BO")) return `BSE:${normalized.replace(".BO", "")}`;

  // Cryptocurrencies
  const cryptos = ["BTC", "ETH", "SOL", "ADA", "XRP", "BNB", "DOGE", "LINK", "AVAX", "DOT", "NEAR", "SUI", "MATIC"];
  const cleanCrypto = normalized.replace("-USD", "").replace("USDT", "");
  if (cryptos.includes(cleanCrypto)) return `BINANCE:${cleanCrypto}USDT`;

  // Major US Stocks
  const usStocks = ["AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "TSLA", "META", "NFLX", "WMT", "AMD", "INTC", "PLTR", "COIN"];
  if (usStocks.includes(normalized)) return `NASDAQ:${normalized}`;

  // Default fallback based on characteristics
  if (normalized.length <= 5) return `NASDAQ:${normalized}`;
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

  // Use a strictly alphanumeric DOM ID without colons to prevent TradingView CSS selector parser failures
  const sanitizedId = `tv_chart_${symbol.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${timeframe || "1d"}`;

  const [isScriptReady, setIsScriptReady] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>("Etc/UTC");

  useEffect(() => {
    const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Etc/UTC";
    setUserTimezone(fallbackTimezone);

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || fallbackTimezone),
        () => setUserTimezone(fallbackTimezone),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    }
  }, []);

  const chartTimezone = resolveMarketTimezone(symbol);
  const tvSymbol = resolveTradingViewSymbol(symbol);

  useEffect(() => {
    let unmounted = false;

    const loadWidget = () => {
      if (!containerRef.current || typeof window === "undefined" || unmounted) return;
      const target = containerRef.current;
      const TradingView = (window as any).TradingView;
      if (!TradingView?.widget) return;

      target.innerHTML = "";
      widgetRef.current = new TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: intervalMap[timeframe] || "D",
        timezone: chartTimezone === "Etc/UTC" && userTimezone ? userTimezone : chartTimezone,
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        save_image: false,
        withdateranges: true,
        allow_symbol_change: true,
        details: true,
        hotlist: true,
        container_id: sanitizedId,
        studies: ["Volume@tv-basicstudies", "RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
      });
    };

    const scriptUrl = "https://s3.tradingview.com/tv.js";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);

    if ((window as any).TradingView?.widget) {
      setIsScriptReady(true);
      loadWidget();
      return () => {
        unmounted = true;
      };
    }

    if (existing) {
      existing.addEventListener(
        "load",
        () => {
          if (!unmounted) {
            setIsScriptReady(true);
            loadWidget();
          }
        },
        { once: true }
      );
      return () => {
        unmounted = true;
      };
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      if (!unmounted) {
        setIsScriptReady(true);
        loadWidget();
      }
    };
    script.onerror = () => {
      if (!unmounted) setIsScriptReady(false);
    };
    document.body.appendChild(script);

    return () => {
      unmounted = true;
      script.onload = null;
      script.onerror = null;
    };
  }, [tvSymbol, timeframe, sanitizedId, chartTimezone, userTimezone]);

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
            <h3 className="text-sm font-semibold text-foreground">TradingView Institutional Chart</h3>
            <span className="text-xs font-mono text-accent font-semibold">[{tvSymbol}]</span>
            <span className="px-2 py-0.5 rounded-full bg-bullish/10 border border-bullish/30 text-bullish text-[10px] font-mono">
              {status === "LIVE" ? "●" : "○"} {status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Exchange Feed: <span className="font-mono text-foreground font-semibold">{tvSymbol}</span> · Timezone: {chartTimezone}
          </p>
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
        id={sanitizedId}
        ref={containerRef}
        className="w-full h-[460px] rounded-lg overflow-hidden border border-border/50 bg-background"
      />

      {!isScriptReady && (
        <div className="flex items-center justify-center h-[64px] rounded-lg border border-dashed border-border text-xs font-mono text-muted-foreground animate-pulse">
          Initializing TradingView high-resolution feed for {tvSymbol}...
        </div>
      )}

      <div className="flex items-center gap-6 pt-2 border-t border-border/40 text-xs font-mono text-muted-foreground">
        <span><span className="w-2.5 h-2.5 inline-block rounded-sm bg-bullish" /> Bullish Bar</span>
        <span><span className="w-2.5 h-2.5 inline-block rounded-sm bg-bearish" /> Bearish Bar</span>
        {liveTick?.price ? (
          <span className="ml-auto text-foreground font-semibold">
            Last Price: {currencySymbol}{liveTick.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
