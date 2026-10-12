import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DailyDataPoint, HourlyDataPoint, ClimateStats } from '../types/climate.ts';
import { formatTemp } from '../utils/units.ts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface TemperatureAnalyticsProps {
  hourly: HourlyDataPoint[];
  daily: DailyDataPoint[];
  stats: ClimateStats;
  tempUnit: 'C' | 'F';
}

type Timeframe = '24h' | '7d' | '30d' | '1y';

export const TemperatureAnalytics: React.FC<TemperatureAnalyticsProps> = ({
  hourly,
  daily,
  stats,
  tempUnit,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');
  const [showMovingAverage, setShowMovingAverage] = useState(true);

  // Prepare 24-hour hourly dataset
  const hourlyChartData = React.useMemo(() => {
    const slice = hourly.slice(-24);
    return slice.map((item) => {
      const timePart = item.time.includes('T') ? item.time.split('T')[1].slice(0, 5) : item.time;
      const tempVal = tempUnit === 'F' ? (item.temperature * 9) / 5 + 32 : item.temperature;
      const feelsVal = tempUnit === 'F' ? (item.apparentTemperature * 9) / 5 + 32 : item.apparentTemperature;
      return {
        label: timePart,
        temp: Number(tempVal.toFixed(1)),
        feelsLike: Number(feelsVal.toFixed(1)),
        humidity: item.humidity,
        precipitation: item.precipitation,
      };
    });
  }, [hourly, tempUnit]);

  // Prepare multi-day daily dataset
  const dailyChartData = React.useMemo(() => {
    const count = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : daily.length;
    const slice = daily.slice(-count);

    return slice.map((item) => {
      const datePart = item.date.slice(5); // MM-DD
      const tempAvgVal = tempUnit === 'F' ? (item.tempAvg * 9) / 5 + 32 : item.tempAvg;
      const tempMaxVal = tempUnit === 'F' ? (item.tempMax * 9) / 5 + 32 : item.tempMax;
      const tempMinVal = tempUnit === 'F' ? (item.tempMin * 9) / 5 + 32 : item.tempMin;
      const maVal =
        item.movingAverage7d !== undefined
          ? tempUnit === 'F'
            ? (item.movingAverage7d * 9) / 5 + 32
            : item.movingAverage7d
          : null;

      return {
        label: datePart,
        temp: Number(tempAvgVal.toFixed(1)),
        tempMax: Number(tempMaxVal.toFixed(1)),
        tempMin: Number(tempMinVal.toFixed(1)),
        movingAvg7d: maVal ? Number(maVal.toFixed(1)) : null,
        rainfall: item.precipitationSum,
      };
    });
  }, [timeframe, daily, tempUnit]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">Temperature Analytics</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly progression, multi-day moving average, and thermal variance
          </p>
        </div>

        {/* Timeframe selector & toggles */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            {(['24h', '7d', '30d', '1y'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                  timeframe === tf
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf === '24h' ? '24 Hours' : tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : '1 Year'}
              </button>
            ))}
          </div>

          {timeframe !== '24h' && (
            <button
              onClick={() => setShowMovingAverage(!showMovingAverage)}
              className={`px-2.5 py-1.5 text-xs rounded-xl border transition flex items-center space-x-1.5 ${
                showMovingAverage
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>7-Day MA</span>
            </button>
          )}
        </div>
      </div>

      {/* Statistical summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
        <div className="text-xs">
          <span className="text-slate-400 block">Baseline Mean</span>
          <span className="text-base font-bold text-white">{formatTemp(stats.avgTemp, tempUnit)}</span>
        </div>
        <div className="text-xs">
          <span className="text-slate-400 block">Min / Max Observed</span>
          <span className="text-base font-bold text-white">
            {formatTemp(stats.minTemp, tempUnit)} — {formatTemp(stats.maxTemp, tempUnit)}
          </span>
        </div>
        <div className="text-xs">
          <span className="text-slate-400 block">Recent Change (Δ)</span>
          <span className={`text-base font-bold flex items-center ${stats.tempChange >= 0 ? 'text-rose-400' : 'text-teal-400'}`}>
            {stats.tempChange >= 0 ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
            {stats.tempChange > 0 ? `+${stats.tempChange}` : stats.tempChange}°C
          </span>
        </div>
        <div className="text-xs">
          <span className="text-slate-400 block">Percentage Shift</span>
          <span className="text-base font-bold text-slate-300">
            {stats.tempPctChange > 0 ? `+${stats.tempPctChange}%` : `${stats.tempPctChange}%`}
          </span>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {timeframe === '24h' ? (
            <AreaChart data={hourlyChartData}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} unit={`°${tempUnit}`} />
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
                dataKey="temp"
                name={`Temperature (°${tempUnit})`}
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#tempGradient)"
              />
              <Line
                type="monotone"
                dataKey="feelsLike"
                name={`Feels Like (°${tempUnit})`}
                stroke="#06b6d4"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          ) : (
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} unit={`°${tempUnit}`} />
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
              <Line
                type="monotone"
                dataKey="tempMax"
                name={`Max Temp (°${tempUnit})`}
                stroke="#ef4444"
                strokeWidth={1.5}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="temp"
                name={`Avg Temp (°${tempUnit})`}
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="tempMin"
                name={`Min Temp (°${tempUnit})`}
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={{ r: 2 }}
              />
              {showMovingAverage && (
                <Line
                  type="monotone"
                  dataKey="movingAvg7d"
                  name={`7-Day Moving Avg (°${tempUnit})`}
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
