import { NextResponse } from "next/server";
import { fetchGlobalMarketCenters, fetchLiveQuoteFromServer } from "@/lib/serverMarketService";

export const dynamic = "force-dynamic";

export async function GET() {
  const centers = await fetchGlobalMarketCenters();

  // Unified ticker stream for the live bar
  const tickerSymbols = [
    "NIFTY50",
    "SENSEX",
    "BANKNIFTY",
    "SP500",
    "NASDAQ",
    "DOW",
    "SHANGHAI",
    "HANGSENG",
    "MOEX",
    "BTC",
    "ETH",
    "RELIANCE",
    "TCS",
    "NVDA",
  ];

  const quotes = await Promise.all(tickerSymbols.map((sym) => fetchLiveQuoteFromServer(sym)));

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    indices: quotes,
    centers,
  });
}
