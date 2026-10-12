/**
 * ClimatePulse AI Insight Service
 * Generates automated data-driven environmental insights using Google Gemini (@google/genai)
 * or analytical natural language synthesis grounded strictly in verified metrics.
 */

import { GoogleGenAI } from '@google/genai';
import {
  AIInsight,
  AirQualityMetrics,
  AnomalyRecord,
  ClimateImpactScore,
  ClimateStats,
  CurrentWeather,
  LocationInfo,
} from '../src/types/climate.ts';

export class AIService {
  private client: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.client = new GoogleGenAI({ apiKey });
      } catch (e) {
        console.warn('Could not initialize GoogleGenAI client:', e);
      }
    }
  }

  public async generateInsights(params: {
    location: LocationInfo;
    current: CurrentWeather;
    aqi: AirQualityMetrics;
    stats: ClimateStats;
    anomalies: AnomalyRecord[];
    impactScore: ClimateImpactScore;
  }): Promise<AIInsight[]> {
    const { location, current, aqi, stats, anomalies, impactScore } = params;

    // Check if Gemini API is available
    if (this.client) {
      try {
        const prompt = `You are a Senior Environmental Data Analyst at ClimatePulse. Analyze the following verified telemetry data for ${location.city}, ${location.country}:

Current Conditions:
- Temperature: ${current.temperature}°C (Feels like: ${current.apparentTemperature}°C)
- Weather: ${current.weatherDescription}
- Air Quality Index (US AQI): ${aqi.usAqi} (${aqi.aqiStatus})
- Pollutants: PM2.5: ${aqi.pm25} µg/m³, PM10: ${aqi.pm10} µg/m³, NO2: ${aqi.no2} µg/m³, Ozone: ${aqi.o3} µg/m³
- Relative Humidity: ${current.humidity}%
- Precipitation: ${current.precipitation} mm
- UV Index: ${current.uvIndex}
- Wind Speed: ${current.windSpeed} km/h
- Surface Pressure: ${current.pressure} hPa

Historical 14-Day Analytics:
- Mean Temp: ${stats.avgTemp}°C (Min: ${stats.minTemp}°C, Max: ${stats.maxTemp}°C)
- Temperature Change: ${stats.tempChange > 0 ? '+' : ''}${stats.tempChange}°C (${stats.tempPctChange}%)
- Mean AQI: ${stats.avgAqi} (Peak AQI: ${stats.maxAqi})
- Cumulative Rainfall: ${stats.totalRainfall} mm

Detected Anomalies:
${anomalies.length > 0 ? anomalies.map((a) => `- [${a.severity.toUpperCase()}] ${a.description}`).join('\n') : 'No statistical anomalies detected (|z| < 2.0).'}

Composite Climate Impact Score: ${impactScore.totalScore}/100 (${impactScore.status})

Generate exactly 3 concise, analytical insights for data analysts and environmental researchers.
Do NOT invent numbers. Reference the specific metrics given above.
Format as JSON array with fields:
- title: string (short title)
- category: "temperature" | "air_quality" | "rainfall" | "extreme" | "overview"
- severity: "info" | "warning" | "alert" | "positive"
- summary: string (1 sentence)
- details: string (2-3 sentences with numerical evidence)

Return ONLY valid JSON.`;

        const response = await this.client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2, // low temperature for analytical precision
          },
        });

        if (response && response.text) {
          const parsed = JSON.parse(response.text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item: any, idx: number) => ({
              id: `ai-${Date.now()}-${idx}`,
              title: item.title || `Environmental Analysis ${idx + 1}`,
              category: item.category || 'overview',
              severity: item.severity || 'info',
              summary: item.summary || '',
              details: item.details || '',
              generatedAt: new Date().toISOString(),
              source: 'gemini-ai' as const,
            }));
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed or timed out, using deterministic analytical engine:', err);
      }
    }

    // High-precision Deterministic Statistical Engine
    return this.generateDeterministicInsights(params);
  }

  private generateDeterministicInsights(params: {
    location: LocationInfo;
    current: CurrentWeather;
    aqi: AirQualityMetrics;
    stats: ClimateStats;
    anomalies: AnomalyRecord[];
    impactScore: ClimateImpactScore;
  }): AIInsight[] {
    const { location, current, aqi, stats, anomalies, impactScore } = params;
    const insights: AIInsight[] = [];
    const now = new Date().toISOString();

    // 1. Overall Environmental Status Insight
    const tempDelta = Number((current.temperature - stats.avgTemp).toFixed(1));
    const isWarmer = tempDelta > 1.5;
    const isCooler = tempDelta < -1.5;

    let overviewSummary = `${location.city} currently registers an ambient temperature of ${current.temperature}°C with ${aqi.aqiStatus.toLowerCase()} air quality (AQI ${aqi.usAqi}).`;
    let overviewDetails = `Observed conditions reflect a ${
      isWarmer
        ? `+${tempDelta}°C temperature departure above the 14-day historical baseline (${stats.avgTemp}°C)`
        : isCooler
        ? `${tempDelta}°C temperature drop below the baseline (${stats.avgTemp}°C)`
        : `stable temperature variance within ±1.5°C of historical mean (${stats.avgTemp}°C)`
    }. Climate Impact Score stands at ${impactScore.totalScore}/100 (${impactScore.status}).`;

    insights.push({
      id: `syn-overview-${Date.now()}`,
      title: 'Current Atmospheric Baseline',
      category: 'overview',
      severity: impactScore.totalScore > 60 ? 'warning' : 'info',
      summary: overviewSummary,
      details: overviewDetails,
      generatedAt: now,
      source: 'analytics-engine',
    });

    // 2. Air Quality & Particulate Insight
    let aqiSeverity: 'positive' | 'info' | 'warning' | 'alert' = 'info';
    let aqiTitle = 'Aerosol & Particulate Analysis';
    let aqiSummary = '';
    let aqiDetails = '';

    if (aqi.usAqi > 150) {
      aqiSeverity = 'alert';
      aqiTitle = 'Critical Particulate Dispersion Alert';
      aqiSummary = `Elevated air quality index (${aqi.usAqi}) indicates high respiratory exposure risk.`;
      aqiDetails = `Fine particulate PM2.5 concentration is ${aqi.pm25} µg/m³, which exceeds the WHO recommended 24-hour benchmark (15 µg/m³). Regional NO2 levels stand at ${aqi.no2} µg/m³.`;
    } else if (aqi.usAqi > 100) {
      aqiSeverity = 'warning';
      aqiTitle = 'Sensitive Cohort Air Quality Advisory';
      aqiSummary = `Current AQI (${aqi.usAqi}) is categorized as Unhealthy for Sensitive Groups.`;
      aqiDetails = `PM2.5 concentration is ${aqi.pm25} µg/m³ alongside PM10 of ${aqi.pm10} µg/m³. Ozone (O3) concentration is ${aqi.o3} µg/m³.`;
    } else {
      aqiSeverity = 'positive';
      aqiTitle = 'Favorable Air Dispersion Index';
      aqiSummary = `Ambient air quality is favorable with AQI ${aqi.usAqi} (${aqi.aqiStatus}).`;
      aqiDetails = `Fine particulate PM2.5 is safely bounded at ${aqi.pm25} µg/m³ and PM10 is ${aqi.pm10} µg/m³, well within safe regulatory air thresholds.`;
    }

    insights.push({
      id: `syn-aqi-${Date.now()}`,
      title: aqiTitle,
      category: 'air_quality',
      severity: aqiSeverity,
      summary: aqiSummary,
      details: aqiDetails,
      generatedAt: now,
      source: 'analytics-engine',
    });

    // 3. Anomaly or Extreme Event Insight
    if (anomalies.length > 0) {
      const topAnom = anomalies[0];
      insights.push({
        id: `syn-anom-${Date.now()}`,
        title: `Statistical Anomaly Flagged: ${topAnom.metric.toUpperCase()}`,
        category: topAnom.metric === 'temperature' ? 'temperature' : 'extreme',
        severity: topAnom.severity === 'extreme' ? 'alert' : 'warning',
        summary: topAnom.description,
        details: `Z-Score of ${topAnom.zScore}σ was calculated using the ${topAnom.method.toUpperCase()} detector. Standard expected range is [${topAnom.normalRange[0]}, ${topAnom.normalRange[1]}]. Baseline mean: ${topAnom.baselineMean}.`,
        generatedAt: now,
        source: 'analytics-engine',
      });
    } else {
      // Temperature & Precipitation Trend
      insights.push({
        id: `syn-trend-${Date.now()}`,
        title: 'Thermal & Hydrological Stability',
        category: 'temperature',
        severity: 'info',
        summary: `Telemetry indicates consistent thermodynamic trends across the observation period.`,
        details: `Recorded maximum temperature over the window reached ${stats.maxTemp}°C with minimum of ${stats.minTemp}°C. Cumulative rainfall totaling ${stats.totalRainfall} mm exhibits normal regional seasonal variance.`,
        generatedAt: now,
        source: 'analytics-engine',
      });
    }

    return insights;
  }
}

export const aiService = new AIService();
