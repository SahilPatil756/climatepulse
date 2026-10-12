import React from 'react';
import { AnomalyRecord, LocationInfo } from '../types/climate.ts';
import { AlertTriangle, ShieldCheck, Activity, BarChart2 } from 'lucide-react';

interface AnomalyDetectionProps {
  location: LocationInfo;
  anomalies: AnomalyRecord[];
  totalEvaluatedHours: number;
}

export const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({
  location,
  anomalies,
  totalEvaluatedHours,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">Statistical Anomaly & Extreme Event Detection</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Z-score Gaussian thresholding (|z| ≥ 2.0) and Interquartile Range (IQR) outlier isolation for {location.city}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
            {totalEvaluatedHours} telemetry windows evaluated
          </span>
          <span
            className={`px-3 py-1 rounded-xl text-xs font-bold border ${
              anomalies.length > 0
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {anomalies.length} Flagged {anomalies.length === 1 ? 'Outlier' : 'Outliers'}
          </span>
        </div>
      </div>

      {anomalies.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">Atmospheric Parameters Within Standard Deviations</h4>
          <p className="text-xs text-slate-400 max-w-md">
            All live observations for {location.city} (temperature, air quality, pressure, and wind) fall within the expected ±2.0σ Gaussian confidence interval.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {anomalies.map((anom) => {
            const isExtreme = anom.severity === 'extreme';
            const isHigh = anom.severity === 'high';

            return (
              <div
                key={anom.id}
                className={`p-4 rounded-xl border transition ${
                  isExtreme
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : isHigh
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-950/50 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        isExtreme
                          ? 'bg-rose-500 text-slate-950'
                          : isHigh
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}
                    >
                      {anom.severity} Anomaly
                    </span>
                    <span className="text-sm font-bold text-white capitalize">{anom.metric} Outlier</span>
                    <span className="text-xs text-slate-400">via {anom.method.toUpperCase()} detector</span>
                  </div>

                  <div className="text-xs font-mono">
                    <span className="text-slate-400 mr-2">Z-Score:</span>
                    <span className="font-bold text-amber-300">{anom.zScore}σ</span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed mb-3">{anom.description}</p>

                {/* Quantitative Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Observed Value</span>
                    <span className="font-bold text-white">{anom.value}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Baseline Mean (μ)</span>
                    <span className="font-medium text-slate-300">{anom.baselineMean}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Std Deviation (σ)</span>
                    <span className="font-medium text-slate-300">{anom.baselineStdDev}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Normal 2σ Bound</span>
                    <span className="font-medium text-slate-300">
                      [{anom.normalRange[0]}, {anom.normalRange[1]}]
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Methodology Note */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center space-x-2">
        <Activity className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Outlier detection computes normalized standardized residuals: z = (x - μ) / σ over rolling historical windows, flagging points where |z| &gt; 2.0 (p &lt; 0.045) or IQR bounds Q3 + 1.5×IQR.
        </span>
      </div>
    </div>
  );
};
