import { NextResponse } from "next/server";
import { fetchLiveQuoteFromServer, computeDynamicEnsembleSignal } from "@/lib/serverMarketService";

export const dynamic = "force-dynamic";

export async function GET() {
  const featuredSymbols = ["BTC", "NVDA", "RELIANCE", "ETH", "AAPL", "TCS"];

  const assets = await Promise.all(
    featuredSymbols.map(async (sym) => {
      const quote = await fetchLiveQuoteFromServer(sym);
      const signal = computeDynamicEnsembleSignal(sym, quote.price, quote.previous_close);

      return {
        ...quote,
        signal: signal.signal,
        confidence: signal.confidence,
        regime: signal.regime,
        risk_level: signal.risk_level,
      };
    })
  );

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    assets,
  });
}
