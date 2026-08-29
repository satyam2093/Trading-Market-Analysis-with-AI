"use client";

import { Cpu, ShieldCheck } from "lucide-react";

export default function ModelConsensusCard() {
  const models = [
    { name: "Model 1: Market Regime XGBoost", signal: "BULLISH", confidence: "74%", weight: "15%", status: "Active" },
    { name: "Model 2: Multi-Horizon Direction XGBoost", signal: "UP (+2.4%)", confidence: "68%", weight: "15%", status: "Active" },
    { name: "Model 3: Volatility Regressor", signal: "MEDIUM (22%)", confidence: "81%", weight: "10%", status: "Active" },
    { name: "Model 4: PyTorch Bi-LSTM / GRU", signal: "BULLISH", confidence: "70%", weight: "12%", status: "Active" },
    { name: "Model 5: PyTorch Temporal Transformer", signal: "BULLISH", confidence: "76%", weight: "12%", status: "Active" },
    { name: "Model 6: PyTorch Market Correlation GNN", signal: "BULLISH", confidence: "65%", weight: "8%", status: "Active" },
    { name: "Model 7: Audited Financial Statement NLP", signal: "POSITIVE", confidence: "85%", weight: "10%", status: "Active" },
    { name: "Model 8: Real-Time News & Event NLP", signal: "POSITIVE", confidence: "72%", weight: "8%", status: "Active" },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          8 AI Predictive Models Consensus & Transparency
        </h3>
        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> High Consensus (78%)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 font-semibold">AI MODEL MODULE</th>
              <th className="pb-3 font-semibold">INDIVIDUAL SIGNAL</th>
              <th className="pb-3 font-semibold">CONFIDENCE</th>
              <th className="pb-3 font-semibold">ENSEMBLE WEIGHT</th>
              <th className="pb-3 font-semibold text-right">HEALTH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {models.map((m, idx) => (
              <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-2.5 font-medium text-slate-200">{m.name}</td>
                <td className="py-2.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {m.signal}
                  </span>
                </td>
                <td className="py-2.5 text-cyan-400 font-bold">{m.confidence}</td>
                <td className="py-2.5 text-slate-400">{m.weight}</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
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
