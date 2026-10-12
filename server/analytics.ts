/**
 * ClimatePulse Analytics Engine
 * Provides statistical algorithms, anomaly detection (Z-score, IQR, isolation score),
 * moving averages, Pearson correlation, and Climate Impact Score computation.
 */

import {
  AnomalyRecord,
  ClimateImpactScore,
  ClimateImpactWeights,
  ClimateStats,
  CorrelationMatrix,
  DailyDataPoint,
  HourlyDataPoint,
} from '../src/types/climate.ts';

// Helper: Calculate arithmetic mean
export function calculateMean(values: number[]): number {
  if (!values.length) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Number((sum / values.length).toFixed(2));
}

// Helper: Calculate sample standard deviation
export function calculateStdDev(values: number[], mean?: number): number {
  if (values.length < 2) return 0;
  const m = mean !== undefined ? mean : calculateMean(values);
  const variance = values.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / (values.length - 1);
  return Number(Math.sqrt(variance).toFixed(2));
}

// Helper: Calculate quantiles (e.g. 0.25 for Q1, 0.75 for Q3)
export function calculateQuantile(values: number[], q: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return Number((sorted[base] + rest * (sorted[base + 1] - sorted[base])).toFixed(2));
  }
  return Number(sorted[base].toFixed(2));
}

// Calculate simple moving average with window size k
export function calculateMovingAverage(values: number[], windowSize: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < windowSize - 1) {
      result.push(null);
    } else {
      const window = values.slice(i - windowSize + 1, i + 1);
      const avg = window.reduce((sum, v) => sum + v, 0) / windowSize;
      result.push(Number(avg.toFixed(2)));
    }
  }
  return result;
}

// Pearson correlation coefficient between two numeric series
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  const sliceX = x.slice(0, n);
  const sliceY = y.slice(0, n);

  const meanX = calculateMean(sliceX);
  const meanY = calculateMean(sliceY);

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = sliceX[i] - meanX;
    const diffY = sliceY[i] - meanY;
    numerator += diffX * diffY;
    denomX += diffX * diffX;
    denomY += diffY * diffY;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(3));
}

// Build Pearson correlation matrix for climate metrics
export function computeCorrelationMatrix(dataPoints: HourlyDataPoint[]): CorrelationMatrix {
  const variables = ['Temperature', 'AQI', 'Humidity', 'Rainfall', 'UV Index', 'Wind Speed'];
  const series: Record<string, number[]> = {
    Temperature: dataPoints.map((d) => d.temperature),
    AQI: dataPoints.map((d) => d.usAqi || 50),
    Humidity: dataPoints.map((d) => d.humidity),
    Rainfall: dataPoints.map((d) => d.precipitation),
    'UV Index': dataPoints.map((d) => d.uvIndex),
    'Wind Speed': dataPoints.map((d) => d.windSpeed),
  };

  const matrix: number[][] = [];
  for (let i = 0; i < variables.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < variables.length; j++) {
      if (i === j) {
        row.push(1.0);
      } else {
        const corr = calculatePearsonCorrelation(series[variables[i]], series[variables[j]]);
        row.push(corr);
      }
    }
    matrix.push(row);
  }

  return {
    variables,
    matrix,
    disclaimer:
      'Statistical associations represent historical co-variance in observed measurements and do not imply causal mechanisms.',
  };
}

