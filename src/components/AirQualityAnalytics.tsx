import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AirQualityMetrics, HourlyDataPoint } from '../types/climate.ts';
import { getAqiColor } from '../utils/units.ts';
import { Wind, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AirQualityAnalyticsProps {
  aqi: AirQualityMetrics;
  hourly: HourlyDataPoint[];
}

export const AirQualityAnalytics: React.FC<AirQualityAnalyticsProps> = ({ aqi, hourly }) => {
  const aqiStyle = getAqiColor(aqi.usAqi);

  // Pollutant definitions with WHO guidelines
  const pollutants = [
    {
      name: 'PM2.5',
      fullName: 'Fine Particulate Matter (< 2.5 µm)',
      value: aqi.pm25,
      unit: 'µg/m³',
      whoLimit: 15,
      description: 'Penetrates deep into respiratory tract and bloodstream.',
    },
    {
      name: 'PM10',
      fullName: 'Coarse Particulate Matter (< 10 µm)',
      value: aqi.pm10,
      unit: 'µg/m³',
      whoLimit: 45,
      description: 'Dust, pollen, and mold spores irritating airways.',
    },
    {
      name: 'NO₂',
      fullName: 'Nitrogen Dioxide',
      value: aqi.no2,
      unit: 'µg/m³',
      whoLimit: 25,
      description: 'Emitted from vehicle combustion and power plants.',
    },
    {
      name: 'O₃',
      fullName: 'Tropospheric Ground Ozone',
      value: aqi.o3,
      unit: 'µg/m³',
      whoLimit: 100,
      description: 'Photochemical reaction of sunlight with NOx pollutants.',
    },
    {
      name: 'SO₂',
      fullName: 'Sulphur Dioxide',
      value: aqi.so2,
      unit: 'µg/m³',
      whoLimit: 40,
      description: 'Combustion of sulphur-containing fossil fuels.',
    },
    {
      name: 'CO',
      fullName: 'Carbon Monoxide',
      value: aqi.co,
      unit: 'µg/m³',
      whoLimit: 4000,
      description: 'Incomplete combustion of organic fuels.',
    },
  ];

  // Prepare trend data for last 48 hours
  const trendData = React.useMemo(() => {
    return hourly.slice(-48).map((h) => {
      const timePart = h.time.includes('T') ? h.time.split('T')[1].slice(0, 5) : h.time;
      return {
        time: timePart,
        AQI: h.usAqi ?? 50,
        PM25: h.pm25 ?? 15,
        PM10: h.pm10 ?? 25,
      };
    });
  }, [hourly]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Wind className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-semibold text-white">Air Quality & Aerosol Diagnostics</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            US EPA Air Quality Index scale and individual particulate mass concentrations
          </p>
        </div>

        {/* Current AQI Badge */}
        <div className="flex items-center space-x-3 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Index</span>
            <span className="text-xl font-bold text-white">AQI {aqi.usAqi}</span>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${aqiStyle.bg} ${aqiStyle.text} border ${aqiStyle.border}`}>
            {aqi.aqiStatus}
          </span>
        </div>
      </div>

      {/* EPA Scale Indicator */}
      <div className="mb-6 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>EPA Scale Classification:</span>
          <span className="font-medium text-slate-300">European CAQI: {aqi.europeanAqi}</span>
        </div>
        <div className="grid grid-cols-6 gap-1 h-3 rounded-full overflow-hidden mb-2">
          <div className="bg-emerald-500" title="Good (0-50)" />
          <div className="bg-yellow-500" title="Moderate (51-100)" />
          <div className="bg-orange-500" title="Unhealthy for Sensitive Groups (101-150)" />
          <div className="bg-red-500" title="Unhealthy (151-200)" />
          <div className="bg-purple-600" title="Very Unhealthy (201-300)" />
          <div className="bg-rose-950" title="Hazardous (301-500)" />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0 (Good)</span>
          <span>50</span>
          <span>100</span>
          <span>150</span>
          <span>200</span>
          <span>300</span>
          <span>500 (Hazardous)</span>
        </div>
      </div>

      {/* Pollutant Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {pollutants.map((p) => {
          const isAboveWho = p.value > p.whoLimit;
          const ratio = (p.value / p.whoLimit).toFixed(1);

          return (
            <div
              key={p.name}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white">{p.name}</span>
                  <span className="text-[10px] text-slate-400">{p.unit}</span>
                </div>
                {isAboveWho ? (
                  <span className="flex items-center text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-semibold">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {ratio}× WHO
                  </span>
                ) : (
                  <span className="flex items-center text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    WHO Safe
                  </span>
                )}
              </div>
              <div className="text-xl font-extrabold text-white mb-1">
                {p.value} <span className="text-xs font-normal text-slate-400">{p.unit}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mb-2">{p.fullName}</p>
              <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                WHO 24h Guideline: ≤ {p.whoLimit} {p.unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* 48-Hour Pollutant Concentration Chart */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          48-Hour Particulate Concentration Trend (PM2.5 & PM10 vs AQI)
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="AQI"
                name="Air Quality Index"
                stroke="#14b8a6"
                fillOpacity={1}
                fill="url(#aqiGrad)"
              />
              <Area
                type="monotone"
                dataKey="PM25"
                name="PM2.5 (µg/m³)"
                stroke="#f97316"
                fillOpacity={0.1}
                fill="#f97316"
              />
              <Area
                type="monotone"
                dataKey="PM10"
                name="PM10 (µg/m³)"
                stroke="#a855f7"
                fillOpacity={0.1}
                fill="#a855f7"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
