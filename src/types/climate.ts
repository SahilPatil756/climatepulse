export interface LocationInfo {
  id: string;
  city: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  elevation?: number;
}

export interface CurrentWeather {
  temperature: number; // °C
  apparentTemperature: number; // °C
  humidity: number; // %
  pressure: number; // hPa
  windSpeed: number; // km/h
  windDirection?: number; // degrees
  precipitation: number; // mm
  rain: number; // mm
  uvIndex: number; // 0-12
  weatherCode: number;
  weatherDescription: string;
  timestamp: string; // ISO string
}

export interface AirQualityMetrics {
  usAqi: number;
  europeanAqi: number;
  aqiStatus: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  pm25: number; // µg/m³
  pm10: number; // µg/m³
  co: number; // µg/m³
  no2: number; // µg/m³
  so2: number; // µg/m³
  o3: number; // µg/m³
  dust?: number; // µg/m³
  timestamp: string;
}

export interface HourlyDataPoint {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  pressure: number;
  windSpeed: number;
  uvIndex: number;
  usAqi?: number;
  pm25?: number;
  pm10?: number;
}

export interface DailyDataPoint {
  date: string;
  tempMax: number;
  tempMin: number;
  tempAvg: number;
  precipitationSum: number;
  uvIndexMax: number;
  windSpeedMax: number;
  movingAverage7d?: number;
  movingAverage30d?: number;
  usAqiAvg?: number;
}

export interface ClimateStats {
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  tempChange: number;
  tempPctChange: number;
  avgAqi: number;
  maxAqi: number;
  totalRainfall: number;
  avgRainfall: number;
  rainfallAnomalyPct: number;
}

export interface AnomalyRecord {
  id: string;
  timestamp: string;
  metric: 'temperature' | 'aqi' | 'rainfall' | 'wind' | 'pressure';
  value: number;
  baselineMean: number;
  baselineStdDev: number;
  zScore: number;
  normalRange: [number, number];
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  description: string;
  method: 'z-score' | 'iqr' | 'isolation-forest';
}

export interface ClimateImpactWeights {
  temperatureAnomaly: number; // default 0.25
  airQuality: number; // default 0.30
  extremeWeather: number; // default 0.20
  rainfallAnomaly: number; // default 0.15
  uvExposure: number; // default 0.10
}

export interface ClimateImpactScore {
  totalScore: number; // 0 - 100
  status: 'Low Impact' | 'Moderate Impact' | 'High Impact' | 'Severe Impact';
  color: string;
  components: {
    temperatureAnomalyScore: number;
    airQualityScore: number;
    extremeWeatherScore: number;
    rainfallAnomalyScore: number;
    uvExposureScore: number;
  };
  weights: ClimateImpactWeights;
  explanation: string;
}

export interface CityComparisonData {
  location: LocationInfo;
  temperature: number;
  aqi: number;
  aqiStatus: string;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  uvIndex: number;
  climateImpactScore: number;
}

export interface CorrelationMatrix {
  variables: string[];
  matrix: number[][]; // values between -1 and 1
  disclaimer: string;
}

export interface AIInsight {
  id: string;
  title: string;
  category: 'temperature' | 'air_quality' | 'rainfall' | 'extreme' | 'overview';
  severity: 'info' | 'warning' | 'alert' | 'positive';
  summary: string;
  details: string;
  generatedAt: string;
  source: 'gemini-ai' | 'analytics-engine';
}

export interface SystemHealthInfo {
  openMeteoWeatherApi: 'active' | 'degraded' | 'down';
  openMeteoAqiApi: 'active' | 'degraded' | 'down';
  geocodingApi: 'active' | 'degraded' | 'down';
  aiEngine: 'active' | 'fallback_mode';
  databaseStatus: 'connected';
  dataQualityScore: number; // e.g. 99.8
  totalRecordsProcessed: number;
  rejectedRecordsCount: number;
  lastIngestionTime: string;
  uptimeSeconds: number;
}
