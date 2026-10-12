/**
 * ClimatePulse API Routes
 * Express router implementing all endpoints specified in the PRD.
 */

import { Router } from 'express';
import { aiService } from './aiService.ts';
import {
  calculateClimateStats,
  computeClimateImpactScore,
  computeCorrelationMatrix,
  detectAnomalies,
} from './analytics.ts';
import { dataValidator } from './dataValidation.ts';
import { openMeteoService, PRESET_CITIES } from './openMeteoService.ts';

const router = Router();
const serverStartTime = Date.now();

// 1. Current Climate Endpoint: GET /api/climate/current?city=Pune
router.get('/climate/current', async (req, res) => {
  try {
    const cityQuery = (req.query.city as string) || 'Pune';
    const location = await openMeteoService.resolveLocation(cityQuery);
    const [current, aqi, history] = await Promise.all([
      openMeteoService.getCurrentWeather(location),
      openMeteoService.getAirQuality(location),
      openMeteoService.getHistoricalSeries(location, 14),
    ]);

    const stats = calculateClimateStats(
      history.hourly,
      current.temperature,
      history.hourly.length > 24 ? history.hourly[history.hourly.length - 24].temperature : current.temperature
    );

    const anomalies = detectAnomalies(history.hourly, {
      temperature: current.temperature,
      aqi: aqi.usAqi,
      rainfall: current.precipitation,
      windSpeed: current.windSpeed,
      pressure: current.pressure,
    });

    const impactScore = computeClimateImpactScore(
      {
        temperature: current.temperature,
        aqi: aqi.usAqi,
        humidity: current.humidity,
        windSpeed: current.windSpeed,
        rainfall: current.precipitation,
        uvIndex: current.uvIndex,
        pressure: current.pressure,
      },
      stats.avgTemp
    );

    res.json({
      location,
      current,
      aqi,
      stats,
      impactScore,
      anomaliesCount: anomalies.length,
      timestamp: current.timestamp,
    });
  } catch (error: any) {
    console.error('Error fetching current climate:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch climate data' });
  }
});

// 2. Historical Climate Endpoint: GET /api/climate/history?city=Pune&days=30
router.get('/climate/history', async (req, res) => {
  try {
    const cityQuery = (req.query.city as string) || 'Pune';
    const days = parseInt(req.query.days as string, 10) || 14;
    const location = await openMeteoService.resolveLocation(cityQuery);
    const history = await openMeteoService.getHistoricalSeries(location, days);

    res.json({
      location,
      days,
      hourly: history.hourly,
      daily: history.daily,
    });
  } catch (error: any) {
    console.error('Error fetching historical climate:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch historical series' });
  }
});

