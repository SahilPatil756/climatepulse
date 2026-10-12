"""
ClimatePulse Python Analytics Engine
Demonstrating Pandas, NumPy, and Scikit-learn for time-series analysis,
anomaly detection (Isolation Forest and Z-Score), and correlation matrices.
"""

from typing import Dict, List, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


class ClimateAnalyticsEngine:
    """
    Modular analytics calculations module for descriptive stats,
    moving averages, correlation matrices, and machine-learning anomaly detection.
    """

    @staticmethod
    def calculate_descriptive_stats(series: List[float]) -> Dict[str, float]:
        """Calculates mean, std, min, max, median using NumPy."""
        if not series:
            return {"mean": 0.0, "std": 0.0, "min": 0.0, "max": 0.0, "median": 0.0}

        arr = np.array(series, dtype=float)
        return {
            "mean": round(float(np.mean(arr)), 2),
            "std": round(float(np.std(arr, ddof=1) if len(arr) > 1 else 0.0), 2),
            "min": round(float(np.min(arr)), 2),
            "max": round(float(np.max(arr)), 2),
            "median": round(float(np.median(arr)), 2),
        }

    @staticmethod
    def compute_moving_averages(series: List[float], windows: List[int] = [7, 30]) -> Dict[str, List[float]]:
        """Computes rolling moving averages using Pandas."""
        s = pd.Series(series)
        result = {}
        for w in windows:
            ma = s.rolling(window=w, min_periods=1).mean()
            result[f"ma_{w}"] = [round(x, 2) for x in ma.tolist()]
        return result

    @staticmethod
    def detect_zscore_anomalies(
        values: List[float], current_value: float, threshold: float = 2.0
    ) -> Dict[str, Any]:
        """
        Z-Score Outlier Detection: z = (x - mean) / std.
        Flags values where |z| >= threshold.
        """
        if len(values) < 5:
            return {"is_anomaly": False, "z_score": 0.0}

        arr = np.array(values, dtype=float)
        mean = float(np.mean(arr))
        std = float(np.std(arr, ddof=1))
        if std == 0:
            std = 0.01

        z_score = round(float((current_value - mean) / std), 2)
        is_anomaly = abs(z_score) >= threshold

        return {
            "is_anomaly": is_anomaly,
            "z_score": z_score,
            "mean": round(mean, 2),
            "std": round(std, 2),
            "threshold": threshold,
            "normal_range": [round(mean - threshold * std, 2), round(mean + threshold * std, 2)],
        }

    @staticmethod
    def detect_isolation_forest_anomalies(
        dataframe: pd.DataFrame, feature_cols: List[str], contamination: float = 0.05
    ) -> List[int]:
        """
        Multivariate Anomaly Detection using Scikit-Learn IsolationForest.
        Returns indices of detected outlier points (-1 = outlier, 1 = inlier).
        """
        if len(dataframe) < 15:
            return []

        features = dataframe[feature_cols].fillna(dataframe[feature_cols].median())
        clf = IsolationForest(contamination=contamination, random_state=42)
        preds = clf.fit_predict(features)

        # Indices where prediction is -1
        outlier_indices = [int(i) for i, p in enumerate(preds) if p == -1]
        return outlier_indices

    @staticmethod
    def compute_correlation_matrix(df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        """Computes Pearson correlation matrix with statistical association disclaimer."""
        sub_df = df[columns].dropna()
        corr_matrix = sub_df.corr(method="pearson").round(3)

        return {
            "variables": columns,
            "matrix": corr_matrix.values.tolist(),
            "disclaimer": "Statistical associations indicate covariance in historical observations, not direct causation.",
        }

    @staticmethod
    def compute_composite_impact_score(
        temp_anomaly_score: float,
        aqi_score: float,
        extreme_weather_score: float,
        rain_anomaly_score: float,
        uv_score: float,
        weights: Dict[str, float] = None,
    ) -> Dict[str, Any]:
        """Computes composite Climate Impact Score from 0 to 100 with configurable weights."""
        if weights is None:
            weights = {
                "temperature": 0.25,
                "air_quality": 0.30,
                "extreme_weather": 0.20,
                "rainfall": 0.15,
                "uv": 0.10,
            }

        total_weight = sum(weights.values()) or 1.0
        score = (
            temp_anomaly_score * weights["temperature"]
            + aqi_score * weights["air_quality"]
            + extreme_weather_score * weights["extreme_weather"]
            + rain_anomaly_score * weights["rainfall"]
            + uv_score * weights["uv"]
        ) / total_weight

        clamped = max(0.0, min(100.0, round(score, 1)))
        status = "Low Impact"
        if clamped >= 80:
            status = "Severe Impact"
        elif clamped >= 60:
            status = "High Impact"
        elif clamped >= 35:
            status = "Moderate Impact"

        return {
            "score": clamped,
            "status": status,
            "weights": weights,
        }
