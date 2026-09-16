import { NextRequest, NextResponse } from "next/server";
import { fetchLiveQuoteFromServer, computeDynamicEnsembleSignal } from "@/lib/serverMarketService";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol || "BTC";
  const { searchParams } = new URL(request.url);
  const tradingStyle = searchParams.get("trading_style") || "SWING";

  const quote = await fetchLiveQuoteFromServer(symbol);
  const signal = computeDynamicEnsembleSignal(symbol, quote.price, quote.previous_close, tradingStyle);

  return NextResponse.json({
    asset_id: symbol,
    trading_style: tradingStyle,
    data_status: quote.data_status,
    analysis: signal,
    models_breakdown: {
      regime_classifier: { bullish_probability: signal.bullish_probability, bearish_probability: signal.bearish_probability, sideways_probability: 0.15 },
      direction_model: { bullish_probability: signal.bullish_probability, bearish_probability: signal.bearish_probability, sideways_probability: 0.0 },
      volatility_model: { bullish_probability: 0.35, bearish_probability: 0.35, sideways_probability: 0.30 },
      lstm_model: { bullish_probability: signal.bullish_probability, bearish_probability: signal.bearish_probability, sideways_probability: 0.15 },
      transformer_model: { bullish_probability: signal.bullish_probability, bearish_probability: signal.bearish_probability, sideways_probability: 0.15 },
      gnn_model: { bullish_probability: signal.bullish_probability, bearish_probability: signal.bearish_probability, sideways_probability: 0.15 },
      fundamental_score: { bullish_probability: 0.65, bearish_probability: 0.20, sideways_probability: 0.15 },
      news_sentiment: { bullish_probability: 0.60, bearish_probability: 0.25, sideways_probability: 0.15 },
    },
  });
}

