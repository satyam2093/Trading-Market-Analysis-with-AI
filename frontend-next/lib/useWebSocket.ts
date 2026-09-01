"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WSMarketPayload, WSPredictionPayload } from "@/types/market";

type ConnectionState = "CONNECTED" | "RECONNECTING" | "DISCONNECTED";

function useWebSocket<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("DISCONNECTED");
  const socketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);
  const attemptsRef = useRef(0);
  const connect = useCallback(() => {
    if (stoppedRef.current) return;
    const socket = new WebSocket(url); socketRef.current = socket;
    socket.onopen = () => { attemptsRef.current = 0; setConnectionState("CONNECTED"); };
    socket.onmessage = (event) => { try { setData(JSON.parse(event.data) as T); } catch { /* ignore malformed payload */ } };
    socket.onerror = () => socket.close();
    socket.onclose = () => { if (stoppedRef.current) return; setConnectionState("RECONNECTING"); const delay = Math.min(30000, 1000 * 2 ** Math.min(attemptsRef.current++, 5)); timerRef.current = setTimeout(connect, delay); };
  }, [url]);
  useEffect(() => { stoppedRef.current = false; connect(); return () => { stoppedRef.current = true; if (timerRef.current) clearTimeout(timerRef.current); socketRef.current?.close(); }; }, [connect]);
  return { data, connectionState };
}

export function useMarketWebSocket(symbol: string, timeframe: string) {
  const base =
    process.env.NEXT_PUBLIC_WS_URL ||
    process.env.NEXT_PUBLIC_RENDER_WS_URL ||
    (process.env.NODE_ENV === "production" ? "wss://your-render-backend.onrender.com" : "ws://localhost:8000");

  const { data, connectionState } = useWebSocket<WSMarketPayload>(`${base}/ws/market/${encodeURIComponent(symbol)}?timeframe=${encodeURIComponent(timeframe)}`);
  return { marketData: data, connectionState };
}

export function usePredictionWebSocket(symbol: string) {
  const base =
    process.env.NEXT_PUBLIC_WS_URL ||
    process.env.NEXT_PUBLIC_RENDER_WS_URL ||
    (process.env.NODE_ENV === "production" ? "wss://your-render-backend.onrender.com" : "ws://localhost:8000");

  const { data, connectionState } = useWebSocket<WSPredictionPayload>(`${base}/ws/prediction/${encodeURIComponent(symbol)}`);
  return { predictionData: data, connectionState };
}
