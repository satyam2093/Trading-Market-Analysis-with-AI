import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from typing import Dict, Any, Optional

def render_candlestick_chart(
    df: pd.DataFrame,
    asset_info: Dict[str, Any],
    timeframe: str = "1d",
    show_emas: bool = True,
    show_bollinger: bool = True,
    show_volume: bool = True
) -> go.Figure:
    """
    Phase 5: Interactive Candlestick Chart Component built with Plotly.
    Renders OHLC candlesticks, volume, EMA overlays, Bollinger Bands, and pattern indicators.
    """
    if df is None or df.empty:
        fig = go.Figure()
        fig.add_annotation(
            text="DATA UNAVAILABLE: No candlestick data found for selected asset.",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=16, color="#FF5252")
        )
        fig.update_layout(template="plotly_dark", height=400)
        return fig

    # Create subplots for Price Chart (row 1) and Volume Chart (row 2)
    rows = 2 if show_volume else 1
    row_heights = [0.8, 0.2] if show_volume else [1.0]

    fig = make_subplots(
        rows=rows, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.03,
        row_heights=row_heights
    )

    # 1. Candlestick Trace
    fig.add_trace(
        go.Candlestick(
            x=df['timestamp'],
            open=df['open'],
            high=df['high'],
            low=df['low'],
            close=df['close'],
            name='OHLC Price',
            increasing_line_color='#00E676',
            decreasing_line_color='#FF5252'
        ),
        row=1, col=1
    )

    # 2. Moving Averages
    if show_emas:
        if "ema_20" in df.columns:
            fig.add_trace(go.Scatter(x=df['timestamp'], y=df['ema_20'], line=dict(color='#FF9800', width=1.5), name='EMA 20'), row=1, col=1)
        if "ema_50" in df.columns:
            fig.add_trace(go.Scatter(x=df['timestamp'], y=df['ema_50'], line=dict(color='#00E5FF', width=1.5), name='EMA 50'), row=1, col=1)
        if "ema_200" in df.columns:
            fig.add_trace(go.Scatter(x=df['timestamp'], y=df['ema_200'], line=dict(color='#E040FB', width=1.5), name='EMA 200'), row=1, col=1)

    # 3. Bollinger Bands
    if show_bollinger and "bollinger_hband" in df.columns and "bollinger_lband" in df.columns:
        fig.add_trace(go.Scatter(x=df['timestamp'], y=df['bollinger_hband'], line=dict(color='#78909C', width=1, dash='dash'), name='Upper BB'), row=1, col=1)
        fig.add_trace(go.Scatter(x=df['timestamp'], y=df['bollinger_lband'], line=dict(color='#78909C', width=1, dash='dash'), name='Lower BB'), row=1, col=1)

    # 4. Candlestick Pattern Markers
    pattern_cols = [c for c in df.columns if c.startswith("pattern_")]
    for col in pattern_cols:
        triggers = df[df[col] == 1]
        if not triggers.empty:
            pattern_name = col.replace("pattern_", "").replace("_", " ").title()
            fig.add_trace(
                go.Scatter(
                    x=triggers['timestamp'],
                    y=triggers['high'] * 1.01,
                    mode='markers+text',
                    text=[pattern_name[:3].upper()] * len(triggers),
                    textposition='top center',
                    marker=dict(symbol='triangle-down', size=8, color='#FFD600'),
                    name=pattern_name
                ),
                row=1, col=1
            )

    # 5. Volume Histogram
    if show_volume and "volume" in df.columns:
        colors = ['#00E676' if close >= open_val else '#FF5252' for close, open_val in zip(df['close'], df['open'])]
        fig.add_trace(
            go.Bar(
                x=df['timestamp'],
                y=df['volume'],
                marker_color=colors,
                name='Volume',
                opacity=0.7
            ),
            row=2, col=1
        )

    # Layout Configuration
    symbol = asset_info.get("symbol", "")
    name = asset_info.get("name", symbol)
    currency = asset_info.get("currency", "USD")

    fig.update_layout(
        title=f"{name} ({symbol}) • {timeframe.upper()} Candlestick Chart ({currency})",
        template="plotly_dark",
        height=550,
        margin=dict(l=15, r=15, t=40, b=15),
        xaxis_rangeslider_visible=False,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )

    fig.update_yaxes(title_text=f"Price ({currency})", row=1, col=1)
    if show_volume:
        fig.update_yaxes(title_text="Volume", row=2, col=1)

    return fig
