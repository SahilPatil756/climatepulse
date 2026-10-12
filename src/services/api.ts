/**
 * ClimatePulse Frontend API Service
 * Calls server API endpoints with resilient error handling and types.
 */

import {
  AirQualityMetrics,
  AnomalyRecord,
  CityComparisonData,
  ClimateImpactScore,
  ClimateStats,
  CorrelationMatrix,
  CurrentWeather,
  DailyDataPoint,
  HourlyDataPoint,
  LocationInfo,
  SystemHealthInfo,
} from '../types/climate.ts';

export interface CurrentClimateResponse {
  location: LocationInfo;
  current: CurrentWeather;
  aqi: AirQualityMetrics;
  stats: ClimateStats;
  impactScore: ClimateImpactScore;
  anomaliesCount: number;
  timestamp: string;
}

export interface HistoricalClimateResponse {
  location: LocationInfo;
  days: number;
  hourly: HourlyDataPoint[];
  daily: DailyDataPoint[];
}

export interface AirQualityResponse {
  location: LocationInfo;
  current: AirQualityMetrics;
  recentTrend: Array<{
    time: string;
    aqi: number;
    pm25: number;
    pm10: number;
  }>;
}

export interface CompareCitiesResponse {
  results: CityComparisonData[];
}

export interface AnomaliesResponse {
  location: LocationInfo;
  anomalies: AnomalyRecord[];
  totalDetected: number;
  baselineHoursEvaluated: number;
}

export interface InsightsResponse {
  location: LocationInfo;
  insights: Array<{
    id: string;
    title: string;
    category: 'temperature' | 'air_quality' | 'rainfall' | 'extreme' | 'overview';
    severity: 'info' | 'warning' | 'alert' | 'positive';
    summary: string;
    details: string;
    generatedAt: string;
    source: 'gemini-ai' | 'analytics-engine';
  }>;
  generatedAt: string;
}

export interface CarbonResponse {
  currentPpm: number;
  annualIncreasePpm: number;
  historicalTrend: Array<{ year: number; month: string; ppm: number; anomaly: number }>;
  description: string;
  dataSource: string;
}

export async function fetchCurrentClimate(city = 'Pune'): Promise<CurrentClimateResponse> {
  const res = await fetch(`/api/climate/current?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}: Failed to fetch current climate for ${city}`);
  return res.json();
}

export async function fetchHistoricalClimate(city = 'Pune', days = 14): Promise<HistoricalClimateResponse> {
  const res = await fetch(`/api/climate/history?city=${encodeURIComponent(city)}&days=${days}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}: Failed to fetch historical climate`);
  return res.json();
}

export async function fetchAirQuality(city = 'Pune'): Promise<AirQualityResponse> {
  const res = await fetch(`/api/air-quality?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}: Failed to fetch air quality`);
  return res.json();
}

export async function fetchCompareCities(cities: string[]): Promise<CompareCitiesResponse> {
  const param = cities.join(',');
  const res = await fetch(`/api/compare?cities=${encodeURIComponent(param)}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}: Failed to compare cities`);
  return res.json();
}

export async function fetchAnomalies(city = 'Pune'): Promise<AnomaliesResponse> {
  const res = await fetch(`/api/anomalies?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}: Failed to fetch anomalies`);
  return res.json();
}

export async function fetchInsights(city = 'Pune'): Promise<InsightsResponse> {
  const res = await fetch(`/api/insights?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}: Failed to fetch AI insights`);
  return res.json();
}

export async function fetchCorrelation(city = 'Pune'): Promise<CorrelationMatrix & { location: LocationInfo }> {
  const res = await fetch(`/api/correlation?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}: Failed to fetch correlation matrix`);
  return res.json();
}

export async function searchLocations(query: string): Promise<LocationInfo[]> {
  const res = await fetch(`/api/locations?query=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.results || [];
}

export async function fetchCarbonData(): Promise<CarbonResponse> {
  const res = await fetch('/api/carbon');
  if (!res.ok) throw new Error(`HTTP error ${res.status}: Failed to fetch carbon data`);
  return res.json();
}

export async function fetchAdminHealth(): Promise<SystemHealthInfo & { qualityAuditLogs: any[] }> {
  const res = await fetch('/api/admin/health');
  if (!res.ok) throw new Error(`HTTP error ${res.status}: Failed to fetch system health`);
  return res.json();
}
