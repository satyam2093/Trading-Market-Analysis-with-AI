"use client";

import { Cpu, ShieldCheck } from "lucide-react";

export default function ModelConsensus() {
  const models = [
    { name: "Model 1: Market Regime Classifier (XGBoost)", signal: "BULLISH", confidence: "74%", weight: "15%", status: "Active" },
    { name: "Model 2: Multi-Horizon Direction (XGBoost)", signal: "UP (+2.4%)", confidence: "68%", weight: "15%", status: "Active" },
    { name: "Model 3: Volatility Regressor", signal: "MEDIUM (22%)", confidence: "81%", weight: "10%", status: "Active" },
    { name: "Model 4: PyTorch Bi-LSTM / GRU", signal: "BULLISH", confidence: "70%", weight: "12%", status: "Active" },
    { name: "Model 5: PyTorch Temporal Transformer", signal: "BULLISH", confidence: "76%", weight: "12%", status: "Active" },
    { name: "Model 6: PyTorch Market Correlation GNN", signal: "BULLISH", confidence: "65%", weight: "8%", status: "Active" },
    { name: "Model 7: Financial Statement NLP (FinBERT)", signal: "POSITIVE", confidence: "85%", weight: "10%", status: "Active" },
    { name: "Model 8: Real-Time News & Event NLP", signal: "POSITIVE", confidence: "72%", weight: "8%", status: "Active" },
  ];

  return (
    <div className="p-6 rounded-xl bg-surface border border-border space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            8 AI Predictive Models Consensus & Transparency
          </h3>
          <p className="text-xs text-muted-foreground">Individual model signals, weights, and health status</p>
        </div>
        <span className="text-xs font-mono text-bullish flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> High Consensus (78%)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="pb-3 font-semibold">AI MODEL MODULE</th>
              <th className="pb-3 font-semibold">INDIVIDUAL SIGNAL</th>
              <th className="pb-3 font-semibold">CONFIDENCE</th>
              <th className="pb-3 font-semibold">WEIGHT</th>
              <th className="pb-3 font-semibold text-right">HEALTH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {models.map((m, idx) => (
              <tr key={idx} className="hover:bg-elevated/40 transition-colors">
                <td className="py-2.5 font-medium text-foreground">{m.name}</td>
                <td className="py-2.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-bullish/10 text-bullish border border-bullish/20">
                    {m.signal}
                  </span>
                </td>
                <td className="py-2.5 text-foreground font-semibold tabular-nums">{m.confidence}</td>
                <td className="py-2.5 text-muted-foreground tabular-nums">{m.weight}</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] text-bullish bg-bullish/10 px-2 py-0.5 rounded border border-bullish/20">
                    ● {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
