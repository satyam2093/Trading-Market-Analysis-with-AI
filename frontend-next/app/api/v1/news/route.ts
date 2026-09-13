import { NextRequest, NextResponse } from "next/server";
import { fetchLiveMarketNews } from "@/lib/serverNewsService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || undefined;
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const articles = await fetchLiveMarketNews(limit, symbol);

  return NextResponse.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    count: articles.length,
    symbol: symbol || "MARKET",
    data_status: articles.length > 0 ? "LIVE" : "UNAVAILABLE",
    articles,
  });
}
