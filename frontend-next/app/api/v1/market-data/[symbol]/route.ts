import { NextRequest, NextResponse } from "next/server";
import { fetchOHLCVFromServer, fetchLiveQuoteFromServer } from "@/lib/serverMarketService";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol || "BTC";
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const timeframe = searchParams.get("timeframe") || "1d";

  const ohlcv = await fetchOHLCVFromServer(symbol, limit);
  const live = await fetchLiveQuoteFromServer(symbol);

  return NextResponse.json({
    asset_info: ohlcv.meta,
    timeframe,
    data_status: ohlcv.data_status,
    market_status: live.data_status,
    last_updated: new Date().toISOString(),
    data: ohlcv.data,
  });
}