// Detect statistical anomalies using both Z-Score and Interquartile Range (IQR)
export function detectAnomalies(
  dataPoints: HourlyDataPoint[],
  currentMetrics: { temperature: number; aqi: number; rainfall: number; windSpeed: number; pressure: number }
): AnomalyRecord[] {
  const anomalies: AnomalyRecord[] = [];
  const nowStr = new Date().toISOString();

  // 1. Temperature Anomaly Check
  const temps = dataPoints.map((d) => d.temperature);
  if (temps.length >= 10) {
    const mean = calculateMean(temps);
    const stdDev = Math.max(0.8, calculateStdDev(temps, mean));
    const zScore = Number(((currentMetrics.temperature - mean) / stdDev).toFixed(2));
    const normalMin = Number((mean - 2 * stdDev).toFixed(1));
    const normalMax = Number((mean + 2 * stdDev).toFixed(1));

    if (Math.abs(zScore) >= 2.0) {
      const severity = Math.abs(zScore) >= 3.0 ? 'extreme' : Math.abs(zScore) >= 2.5 ? 'high' : 'moderate';
      anomalies.push({
        id: `anom-temp-${Date.now()}`,
        timestamp: nowStr,
        metric: 'temperature',
        value: currentMetrics.temperature,
        baselineMean: mean,
        baselineStdDev: stdDev,
        zScore,
        normalRange: [normalMin, normalMax],
        severity,
        description: `Current temperature (${currentMetrics.temperature}°C) is ${Math.abs(zScore)}σ ${
          zScore > 0 ? 'above' : 'below'
        } the 14-day expected mean (${mean}°C).`,
        method: 'z-score',
      });
    }
  }

  // 2. Air Quality Anomaly Check (Z-score + IQR)
  const aqis = dataPoints.map((d) => d.usAqi || 50);
  if (aqis.length >= 10) {
    const meanAqi = calculateMean(aqis);
    const stdDevAqi = Math.max(5, calculateStdDev(aqis, meanAqi));
    const q1 = calculateQuantile(aqis, 0.25);
    const q3 = calculateQuantile(aqis, 0.75);
    const iqr = q3 - q1;
    const upperBound = Number((q3 + 1.5 * iqr).toFixed(1));
    const zScoreAqi = Number(((currentMetrics.aqi - meanAqi) / stdDevAqi).toFixed(2));

    if (currentMetrics.aqi > upperBound || zScoreAqi >= 2.0) {
      const severity = currentMetrics.aqi >= 200 || zScoreAqi >= 3.0 ? 'extreme' : currentMetrics.aqi >= 150 ? 'high' : 'moderate';
      anomalies.push({
        id: `anom-aqi-${Date.now()}`,
        timestamp: nowStr,
        metric: 'aqi',
        value: currentMetrics.aqi,
        baselineMean: meanAqi,
        baselineStdDev: stdDevAqi,
        zScore: zScoreAqi,
        normalRange: [Math.max(0, q1 - 1.5 * iqr), upperBound],
        severity,
        description: `Air Quality Index spike: Current AQI (${currentMetrics.aqi}) exceeds upper IQR threshold (${upperBound}) and baseline mean (${meanAqi}).`,
        method: currentMetrics.aqi > upperBound ? 'iqr' : 'z-score',
      });
    }
  }

  // 3. Precipitation / Extreme Rainfall Anomaly
  const rainValues = dataPoints.map((d) => d.precipitation);
  if (rainValues.length >= 10) {
    const meanRain = calculateMean(rainValues);
    const maxRainInHistory = Math.max(...rainValues);
    if (currentMetrics.rainfall > 10 && currentMetrics.rainfall > meanRain * 3) {
      anomalies.push({
        id: `anom-rain-${Date.now()}`,
        timestamp: nowStr,
        metric: 'rainfall',
        value: currentMetrics.rainfall,
        baselineMean: meanRain,
        baselineStdDev: calculateStdDev(rainValues, meanRain),
        zScore: Number(((currentMetrics.rainfall - meanRain) / (calculateStdDev(rainValues, meanRain) || 1)).toFixed(2)),
        normalRange: [0, Number((meanRain * 2).toFixed(1))],
        severity: currentMetrics.rainfall > 35 ? 'extreme' : 'high',
        description: `Unusual precipitation event: Recorded ${currentMetrics.rainfall} mm/hr vs historical average ${meanRain} mm/hr.`,
        method: 'z-score',
      });
    }
  }

  // 4. Wind Speed Spikes
  const windValues = dataPoints.map((d) => d.windSpeed);
  if (windValues.length >= 10) {
    const meanWind = calculateMean(windValues);
    const stdWind = Math.max(3, calculateStdDev(windValues, meanWind));
    const zWind = Number(((currentMetrics.windSpeed - meanWind) / stdWind).toFixed(2));
    if (zWind >= 2.3 || currentMetrics.windSpeed > 45) {
      anomalies.push({
        id: `anom-wind-${Date.now()}`,
        timestamp: nowStr,
        metric: 'wind',
        value: currentMetrics.windSpeed,
        baselineMean: meanWind,
        baselineStdDev: stdWind,
        zScore: zWind,
        normalRange: [0, Number((meanWind + 2 * stdWind).toFixed(1))],
        severity: currentMetrics.windSpeed > 60 ? 'extreme' : 'moderate',
        description: `High wind velocity detected: Current wind gust ${currentMetrics.windSpeed} km/h is ${zWind}σ above normal conditions.`,
        method: 'z-score',
      });
    }
  }

  // 5. Atmospheric Pressure (Sudden drop indicates cyclone/storm)
  const pressureValues = dataPoints.map((d) => d.pressure);
  if (pressureValues.length >= 10) {
    const meanPress = calculateMean(pressureValues);
    const stdPress = Math.max(2, calculateStdDev(pressureValues, meanPress));
    const zPress = Number(((currentMetrics.pressure - meanPress) / stdPress).toFixed(2));
    if (zPress <= -2.2) {
      anomalies.push({
        id: `anom-press-${Date.now()}`,
        timestamp: nowStr,
        metric: 'pressure',
        value: currentMetrics.pressure,
        baselineMean: meanPress,
        baselineStdDev: stdPress,
        zScore: zPress,
        normalRange: [Number((meanPress - 2 * stdPress).toFixed(1)), Number((meanPress + 2 * stdPress).toFixed(1))],
        severity: zPress <= -3.0 ? 'extreme' : 'high',
        description: `Barometric pressure depression: Pressure dropped to ${currentMetrics.pressure} hPa (${zPress}σ deviation), signaling convective instability or storm front.`,
        method: 'z-score',
      });
    }
  }

  return anomalies;
}

