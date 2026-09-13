import { NextRequest, NextResponse } from "next/server";
import { resolveAssetMetadata, ASSET_DIRECTORY } from "@/lib/serverMarketService";

export const dynamic = "force-dynamic";

const POPULAR_ASSETS = [
  // Indian Indices & Leaders
  "NIFTY50", "SENSEX", "BANKNIFTY", "TCS", "RELIANCE", "INFY", "HDFCBANK", "ICICIBANK", "TATAMOTORS", "SBIN",
  // US Indices & Leaders
  "SP500", "NASDAQ", "DOW", "NVDA", "AAPL", "MSFT", "TSLA", "AMZN", "META", "AMD",
  // Global Indices
  "SHANGHAI", "HANGSENG", "MOEX", "FTSE100", "NIKKEI225",
  // Crypto
  "BTC", "ETH", "SOL", "BNB", "XRP"
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = (searchParams.get("query") || "").trim().toUpperCase();
  const assetType = (searchParams.get("asset_type") || "ALL").toUpperCase();
  const limit = parseInt(searchParams.get("limit") || "60", 10);

  // All known keys from directory
  const allKnownSymbols = Array.from(new Set([...POPULAR_ASSETS, ...Object.keys(ASSET_DIRECTORY)]));

  const matchedSymbols = allKnownSymbols.filter((sym) => {
    if (!rawQuery) return true;
    const meta = resolveAssetMetadata(sym);
    return (
      sym.includes(rawQuery) ||
      meta.name.toUpperCase().includes(rawQuery) ||
      meta.exchange.toUpperCase().includes(rawQuery) ||
      (meta.country && meta.country.toUpperCase().includes(rawQuery))
    );
  });

  // If query is a custom ticker not in directory, prepend it so user can query arbitrary assets
  if (rawQuery && !matchedSymbols.includes(rawQuery) && rawQuery.length <= 15) {
    matchedSymbols.unshift(rawQuery);
  }

  const results = matchedSymbols.slice(0, limit).map((sym) => resolveAssetMetadata(sym));

  const filtered = assetType === "ALL"
    ? results
    : results.filter((r) => r.asset_type === assetType || r.assetType === assetType);

  return NextResponse.json({
    count: filtered.length,
    query: rawQuery,
    assets: filtered,
  });
}
