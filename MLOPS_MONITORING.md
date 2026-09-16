# MLOps Monitoring — NexQuant Platform

## Overview
This document describes the MLOps monitoring infrastructure for NexQuant's AI pipeline, covering model health, data quality, drift detection, and alerting.

## Monitoring Architecture

`
Data Ingestion → Feature Pipeline → Model Inference → Signal Delivery → P&L Tracking
      ↓                ↓                  ↓                ↓              ↓
  Data Quality    Feature Drift     Model Health      Latency SLA    Performance
   Monitors        Detectors         Checks           Monitors       Dashboards
`

## Data Quality Monitoring

### Market Data Checks
- **Staleness**: Alert if last candle age > 2× expected timeframe interval
- **Completeness**: Alert if >5% of OHLCV fields are NaN within a window
- **Outlier Detection**: Flag candles with returns > 10σ from rolling mean
- **Volume Anomaly**: Alert if volume drops >90% vs 20-period average

### News Data Checks
- **Feed Health**: Monitor API response codes; alert on >3 consecutive failures
- **Freshness**: Alert if no new articles in >30 minutes during market hours
- **Deduplication**: Track duplicate article rate; alert if >20%

## Model Health Monitoring

### Per-Model Metrics (logged per inference cycle)

| Model | Health Metric | Alert Threshold |
|-------|---------------|-----------------|
| Regime Classifier | Confidence entropy | Entropy > 0.95 (uniform = no signal) |
| Direction Model | Prediction stability | >80% same direction for 50+ candles |
| Volatility Model | Predicted vs realized MAE | MAE > 3× rolling baseline |
| LSTM | Sequence prediction variance | Variance < 1e-6 (collapsed model) |
| Transformer | Attention weight entropy | Entropy > 0.99 (unfocused attention) |
| News NLP | Sentiment distribution skew | All-neutral rate > 90% |
| Ensemble Engine | Signal flip rate | >20 flips per day (noise) |
| Sentiment Decay | Half-life calibration error | Predicted vs realized decay R² < 0.3 |

## Drift Detection

### Feature Drift
- **Method**: Kolmogorov-Smirnov test on 30-day rolling windows vs training distribution
- **Threshold**: p-value < 0.01 triggers retraining flag
- **Monitored Features**: RSI, MACD, Bollinger Width, ATR, Volume Z-score

### Concept Drift
- **Method**: Track rolling 30-day Sharpe ratio of ensemble signals
- **Threshold**: Sharpe drops below -0.5 for >5 consecutive days
- **Action**: Trigger walk-forward retraining with latest data

## Alerting & Escalation

| Severity | Response Time | Channel | Example |
|----------|---------------|---------|---------|
| P0 - Critical | Immediate | System log + restart | Model inference failure |
| P1 - High | < 1 hour | Log warning | Data feed down |
| P2 - Medium | < 4 hours | Log info | Feature drift detected |
| P3 - Low | Next session | Dashboard | Performance degradation |

## Retraining Policy

- **Scheduled**: Weekly walk-forward retraining on Sunday 00:00 UTC
- **Triggered**: On P2+ drift alerts or >3 consecutive losing days
- **Validation**: New model must beat current model on last 30 days OOS before promotion
- **Rollback**: If new model underperforms within 48 hours, auto-rollback to previous weights

## Infrastructure

- **Logging**: Python logging module with structured JSON output
- **Storage**: SQLite for model metadata, inference logs, and P&L tracking
- **Compute**: FastAPI backend handles inference; Streamlit dashboard for monitoring
- **Deployment**: Vercel (frontend), local/cloud (backend API)
