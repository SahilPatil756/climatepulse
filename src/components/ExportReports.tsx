import React, { useState } from 'react';
import { LocationInfo, CurrentWeather, AirQualityMetrics, ClimateStats, ClimateImpactScore } from '../types/climate.ts';
import { Download, FileSpreadsheet, FileText, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import { formatTemp, formatTimestamp } from '../utils/units.ts';

interface ExportReportsProps {
  location: LocationInfo;
  current: CurrentWeather;
  aqi: AirQualityMetrics;
  stats: ClimateStats;
  impactScore: ClimateImpactScore;
  tempUnit: 'C' | 'F';
}

export const ExportReports: React.FC<ExportReportsProps> = ({
  location,
  current,
  aqi,
  stats,
  impactScore,
  tempUnit,
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (format: 'csv' | 'excel' | 'json') => {
    setDownloading(format);
    const url = `/api/export/${format}?city=${encodeURIComponent(location.city)}`;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `climatepulse_${location.city.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.${
      format === 'excel' ? 'csv' : format
    }`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => {
      setDownloading(null);
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Export Environmental Reports & Datasets</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Download machine-readable datasets (CSV, Excel, JSON) or print standard executive briefs for {location.city}
          </p>
        </div>
      </div>

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* 1. CSV Export */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">CSV Dataset</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Standard comma-separated telemetry with headers, timestamps, weather, and air quality pollutants.
            </p>
          </div>
          <button
            onClick={() => handleDownload('csv')}
            disabled={downloading === 'csv'}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center space-x-1.5"
          >
            {downloading === 'csv' ? (
              <span>Preparing...</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download .CSV</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Excel Format */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 w-fit mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Excel-Ready Spreadsheet</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Spreadsheet format pre-formatted for Microsoft Excel, LibreOffice Calc, or Google Sheets.
            </p>
          </div>
          <button
            onClick={() => handleDownload('excel')}
            disabled={downloading === 'excel'}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition flex items-center justify-center space-x-1.5"
          >
            {downloading === 'excel' ? (
              <span>Preparing...</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download .XLS</span>
              </>
            )}
          </button>
        </div>

        {/* 3. JSON Payload */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 w-fit mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Structured JSON</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Hierarchical JSON payload complete with coordinates, daily aggregations, and quality validations.
            </p>
          </div>
          <button
            onClick={() => handleDownload('json')}
            disabled={downloading === 'json'}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center justify-center space-x-1.5"
          >
            {downloading === 'json' ? (
              <span>Preparing...</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download .JSON</span>
              </>
            )}
          </button>
        </div>

        {/* 4. Print / PDF Report */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 w-fit mb-3">
              <Printer className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Print / Save as PDF</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Generate a clean, print-optimized executive summary sheet using your browser's print dialog.
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-purple-500 hover:bg-purple-400 text-slate-950 transition flex items-center justify-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Printable Executive Climate Brief Preview */}
      <div className="p-6 rounded-xl bg-slate-950 border border-slate-800" id="printable-brief">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
              Executive Climate Brief
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {location.city}, {location.country}
            </h2>
          </div>
          <div className="text-right text-xs text-slate-400 font-mono">
            <div>Timestamp: {formatTimestamp(current.timestamp)}</div>
            <div>Source: Open-Meteo & ClimatePulse Pipeline</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-6">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block">Temperature</span>
            <span className="text-base font-bold text-white">{formatTemp(current.temperature, tempUnit)}</span>
            <span className="text-[10px] text-slate-400 block">Feels: {formatTemp(current.apparentTemperature, tempUnit)}</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block">Air Quality</span>
            <span className="text-base font-bold text-teal-400">AQI {aqi.usAqi}</span>
            <span className="text-[10px] text-slate-400 block">{aqi.aqiStatus}</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block">Fine Particulate (PM2.5)</span>
            <span className="text-base font-bold text-white">{aqi.pm25} µg/m³</span>
            <span className="text-[10px] text-slate-400 block">WHO: ≤ 15 µg/m³</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block">Climate Impact Index</span>
            <span className="text-base font-bold text-rose-400">{impactScore.totalScore} / 100</span>
            <span className="text-[10px] text-slate-400 block">{impactScore.status}</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 border-t border-slate-800 pt-3 flex items-center justify-between">
          <span>ClimatePulse Live Climate Impact Platform</span>
          <span className="font-mono">Audit Hash: CP-{Date.now().toString(36).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
