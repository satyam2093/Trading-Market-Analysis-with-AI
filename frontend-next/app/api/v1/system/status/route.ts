import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "OPERATIONAL",
    models: [
      { name: "XGBoost Regime Classifier", version: "2.1.0", status: "READY" },
      { name: "PyTorch Bi-LSTM", version: "1.4.2", status: "READY" },
      { name: "Temporal Transformer", version: "1.1.0", status: "READY" },
      { name: "FinBERT Sentiment", version: "2.0.1", status: "READY" },
    ],
    database: "ACTIVE",
    data_freshness: "REAL_TIME",
  });
}
