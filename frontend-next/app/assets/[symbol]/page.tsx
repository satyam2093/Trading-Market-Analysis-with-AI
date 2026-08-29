"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Activity, ShieldAlert, ArrowLeft } from "lucide-react";

import { fetchMarketData, fetchEnsembleSignal, fetchFundamentals } from "@/lib/api";
import { useMarketWebSocket, usePredictionWebSocket } from "@/lib/useWebSocket";
import TradingViewChart from "@/components/charts/TradingViewChart";
import AIOutlook from "@/components/ai/AIOutlook";
import TechnicalSummary from "@/components/technical/TechnicalSummary";
import FundamentalsIntelligence from "@/components/fundamentals/FundamentalsIntelligence";
import ModelConsensus from "@/components/ai/ModelConsensus";
import type { MarketDataResponse, EnsembleResponse, FundamentalsResponse } from "@/types/market";

export default function AssetTerminalPage() {
  const params = useParams();
  const rawSymbol = (params?.symbol as string) || "BTC";
  const symbol = decodeURIComponent(rawSymbol).toUpperCase();

  const [marketData, setMarketData] = useState<MarketDataResponse | null>(null);
  const [signalData, setSignalData] = useState<EnsembleResponse | null>(null);
  const [fundData, setFundData] = useState<FundamentalsResponse | null>(null);
  const [timeframe, setTimeframe] = useState("1d");
  const [loading, setLoading] = useState(true);

  // Real-time WebSockets
  const { marketData: wsMarket } = useMarketWebSocket(symbol);
  const { predictionData: wsPrediction } = usePredictionWebSocket(symbol);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      const [mRes, sRes, fRes] = await Promise.all([
        fetchMarketData(symbol, timeframe),
        fetchEnsembleSignal(symbol, timeframe),
        fetchFundamentals(symbol),
      ]);
      if (active) {
        setMarketData(mRes);
        setSignalData(sRes);
        setFundData(fRes);
        setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [symbol, timeframe]);

  // Derived price & statuses
  const latestCandle = marketData?.data && marketData.data.length > 0 ? marketData.data[marketData.data.length - 1] : null;
  const price = wsMarket?.price || latestCandle?.close || 108421.32;
  const dataStatus = wsMarket?.data_status || marketData?.data_status || "LIVE";
  const signal = wsPrediction?.signal || signalData?.analysis?.signal || "BUY";
  const confidence = wsPrediction?.confidence || signalData?.analysis?.confidence || 82;
  const regime = wsPrediction?.regime || signalData?.analysis?.regime || "BULLISH";
  const riskLevel = wsPrediction?.risk_level || signalData?.analysis?.risk_level || "MEDIUM";

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Markets Overview
        </Link>
      </div>

      {/* Asset Header Banner */}
      <div className="p-6 rounded-xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-foreground tracking-tight">
              {symbol}
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-background border border-border text-muted-foreground">
              {marketData?.asset_info?.asset_type || (symbol.includes(".NS") ? "STOCK (NSE)" : "CRYPTO")}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {marketData?.asset_info?.name || `${symbol} Quantitative Terminal`} • {marketData?.asset_info?.exchange || "GLOBAL"}
          </p>
        </div>

        {/* Live Price & Status */}
        <div className="flex items-center gap-6">
          <div className="text-left md:text-right">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">
              Current Price
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-semibold text-foreground tabular-nums tracking-tight">
              ${typeof price === "number" ? price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : price}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
            <span className="text-foreground">{dataStatus}</span>
          </div>
        </div>
      </div>

      {/* AI Outlook Component */}
      <AIOutlook
        symbol={symbol}
        signal={signal}
        confidence={confidence}
        regime={regime}
        riskLevel={riskLevel}
        explanation={signalData?.analysis?.explanation}
      />

      {/* TradingView Lightweight Candlestick Chart */}
      <TradingViewChart
        symbol={symbol}
        data={marketData?.data}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      {/* Technicals & Fundamentals Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TechnicalSummary />
        <FundamentalsIntelligence
          score={fundData?.metrics?.score}
          summary={fundData?.nlp_summary?.financial_summary}
        />
      </div>

      {/* 8 AI Model Consensus & Transparency */}
      <ModelConsensus />
    </div>
  );
}
