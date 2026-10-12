import React from 'react';
import { X, ExternalLink, Database, ShieldCheck, AlertCircle } from 'lucide-react';

interface DataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSourcesModal: React.FC<DataSourcesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sources = [
    {
      name: 'Open-Meteo Weather Forecast API',
      category: 'Meteorology & Physical Atmospheric Telemetry',
      provider: 'Open-Meteo GmbH (Licensed under Non-Commercial / Attribution)',
      endpoint: 'https://api.open-meteo.com/v1/forecast',
      frequency: 'Hourly numerical weather prediction model runs (DWD ICON, NOAA GFS, ECMWF IFS)',
      metrics: 'Temperature (°C), Apparent Temperature, Relative Humidity (%), Atmospheric Pressure (hPa), Wind Speed (km/h), Precipitation (mm), UV Index (0-16)',
      limitations: 'Model-derived reanalysis and forecast grid; microclimates under 1-km resolution may show localized divergence.',
    },
    {
      name: 'Open-Meteo Air Quality & Chemical API',
      category: 'Atmospheric Chemistry & Aerosol Concentrations',
      provider: 'Copernicus Atmosphere Monitoring Service (CAMS) & Open-Meteo',
      endpoint: 'https://air-quality-api.open-meteo.com/v1/air-quality',
      frequency: 'Hourly chemical dispersion models with satellite assimilation',
      metrics: 'US AQI (0-500), European CAQI, PM2.5 (µg/m³), PM10 (µg/m³), Carbon Monoxide CO (µg/m³), NO₂ (µg/m³), SO₂ (µg/m³), Ozone O₃ (µg/m³), Saharan Dust',
      limitations: 'Regional atmospheric transport models provide grid averages rather than localized street-canyon point sensor readings.',
    },
    {
      name: 'Open-Meteo Global Geocoding API',
      category: 'Spatial Georeferencing',
      provider: 'OpenStreetMap Nominatim & Geonames database',
      endpoint: 'https://geocoding-api.open-meteo.com/v1/search',
      frequency: 'Real-time lookups with millisecond spatial indexing',
      metrics: 'Latitude, Longitude, Elevation, Timezone, Administrative Country Codes',
      limitations: 'Ambiguous city names resolve to highest-population municipality unless specific regional qualifiers are provided.',
    },
    {
      name: 'NOAA Global Monitoring Laboratory (GML)',
      category: 'Planetary Atmospheric Baseline Greenhouse Gases',
      provider: 'National Oceanic and Atmospheric Administration (NOAA)',
      endpoint: 'Mauna Loa Baseline Observatory & Global Greenhouse Gas Reference Network',
      frequency: 'Monthly continuous high-precision nondispersive infrared spectrometry',
      metrics: 'Atmospheric Carbon Dioxide CO₂ Concentration (ppm), Annual Growth Anomaly (ppm/yr)',
      limitations: 'Reflects well-mixed background tropospheric accumulation; distinct from localized urban industrial emissions.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Data Sources, Metadata & Limitations</h3>
              <p className="text-xs text-slate-400">
                Transparent documentation of public API providers, update frequencies, and error boundaries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {sources.map((src) => (
            <div key={src.name} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-white text-sm">{src.name}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Verified Public API
                </span>
              </div>
              <p className="text-slate-400 text-xs mb-2">{src.provider}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 mb-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Update Frequency:</span>
                  <span>{src.frequency}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Metrics Provided:</span>
                  <span>{src.metrics}</span>
                </div>
              </div>

              <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded border border-amber-500/20 flex items-start space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Known Limitations: </span>
                  <span>{src.limitations}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legal & Open Access Notice */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>All ingested datasets comply with open public data sharing frameworks.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
