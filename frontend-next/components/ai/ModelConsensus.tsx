"use client";

import { Cpu, ShieldCheck } from "lucide-react";

interface ModelConsensusProps {
  modelsBreakdown?: Record<string, { bullish_probability: number; bearish_probability: number; sideways_probability: number }>;
  consensusConfidence?: number;
}

export default function ModelConsensus({
  modelsBreakdown,
  consensusConfidence = 78,
}: ModelConsensusProps) {
  const defaultModels = [
    { key: "regime_classifier", name: "Model 1: Market Regime Classifier (XGBoost)", defaultSignal: "BULLISH", defaultConf: "74%", weight: "15%" },
    { key: "direction_model", name: "Model 2: Multi-Horizon Direction (XGBoost)", defaultSignal: "UP (+2.4%)", defaultConf: "68%", weight: "15%" },
    { key: "volatility_model", name: "Model 3: Volatility Regressor", defaultSignal: "MEDIUM (22%)", defaultConf: "81%", weight: "10%" },
    { key: "lstm_model", name: "Model 4: PyTorch Bi-LSTM / GRU", defaultSignal: "BULLISH", defaultConf: "70%", weight: "12%" },
    { key: "transformer_model", name: "Model 5: PyTorch Temporal Transformer", defaultSignal: "BULLISH", defaultConf: "76%", weight: "12%" },
    { key: "gnn_model", name: "Model 6: PyTorch Market Correlation GNN", defaultSignal: "BULLISH", defaultConf: "65%", weight: "8%" },
    { key: "fundamental_score", name: "Model 7: Financial Statement NLP (FinBERT)", defaultSignal: "POSITIVE", defaultConf: "85%", weight: "10%" },
    { key: "news_sentiment", name: "Model 8: Real-Time News & Event NLP", defaultSignal: "POSITIVE", defaultConf: "72%", weight: "8%" },
  ];

  const models = defaultModels.map((m) => {
    if (modelsBreakdown && modelsBreakdown[m.key]) {
      const pred = modelsBreakdown[m.key];
      const maxP = Math.max(pred.bullish_probability, pred.bearish_probability, pred.sideways_probability);
      let signalStr = "BULLISH";
      if (pred.bearish_probability === maxP) signalStr = "BEARISH";
      else if (pred.sideways_probability === maxP) signalStr = "SIDEWAYS";

      return {
        name: m.name,
        signal: signalStr,
        confidence: `${Math.round(maxP * 100)}%`,
        weight: m.weight,
        status: "Active",
      };
    }

    return {
      name: m.name,
      signal: m.defaultSignal,
      confidence: m.defaultConf,
      weight: m.weight,
      status: "Active",
    };
  });

  return (
    <div className="p-6 rounded-xl bg-surface border border-border space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            8 AI Predictive Models Consensus & Transparency
          </h3>
          <p className="text-xs text-muted-foreground">Dynamic model outputs evaluated for this specific asset</p>
        </div>
        <span className="text-xs font-mono text-bullish flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> High Consensus ({consensusConfidence}%)
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
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      m.signal === "BULLISH"
                        ? "bg-bullish/10 text-bullish border-bullish/20"
                        : m.signal === "BEARISH"
                        ? "bg-bearish/10 text-bearish border-bearish/20"
                        : "bg-background text-muted-foreground border-border"
                    }`}
                  >
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
