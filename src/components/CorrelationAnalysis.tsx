import React, { useState, useEffect } from 'react';
import { fetchCorrelation } from '../services/api.ts';
import { CorrelationMatrix, LocationInfo } from '../types/climate.ts';
import { Grid, Info, RefreshCw, AlertCircle } from 'lucide-react';

interface CorrelationAnalysisProps {
  currentLocation: LocationInfo;
}

export const CorrelationAnalysis: React.FC<CorrelationAnalysisProps> = ({ currentLocation }) => {
  const [data, setData] = useState<(CorrelationMatrix & { location: LocationInfo }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPair, setSelectedPair] = useState<{ var1: string; var2: string; val: number } | null>(null);

  const loadCorrelation = () => {
    setLoading(true);
    fetchCorrelation(currentLocation.city)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load correlation matrix:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadCorrelation();
  }, [currentLocation.city]);

  // Heatmap cell color based on Pearson r (-1 to +1)
  const getCellColor = (val: number) => {
    if (val === 1) return 'bg-slate-800 text-slate-300';
    if (val > 0.6) return 'bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40';
    if (val > 0.3) return 'bg-orange-500/20 text-orange-300 font-medium border border-orange-500/30';
    if (val > 0) return 'bg-amber-500/10 text-amber-200 border border-amber-500/20';
    if (val > -0.3) return 'bg-teal-500/10 text-teal-200 border border-teal-500/20';
    if (val > -0.6) return 'bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/30';
    return 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/40';
  };

  const getInterpretation = (r: number, var1: string, var2: string) => {
    if (r === 1) return `Identity correlation: A metric with itself always equals 1.00.`;
    const abs = Math.abs(r);
    const direction = r > 0 ? 'positive' : 'negative';
    let strength = 'negligible';
    if (abs >= 0.7) strength = 'strong';
    else if (abs >= 0.4) strength = 'moderate';
    else if (abs >= 0.2) strength = 'mild';

    let context = '';
    if (var1 === 'Temperature' && var2 === 'AQI') {
      context =
        r > 0
          ? 'Thermal inversions and photochemical smog production accelerate as ambient temperature climbs.'
          : 'Warmer boundary layer convection allows particulate dispersion.';
    } else if (var1 === 'Rainfall' && var2 === 'AQI') {
      context = 'Wet deposition through precipitation washes particulate pollutants out of the ambient atmosphere.';
    } else if (var1 === 'Humidity' && var2 === 'AQI') {
      context = 'High hygroscopic growth of aerosol particles influences particulate optical density.';
    }

    return `Pearson r = ${r} indicates a ${strength} ${direction} statistical association between ${var1} and ${var2}. ${context}`;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Grid className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">Pearson Correlation Matrix</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Inter-variable covariance coefficients calculated across 336 hourly observations for {currentLocation.city}
          </p>
        </div>

        <button
          onClick={loadCorrelation}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Recalculate Matrix</span>
        </button>
      </div>

      {loading || !data ? (
        <div className="h-64 flex items-center justify-center text-sm text-slate-400 animate-pulse">
          Computing multi-variable covariance matrices...
        </div>
      ) : (
        <>
          {/* Heatmap Matrix Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-center text-xs font-mono border-collapse">
              <thead>
                <tr>
                  <th className="py-2.5 px-3 text-left font-sans font-semibold text-slate-400">Metric</th>
                  {data.variables.map((v) => (
                    <th key={v} className="py-2.5 px-3 font-sans font-semibold text-slate-200">
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.variables.map((v1, i) => (
                  <tr key={v1} className="border-t border-slate-800/60">
                    <td className="py-3 px-3 text-left font-sans font-semibold text-slate-300">
                      {v1}
                    </td>
                    {data.variables.map((v2, j) => {
                      const val = data.matrix[i][j];
                      const isSelected =
                        selectedPair &&
                        ((selectedPair.var1 === v1 && selectedPair.var2 === v2) ||
                          (selectedPair.var1 === v2 && selectedPair.var2 === v1));

                      return (
                        <td key={v2} className="p-1">
                          <button
                            onClick={() => setSelectedPair({ var1: v1, var2: v2, val })}
                            className={`w-full py-2.5 px-2 rounded-lg transition text-xs font-mono cursor-pointer ${getCellColor(
                              val
                            )} ${isSelected ? 'ring-2 ring-emerald-400 font-bold' : ''}`}
                            title={`${v1} vs ${v2}: r = ${val}`}
                          >
                            {val > 0 && val !== 1 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interactive Inspection Card */}
          {selectedPair && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-700/80 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">
                  Pairwise Correlation: {selectedPair.var1} ↔ {selectedPair.var2}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  r = {selectedPair.val}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {getInterpretation(selectedPair.val, selectedPair.var1, selectedPair.var2)}
              </p>
            </div>
          )}

          {/* Disclaimer per PRD Section 26 */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Statistical Disclaimer:</span>
              <p className="mt-0.5 text-slate-400">{data.disclaimer}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
