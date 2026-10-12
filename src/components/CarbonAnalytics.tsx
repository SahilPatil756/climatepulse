import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { fetchCarbonData, CarbonResponse } from '../services/api.ts';
import { Flame, AlertTriangle, ArrowUpRight, ShieldCheck, Info } from 'lucide-react';

export const CarbonAnalytics: React.FC = () => {
  const [carbonData, setCarbonData] = useState<CarbonResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCarbonData()
      .then((data) => {
        setCarbonData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load carbon data:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !carbonData) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6 flex items-center justify-center min-h-[300px]">
        <div className="animate-pulse text-sm text-slate-400">Loading atmospheric CO₂ observatory records...</div>
      </div>
    );
  }

  const chartPoints = carbonData.historicalTrend.map((t) => ({
    label: `${t.month} ${t.year}`,
    ppm: t.ppm,
    anomaly: t.anomaly,
  }));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-semibold text-white">Atmospheric CO₂ & Greenhouse Diagnostics</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Observational records of planetary atmospheric CO₂ concentrations (parts per million)
          </p>
        </div>

        {/* Global CO2 KPI Badge */}
        <div className="flex items-center space-x-3 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Global Baseline CO₂</span>
            <span className="text-xl font-bold text-white">{carbonData.currentPpm} ppm</span>
          </div>
          <div className="flex items-center text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            +{carbonData.annualIncreasePpm} ppm/yr
          </div>
        </div>
      </div>

      {/* Critical Scientific Distinction Callout */}
      <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">Methodological Clarification (Atmospheric CO₂ vs Local Emissions):</span>
          <p className="mt-1 text-slate-300">
            <strong>Atmospheric CO₂ concentration (ppm)</strong> measures the well-mixed global molecular fraction in ambient air across Earth (currently ~427 ppm, up from the pre-industrial baseline of 280 ppm).
            In contrast, <strong>CO₂ emissions (metric tons / year)</strong> measure annual anthropogenic mass releases from localized industrial, transport, and energy sectors.
          </p>
        </div>
      </div>

      {/* CO2 Trend Chart */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Multi-Year Atmospheric CO₂ Trajectory (NOAA GML Baseline Observatory)
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">Keeling Curve progression</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} interval={1} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[415, 435]} unit=" ppm" />
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
                dataKey="ppm"
                name="Atmospheric CO₂ (ppm)"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f97316' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Baseline Context Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block">Pre-Industrial Baseline</span>
          <span className="text-base font-bold text-slate-200">280.0 ppm</span>
          <span className="text-[11px] text-slate-400 block mt-1">Holocene baseline (~10,000 BCE - 1750 CE)</span>
        </div>
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block">Net Planetary Accumulation</span>
          <span className="text-base font-bold text-rose-400">+147.2 ppm (+52.6%)</span>
          <span className="text-[11px] text-slate-400 block mt-1">Cumulative atmospheric warming forcing</span>
        </div>
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block">Observational Verification</span>
          <span className="text-base font-bold text-emerald-400">NOAA GML Certified</span>
          <span className="text-[11px] text-slate-400 block mt-1">Continuous high-precision infrared spectrometry</span>
        </div>
      </div>
    </div>
  );
};