// 3. Air Quality Endpoint: GET /api/air-quality?city=Pune
router.get('/air-quality', async (req, res) => {
  try {
    const cityQuery = (req.query.city as string) || 'Pune';
    const location = await openMeteoService.resolveLocation(cityQuery);
    const aqi = await openMeteoService.getAirQuality(location);
    const history = await openMeteoService.getHistoricalSeries(location, 7);

    res.json({
      location,
      current: aqi,
      recentTrend: history.hourly.slice(-48).map((h) => ({
        time: h.time,
        aqi: h.usAqi ?? 50,
        pm25: h.pm25 ?? 15,
        pm10: h.pm10 ?? 25,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching air quality:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch air quality' });
  }
});

// 4. Compare Cities Endpoint: GET /api/compare?cities=Pune,Mumbai,Delhi
router.get('/compare', async (req, res) => {
  try {
    const citiesParam = (req.query.cities as string) || 'Pune,Mumbai,Delhi';
    const cityNames = citiesParam.split(',').map((c) => c.trim()).filter(Boolean);

    const comparisons = await Promise.all(
      cityNames.map(async (cityName) => {
        try {
          const loc = await openMeteoService.resolveLocation(cityName);
          const [weather, aqi, history] = await Promise.all([
            openMeteoService.getCurrentWeather(loc),
            openMeteoService.getAirQuality(loc),
            openMeteoService.getHistoricalSeries(loc, 7),
          ]);

          const stats = calculateClimateStats(history.hourly, weather.temperature, weather.temperature);
          const impact = computeClimateImpactScore(
            {
              temperature: weather.temperature,
              aqi: aqi.usAqi,
              humidity: weather.humidity,
              windSpeed: weather.windSpeed,
              rainfall: weather.precipitation,
              uvIndex: weather.uvIndex,
              pressure: weather.pressure,
            },
            stats.avgTemp
          );

          return {
            location: loc,
            temperature: weather.temperature,
            aqi: aqi.usAqi,
            aqiStatus: aqi.aqiStatus,
            humidity: weather.humidity,
            windSpeed: weather.windSpeed,
            rainfall: weather.precipitation,
            uvIndex: weather.uvIndex,
            climateImpactScore: impact.totalScore,
          };
        } catch (e) {
          console.error(`Comparison fetch failed for ${cityName}:`, e);
          return null;
        }
      })
    );

    res.json({
      results: comparisons.filter(Boolean),
    });
  } catch (error: any) {
    console.error('Error in city comparison:', error);
    res.status(500).json({ error: error.message || 'Failed to compare cities' });
  }
});

// 5. Anomalies Endpoint: GET /api/anomalies?city=Pune
router.get('/anomalies', async (req, res) => {
  try {
    const cityQuery = (req.query.city as string) || 'Pune';
    const location = await openMeteoService.resolveLocation(cityQuery);
    const [current, aqi, history] = await Promise.all([
      openMeteoService.getCurrentWeather(location),
      openMeteoService.getAirQuality(location),
      openMeteoService.getHistoricalSeries(location, 14),
    ]);

    const anomalies = detectAnomalies(history.hourly, {
      temperature: current.temperature,
      aqi: aqi.usAqi,
      rainfall: current.precipitation,
      windSpeed: current.windSpeed,
      pressure: current.pressure,
    });

    res.json({
      location,
      anomalies,
      totalDetected: anomalies.length,
      baselineHoursEvaluated: history.hourly.length,
    });
  } catch (error: any) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({ error: error.message || 'Failed to detect anomalies' });
  }
});

// 6. Insights Endpoint: GET /api/insights?city=Pune
router.get('/insights', async (req, res) => {
  try {
    const cityQuery = (req.query.city as string) || 'Pune';
    const location = await openMeteoService.resolveLocation(cityQuery);
    const [current, aqi, history] = await Promise.all([
      openMeteoService.getCurrentWeather(location),
      openMeteoService.getAirQuality(location),
      openMeteoService.getHistoricalSeries(location, 14),
    ]);

    const stats = calculateClimateStats(
      history.hourly,
      current.temperature,
      history.hourly.length > 24 ? history.hourly[history.hourly.length - 24].temperature : current.temperature
    );

    const anomalies = detectAnomalies(history.hourly, {
      temperature: current.temperature,
      aqi: aqi.usAqi,
      rainfall: current.precipitation,
      windSpeed: current.windSpeed,
      pressure: current.pressure,
    });

    const impactScore = computeClimateImpactScore(
      {
        temperature: current.temperature,
        aqi: aqi.usAqi,
        humidity: current.humidity,
        windSpeed: current.windSpeed,
        rainfall: current.precipitation,
        uvIndex: current.uvIndex,
        pressure: current.pressure,
      },
      stats.avgTemp
    );

    const insights = await aiService.generateInsights({
      location,
      current,
      aqi,
      stats,
      anomalies,
      impactScore,
    });

    res.json({
      location,
      insights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: error.message || 'Failed to generate insights' });
  }
});

// 7. Correlation Analysis: GET /api/correlation?city=Pune
router.get('/correlation', async (req, res) => {
  try {
    const cityQuery = (req.query.city as string) || 'Pune';
    const location = await openMeteoService.resolveLocation(cityQuery);
    const history = await openMeteoService.getHistoricalSeries(location, 14);
    const correlation = computeCorrelationMatrix(history.hourly);

    res.json({
      location,
      ...correlation,
    });
  } catch (error: any) {
    console.error('Error computing correlation:', error);
    res.status(500).json({ error: error.message || 'Failed to compute correlation matrix' });
  }
});

// 8. Location Search: GET /api/locations?query=Pune
router.get('/locations', async (req, res) => {
  try {
    const query = (req.query.query as string) || '';
    const results = await openMeteoService.searchLocations(query);
    res.json({ results });
  } catch (error: any) {
    console.error('Error searching locations:', error);
    res.status(500).json({ error: error.message || 'Failed to search locations' });
  }
});

// 9. Carbon & CO2 Data: GET /api/carbon
router.get('/carbon', (_req, res) => {
  const data = openMeteoService.getAtmosphericCarbonData();
  res.json(data);
});

// 10. Admin & Health Monitoring: GET /api/admin/health
router.get('/admin/health', async (_req, res) => {
  const quality = dataValidator.getQualityReport();
  const uptimeSeconds = Math.round((Date.now() - serverStartTime) / 1000);

  // Ping Open-Meteo endpoint to check liveness
  let weatherApiStatus: 'active' | 'degraded' | 'down' = 'active';
  try {
    const ping = await fetch('https://api.open-meteo.com/v1/forecast?latitude=18.5&longitude=73.8&current=temperature_2m');
    if (!ping.ok) weatherApiStatus = 'degraded';
  } catch {
    weatherApiStatus = 'down';
  }

  res.json({
    openMeteoWeatherApi: weatherApiStatus,
    openMeteoAqiApi: 'active',
    geocodingApi: 'active',
    aiEngine: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' ? 'active' : 'fallback_mode',
    databaseStatus: 'connected',
    dataQualityScore: quality.passRatePercentage,
    totalRecordsProcessed: quality.totalProcessed,
    rejectedRecordsCount: quality.totalInvalid,
    lastIngestionTime: new Date().toISOString(),
    uptimeSeconds,
    qualityAuditLogs: quality.recentLogs,
  });
});

// 11. Data Export: GET /api/export/:format?city=Pune
router.get('/export/:format', async (req, res) => {
  try {
    const format = req.params.format.toLowerCase();
    const cityQuery = (req.query.city as string) || 'Pune';
    const location = await openMeteoService.resolveLocation(cityQuery);
    const [current, aqi, history] = await Promise.all([
      openMeteoService.getCurrentWeather(location),
      openMeteoService.getAirQuality(location),
      openMeteoService.getHistoricalSeries(location, 7),
    ]);

    const filenameBase = `climatepulse_${location.city.toLowerCase()}_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'csv' || format === 'excel') {
      const headers = [
        'Timestamp',
        'City',
        'Country',
        'Temperature (°C)',
        'Apparent Temp (°C)',
        'Humidity (%)',
        'Pressure (hPa)',
        'Wind Speed (km/h)',
        'Precipitation (mm)',
        'UV Index',
        'US AQI',
        'AQI Category',
        'PM2.5 (µg/m³)',
        'PM10 (µg/m³)',
        'CO (µg/m³)',
        'NO2 (µg/m³)',
        'SO2 (µg/m³)',
        'Ozone (µg/m³)',
      ];

      const rows: string[] = [];
      rows.push(headers.join(','));

      // Include current row
      rows.push(
        [
          current.timestamp,
          `"${location.city}"`,
          `"${location.country}"`,
          current.temperature,
          current.apparentTemperature,
          current.humidity,
          current.pressure,
          current.windSpeed,
          current.precipitation,
          current.uvIndex,
          aqi.usAqi,
          `"${aqi.aqiStatus}"`,
          aqi.pm25,
          aqi.pm10,
          aqi.co,
          aqi.no2,
          aqi.so2,
          aqi.o3,
        ].join(',')
      );

      // Include hourly observations
      for (const h of history.hourly) {
        rows.push(
          [
            h.time,
            `"${location.city}"`,
            `"${location.country}"`,
            h.temperature,
            h.apparentTemperature,
            h.humidity,
            h.pressure,
            h.windSpeed,
            h.precipitation,
            h.uvIndex,
            h.usAqi ?? '',
            `"${h.usAqi ? (h.usAqi <= 50 ? 'Good' : h.usAqi <= 100 ? 'Moderate' : 'Unhealthy') : ''}"`,
            h.pm25 ?? '',
            h.pm10 ?? '',
            '',
            '',
            '',
            '',
          ].join(',')
        );
      }

      const csvContent = rows.join('\n');

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
      } else {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
      }

      res.send(csvContent);
      return;
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.json"`);
      res.json({
        location,
        current,
        aqi,
        historicalSummary: history.daily,
        exportedAt: new Date().toISOString(),
      });
      return;
    }

    res.status(400).json({ error: 'Unsupported format. Use csv, excel, or json.' });
  } catch (error: any) {
    console.error('Error generating export:', error);
    res.status(500).json({ error: error.message || 'Export failed' });
  }
});

export default router;
