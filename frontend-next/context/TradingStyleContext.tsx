"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { TradingStyle, TradingStyleInfo } from "@/types/tradingStyle";
import { TRADING_STYLE_CONFIGS, getTradingStyleConfig } from "@/lib/tradingStyleConfig";

interface TradingStyleContextType {
  style: TradingStyle;
  styleInfo: TradingStyleInfo;
  setStyle: (style: TradingStyle) => void;
}

const TradingStyleContext = createContext<TradingStyleContextType>({
  style: "SWING",
  styleInfo: TRADING_STYLE_CONFIGS.SWING,
  setStyle: () => {},
});

export function TradingStyleProvider({ children }: { children: React.ReactNode }) {
  const [style, setStyleState] = useState<TradingStyle>("SWING");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexquant_trading_style");
      if (saved && ["SCALPER", "INTRADAY", "SWING", "INVESTOR"].includes(saved)) {
        setStyleState(saved as TradingStyle);
      }
    } catch {
      // LocalStorage unavailable in SSR
    }
  }, []);

  const setStyle = (newStyle: TradingStyle) => {
    setStyleState(newStyle);
    try {
      localStorage.setItem("nexquant_trading_style", newStyle);
    } catch {
      // Safe fallback
    }
  };

  const styleInfo = getTradingStyleConfig(style);

  return (
    <TradingStyleContext.Provider value={{ style, styleInfo, setStyle }}>
      {children}
    </TradingStyleContext.Provider>
  );
}

export function useTradingStyle() {
  return useContext(TradingStyleContext);
}
