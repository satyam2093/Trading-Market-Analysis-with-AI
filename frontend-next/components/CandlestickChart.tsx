"use client";

import { useState } from "react";
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Bar, Line, CartesianGrid } from "recharts";
import { BarChart2, Layers } from "lucide-react";

interface CandlePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema_20?: number;
  ema_50?: number;
  ema_200?: number;
}

interface ChartProps {
  symbol: string;
  data?: CandlePoint[];
}

export default function CandlestickChart({ symbol, data = [] }: ChartProps) {
  const [timeframe, setTimeframe] = useState("1D");
  const [showEMA, setShowEMA] = useState(true);

  // Fallback data points for clean rendering if data loading
  const chartData = data.length > 0 ? data : Array.from({ length: 30 }).map((_, i) => {
    const base = 100000 + i * 200 + Math.sin(i) * 500;
    return {
      timestamp: `Day ${i + 1}`,
      open: base - 100,
      high: base + 400,
      low: base - 300,
      close: base + 200,
      volume: 15000 + Math.random() * 5000,
      ema_20: base + 50,
      ema_50: base - 100,
    };
  });

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#26Afe6]" />
            NexQuant Interactive Price Chart ({symbol})
          </h3>
          <p className="text-xs text-slate-400">Real-time OHLC bars with Volume and Exponential Moving Averages</p>
        </div>

        {/* Timeframe & Overlay Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
              showEMA ? "bg-[#Fe3Dce]/20 text-[#Fe3Dce] border-[#Fe3Dce]/40" : "bg-[#0b111b] text-slate-400 border-[#2b313a]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> EMAs
          </button>
          {["1D", "1W", "1M", "ALL"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                timeframe === tf
                  ? "bg-gradient-to-r from-[#Fe3Dce] to-[#26Afe6] text-white font-bold shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2b313a" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="price" orientation="right" domain={["auto", "auto"]} stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="volume" orientation="left" domain={[0, "auto"]} hide />

            <Tooltip
              contentStyle={{ backgroundColor: "#131923", borderColor: "#2b313a", borderRadius: "12px", color: "#f8fafc" }}
              formatter={(val: any, name: string) => [
                typeof val === "number" ? val.toLocaleString(undefined, { minimumFractionDigits: 2 }) : val,
                name.toUpperCase(),
              ]}
            />

            {/* Volume Bar Overlay */}
            <Bar yAxisId="volume" dataKey="volume" fill="#2b313a" opacity={0.4} radius={[4, 4, 0, 0]} />

            {/* Close Price Line in NexQuant Cyan */}
            <Line yAxisId="price" type="monotone" dataKey="close" stroke="#26Afe6" strokeWidth={2.5} dot={false} name="Close Price" />

            {/* EMA Overlays in NexQuant Magenta & Purple */}
            {showEMA && <Line yAxisId="price" type="monotone" dataKey="ema_20" stroke="#Fe3Dce" strokeWidth={1.5} dot={false} name="EMA 20" />}
            {showEMA && <Line yAxisId="price" type="monotone" dataKey="ema_50" stroke="#9989Ff" strokeWidth={1.5} dot={false} name="EMA 50" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Indicator Legend */}
      <div className="flex items-center gap-6 mt-4 pt-3 border-t border-[#2b313a] text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#26Afe6]"></span> Close Price</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#Fe3Dce]"></span> EMA 20</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#9989Ff]"></span> EMA 50</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span> Volume Bars</span>
      </div>
    </div>
  );
}
