import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  RefreshCw,
  MapPin,
  Clock,
  Database,
  Globe2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { LocationInfo } from '../types/climate.ts';
import { searchLocations } from '../services/api.ts';
import { formatTimestamp } from '../utils/units.ts';

interface HeaderProps {
  currentLocation: LocationInfo;
  onSelectCity: (city: string) => void;
  tempUnit: 'C' | 'F';
  onToggleTempUnit: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
  onOpenDataSources: () => void;
}

const PRESET_QUICK_CITIES = ['Pune', 'Mumbai', 'Delhi', 'Bangalore', 'London', 'New York', 'Tokyo'];

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectCity,
  tempUnit,
  onToggleTempUnit,
  onRefresh,
  isRefreshing,
  lastUpdated,
  onOpenDataSources,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationInfo[]>([]);
  const [isOpenSuggestions, setIsOpenSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const results = await searchLocations(searchQuery);
          setSuggestions(results);
          setIsOpenSuggestions(true);
        } catch {
          setSuggestions([]);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsOpenSuggestions(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpenSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (city: string) => {
    onSelectCity(city);
    setSearchQuery('');
    setIsOpenSuggestions(false);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                <Globe2 className="w-5 h-5 text-slate-950" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold tracking-tight text-white">ClimatePulse</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-400">Live Climate & Environmental Impact Dashboard</p>
              </div>
            </div>

            {/* Mobile Refresh & Unit buttons */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={onToggleTempUnit}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
              >
                °{tempUnit}
              </button>
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Location Search Bar & Controls */}
          <div className="flex flex-1 max-w-xl mx-0 md:mx-4 items-center">
            <div ref={searchContainerRef} className="relative w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length >= 2 && setIsOpenSuggestions(true)}
                  placeholder={`Search any city (e.g., Pune, Mumbai, London)...`}
                  className="w-full pl-10 pr-24 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
                <div className="absolute inset-y-0 right-1 flex items-center pr-1.5">
                  <span className="hidden sm:inline-flex items-center text-[11px] text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded-md">
                    <MapPin className="w-3 h-3 mr-1 text-emerald-400" />
                    {currentLocation.city}
                  </span>
                </div>
              </div>

              {/* Suggestions Dropdown */}
              {isOpenSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="py-1">
                    {suggestions.map((loc) => (
                      <button
                        key={`${loc.city}-${loc.country}-${loc.latitude}`}
                        onClick={() => handleSelectSuggestion(loc.city)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/80 hover:text-emerald-300 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-medium">{loc.city}</span>
                          <span className="text-xs text-slate-400">({loc.country})</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls: Unit, Refresh, Timestamp, Data Sources */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Timestamp Badge */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{formatTimestamp(lastUpdated)}</span>
            </div>

            {/* Temp Unit Toggle */}
            <button
              onClick={onToggleTempUnit}
              title="Toggle Temperature Unit (°C / °F)"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              °{tempUnit}
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Fetch latest environmental observations"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Data Sources Modal Trigger */}
            <button
              onClick={onOpenDataSources}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Data Sources</span>
            </button>
          </div>
        </div>

        {/* Quick City Chips */}
        <div className="mt-3 flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 text-[11px] whitespace-nowrap">Popular:</span>
          {PRESET_QUICK_CITIES.map((city) => {
            const isSelected = currentLocation.city.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                onClick={() => onSelectCity(city)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20 font-semibold'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
