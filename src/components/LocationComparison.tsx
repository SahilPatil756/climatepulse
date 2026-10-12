import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { fetchCompareCities } from '../services/api.ts';
import { CityComparisonData } from '../types/climate.ts';
import { formatTemp, formatWind, getAqiColor } from '../utils/units.ts';
import { ArrowRightLeft, Plus, X, RefreshCw } from 'lucide-react';

interface LocationComparisonProps {
  currentCity: string;
  tempUnit: 'C' | 'F';
  onSelectCity: (city: string) => void;
}

const AVAILABLE_CITIES = ['Pune', 'Mumbai', 'Delhi', 'Bangalore', 'London', 'New York', 'Tokyo', 'Paris'];

export const LocationComparison: React.FC<LocationComparisonProps> = ({
  currentCity,
  tempUnit,
  onSelectCity,
}) => {
  const [selectedCities, setSelectedCities] = useState<string[]>([
    currentCity,
    currentCity.toLowerCase() === 'mumbai' ? 'Pune' : 'Mumbai',
    currentCity.toLowerCase() === 'delhi' ? 'Bangalore' : 'Delhi',
  ]);
  const [data, setData] = useState<CityComparisonData[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync currentCity if not in selectedCities
  useEffect(() => {
    if (!selectedCities.some((c) => c.toLowerCase() === currentCity.toLowerCase())) {
      setSelectedCities((prev) => [currentCity, ...prev.slice(0, 3)]);
    }
  }, [currentCity]);

  const loadComparison = () => {
    setLoading(true);
    fetchCompareCities(selectedCities)
      .then((res) => {
        setData(res.results);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching city comparisons:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadComparison();
  }, [selectedCities]);

  const handleToggleCity = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      if (selectedCities.length > 2) {
        setSelectedCities(selectedCities.filter((c) => c !== cityName));
      }
    } else {
      if (selectedCities.length < 5) {
        setSelectedCities([...selectedCities, cityName]);
      }
    }
  };

  const chartData = data.map((d) => {
    const tempVal = tempUnit === 'F' ? (d.temperature * 9) / 5 + 32 : d.temperature;
    return {
      name: d.location.city,
      Temperature: Number(tempVal.toFixed(1)),
      AQI: d.aqi,
      Humidity: d.humidity,
      WindSpeed: d.windSpeed,
      ImpactScore: d.climateImpactScore,
    };
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Cross-Location Climate Comparison</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Normalized environmental metrics compared across regional and global monitoring stations
          </p>
        </div>

        <button
          onClick={loadComparison}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Comparison</span>
        </button>
      </div>

      {/* City Chips Selector */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-slate-400 font-medium mr-1">Select Cities (2-5):</span>
        {AVAILABLE_CITIES.map((city) => {
          const isSelected = selectedCities.includes(city);
          return (
            <button
              key={city}
              onClick={() => handleToggleCity(city)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center space-x-1.5 ${
                isSelected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <span>{city}</span>
              {isSelected ? <X className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-sm text-slate-400 animate-pulse">
          Fetching live meteorological telemetry across selected cities...
        </div>
      ) : (
        <>
          {/* Comparison Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60">
                  <th className="py-3 px-4 font-semibold text-slate-300">Metric</th>
                  {data.map((item) => (
                    <th key={item.location.city} className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onSelectCity(item.location.city)}
                          className="hover:text-emerald-400 hover:underline transition font-bold"
                        >
                          {item.location.city}
                        </button>
                        <span className="text-[10px] text-slate-400 font-normal">({item.location.country})</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-medium text-slate-400">Temperature</td>
                  {data.map((item) => (
                    <td key={item.location.city} className="py-2.5 px-4 font-bold text-white">
                      {formatTemp(item.temperature, tempUnit)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-medium text-slate-400">Air Quality (AQI)</td>
                  {data.map((item) => {
                    const style = getAqiColor(item.aqi);
                    return (
                      <td key={item.location.city} className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-xs ${style.bg} ${style.text} border ${style.border}`}>
                          {item.aqi} — {item.aqiStatus}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-medium text-slate-400">Relative Humidity</td>
                  {data.map((item) => (
                    <td key={item.location.city} className="py-2.5 px-4 text-slate-300">
                      {item.humidity}%
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-medium text-slate-400">Wind Velocity</td>
                  {data.map((item) => (
                    <td key={item.location.city} className="py-2.5 px-4 text-slate-300">
                      {formatWind(item.windSpeed)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-medium text-slate-400">Precipitation Rate</td>
                  {data.map((item) => (
                    <td key={item.location.city} className="py-2.5 px-4 text-slate-300">
                      {item.rainfall} mm/h
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-medium text-slate-400">UV Index</td>
                  {data.map((item) => (
                    <td key={item.location.city} className="py-2.5 px-4 text-slate-300">
                      {item.uvIndex.toFixed(1)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-800/30 bg-slate-950/40">
                  <td className="py-3 px-4 font-semibold text-rose-300">Climate Impact Score</td>
                  {data.map((item) => (
                    <td key={item.location.city} className="py-3 px-4 font-extrabold text-white">
                      <span className="text-sm">{item.climateImpactScore}</span>
                      <span className="text-[10px] text-slate-400">/100</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Comparative Multi-Bar Chart */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Comparative Metric Visualizer
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
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
                  <Bar dataKey="Temperature" name={`Temperature (°${tempUnit})`} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="AQI" name="Air Quality Index" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ImpactScore" name="Climate Impact (0-100)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
