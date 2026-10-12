import React, { useState, useEffect } from 'react';
import { fetchAdminHealth } from '../services/api.ts';
import { SystemHealthInfo } from '../types/climate.ts';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Server,
  Cpu,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { formatTimestamp } from '../utils/units.ts';

export const AdminMonitoring: React.FC = () => {
  const [health, setHealth] = useState<(SystemHealthInfo & { qualityAuditLogs: any[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = () => {
    setLoading(true);
    fetchAdminHealth()
      .then((res) => {
        setHealth(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load system health:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">System Health & Data Quality Monitoring</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational status of public API ingestors, database pipelines, validation audits, and AI engines
          </p>
        </div>

        <button
          onClick={loadHealth}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Ping Health Status</span>
        </button>
      </div>

      {loading || !health ? (
        <div className="h-60 flex items-center justify-center text-sm text-slate-400 animate-pulse">
          Querying backend pipeline diagnostics...
        </div>
      ) : (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Open-Meteo Weather API */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Open-Meteo Weather</span>
                <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {health.openMeteoWeatherApi.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-400">Public Meteorological Ingest</div>
            </div>

            {/* Open-Meteo AQI API */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Open-Meteo Air Quality</span>
                <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {health.openMeteoAqiApi.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-400">Chemical Atmospheric Ingest</div>
            </div>

            {/* AI Service */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">AI Insight Service</span>
                <span
                  className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded border ${
                    health.aiEngine === 'active'
                      ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}
                >
                  <Cpu className="w-3 h-3 mr-1" />
                  {health.aiEngine === 'active' ? 'GEMINI 3.8 FLASH' : 'ANALYTIC ENGINE'}
                </span>
              </div>
              <div className="text-xs text-slate-400">Natural-Language Synthesis</div>
            </div>

            {/* Database & Pipeline */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Data Store & Cache</span>
                <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  CONNECTED
                </span>
              </div>
              <div className="text-xs text-slate-400">In-Memory + PostgreSQL Ready</div>
            </div>
          </div>

          {/* Data Quality Metrics */}
          <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Data Quality & Ingestion Integrity Metrics</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Integrity Pass Rate</span>
                <span className="text-xl font-extrabold text-emerald-400">
                  {health.dataQualityScore}%
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Total Ingested Records</span>
                <span className="text-xl font-extrabold text-white">
                  {health.totalRecordsProcessed}
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Flagged / Rejected</span>
                <span className="text-xl font-extrabold text-slate-300">
                  {health.rejectedRecordsCount}
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Engine Uptime</span>
                <span className="text-xl font-extrabold text-cyan-400">
                  {formatUptime(health.uptimeSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Audit Logs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Recent Ingestion Validation Audit Log (Latest 10)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <th className="py-2.5 px-3">Audit ID</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">City</th>
                    <th className="py-2.5 px-3">Validation Result</th>
                    <th className="py-2.5 px-3">Temperature</th>
                    <th className="py-2.5 px-3">Status / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {health.qualityAuditLogs && health.qualityAuditLogs.length > 0 ? (
                    health.qualityAuditLogs.slice(0, 10).map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">{log.id.slice(0, 14)}</td>
                        <td className="py-2 px-3 text-slate-300">{formatTimestamp(log.timestamp)}</td>
                        <td className="py-2 px-3 font-semibold text-white">{log.city}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.passed
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {log.passed ? 'PASSED' : 'REJECTED'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">{log.metricsSample?.temperature}°C</td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">
                          {log.passed ? 'All atmospheric boundaries verified' : log.issues?.join('; ')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">
                        No validation anomalies recorded in current session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
