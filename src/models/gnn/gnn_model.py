import os
import logging
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim

logger = logging.getLogger(__name__)

class SimpleGNNLayer(nn.Module):
    """Simple Graph Convolutional Layer (message-passing) without requiring torch_geometric."""

    def __init__(self, in_features: int, out_features: int):
        super(SimpleGNNLayer, self).__init__()
        self.linear = nn.Linear(in_features, out_features)

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> torch.Tensor:
        # adj: (N, N) adjacency matrix, x: (N, F)
        # Aggregate neighbor features via adjacency matrix
        support = self.linear(x)
        output = torch.mm(adj, support)
        return torch.relu(output)


class MarketGraphGNN(nn.Module):
    """2-layer GCN for market relationship graph."""

    def __init__(self, input_dim: int, hidden_dim: int = 32, output_dim: int = 16):
        super(MarketGraphGNN, self).__init__()
        self.layer1 = SimpleGNNLayer(input_dim, hidden_dim)
        self.layer2 = SimpleGNNLayer(hidden_dim, output_dim)
        self.classifier = nn.Linear(output_dim, 3)  # 3 regime classes

    def forward(self, x: torch.Tensor, adj: torch.Tensor) -> tuple:
        h = self.layer1(x, adj)
        embeddings = self.layer2(x=h, adj=adj)
        logits = self.classifier(embeddings)
        return logits, embeddings


