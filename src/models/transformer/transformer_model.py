import os
import math
import logging
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

logger = logging.getLogger(__name__)

class PositionalEncoding(nn.Module):
    """Sinusoidal Positional Encoding for Temporal Transformer."""

    def __init__(self, d_model: int, max_len: int = 500):
        super(PositionalEncoding, self).__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # Shape: (1, max_len, d_model)
        self.register_buffer("pe", pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.pe[:, :x.size(1), :]


class PyTorchTemporalTransformer(nn.Module):
    """PyTorch Multi-Head Self-Attention Temporal Transformer Architecture."""

    def __init__(self, input_dim: int, d_model: int = 64, nhead: int = 4, num_layers: int = 2, dim_feedforward: int = 128, dropout: float = 0.2, num_classes: int = 3):
        super(PyTorchTemporalTransformer, self).__init__()
        
        self.input_projection = nn.Linear(input_dim, d_model)
        self.pos_encoder = PositionalEncoding(d_model=d_model)
        
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        self.fc1 = nn.Linear(d_model, 32)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(32, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch_size, seq_len, input_dim)
        h = self.input_projection(x)
        h = self.pos_encoder(h)
        h = self.transformer_encoder(h)  # (batch_size, seq_len, d_model)
        # Global Average Pooling over time dimension
        h = h.mean(dim=1)
        h = self.relu(self.fc1(h))
        logits = self.fc2(h)
        return logits


class TemporalTransformerModel:
    """
    Model 5: Temporal Transformer Model Wrapper.
    """

    FEATURE_COLS = [
        "returns_1", "returns_5", "volatility_20", "rsi_14", "macd",
        "macd_hist", "adx_14", "atr_14", "bollinger_pband", "volume_ma_ratio_20"
    ]

    REGIME_MAP = {0: "SIDEWAYS", 1: "BULLISH", 2: "BEARISH"}

    def __init__(self, seq_length: int = 20, d_model: int = 64, nhead: int = 4):
        self.seq_length = seq_length
        self.d_model = d_model
        self.nhead = nhead
        self.model: Optional[PyTorchTemporalTransformer] = None
        self.is_trained = False
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.feature_means: Optional[np.ndarray] = None
        self.feature_stds: Optional[np.ndarray] = None

    def prepare_sequences(self, df: pd.DataFrame, forward_horizon: int = 5, threshold: float = 0.015) -> Tuple[np.ndarray, np.ndarray]:
        df_feats = df.copy()
        for col in self.FEATURE_COLS:
            if col not in df_feats.columns:
                df_feats[col] = 0.0
            else:
                df_feats[col] = df_feats[col].astype(float)

        raw_feats = df_feats[self.FEATURE_COLS].fillna(0.0).values

        fwd_return = df["close"].pct_change(forward_horizon).shift(-forward_horizon).values
        labels = np.zeros(len(df), dtype=int)
        labels[fwd_return > threshold] = 1
        labels[fwd_return < -threshold] = 2

        X, y = [], []
        for i in range(len(df) - self.seq_length - forward_horizon):
            seq = raw_feats[i : i + self.seq_length]
            target = labels[i + self.seq_length - 1]
            X.append(seq)
            y.append(target)

        return np.array(X, dtype=np.float32), np.array(y, dtype=np.int64)

    def train(self, df: pd.DataFrame, epochs: int = 30, batch_size: int = 32, lr: float = 0.001) -> Dict[str, Any]:
        X_arr, y_arr = self.prepare_sequences(df)
        if len(X_arr) < 30:
            raise ValueError(f"Insufficient sequence samples ({len(X_arr)}) for Transformer training.")

        self.feature_means = X_arr.mean(axis=(0, 1), keepdims=True)
        self.feature_stds = X_arr.std(axis=(0, 1), keepdims=True) + 1e-8
        X_norm = (X_arr - self.feature_means) / self.feature_stds

        dataset = TensorDataset(torch.tensor(X_norm, dtype=torch.float32), torch.tensor(y_arr, dtype=torch.long))
        loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        input_dim = len(self.FEATURE_COLS)
        self.model = PyTorchTemporalTransformer(input_dim=input_dim, d_model=self.d_model, nhead=self.nhead).to(self.device)
        
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(self.model.parameters(), lr=lr)

        self.model.train()
        for epoch in range(epochs):
            for b_x, b_y in loader:
                b_x, b_y = b_x.to(self.device), b_y.to(self.device)
                optimizer.zero_grad()
                logits = self.model(b_x)
                loss = criterion(logits, b_y)
                loss.backward()
                optimizer.step()

        self.is_trained = True
        logger.info(f"TemporalTransformerModel trained on {len(X_arr)} sequences.")
        return {"samples": len(X_arr), "epochs": epochs, "final_loss": round(float(loss.item()), 4)}

    def predict(self, df: pd.DataFrame) -> Dict[str, Any]:
        if not self.is_trained or self.model is None:
            raise RuntimeError("TemporalTransformerModel is not trained.")

        df_feats = df.copy()
        for col in self.FEATURE_COLS:
            if col not in df_feats.columns:
                df_feats[col] = 0.0
            else:
                df_feats[col] = df_feats[col].astype(float)

        raw_feats = df_feats[self.FEATURE_COLS].tail(self.seq_length).fillna(0.0).values
        if len(raw_feats) < self.seq_length:
            pad_len = self.seq_length - len(raw_feats)
            raw_feats = np.pad(raw_feats, ((pad_len, 0), (0, 0)), mode="edge")

        seq = np.expand_dims(raw_feats, axis=0)
        if self.feature_means is not None and self.feature_stds is not None:
            seq = (seq - self.feature_means) / self.feature_stds

        self.model.eval()
        with torch.no_grad():
            b_x = torch.tensor(seq, dtype=torch.float32).to(self.device)
            logits = self.model(b_x)
            probs = torch.softmax(logits, dim=-1).cpu().numpy()[0]

        sideways_prob = float(probs[0])
        bullish_prob = float(probs[1])
        bearish_prob = float(probs[2])

        pred_cls = int(np.argmax(probs))
        pred_regime = self.REGIME_MAP[pred_cls]
        confidence = float(np.max(probs))

        return {
            "bullish_probability": round(bullish_prob, 4),
            "bearish_probability": round(bearish_prob, 4),
            "sideways_probability": round(sideways_prob, 4),
            "predicted_regime": pred_regime,
            "confidence": round(confidence, 4)
        }

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        torch.save({
            "state_dict": self.model.state_dict(),
            "seq_length": self.seq_length,
            "d_model": self.d_model,
            "nhead": self.nhead,
            "feature_means": self.feature_means,
            "feature_stds": self.feature_stds
        }, filepath)
        logger.info(f"Saved TemporalTransformerModel checkpoint to {filepath}")

    def load(self, filepath: str):
        checkpoint = torch.load(filepath, map_location=self.device, weights_only=False)
        self.seq_length = checkpoint["seq_length"]
        self.d_model = checkpoint["d_model"]
        self.nhead = checkpoint["nhead"]
        self.feature_means = checkpoint["feature_means"]
        self.feature_stds = checkpoint["feature_stds"]

        input_dim = len(self.FEATURE_COLS)
        self.model = PyTorchTemporalTransformer(input_dim=input_dim, d_model=self.d_model, nhead=self.nhead).to(self.device)
        self.model.load_state_dict(checkpoint["state_dict"])
        self.is_trained = True
        logger.info(f"Loaded TemporalTransformerModel checkpoint from {filepath}")
