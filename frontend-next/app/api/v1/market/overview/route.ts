import { NextResponse } from "next/server";
import { fetchLiveQuoteFromServer } from "@/lib/serverMarketService";

export const dynamic = "force-dynamic";

export async function GET() {
  const indices = ["NIFTY50", "SENSEX", "SPY", "QQQ", "BTC", "ETH", "NVDA", "RELIANCE"];
  const quotes = await Promise.all(indices.map((sym) => fetchLiveQuoteFromServer(sym)));

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    indices: quotes,
  });
}
