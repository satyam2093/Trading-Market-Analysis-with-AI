"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { TradingStyleProvider } from "@/context/TradingStyleContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TradingStyleProvider>
        <AuthProvider>{children}</AuthProvider>
      </TradingStyleProvider>
    </QueryClientProvider>
  );
}


