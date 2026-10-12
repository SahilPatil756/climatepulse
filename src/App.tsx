/**
 * ClimatePulse — Live Climate Impact Dashboard
 * Root Application Component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Navigation, DashboardTab } from './components/Navigation.tsx';
import { KPICards } from './components/KPICards.tsx';
import { TemperatureAnalytics } from './components/TemperatureAnalytics.tsx';
import { AirQualityAnalytics } from './components/AirQualityAnalytics.tsx';
import { CarbonAnalytics } from './components/CarbonAnalytics.tsx';
import { ClimateImpactScoreCard } from './components/ClimateImpactScoreCard.tsx';
import { LocationComparison } from './components/LocationComparison.tsx';
import { AnomalyDetection } from './components/AnomalyDetection.tsx';
import { CorrelationAnalysis } from './components/CorrelationAnalysis.tsx';
import { MapVisualization } from './components/MapVisualization.tsx';
import { AIInsights } from './components/AIInsights.tsx';
import { ExportReports } from './components/ExportReports.tsx';
import { AdminMonitoring } from './components/AdminMonitoring.tsx';
import { DataSourcesModal } from './components/DataSourcesModal.tsx';

import {
  fetchCurrentClimate,
  fetchHistoricalClimate,
  fetchAnomalies,
  CurrentClimateResponse,
  HistoricalClimateResponse,
  AnomaliesResponse,
} from './services/api.ts';
import { ClimateImpactWeights } from './types/climate.ts';
import { computeClimateImpactScore } from '../server/analytics.ts';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentCity, setCurrentCity] = useState<string>('Pune');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState<boolean>(false);

  const [currentData, setCurrentData] = useState<CurrentClimateResponse | null>(null);
  const [historyData, setHistoryData] = useState<HistoricalClimateResponse | null>(null);
  const [anomaliesData, setAnomaliesData] = useState<AnomaliesResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  // Load all telemetry for selected city
  const loadData = useCallback(async (city: string, isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [curr, hist, anom] = await Promise.all([
        fetchCurrentClimate(city),
        fetchHistoricalClimate(city, 14),
        fetchAnomalies(city),
      ]);

      setCurrentData(curr);
      setHistoryData(hist);
      setAnomaliesData(anom);
      setLastUpdated(curr.timestamp || new Date().toISOString());
    } catch (err: any) {
      console.error('Failed to load climate data:', err);
      setError(
        err.message ||
          'Unable to retrieve live environmental telemetry from public APIs. Please verify connectivity or select another city.'
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Effect to load data on city change
  useEffect(() => {
    loadData(currentCity);
  }, [currentCity, loadData]);

  // Automatic Data Refresh every 5 minutes (PRD Section 23)
  useEffect(() => {
    const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
    const interval = setInterval(() => {
      loadData(currentCity, true);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [currentCity, loadData]);

  const handleSelectCity = (city: string) => {
    setCurrentCity(city);
  };

  const handleToggleTempUnit = () => {
    setTempUnit((prev) => (prev === 'C' ? 'F' : 'C'));
  };

  const handleCustomWeights = (weights: ClimateImpactWeights) => {
    if (currentData) {
      const updatedScore = computeClimateImpactScore(
        {
          temperature: currentData.current.temperature,
          aqi: currentData.aqi.usAqi,
          humidity: currentData.current.humidity,
          windSpeed: currentData.current.windSpeed,
          rainfall: currentData.current.precipitation,
          uvIndex: currentData.current.uvIndex,
          pressure: currentData.current.pressure,
        },
        currentData.stats.avgTemp,
        weights
      );
      setCurrentData({
        ...currentData,
        impactScore: updatedScore,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      {currentData && (
        <Header
          currentLocation={currentData.location}
          onSelectCity={handleSelectCity}
          tempUnit={tempUnit}
          onToggleTempUnit={handleToggleTempUnit}
          onRefresh={() => loadData(currentCity, true)}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          onOpenDataSources={() => setIsDataSourcesOpen(true)}
        />
      )}

      {/* Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        anomaliesCount={anomaliesData?.totalDetected ?? 0}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-rose-300">Telemetry Ingestion Advisory: </span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData(currentCity)}
              className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-lg transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner Skeleton */}
        {loading && !currentData ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
            <div className="relative">
              <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
              <div className="absolute inset-0 blur-lg bg-emerald-500/20 rounded-full" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Ingesting Verified Atmospheric Telemetry</h3>
              <p className="text-xs text-slate-400 mt-1">
                Connecting to Open-Meteo Weather & Air Quality APIs for {currentCity}...
              </p>
            </div>
          </div>
        ) : currentData && historyData ? (
          <div>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div>
                {/* 1. KPI Cards */}
                <KPICards
                  current={currentData.current}
                  aqi={currentData.aqi}
                  impactScore={currentData.impactScore}
                  tempUnit={tempUnit}
                  onNavigateToTab={setActiveTab}
                />

                {/* 2. Temperature Trend & Climate Impact Score in 2 Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                  <div className="lg:col-span-7">
                    <TemperatureAnalytics
                      hourly={historyData.hourly}
                      daily={historyData.daily}
                      stats={currentData.stats}
                      tempUnit={tempUnit}
                    />
                  </div>
                  <div className="lg:col-span-5">
                    <ClimateImpactScoreCard
                      score={currentData.impactScore}
                      onUpdateWeights={handleCustomWeights}
                    />
                  </div>
                </div>

                {/* 3. Air Quality Diagnostics */}
                <AirQualityAnalytics aqi={currentData.aqi} hourly={historyData.hourly} />

                {/* 4. AI Climate Insights Overview */}
                <AIInsights currentLocation={currentData.location} />
              </div>
            )}

            {/* TEMPERATURE TAB */}
            {activeTab === 'temperature' && (
              <TemperatureAnalytics
                hourly={historyData.hourly}
                daily={historyData.daily}
                stats={currentData.stats}
                tempUnit={tempUnit}
              />
            )}

            {/* AIR QUALITY TAB */}
            {activeTab === 'air_quality' && (
              <AirQualityAnalytics aqi={currentData.aqi} hourly={historyData.hourly} />
            )}

            {/* CARBON TAB */}
            {activeTab === 'carbon' && <CarbonAnalytics />}

            {/* COMPARISON TAB */}
            {activeTab === 'comparison' && (
              <LocationComparison
                currentCity={currentCity}
                tempUnit={tempUnit}
                onSelectCity={handleSelectCity}
              />
            )}

            {/* ANOMALIES TAB */}
            {activeTab === 'anomalies' && anomaliesData && (
              <AnomalyDetection
                location={currentData.location}
                anomalies={anomaliesData.anomalies}
                totalEvaluatedHours={anomaliesData.baselineHoursEvaluated}
              />
            )}

            {/* CORRELATION MATRIX TAB */}
            {activeTab === 'correlation' && (
              <CorrelationAnalysis currentLocation={currentData.location} />
            )}

            {/* MAP VIEW TAB */}
            {activeTab === 'map' && (
              <MapVisualization
                currentLocation={currentData.location}
                onSelectCity={handleSelectCity}
                tempUnit={tempUnit}
              />
            )}

            {/* AI INSIGHTS TAB */}
            {activeTab === 'insights' && <AIInsights currentLocation={currentData.location} />}

            {/* EXPORT & REPORTS TAB */}
            {activeTab === 'export' && (
              <ExportReports
                location={currentData.location}
                current={currentData.current}
                aqi={currentData.aqi}
                stats={currentData.stats}
                impactScore={currentData.impactScore}
                tempUnit={tempUnit}
              />
            )}

            {/* ADMIN MONITORING TAB */}
            {activeTab === 'admin' && <AdminMonitoring />}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">ClimatePulse</span>
            <span>—</span>
            <span>Live Environmental & Climate Impact Analytics</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDataSourcesOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 transition"
            >
              Data Sources & Standards
            </button>
            <span>•</span>
            <span className="font-mono text-slate-400">Real Public Open-Meteo & NOAA Pipelines</span>
          </div>
        </div>
      </footer>

      {/* Data Sources Modal */}
      <DataSourcesModal isOpen={isDataSourcesOpen} onClose={() => setIsDataSourcesOpen(false)} />
    </div>
  );
}
