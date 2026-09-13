import { NextRequest, NextResponse } from "next/server";
import { resolveAssetMetadata } from "@/lib/serverMarketService";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol || "BTC";
  const meta = resolveAssetMetadata(symbol);

  // No real news API is integrated yet — return empty articles honestly
  return NextResponse.json({
    symbol,
    name: meta.name,
    data_status: "UNAVAILABLE",
    message: "News API integration is not yet configured. No articles available.",
    articles: [],
  });
}
