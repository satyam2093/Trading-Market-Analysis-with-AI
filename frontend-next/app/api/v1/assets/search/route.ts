import { NextRequest, NextResponse } from "next/server";
import { resolveAssetMetadata } from "@/lib/serverMarketService";

export const dynamic = "force-dynamic";

const POPULAR_ASSETS = [
  "BTC", "ETH", "SOL", "NVDA", "AAPL", "MSFT", "TSLA", "AMZN", "META",
  "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "TATAMOTORS", "SBIN",
  "NIFTY50", "SENSEX", "SPY", "QQQ"
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") || "").trim().toUpperCase();
  const assetType = (searchParams.get("asset_type") || "ALL").toUpperCase();
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const matchedSymbols = POPULAR_ASSETS.filter((sym) => {
    if (!query) return true;
    return sym.includes(query);
  });

  if (query && !matchedSymbols.includes(query) && query.length <= 15) {
    matchedSymbols.unshift(query);
  }

  const results = matchedSymbols.slice(0, limit).map((sym) => resolveAssetMetadata(sym));

  const filtered = assetType === "ALL"
    ? results
    : results.filter((r) => r.assetType === assetType);

  return NextResponse.json({
    count: filtered.length,
    query,
    assets: filtered,
  });
}
