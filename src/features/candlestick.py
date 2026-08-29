import logging
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

class CandlestickEngine:
    """
    Candlestick Pattern Recognition & Analysis Engine.
    Detects 15 major candlestick patterns and calculates historical success rates.
    """

    SUPPORTED_PATTERNS = [
        "Doji", "Hammer", "Inverted Hammer", "Shooting Star", "Hanging Man",
        "Bullish Engulfing", "Bearish Engulfing", "Morning Star", "Evening Star",
        "Bullish Harami", "Bearish Harami", "Bullish Marubozu", "Bearish Marubozu",
        "Piercing Pattern", "Dark Cloud Cover", "Three White Soldiers", "Three Black Crows"
    ]

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Scans OHLCV DataFrame and appends boolean/strength columns for each supported pattern.
        """
        df_out = df.copy()
        if len(df_out) < 3:
            return df_out

        open_p = df_out["open"].values
        high_p = df_out["high"].values
        low_p = df_out["low"].values
        close_p = df_out["close"].values

        body = np.abs(close_p - open_p)
        candle_range = high_p - low_p
        candle_range = np.where(candle_range == 0, 1e-8, candle_range)
        body_ratio = body / candle_range

        upper_shadow = high_p - np.maximum(open_p, close_p)
        lower_shadow = np.minimum(open_p, close_p) - low_p

        is_green = close_p > open_p
        is_red = close_p < open_p

        n = len(df_out)

        # 1. Doji
        is_doji = body_ratio < 0.10

        # 2. Hammer & Hanging Man
        # Small body at top, lower shadow >= 2x body, upper shadow <= 0.2x body
        is_hammer_shape = (lower_shadow >= 2 * body) & (upper_shadow <= 0.2 * body) & (body_ratio < 0.35)
        # Trend context (simple 5-period return)
        ret_5 = df_out["close"].pct_change(5).fillna(0.0).values
        is_hammer = is_hammer_shape & (ret_5 < 0)  # After downtrend
        is_hanging_man = is_hammer_shape & (ret_5 > 0)  # After uptrend

        # 3. Inverted Hammer & Shooting Star
        # Small body at bottom, upper shadow >= 2x body, lower shadow <= 0.2x body
        is_inv_hammer_shape = (upper_shadow >= 2 * body) & (lower_shadow <= 0.2 * body) & (body_ratio < 0.35)
        is_inverted_hammer = is_inv_hammer_shape & (ret_5 < 0)
        is_shooting_star = is_inv_hammer_shape & (ret_5 > 0)

        # Vectorized 2-candle & 3-candle pattern placeholders
        is_bullish_engulfing = np.zeros(n, dtype=bool)
        is_bearish_engulfing = np.zeros(n, dtype=bool)
        is_morning_star = np.zeros(n, dtype=bool)
        is_evening_star = np.zeros(n, dtype=bool)
        is_bullish_harami = np.zeros(n, dtype=bool)
        is_bearish_harami = np.zeros(n, dtype=bool)
        is_bullish_marubozu = (is_green) & (body_ratio > 0.85)
        is_bearish_marubozu = (is_red) & (body_ratio > 0.85)
        is_piercing = np.zeros(n, dtype=bool)
        is_dark_cloud = np.zeros(n, dtype=bool)
        is_three_white_soldiers = np.zeros(n, dtype=bool)
        is_three_black_crows = np.zeros(n, dtype=bool)

        for i in range(1, n):
            # Bullish Engulfing
            if is_red[i-1] and is_green[i] and (close_p[i] >= open_p[i-1]) and (open_p[i] <= close_p[i-1]):
                is_bullish_engulfing[i] = True

            # Bearish Engulfing
            if is_green[i-1] and is_red[i] and (close_p[i] <= open_p[i-1]) and (open_p[i] >= close_p[i-1]):
                is_bearish_engulfing[i] = True

            # Bullish Harami
            if is_red[i-1] and is_green[i] and (open_p[i] >= close_p[i-1]) and (close_p[i] <= open_p[i-1]):
                is_bullish_harami[i] = True

            # Bearish Harami
            if is_green[i-1] and is_red[i] and (open_p[i] <= close_p[i-1]) and (close_p[i] >= open_p[i-1]):
                is_bearish_harami[i] = True

            # Piercing Pattern
            midpoint_prev = (open_p[i-1] + close_p[i-1]) / 2
            if is_red[i-1] and is_green[i] and (open_p[i] < low_p[i-1]) and (close_p[i] > midpoint_prev):
                is_piercing[i] = True

            # Dark Cloud Cover
            if is_green[i-1] and is_red[i] and (open_p[i] > high_p[i-1]) and (close_p[i] < midpoint_prev):
                is_dark_cloud[i] = True

        for i in range(2, n):
            # Morning Star
            if is_red[i-2] and (body_ratio[i-1] < 0.20) and is_green[i] and (close_p[i] > (open_p[i-2] + close_p[i-2]) / 2):
                is_morning_star[i] = True

            # Evening Star
            if is_green[i-2] and (body_ratio[i-1] < 0.20) and is_red[i] and (close_p[i] < (open_p[i-2] + close_p[i-2]) / 2):
                is_evening_star[i] = True

            # Three White Soldiers
            if is_green[i-2] and is_green[i-1] and is_green[i] and (close_p[i] > close_p[i-1] > close_p[i-2]) and (body_ratio[i] > 0.6) and (body_ratio[i-1] > 0.6):
                is_three_white_soldiers[i] = True

            # Three Black Crows
            if is_red[i-2] and is_red[i-1] and is_red[i] and (close_p[i] < close_p[i-1] < close_p[i-2]) and (body_ratio[i] > 0.6) and (body_ratio[i-1] > 0.6):
                is_three_black_crows[i] = True

        # Assign to DataFrame
        df_out["pattern_doji"] = is_doji
        df_out["pattern_hammer"] = is_hammer
        df_out["pattern_inverted_hammer"] = is_inverted_hammer
        df_out["pattern_shooting_star"] = is_shooting_star
        df_out["pattern_hanging_man"] = is_hanging_man
        df_out["pattern_bullish_engulfing"] = is_bullish_engulfing
        df_out["pattern_bearish_engulfing"] = is_bearish_engulfing
        df_out["pattern_morning_star"] = is_morning_star
        df_out["pattern_evening_star"] = is_evening_star
        df_out["pattern_bullish_harami"] = is_bullish_harami
        df_out["pattern_bearish_harami"] = is_bearish_harami
        df_out["pattern_bullish_marubozu"] = is_bullish_marubozu
        df_out["pattern_bearish_marubozu"] = is_bearish_marubozu
        df_out["pattern_piercing"] = is_piercing
        df_out["pattern_dark_cloud"] = is_dark_cloud
        df_out["pattern_three_white_soldiers"] = is_three_white_soldiers
        df_out["pattern_three_black_crows"] = is_three_black_crows

        return df_out

    def calculate_pattern_performance(self, df_with_patterns: pd.DataFrame, forward_horizon: int = 5) -> Dict[str, Dict[str, Any]]:
        """
        Calculates historical frequency and win-rate for detected candlestick patterns.
        Win-rate is defined as matching the expected directional return over `forward_horizon` candles.
        """
        df = df_with_patterns.copy()
        df["fwd_return"] = df["close"].pct_change(forward_horizon).shift(-forward_horizon)

        implication_map = {
            "pattern_hammer": ("BULLISH", "BULLISH"),
            "pattern_inverted_hammer": ("BULLISH", "BULLISH"),
            "pattern_bullish_engulfing": ("BULLISH", "BULLISH"),
            "pattern_morning_star": ("BULLISH", "BULLISH"),
            "pattern_bullish_harami": ("BULLISH", "BULLISH"),
            "pattern_bullish_marubozu": ("BULLISH", "BULLISH"),
            "pattern_piercing": ("BULLISH", "BULLISH"),
            "pattern_three_white_soldiers": ("BULLISH", "BULLISH"),
            "pattern_shooting_star": ("BEARISH", "BEARISH"),
            "pattern_hanging_man": ("BEARISH", "BEARISH"),
            "pattern_bearish_engulfing": ("BEARISH", "BEARISH"),
            "pattern_evening_star": ("BEARISH", "BEARISH"),
            "pattern_bearish_harami": ("BEARISH", "BEARISH"),
            "pattern_bearish_marubozu": ("BEARISH", "BEARISH"),
            "pattern_dark_cloud": ("BEARISH", "BEARISH"),
            "pattern_three_black_crows": ("BEARISH", "BEARISH"),
            "pattern_doji": ("NEUTRAL", "NEUTRAL")
        }

        performance_report: Dict[str, Dict[str, Any]] = {}

        for col, (p_name, impl) in implication_map.items():
            if col not in df.columns:
                continue

            pattern_mask = df[col] == True
            total_occurrences = int(pattern_mask.sum())

            if total_occurrences == 0:
                performance_report[col] = {
                    "pattern_name": col.replace("pattern_", "").replace("_", " ").title(),
                    "implication": impl,
                    "frequency": 0,
                    "win_rate": 0.50,
                    "avg_forward_return": 0.0
                }
                continue

            pattern_df = df[pattern_mask].dropna(subset=["fwd_return"])
            valid_occurrences = len(pattern_df)

            if valid_occurrences == 0:
                performance_report[col] = {
                    "pattern_name": col.replace("pattern_", "").replace("_", " ").title(),
                    "implication": impl,
                    "frequency": total_occurrences,
                    "win_rate": 0.50,
                    "avg_forward_return": 0.0
                }
                continue

            if impl == "BULLISH":
                wins = (pattern_df["fwd_return"] > 0).sum()
            elif impl == "BEARISH":
                wins = (pattern_df["fwd_return"] < 0).sum()
            else:  # NEUTRAL
                wins = (pattern_df["fwd_return"].abs() < 0.01).sum()

            win_rate = float(wins / valid_occurrences)
            avg_return = float(pattern_df["fwd_return"].mean())

            performance_report[col] = {
                "pattern_name": col.replace("pattern_", "").replace("_", " ").title(),
                "implication": impl,
                "frequency": total_occurrences,
                "win_rate": round(win_rate, 4),
                "avg_forward_return": round(avg_return, 4)
            }

        return performance_report
