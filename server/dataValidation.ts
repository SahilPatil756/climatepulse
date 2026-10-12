/**
 * ClimatePulse Data Quality and Ingestion Validation
 * Validates environmental telemetry against physical atmospheric boundaries,
 * checks for missing values, timestamps, and maintains audit logs for admin monitoring.
 */

export interface ValidationRecordLog {
  id: string;
  timestamp: string;
  city: string;
  passed: boolean;
  issues: string[];
  metricsSample: Record<string, number | null | undefined>;
}

export interface DataQualityReport {
  totalProcessed: number;
  totalValid: number;
  totalInvalid: number;
  passRatePercentage: number;
  recentLogs: ValidationRecordLog[];
}

class DataValidationService {
  private logs: ValidationRecordLog[] = [];
  private totalProcessed = 0;
  private totalValid = 0;
  private totalInvalid = 0;

  // Physical limits for atmospheric data
  public readonly LIMITS = {
    minTemp: -90, // °C (Vostok Station record is -89.2°C)
    maxTemp: 60, // °C (Furnace Creek record is 56.7°C)
    minHumidity: 0,
    maxHumidity: 100,
    minPressure: 800, // hPa (Tornadoes/typhoons rare drops ~870 hPa)
    maxPressure: 1100, // hPa (Siberian high max ~1084 hPa)
    minWindSpeed: 0,
    maxWindSpeed: 450, // km/h (Cyclone gusts)
    minRainfall: 0,
    maxRainfall: 500, // mm/hr extreme flash deluge
    minUvIndex: 0,
    maxUvIndex: 16,
    minAqi: 0,
    maxAqi: 500,
  };

  /**
   * Validate a single snapshot of climate metrics
   */
  public validateCurrentData(city: string, metrics: {
    temperature?: number | null;
    humidity?: number | null;
    pressure?: number | null;
    windSpeed?: number | null;
    precipitation?: number | null;
    uvIndex?: number | null;
    timestamp?: string | null;
  }): { valid: boolean; issues: string[]; cleanedData: Record<string, number> } {
    this.totalProcessed++;
    const issues: string[] = [];

    // 1. Timestamp validation
    if (!metrics.timestamp || isNaN(new Date(metrics.timestamp).getTime())) {
      issues.push('Missing or invalid ISO timestamp.');
    }

    // 2. Temperature validation
    if (metrics.temperature === null || metrics.temperature === undefined || isNaN(metrics.temperature)) {
      issues.push('Missing temperature observation.');
    } else if (metrics.temperature < this.LIMITS.minTemp || metrics.temperature > this.LIMITS.maxTemp) {
      issues.push(`Temperature ${metrics.temperature}°C is outside valid terrestrial atmospheric limits [-90, 60]°C.`);
    }

    // 3. Humidity validation
    if (metrics.humidity !== null && metrics.humidity !== undefined) {
      if (metrics.humidity < this.LIMITS.minHumidity || metrics.humidity > this.LIMITS.maxHumidity) {
        issues.push(`Relative humidity ${metrics.humidity}% is out of bounds [0, 100]%.`);
      }
    }

    // 4. Barometric Pressure
    if (metrics.pressure !== null && metrics.pressure !== undefined) {
      if (metrics.pressure < this.LIMITS.minPressure || metrics.pressure > this.LIMITS.maxPressure) {
        issues.push(`Atmospheric pressure ${metrics.pressure} hPa is out of physical range [800, 1100] hPa.`);
      }
    }

    // 5. Rainfall validation (Negative rainfall is impossible)
    if (metrics.precipitation !== null && metrics.precipitation !== undefined) {
      if (metrics.precipitation < this.LIMITS.minRainfall) {
        issues.push(`Precipitation ${metrics.precipitation} mm cannot be negative.`);
      }
    }

    // 6. Wind speed
    if (metrics.windSpeed !== null && metrics.windSpeed !== undefined) {
      if (metrics.windSpeed < this.LIMITS.minWindSpeed || metrics.windSpeed > this.LIMITS.maxWindSpeed) {
        issues.push(`Wind speed ${metrics.windSpeed} km/h is outside valid terrestrial bounds [0, 450].`);
      }
    }

    const isValid = issues.length === 0;
    if (isValid) {
      this.totalValid++;
    } else {
      this.totalInvalid++;
    }

    const logEntry: ValidationRecordLog = {
      id: `val-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      city,
      passed: isValid,
      issues,
      metricsSample: {
        temperature: metrics.temperature,
        humidity: metrics.humidity,
        pressure: metrics.pressure,
        windSpeed: metrics.windSpeed,
        precipitation: metrics.precipitation,
        uvIndex: metrics.uvIndex,
      },
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > 50) this.logs.pop(); // keep last 50 audit entries

    const cleanedData: Record<string, number> = {
      temperature: metrics.temperature ?? 20,
      humidity: Math.max(0, Math.min(100, metrics.humidity ?? 50)),
      pressure: Math.max(800, Math.min(1100, metrics.pressure ?? 1013)),
      windSpeed: Math.max(0, metrics.windSpeed ?? 0),
      precipitation: Math.max(0, metrics.precipitation ?? 0),
      uvIndex: Math.max(0, Math.min(16, metrics.uvIndex ?? 0)),
    };

    return { valid: isValid, issues, cleanedData };
  }

  /**
   * Validate Air Quality data
   */
  public validateAirQuality(city: string, metrics: {
    usAqi?: number | null;
    pm25?: number | null;
    pm10?: number | null;
    co?: number | null;
    no2?: number | null;
    so2?: number | null;
    o3?: number | null;
  }): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (metrics.usAqi !== null && metrics.usAqi !== undefined) {
      if (metrics.usAqi < this.LIMITS.minAqi || metrics.usAqi > this.LIMITS.maxAqi) {
        issues.push(`US AQI ${metrics.usAqi} is outside standardized range [0, 500].`);
      }
    }

    const pollutantFields: Array<keyof typeof metrics> = ['pm25', 'pm10', 'co', 'no2', 'so2', 'o3'];
    for (const field of pollutantFields) {
      const val = metrics[field];
      if (val !== null && val !== undefined && val < 0) {
        issues.push(`Pollutant concentration ${field} (${val} µg/m³) cannot be negative.`);
      }
    }

    return { valid: issues.length === 0, issues };
  }

  public getQualityReport(): DataQualityReport {
    const passRate =
      this.totalProcessed > 0
        ? Number(((this.totalValid / this.totalProcessed) * 100).toFixed(2))
        : 100.0;

    return {
      totalProcessed: this.totalProcessed,
      totalValid: this.totalValid,
      totalInvalid: this.totalInvalid,
      passRatePercentage: passRate,
      recentLogs: this.logs.slice(0, 20),
    };
  }
}

export const dataValidator = new DataValidationService();
