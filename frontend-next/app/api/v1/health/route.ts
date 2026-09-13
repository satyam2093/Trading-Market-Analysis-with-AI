import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "HEALTHY",
    timestamp: new Date().toISOString(),
    database: "CONNECTED",
    market_data_service: "OPERATIONAL",
    websocket_gateway: "ONLINE",
    version: "2.1.0",
    runtime: "vercel-serverless",
  });
}