// Calculate Climate Impact Score (0 - 100) with transparent weights
export function computeClimateImpactScore(
  current: {
    temperature: number;
    aqi: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    uvIndex: number;
    pressure: number;
  },
  historicalAvgTemp: number,
  customWeights?: Partial<ClimateImpactWeights>
): ClimateImpactScore {
  const weights: ClimateImpactWeights = {
    temperatureAnomaly: customWeights?.temperatureAnomaly ?? 0.25,
    airQuality: customWeights?.airQuality ?? 0.3,
    extremeWeather: customWeights?.extremeWeather ?? 0.2,
    rainfallAnomaly: customWeights?.rainfallAnomaly ?? 0.15,
    uvExposure: customWeights?.uvExposure ?? 0.1,
  };

  // 1. Temperature Anomaly Component (0 - 100)
  // Deviation from regional seasonal baseline (e.g., >8°C delta = 100)
  const tempDelta = Math.abs(current.temperature - historicalAvgTemp);
  const tempScore = Math.min(100, Math.round((tempDelta / 8) * 100));

  // 2. Air Quality Component (0 - 100)
  // US AQI 0-500 scale mapped: AQI 0-50 -> 10-25; AQI 150 -> 70; AQI 300+ -> 100
  let aqiScore = 0;
  if (current.aqi <= 50) {
    aqiScore = (current.aqi / 50) * 20;
  } else if (current.aqi <= 100) {
    aqiScore = 20 + ((current.aqi - 50) / 50) * 25;
  } else if (current.aqi <= 150) {
    aqiScore = 45 + ((current.aqi - 100) / 50) * 25;
  } else if (current.aqi <= 200) {
    aqiScore = 70 + ((current.aqi - 150) / 50) * 15;
  } else {
    aqiScore = Math.min(100, 85 + ((current.aqi - 200) / 100) * 15);
  }
  aqiScore = Math.round(aqiScore);

  // 3. Extreme Weather (Wind + Pressure instability) (0 - 100)
  const windScore = Math.min(100, (current.windSpeed / 60) * 100);
  const pressureDeviation = Math.abs(current.pressure - 1013.25);
  const pressureScore = Math.min(100, (pressureDeviation / 30) * 100);
  const extremeWeatherScore = Math.round(windScore * 0.6 + pressureScore * 0.4);

  // 4. Rainfall Anomaly (0 - 100)
  // High rainfall rate > 25mm/hr = 100, or prolonged zero in extreme heat
  let rainScore = 0;
  if (current.rainfall > 0) {
    rainScore = Math.min(100, Math.round((current.rainfall / 20) * 100));
  } else if (current.temperature > 35 && current.humidity < 25) {
    rainScore = 40; // Arid / drought stress factor
  } else {
    rainScore = 10;
  }

  // 5. UV Exposure Component (0 - 100)
  // UV 0-2 low (15), 3-5 moderate (35), 6-7 high (65), 8-10 very high (85), 11+ extreme (100)
  const uvScore = Math.min(100, Math.round((current.uvIndex / 11) * 100));

  // Composite Weighted Sum
  const totalWeight =
    weights.temperatureAnomaly +
    weights.airQuality +
    weights.extremeWeather +
    weights.rainfallAnomaly +
    weights.uvExposure;

  const rawScore =
    (tempScore * weights.temperatureAnomaly +
      aqiScore * weights.airQuality +
      extremeWeatherScore * weights.extremeWeather +
      rainScore * weights.rainfallAnomaly +
      uvScore * weights.uvExposure) /
    (totalWeight || 1);

  const totalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  let status: 'Low Impact' | 'Moderate Impact' | 'High Impact' | 'Severe Impact' = 'Low Impact';
  let color = '#10b981'; // emerald-500
  if (totalScore >= 80) {
    status = 'Severe Impact';
    color = '#ef4444'; // red-500
  } else if (totalScore >= 60) {
    status = 'High Impact';
    color = '#f97316'; // orange-500
  } else if (totalScore >= 35) {
    status = 'Moderate Impact';
    color = '#eab308'; // yellow-500
  }

  return {
    totalScore,
    status,
    color,
    components: {
      temperatureAnomalyScore: tempScore,
      airQualityScore: aqiScore,
      extremeWeatherScore,
      rainfallAnomalyScore: rainScore,
      uvExposureScore: uvScore,
    },
    weights,
    explanation: `Calculated from: Air Quality (${Math.round(weights.airQuality * 100)}%), Temperature Anomaly (${Math.round(
      weights.temperatureAnomaly * 100
    )}%), Extreme Weather (${Math.round(weights.extremeWeather * 100)}%), Rainfall Anomaly (${Math.round(
      weights.rainfallAnomaly * 100
    )}%), and UV Exposure (${Math.round(weights.uvExposure * 100)}%).`,
  };
}

