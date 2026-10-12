"""
Unit tests for ClimatePulse analytics calculations.
Tests descriptive statistics, Z-score anomaly detection, moving averages, and impact scores.
"""

import unittest
from backend.app.analytics.engine import ClimateAnalyticsEngine

class TestClimateAnalytics(unittest.TestCase):

    def test_descriptive_stats(self):
        data = [20.0, 22.0, 24.0, 26.0, 28.0]
        stats = ClimateAnalyticsEngine.calculate_descriptive_stats(data)
        self.assertEqual(stats["mean"], 24.0)
        self.assertEqual(stats["min"], 20.0)
        self.assertEqual(stats["max"], 28.0)
        self.assertEqual(stats["median"], 24.0)

    def test_moving_averages(self):
        data = [10.0] * 10
        ma = ClimateAnalyticsEngine.compute_moving_averages(data, windows=[3])
        self.assertEqual(len(ma["ma_3"]), 10)
        self.assertEqual(ma["ma_3"][-1], 10.0)

    def test_zscore_anomaly_detection(self):
        # Normal baseline data
        baseline = [25.0, 26.0, 25.5, 24.8, 25.2, 26.1, 25.0]
        # Extreme observation: 38.0°C
        result = ClimateAnalyticsEngine.detect_zscore_anomalies(baseline, 38.0, threshold=2.0)
        self.assertTrue(result["is_anomaly"])
        self.assertGreater(result["z_score"], 2.0)

    def test_composite_impact_score(self):
        # Extreme hazard input
        score_high = ClimateAnalyticsEngine.compute_composite_impact_score(
            temp_anomaly_score=90.0,
            aqi_score=95.0,
            extreme_weather_score=80.0,
            rain_anomaly_score=75.0,
            uv_score=85.0
        )
        self.assertGreaterEqual(score_high["score"], 80.0)
        self.assertEqual(score_high["status"], "Severe Impact")

        # Favorable conditions input
        score_low = ClimateAnalyticsEngine.compute_composite_impact_score(
            temp_anomaly_score=10.0,
            aqi_score=15.0,
            extreme_weather_score=10.0,
            rain_anomaly_score=5.0,
            uv_score=10.0
        )
        self.assertLess(score_low["score"], 35.0)
        self.assertEqual(score_low["status"], "Low Impact")

if __name__ == "__main__":
    unittest.main()
