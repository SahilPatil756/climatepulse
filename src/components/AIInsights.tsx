import React, { useState, useEffect } from 'react';
import { fetchInsights, InsightsResponse } from '../services/api.ts';
import { LocationInfo } from '../types/climate.ts';
import { Sparkles, RefreshCw, AlertTriangle, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';
import { formatTimestamp } from '../utils/units.ts';

interface AIInsightsProps {
  currentLocation: LocationInfo;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ currentLocation }) => {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const loadInsights = () => {
    setLoading(true);
    fetchInsights(currentLocation.city)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load AI insights:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadInsights();
  }, [currentLocation.city]);

  const filteredInsights =
    data && activeCategory !== 'all'
      ? data.insights.filter((i) => i.category === activeCategory)
      : data?.insights || [];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-semibold text-white">AI Climate Insights & Narrative Analysis</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated analytical interpretations strictly grounded in verified meteorological and chemical telemetry
          </p>
        </div>

        <button
          onClick={loadInsights}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          <span>Regenerate Insights</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-1 text-xs">
        {['all', 'overview', 'temperature', 'air_quality', 'extreme'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-xl font-medium transition capitalize whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            {cat === 'all' ? 'All Insights' : cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-60 flex items-center justify-center text-sm text-slate-400 animate-pulse">
          Synthesizing multi-variate insights from {currentLocation.city} telemetry...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredInsights.map((insight) => {
            let borderStyle = 'border-slate-800';
            let bgStyle = 'bg-slate-950/60';
            let Icon = Info;
            let iconColor = 'text-cyan-400';

            if (insight.severity === 'alert') {
              borderStyle = 'border-rose-500/40';
              bgStyle = 'bg-rose-950/20';
              Icon = AlertTriangle;
              iconColor = 'text-rose-400';
            } else if (insight.severity === 'warning') {
              borderStyle = 'border-amber-500/40';
              bgStyle = 'bg-amber-950/20';
              Icon = AlertTriangle;
              iconColor = 'text-amber-400';
            } else if (insight.severity === 'positive') {
              borderStyle = 'border-emerald-500/40';
              bgStyle = 'bg-emerald-950/20';
              Icon = CheckCircle2;
              iconColor = 'text-emerald-400';
            }

            return (
              <div
                key={insight.id}
                className={`p-4 rounded-xl border ${borderStyle} ${bgStyle} flex flex-col justify-between transition`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {insight.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-purple-300 font-mono">
                      {insight.source === 'gemini-ai' ? 'Gemini 3.8 Flash' : 'Analytical Model'}
                    </span>
                  </div>

                  <div className="flex items-start space-x-2 mb-2">
                    <Icon className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
                    <h4 className="text-sm font-bold text-white leading-snug">{insight.title}</h4>
                  </div>

                  <p className="text-xs font-medium text-slate-200 mb-2 leading-relaxed">
                    {insight.summary}
                  </p>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{insight.details}</p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Target: {currentLocation.city}</span>
                  <span>{formatTimestamp(insight.generatedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
