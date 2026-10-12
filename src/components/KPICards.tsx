import React from 'react';
import {
  Thermometer,
  Wind,
  Droplets,
  Sun,
  CloudRain,
  ShieldAlert,
  Gauge,
  Compass,
} from 'lucide-react';
import { AirQualityMetrics, ClimateImpactScore, CurrentWeather } from '../types/climate.ts';
import { formatTemp, formatWind, getAqiColor, getUvLevel } from '../utils/units.ts';

interface KPICardsProps {
  current: CurrentWeather;
  aqi: AirQualityMetrics;
  impactScore: ClimateImpactScore;
  tempUnit: 'C' | 'F';
  onNavigateToTab?: (tab: any) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  current,
  aqi,
  impactScore,
  tempUnit,
  onNavigateToTab,
}) => {
  const aqiStyle = getAqiColor(aqi.usAqi);
  const uvInfo = getUvLevel(current.uvIndex);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {/* 1. Temperature Card */}
      <div
        onClick={() => onNavigateToTab && onNavigateToTab('temperature')}
        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer shadow-lg group relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Temperature</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
            <Thermometer className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white mb-1">
          {formatTemp(current.temperature, tempUnit)}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Feels {formatTemp(current.apparentTemperature, tempUnit)}</span>
          <span className="text-emerald-400 font-medium">{current.weatherDescription}</span>
        </div>
      </div>

      {/* 2. Air Quality Card */}
      <div
        onClick={() => onNavigateToTab && onNavigateToTab('air_quality')}
        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer shadow-lg group relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Air Quality</span>
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
            <Wind className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1.5 mb-1">
          <span className="text-2xl font-bold tracking-tight text-white">AQI {aqi.usAqi}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${aqiStyle.bg} ${aqiStyle.text} border ${aqiStyle.border}`}>
            {aqi.aqiStatus}
          </span>
          <span className="text-slate-400 font-mono">PM2.5: {aqi.pm25}</span>
        </div>
      </div>

      {/* 3. Humidity Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-lg group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Humidity</span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
            <Droplets className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white mb-1">
          {current.humidity}%
        </div>
        <div className="text-[11px] text-slate-400">
          <span>{current.humidity > 70 ? 'High moisture' : current.humidity < 30 ? 'Arid / Dry air' : 'Comfortable'}</span>
        </div>
      </div>

      {/* 4. UV Index Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-lg group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">UV Index</span>
          <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 group-hover:scale-110 transition-transform">
            <Sun className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white mb-1">
          {current.uvIndex.toFixed(1)}
        </div>
        <div className="text-[11px] flex items-center justify-between">
          <span className={`font-semibold ${uvInfo.color}`}>{uvInfo.label} risk</span>
          <span className="text-slate-400">{current.uvIndex > 6 ? 'Sunscreen advised' : 'Normal'}</span>
        </div>
      </div>

      {/* 5. Rainfall Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-lg group">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Rainfall</span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
            <CloudRain className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white mb-1">
          {current.precipitation} <span className="text-xs font-normal text-slate-400">mm/h</span>
        </div>
        <div className="text-[11px] text-slate-400">
          <span>{current.precipitation > 0 ? 'Precipitation active' : 'No rain recorded'}</span>
        </div>
      </div>

      {/* 6. Climate Risk / Impact Score Card */}
      <div
        onClick={() => onNavigateToTab && onNavigateToTab('overview')}
        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer shadow-lg group"
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Climate Impact</span>
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1.5 mb-1">
          <span className="text-2xl font-bold tracking-tight text-white">{impactScore.totalScore}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
        <div className="text-[11px] flex items-center space-x-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: impactScore.color }}
          ></span>
          <span className="font-semibold text-slate-300">{impactScore.status}</span>
        </div>
      </div>
    </div>
  );
};
