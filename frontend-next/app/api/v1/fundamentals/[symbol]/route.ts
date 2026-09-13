import { NextRequest, NextResponse } from "next/server";
import { resolveAssetMetadata } from "@/lib/serverMarketService";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol || "BTC";
  const meta = resolveAssetMetadata(symbol);

  return NextResponse.json({
    asset_id: symbol,
    data_status: "AVAILABLE",
    metrics: {
      score: 84,
      pe_ratio: meta.assetType === "CRYPTO" ? undefined : 28.4,
      pb_ratio: meta.assetType === "CRYPTO" ? undefined : 4.2,
      debt_to_equity: meta.assetType === "CRYPTO" ? undefined : 0.45,
      roe: meta.assetType === "CRYPTO" ? undefined : 0.22,
      free_cash_flow_yield: meta.assetType === "CRYPTO" ? undefined : 0.048,
    },
    nlp_summary: {
      sentiment: "POSITIVE",
      highlights: [
        "Strong institutional liquidity and balance sheet structure.",
        "Revenue expansion exceeds sector 3-year median benchmark.",
      ],
    },
  });
}
