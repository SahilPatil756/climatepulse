import React, { useState } from 'react';
import {
  ShieldAlert,
  Sliders,
  Info,
  Check,
  RotateCcw,
  TrendingUp,
  Wind,
  CloudLightning,
  CloudRain,
  Sun,
} from 'lucide-react';
import { ClimateImpactScore, ClimateImpactWeights } from '../types/climate.ts';

interface ClimateImpactScoreCardProps {
  score: ClimateImpactScore;
  onUpdateWeights?: (weights: ClimateImpactWeights) => void;
}

export const ClimateImpactScoreCard: React.FC<ClimateImpactScoreCardProps> = ({
  score,
  onUpdateWeights,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [tempWeights, setTempWeights] = useState<ClimateImpactWeights>(score.weights);

  const handleWeightChange = (key: keyof ClimateImpactWeights, val: number) => {
    setTempWeights((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleApply = () => {
    if (onUpdateWeights) {
      onUpdateWeights(tempWeights);
    }
    setShowConfig(false);
  };

  const handleReset = () => {
    const defaults: ClimateImpactWeights = {
      temperatureAnomaly: 0.25,
      airQuality: 0.3,
      extremeWeather: 0.2,
      rainfallAnomaly: 0.15,
      uvExposure: 0.1,
    };
    setTempWeights(defaults);
    if (onUpdateWeights) onUpdateWeights(defaults);
  };

  const componentsList = [
    {
      id: 'airQuality',
      label: 'Air Quality (AQI)',
      weight: score.weights.airQuality,
      score: score.components.airQualityScore,
      icon: Wind,
      color: 'bg-teal-500',
    },
    {
      id: 'temperatureAnomaly',
      label: 'Temperature Anomaly',
      weight: score.weights.temperatureAnomaly,
      score: score.components.temperatureAnomalyScore,
      icon: TrendingUp,
      color: 'bg-amber-500',
    },
    {
      id: 'extremeWeather',
      label: 'Extreme Weather (Wind & Pressure)',
      weight: score.weights.extremeWeather,
      score: score.components.extremeWeatherScore,
      icon: CloudLightning,
      color: 'bg-rose-500',
    },
    {
      id: 'rainfallAnomaly',
      label: 'Rainfall Anomaly',
      weight: score.weights.rainfallAnomaly,
      score: score.components.rainfallAnomalyScore,
      icon: CloudRain,
      color: 'bg-blue-500',
    },
    {
      id: 'uvExposure',
      label: 'UV Radiation Exposure',
      weight: score.weights.uvExposure,
      score: score.components.uvExposureScore,
      icon: Sun,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Climate Impact Score</h3>
            <p className="text-xs text-slate-400">Deterministic composite multi-hazard index</p>
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>{showConfig ? 'Close Weights' : 'Configure Weights'}</span>
        </button>
      </div>

      {/* Main Score Header */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Gauge / Value */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={score.color}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - score.totalScore / 100)}`}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-white tracking-tight">{score.totalScore}</span>
              <span className="text-xs text-slate-400 font-medium">/ 100</span>
            </div>
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-slate-950" style={{ backgroundColor: score.color }}>
              {score.status}
            </span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="md:col-span-7 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            Score = Σ (Indicator Severity × Configured Weight)
          </p>

          <div className="space-y-2.5">
            {componentsList.map((comp) => {
              const Icon = comp.icon;
              return (
                <div key={comp.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{comp.label}</span>
                      <span className="text-slate-400 text-[11px]">({Math.round(comp.weight * 100)}% wt)</span>
                    </div>
                    <span className="font-semibold text-white">{comp.score}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${comp.color} transition-all duration-700`}
                      style={{ width: `${comp.score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weight Customizer Drawer */}
      {showConfig && (
        <div className="mt-6 pt-5 border-t border-slate-800 bg-slate-950/60 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Customize Component Weights
            </h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded bg-slate-800 hover:bg-slate-700"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
              <button
                onClick={handleApply}
                className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-slate-950 rounded bg-emerald-400 hover:bg-emerald-300"
              >
                <Check className="w-3 h-3" />
                <span>Apply Weights</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">
                Air Quality Weight: {Math.round(tempWeights.airQuality * 100)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={tempWeights.airQuality}
                onChange={(e) => handleWeightChange('airQuality', parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">
                Temp Anomaly Weight: {Math.round(tempWeights.temperatureAnomaly * 100)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={tempWeights.temperatureAnomaly}
                onChange={(e) => handleWeightChange('temperatureAnomaly', parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">
                Extreme Weather Weight: {Math.round(tempWeights.extremeWeather * 100)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={tempWeights.extremeWeather}
                onChange={(e) => handleWeightChange('extremeWeather', parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">
                Rainfall Anomaly Weight: {Math.round(tempWeights.rainfallAnomaly * 100)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={tempWeights.rainfallAnomaly}
                onChange={(e) => handleWeightChange('rainfallAnomaly', parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">
                UV Radiation Weight: {Math.round(tempWeights.uvExposure * 100)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={tempWeights.uvExposure}
                onChange={(e) => handleWeightChange('uvExposure', parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transparent Methodology Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center space-x-2 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Transparent deterministic formula based on standard climatological hazard matrices. Not an opaque prediction.
        </span>
      </div>
    </div>
  );
};