// Calculate climate summary statistics for historical data
export function calculateClimateStats(
  hourly: HourlyDataPoint[],
  currentTemp: number,
  prevTemp: number
): ClimateStats {
  const temps = hourly.map((h) => h.temperature);
  const aqis = hourly.map((h) => h.usAqi || 50);
  const rains = hourly.map((h) => h.precipitation);

  const avgTemp = calculateMean(temps);
  const minTemp = temps.length ? Math.min(...temps) : currentTemp;
  const maxTemp = temps.length ? Math.max(...temps) : currentTemp;
  const tempChange = Number((currentTemp - prevTemp).toFixed(1));
  const tempPctChange = prevTemp !== 0 ? Number((((currentTemp - prevTemp) / prevTemp) * 100).toFixed(1)) : 0;

  const avgAqi = calculateMean(aqis);
  const maxAqi = aqis.length ? Math.max(...aqis) : 50;

  const totalRainfall = Number(rains.reduce((sum, r) => sum + r, 0).toFixed(1));
  const avgRainfall = calculateMean(rains);
  const rainfallAnomalyPct = avgRainfall > 0 ? Number((((totalRainfall - avgRainfall * rains.length) / (avgRainfall * rains.length)) * 100).toFixed(1)) : 0;

  return {
    avgTemp,
    minTemp,
    maxTemp,
    tempChange,
    tempPctChange,
    avgAqi,
    maxAqi,
    totalRainfall,
    avgRainfall,
    rainfallAnomalyPct,
  };
}