class GNNModel:
    """
    Model 6: Graph Neural Network for Market Relationship Modeling.
    Builds a correlation-based asset graph and produces embeddings + regime predictions.
    """

    def __init__(self, hidden_dim: int = 32, embed_dim: int = 16):
        self.hidden_dim = hidden_dim
        self.embed_dim = embed_dim
        self.model: Optional[MarketGraphGNN] = None
        self.is_trained = False
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.asset_ids: List[str] = []
        self.feature_means: Optional[np.ndarray] = None
        self.feature_stds: Optional[np.ndarray] = None

    def build_correlation_graph(self, price_dict: Dict[str, pd.Series]) -> np.ndarray:
        """
        Builds NxN adjacency matrix from rolling price correlations.
        Edges are weighted by absolute Pearson correlation; thresholded at 0.3.
        """
        symbols = list(price_dict.keys())
        n = len(symbols)
        adj = np.eye(n, dtype=np.float32)  # Self-loops

        price_df = pd.DataFrame(price_dict)
        corr = price_df.pct_change().dropna().corr().fillna(0.0).values

        for i in range(n):
            for j in range(n):
                if i != j:
                    c = abs(float(corr[i][j]))
                    adj[i][j] = c if c > 0.3 else 0.0

        # Row-normalize adjacency
        row_sums = adj.sum(axis=1, keepdims=True)
        adj = adj / (row_sums + 1e-8)

        return adj.astype(np.float32)

    def build_node_features(self, feature_dict: Dict[str, Dict[str, float]]) -> np.ndarray:
        """
        Builds NxF node feature matrix from per-asset feature dictionaries.
        """
        feat_keys = ["returns_1", "returns_5", "volatility_20", "rsi_14", "adx_14", "volume_ma_ratio_20"]
        features = []
        for asset_id in self.asset_ids:
            feats = feature_dict.get(asset_id, {})
            row = [float(feats.get(k, 0.0)) for k in feat_keys]
            features.append(row)
        return np.array(features, dtype=np.float32)

    def train(self, price_dict: Dict[str, pd.Series], feature_dict: Dict[str, Dict[str, float]],
              label_dict: Dict[str, int], epochs: int = 30) -> Dict[str, Any]:
        """
        Trains the GNN on the market graph.
        label_dict maps asset_id -> regime label (0=SIDEWAYS, 1=BULLISH, 2=BEARISH).
        """
        self.asset_ids = list(price_dict.keys())
        n = len(self.asset_ids)

        adj = self.build_correlation_graph(price_dict)
        X = self.build_node_features(feature_dict)

        self.feature_means = X.mean(axis=0, keepdims=True)
        self.feature_stds = X.std(axis=0, keepdims=True) + 1e-8
        X_norm = (X - self.feature_means) / self.feature_stds

        labels = np.array([label_dict.get(aid, 0) for aid in self.asset_ids], dtype=np.int64)

        input_dim = X_norm.shape[1]
        self.model = MarketGraphGNN(input_dim=input_dim, hidden_dim=self.hidden_dim, output_dim=self.embed_dim).to(self.device)

        adj_t = torch.tensor(adj, dtype=torch.float32).to(self.device)
        x_t = torch.tensor(X_norm, dtype=torch.float32).to(self.device)
        y_t = torch.tensor(labels, dtype=torch.long).to(self.device)

        optimizer = optim.Adam(self.model.parameters(), lr=0.01)
        criterion = nn.CrossEntropyLoss()

        self.model.train()
        for epoch in range(epochs):
            optimizer.zero_grad()
            logits, _ = self.model(x_t, adj_t)
            loss = criterion(logits, y_t)
            loss.backward()
            optimizer.step()

        self.is_trained = True
        logger.info(f"GNNModel trained on {n} nodes for {epochs} epochs. Final loss: {loss.item():.4f}")
        return {"nodes": n, "epochs": epochs, "final_loss": round(float(loss.item()), 4)}

    def predict(self, price_dict: Dict[str, pd.Series], feature_dict: Dict[str, Dict[str, float]]) -> Dict[str, Dict[str, Any]]:
        if not self.is_trained or self.model is None:
            raise RuntimeError("GNNModel is not trained.")

        self.asset_ids = list(price_dict.keys())
        adj = self.build_correlation_graph(price_dict)
        X = self.build_node_features(feature_dict)
        X_norm = (X - self.feature_means) / self.feature_stds

        adj_t = torch.tensor(adj, dtype=torch.float32).to(self.device)
        x_t = torch.tensor(X_norm, dtype=torch.float32).to(self.device)

        self.model.eval()
        with torch.no_grad():
            logits, embeddings = self.model(x_t, adj_t)
            probs = torch.softmax(logits, dim=-1).cpu().numpy()
            embeds = embeddings.cpu().numpy()

        regime_map = {0: "SIDEWAYS", 1: "BULLISH", 2: "BEARISH"}
        results = {}
        for i, aid in enumerate(self.asset_ids):
            pred_cls = int(np.argmax(probs[i]))
            results[aid] = {
                "bullish_probability": round(float(probs[i][1]), 4),
                "bearish_probability": round(float(probs[i][2]), 4),
                "sideways_probability": round(float(probs[i][0]), 4),
                "predicted_regime": regime_map[pred_cls],
                "confidence": round(float(np.max(probs[i])), 4),
                "embedding": embeds[i].tolist()
            }
        return results

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        torch.save({
            "state_dict": self.model.state_dict(),
            "hidden_dim": self.hidden_dim,
            "embed_dim": self.embed_dim,
            "asset_ids": self.asset_ids,
            "feature_means": self.feature_means,
            "feature_stds": self.feature_stds
        }, filepath)

    def load(self, filepath: str):
        checkpoint = torch.load(filepath, map_location=self.device, weights_only=False)
        self.hidden_dim = checkpoint["hidden_dim"]
        self.embed_dim = checkpoint["embed_dim"]
        self.asset_ids = checkpoint["asset_ids"]
        self.feature_means = checkpoint["feature_means"]
        self.feature_stds = checkpoint["feature_stds"]
        input_dim = self.feature_means.shape[1]
        self.model = MarketGraphGNN(input_dim=input_dim, hidden_dim=self.hidden_dim, output_dim=self.embed_dim).to(self.device)
        self.model.load_state_dict(checkpoint["state_dict"])
        self.is_trained = True
