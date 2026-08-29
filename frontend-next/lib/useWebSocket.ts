"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { WSMarketPayload, WSPredictionPayload } from "@/types/market";

interface UseWebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnects?: number;
}

function useWebSocket<T>(options: UseWebSocketOptions) {
  const { url, reconnectInterval = 3000, maxReconnects = 5 } = options;
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectCount.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as T;
          setData(payload);
        } catch {
          // Skip malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (reconnectCount.current < maxReconnects) {
          reconnectCount.current += 1;
          reconnectTimer.current = setTimeout(connect, reconnectInterval);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // Connection failed
    }
  }, [url, reconnectInterval, maxReconnects]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { data, isConnected };
}

export function useMarketWebSocket(symbol: string) {
  const url = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/ws/market/${symbol}`;
  const { data, isConnected } = useWebSocket<WSMarketPayload>({ url });
  return { marketData: data, isConnected };
}

export function usePredictionWebSocket(symbol: string) {
  const url = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/ws/prediction/${symbol}`;
  const { data, isConnected } = useWebSocket<WSPredictionPayload>({ url });
  return { predictionData: data, isConnected };
}
