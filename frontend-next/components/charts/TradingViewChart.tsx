"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import { ExternalLink, Layers, Maximize2, BarChart2 } from "lucide-react";
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

export function resolveTradingViewSymbol(symbol: string): string {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) return "BINANCE:BTCUSDT";

  if (normalized.includes(":")) return normalized;

  // Indian Indices
  if (["NIFTY", "NIFTY50", "^NSEI"].includes(normalized)) return "NSE:NIFTY";
  if (["BANKNIFTY", "BANK_NIFTY", "^NSEBANK"].includes(normalized)) return "NSE:BANKNIFTY";
  if (["SENSEX", "^BSESN"].includes(normalized)) return "BSE:SENSEX";

  // Global Indices
  if (["SPY", "^GSPC", "S&P500", "SPX", "SP500"].includes(normalized)) return "AMEX:SPY";
  if (["QQQ", "^IXIC", "NASDAQ"].includes(normalized)) return "NASDAQ:QQQ";
  if (["DIA", "^DJI", "DOW", "DOWJONES"].includes(normalized)) return "INDEX:DJI";
  if (["MOEX", "IMOEX", "IMOEX.ME"].includes(normalized)) return "MOEX:IMOEX";
  if (["SHANGHAI", "000001.SS"].includes(normalized)) return "SSE:000001";
  if (["HSI", "^HSI", "HANGSENG"].includes(normalized)) return "HSI:HSI";

  // Indian Equities
  const indianEquities = [
    "TCS", "RELIANCE", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "BHARTIARTL",
    "ITC", "WIPRO", "BAJFINANCE", "TATAMOTORS", "LT", "MARUTI", "TITAN",
    "HAL", "BEL", "ADANIENT", "SUNPHARMA", "LTIM", "KOTAKBANK", "AXISBANK",
  ];
  if (indianEquities.includes(normalized)) return `NSE:${normalized}`;
  if (normalized.endsWith(".NS")) return `NSE:${normalized.replace(".NS", "")}`;
  if (normalized.endsWith(".BO")) return `BSE:${normalized.replace(".BO", "")}`;

  // Cryptocurrencies
  const cryptos = ["BTC", "ETH", "SOL", "ADA", "XRP", "BNB", "DOGE", "LINK", "AVAX", "DOT"];
  const cleanCrypto = normalized.replace("-USD", "").replace("USDT", "");
  if (cryptos.includes(cleanCrypto)) return `BINANCE:${cleanCrypto}USDT`;

  // Major US Stocks
  const usStocks = ["AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "TSLA", "META", "NFLX", "AMD", "PLTR", "COIN"];
  if (usStocks.includes(normalized)) return `NASDAQ:${normalized}`;

  return `NASDAQ:${normalized}`;
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
  const isIndianAsset =
    symbol.toUpperCase().includes(".NS") ||
    symbol.toUpperCase().includes(".BO") ||
    [
      "TCS", "RELIANCE", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "BHARTIARTL",
      "ITC", "WIPRO", "BAJFINANCE", "TATAMOTORS", "NIFTY", "NIFTY50", "SENSEX", "BANKNIFTY"
    ].includes(symbol.toUpperCase());

  // Default to native canvas engine (powered by TradingView lightweight-charts) for Indian assets
  // to avoid TradingView's embed licensing restriction ("This symbol is only available on TradingView")
  const [chartMode, setChartMode] = useState<"native" | "embed">("native");
  const [showEMA, setShowEMA] = useState(true);

  // Hover crosshair info
  const [crosshairInfo, setCrosshairInfo] = useState<{
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    time?: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  // Embed widget refs
  const embedContainerRef = useRef<HTMLDivElement | null>(null);
  const tvSymbol = resolveTradingViewSymbol(symbol);
  const embedSanitizedId = `tv_embed_${symbol.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

  // ── Native TradingView Lightweight Charts (Canvas) Mode ──────────────
  useEffect(() => {
    if (chartMode !== "native" || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#0c111a" },
        textColor: "#94a3b8",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.06)" },
        horzLines: { color: "rgba(148, 163, 184, 0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(148, 163, 184, 0.4)",
          width: 1,
          style: 3,
        },
        horzLine: {
          color: "rgba(148, 163, 184, 0.4)",
          width: 1,
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    // 1. Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    candleSeriesRef.current = candleSeries;

    // 2. Volume Series (bottom 20%)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // 3. EMA 20 & 50 Line Series
    const ema20Series = chart.addSeries(LineSeries, {
      color: "#38bdf8",
      lineWidth: 2,
      priceScaleId: "right",
      title: "EMA 20",
    });
    ema20SeriesRef.current = ema20Series;

    const ema50Series = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 2,
      priceScaleId: "right",
      title: "EMA 50",
    });
    ema50SeriesRef.current = ema50Series;

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setCrosshairInfo(null);
        return;
      }
      const cData = param.seriesData.get(candleSeries) as any;
      const vData = param.seriesData.get(volumeSeries) as any;
      if (cData) {
        setCrosshairInfo({
          open: cData.open,
          high: cData.high,
          low: cData.low,
          close: cData.close,
          volume: vData?.value,
          time: typeof param.time === "number" ? new Date(param.time * 1000).toLocaleDateString() : String(param.time),
        });
      } else {
        setCrosshairInfo(null);
      }
    });

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [chartMode]);

  // Feed real OHLCV data into the native chart
  useEffect(() => {
    if (chartMode !== "native" || !candleSeriesRef.current || !data || data.length === 0) return;

    // Format & sort chronologically
    const sorted = [...data].sort((a, b) => {
      const ta = a.unix_time || new Date(a.timestamp).getTime();
      const tb = b.unix_time || new Date(b.timestamp).getTime();
      return ta - tb;
    });

    const candlePoints: any[] = [];
    const volumePoints: any[] = [];
    const ema20Points: any[] = [];
    const ema50Points: any[] = [];

    const seenTimes = new Set<number>();

    for (const d of sorted) {
      const timeInSec = d.unix_time || Math.floor(new Date(d.timestamp).getTime() / 1000);
      if (isNaN(timeInSec) || seenTimes.has(timeInSec)) continue;
      if (typeof d.open !== "number" || typeof d.close !== "number" || d.open <= 0 || d.close <= 0) continue;

      seenTimes.add(timeInSec);

      candlePoints.push({
        time: timeInSec,
        open: d.open,
        high: d.high || Math.max(d.open, d.close),
        low: d.low || Math.min(d.open, d.close),
        close: d.close,
      });

      volumePoints.push({
        time: timeInSec,
        value: d.volume || 0,
        color: d.close >= d.open ? "rgba(34, 197, 94, 0.35)" : "rgba(239, 68, 68, 0.35)",
      });

      if (d.ema_20 && d.ema_20 > 0) {
        ema20Points.push({ time: timeInSec, value: d.ema_20 });
      }
      if (d.ema_50 && d.ema_50 > 0) {
        ema50Points.push({ time: timeInSec, value: d.ema_50 });
      }
    }

    if (candlePoints.length > 0) {
      candleSeriesRef.current.setData(candlePoints);
      volumeSeriesRef.current?.setData(volumePoints);
      if (showEMA) {
        ema20SeriesRef.current?.setData(ema20Points);
        ema50SeriesRef.current?.setData(ema50Points);
      } else {
        ema20SeriesRef.current?.setData([]);
        ema50SeriesRef.current?.setData([]);
      }
      chartRef.current?.timeScale().fitContent();
    }
  }, [data, chartMode, showEMA]);

  // ── Embed Widget Mode (for US/Crypto when requested) ────────────────
  useEffect(() => {
    if (chartMode !== "embed" || !embedContainerRef.current) return;

    let unmounted = false;
    const target = embedContainerRef.current;

    const loadWidget = () => {
      const TradingView = (window as any).TradingView;
      if (!TradingView?.widget || unmounted || !target) return;

      target.innerHTML = "";
      new TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
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
        allow_symbol_change: true,
        details: true,
        container_id: embedSanitizedId,
        studies: ["Volume@tv-basicstudies", "RSI@tv-basicstudies"],
      });
    };

    const scriptUrl = "https://s3.tradingview.com/tv.js";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);

    if ((window as any).TradingView?.widget) {
      loadWidget();
      return () => {
        unmounted = true;
      };
    }

    if (existing) {
      existing.addEventListener("load", () => {
        if (!unmounted) loadWidget();
      }, { once: true });
      return () => {
        unmounted = true;
      };
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      if (!unmounted) loadWidget();
    };
    document.body.appendChild(script);

    return () => {
      unmounted = true;
      script.onload = null;
    };
  }, [chartMode, tvSymbol, timeframe, embedSanitizedId]);

  // Latest candle / live price
  const latestBar = data && data.length > 0 ? data[data.length - 1] : null;
  const currentPrice = liveTick?.price || latestBar?.close || null;
  const prevPrice = latestBar?.open || currentPrice;
  const diff = currentPrice && prevPrice ? currentPrice - prevPrice : 0;
  const diffPct = prevPrice && prevPrice > 0 ? (diff / prevPrice) * 100 : 0;
  const isPos = diff >= 0;

  return (
    <div className="p-6 rounded-xl bg-surface border border-border space-y-4">
      {/* Chart Toolbar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-accent" />
              TradingView Precision Chart
            </h3>
            <span className="text-xs font-mono font-bold text-accent">[{symbol}]</span>

            {/* Mode Badge */}
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-background border border-border text-muted-foreground">
              {chartMode === "native" ? "CANVAS ENGINE" : "WEB EMBED"}
            </span>

            <span className="px-2 py-0.5 rounded-full bg-bullish/10 border border-bullish/30 text-bullish text-[10px] font-mono">
              ● {liveTick?.market_status === "MARKET_CLOSED" ? "MARKET CLOSED" : "LIVE FEED"}
            </span>
          </div>

          {/* Crosshair Inspection Bar */}
          {crosshairInfo ? (
            <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground flex-wrap pt-0.5">
              <span>Date: <strong className="text-foreground">{crosshairInfo.time}</strong></span>
              <span>O: <strong className="text-foreground">{currencySymbol}{crosshairInfo.open?.toFixed(2)}</strong></span>
              <span>H: <strong className="text-foreground">{currencySymbol}{crosshairInfo.high?.toFixed(2)}</strong></span>
              <span>L: <strong className="text-foreground">{currencySymbol}{crosshairInfo.low?.toFixed(2)}</strong></span>
              <span>C: <strong className="text-foreground">{currencySymbol}{crosshairInfo.close?.toFixed(2)}</strong></span>
              {crosshairInfo.volume !== undefined && (
                <span>Vol: <strong className="text-foreground">{crosshairInfo.volume.toLocaleString()}</strong></span>
              )}
            </div>
          ) : (
            <p className="text-xs font-mono text-muted-foreground">
              Hover over candles to inspect precise OHLCV values and institutional moving averages
            </p>
          )}
        </div>

        {/* Action Controls & Engine Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Engine Selector */}
          <div className="flex items-center rounded border border-border bg-background p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setChartMode("native")}
              className={`px-2.5 py-1 rounded transition-colors ${
                chartMode === "native"
                  ? "bg-elevated text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Native high-resolution canvas engine powered by TradingView library — never blocked"
            >
              Native Engine
            </button>
            <button
              onClick={() => setChartMode("embed")}
              className={`px-2.5 py-1 rounded transition-colors ${
                chartMode === "embed"
                  ? "bg-elevated text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Official TradingView Embed Widget"
            >
              Web Embed
            </button>
          </div>

          {/* EMA Overlay Toggle (Native mode) */}
          {chartMode === "native" && (
            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`px-2.5 py-1 rounded border text-xs font-mono transition-colors flex items-center gap-1 ${
                showEMA
                  ? "bg-accent/15 border-accent/40 text-accent font-semibold"
                  : "bg-background border-border text-muted-foreground"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>EMAs</span>
            </button>
          )}

          {/* Reset View */}
          {chartMode === "native" && (
            <button
              onClick={() => chartRef.current?.timeScale().fitContent()}
              className="p-1.5 rounded border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
              title="Fit chart content"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* External TradingView Link */}
          <a
            href={`https://www.tradingview.com/symbols/${tvSymbol.replace(":", "-")}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-background text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            title="Open symbol on TradingView.com"
          >
            <span>TV Web</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative w-full h-[460px] rounded-lg overflow-hidden border border-border/50 bg-[#0c111a]">
        {chartMode === "native" ? (
          <div ref={containerRef} className="w-full h-full" />
        ) : (
          <div id={embedSanitizedId} ref={embedContainerRef} className="w-full h-full" />
        )}
      </div>

      {/* Legend & Summary Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-bullish" />
            <span>Bullish Bar</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-bearish" />
            <span>Bearish Bar</span>
          </span>
          {showEMA && chartMode === "native" && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-[#38bdf8]" />
                <span className="text-[#38bdf8]">EMA 20</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-[#f59e0b]" />
                <span className="text-[#f59e0b]">EMA 50</span>
              </span>
            </>
          )}
        </div>

        {currentPrice && (
          <div className="flex items-center gap-2 sm:ml-auto">
            <span>Last Traded:</span>
            <span className="font-semibold text-foreground tabular-nums">
              {currencySymbol}{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            {diffPct !== 0 && (
              <span className={isPos ? "text-bullish" : "text-bearish"}>
                ({isPos ? "+" : ""}{diffPct.toFixed(2)}%)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
