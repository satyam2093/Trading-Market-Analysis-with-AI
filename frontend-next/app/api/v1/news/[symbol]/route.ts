import { NextRequest, NextResponse } from "next/server";
import { fetchLiveMarketNews } from "@/lib/serverNewsService";
import { resolveAssetMetadata } from "@/lib/serverMarketService";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const rawSymbol = params.symbol || "MARKET";
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const meta = resolveAssetMetadata(rawSymbol);

  let articles = await fetchLiveMarketNews(limit, meta.name || rawSymbol);

  // If specific asset news yields few results, augment with broad market financial news
  if (articles.length < 3) {
    const generalNews = await fetchLiveMarketNews(limit);
    articles = [...articles, ...generalNews].slice(0, limit);
  }

  return NextResponse.json({
    symbol: rawSymbol,
    name: meta.name,
    timestamp: new Date().toISOString(),
    data_status: articles.length > 0 ? "LIVE" : "UNAVAILABLE",
    articles,
  });
}
