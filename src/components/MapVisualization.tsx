import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocationInfo } from '../types/climate.ts';
import { PRESET_CITIES } from '../../server/openMeteoService.ts';
import { Map, Layers, Navigation, ExternalLink } from 'lucide-react';
import { formatTemp, getAqiColor } from '../utils/units.ts';

interface MapVisualizationProps {
  currentLocation: LocationInfo;
  onSelectCity: (city: string) => void;
  tempUnit: 'C' | 'F';
}

type MapLayer = 'aqi' | 'temperature' | 'rainfall' | 'uv';

export const MapVisualization: React.FC<MapVisualizationProps> = ({
  currentLocation,
  onSelectCity,
  tempUnit,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('aqi');
  const [cityDataMap, setCityDataMap] = useState<Record<string, any>>({});

  // Fetch quick telemetry for map markers
  useEffect(() => {
    const fetchMarkerTelemetry = async () => {
      const cityList = Object.values(PRESET_CITIES);
      const results: Record<string, any> = {};

      await Promise.all(
        cityList.map(async (city) => {
          try {
            const [wRes, aRes] = await Promise.all([
              fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,precipitation,uv_index,weather_code`
              ),
              fetch(
                `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.latitude}&longitude=${city.longitude}&current=us_aqi,pm2_5`
              ),
            ]);
            const wData = await wRes.json();
            const aData = await aRes.json();

            results[city.id] = {
              city: city.city,
              country: city.country,
              latitude: city.latitude,
              longitude: city.longitude,
              temp: wData.current?.temperature_2m ?? 25,
              rain: wData.current?.precipitation ?? 0,
              uv: wData.current?.uv_index ?? 5,
              aqi: aData.current?.us_aqi ?? 50,
              pm25: aData.current?.pm2_5 ?? 15,
            };
          } catch (e) {
            console.warn(`Map marker fetch failed for ${city.city}:`, e);
          }
        })
      );

      setCityDataMap(results);
    };

    fetchMarkerTelemetry();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLocation.latitude, currentLocation.longitude],
        zoom: 4,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Dark theme tiles (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([currentLocation.latitude, currentLocation.longitude], 5);
    }
  }, [currentLocation.latitude, currentLocation.longitude]);

  // Update markers when layer or city data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    Object.values(cityDataMap).forEach((item: any) => {
      let markerColor = '#10b981';
      let badgeText = '';

      if (activeLayer === 'aqi') {
        const style = getAqiColor(item.aqi);
        badgeText = `AQI ${item.aqi}`;
        if (item.aqi > 200) markerColor = '#9333ea';
        else if (item.aqi > 150) markerColor = '#ef4444';
        else if (item.aqi > 100) markerColor = '#f97316';
        else if (item.aqi > 50) markerColor = '#eab308';
        else markerColor = '#10b981';
      } else if (activeLayer === 'temperature') {
        const val = tempUnit === 'F' ? (item.temp * 9) / 5 + 32 : item.temp;
        badgeText = `${val.toFixed(1)}°${tempUnit}`;
        if (item.temp > 35) markerColor = '#ef4444';
        else if (item.temp > 28) markerColor = '#f97316';
        else if (item.temp > 20) markerColor = '#eab308';
        else if (item.temp > 10) markerColor = '#06b6d4';
        else markerColor = '#3b82f6';
      } else if (activeLayer === 'rainfall') {
        badgeText = `${item.rain} mm`;
        if (item.rain > 15) markerColor = '#3b82f6';
        else if (item.rain > 2) markerColor = '#06b6d4';
        else markerColor = '#64748b';
      } else if (activeLayer === 'uv') {
        badgeText = `UV ${item.uv.toFixed(1)}`;
        if (item.uv > 8) markerColor = '#ef4444';
        else if (item.uv > 5) markerColor = '#f97316';
        else markerColor = '#10b981';
      }

      const isCurrentCity = currentLocation.city.toLowerCase() === item.city.toLowerCase();

      // Custom HTML Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
            <div style="
              background-color: ${markerColor};
              color: #020617;
              font-weight: 800;
              font-size: 11px;
              padding: 2px 7px;
              border-radius: 9999px;
              white-space: nowrap;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              border: ${isCurrentCity ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.4)'};
            ">
              ${item.city}: ${badgeText}
            </div>
            <div style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background-color: ${markerColor};
              margin-top: 2px;
              box-shadow: 0 0 8px ${markerColor};
            "></div>
          </div>
        `,
        iconSize: [80, 40],
        iconAnchor: [40, 20],
      });

      const marker = L.marker([item.latitude, item.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 170px; color: #f8fafc;">
          <div style="font-size: 13px; font-weight: bold; margin-bottom: 2px; color: #38bdf8;">
            ${item.city}, ${item.country}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            Coordinates: ${item.latitude.toFixed(2)}°, ${item.longitude.toFixed(2)}°
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-bottom: 10px;">
            <div>Temp: <strong>${item.temp}°C</strong></div>
            <div>AQI: <strong>${item.aqi}</strong></div>
            <div>Rain: <strong>${item.rain} mm</strong></div>
            <div>UV: <strong>${item.uv}</strong></div>
          </div>
          <button id="btn-select-${item.city.toLowerCase()}" style="
            width: 100%;
            padding: 5px 8px;
            background: #10b981;
            color: #020617;
            border: none;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
          ">
            Select in Dashboard
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${item.city.toLowerCase()}`);
        if (btn) {
          btn.onclick = () => {
            onSelectCity(item.city);
            marker.closePopup();
          };
        }
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [cityDataMap, activeLayer, tempUnit, currentLocation.city, onSelectCity]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Map className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Global Environmental Spatial Map</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Geospatial sensor distribution with switchable atmospheric layers
          </p>
        </div>

        {/* Layer Switches */}
        <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          {(['aqi', 'temperature', 'rainfall', 'uv'] as MapLayer[]).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition capitalize ${
                activeLayer === layer
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {layer === 'aqi' ? 'Air Quality (AQI)' : layer}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-96 rounded-xl overflow-hidden border border-slate-800">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-20 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 pointer-events-none">
          <div className="font-bold text-white mb-1 uppercase tracking-wider text-[10px]">
            Layer: {activeLayer.toUpperCase()}
          </div>
          {activeLayer === 'aqi' && (
            <div className="flex items-center space-x-2 font-mono">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-1"></span>0-50 Good</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></span>51-100 Mod</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-400 mr-1"></span>101-150 Sens</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-400 mr-1"></span>151+ Unhealthy</span>
            </div>
          )}
          {activeLayer === 'temperature' && (
            <div className="flex items-center space-x-2 font-mono">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-400 mr-1"></span>&lt;10°C</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-cyan-400 mr-1"></span>10-20°C</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></span>20-28°C</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-400 mr-1"></span>28-35°C</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-400 mr-1"></span>&gt;35°C</span>
            </div>
          )}
          {activeLayer === 'rainfall' && (
            <div className="flex items-center space-x-2 font-mono">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-slate-500 mr-1"></span>0 mm Dry</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-cyan-400 mr-1"></span>&gt;0 mm Rain</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>&gt;15 mm Heavy</span>
            </div>
          )}
          {activeLayer === 'uv' && (
            <div className="flex items-center space-x-2 font-mono">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-1"></span>0-2 Low</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></span>3-5 Mod</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-400 mr-1"></span>6-8 High</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-purple-400 mr-1"></span>8+ Very High</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
