import React from 'react';
import {
  LayoutDashboard,
  Thermometer,
  Wind,
  Flame,
  ArrowRightLeft,
  AlertTriangle,
  Grid,
  Map,
  Sparkles,
  Download,
  Activity,
} from 'lucide-react';

export type DashboardTab =
  | 'overview'
  | 'temperature'
  | 'air_quality'
  | 'carbon'
  | 'comparison'
  | 'anomalies'
  | 'correlation'
  | 'map'
  | 'insights'
  | 'export'
  | 'admin';

interface NavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  anomaliesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  anomaliesCount,
}) => {
  const tabs: Array<{ id: DashboardTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'temperature', label: 'Temperature', icon: Thermometer },
    { id: 'air_quality', label: 'Air Quality', icon: Wind },
    { id: 'carbon', label: 'Carbon & CO₂', icon: Flame },
    { id: 'comparison', label: 'Compare Cities', icon: ArrowRightLeft },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle, badge: anomaliesCount },
    { id: 'correlation', label: 'Correlation', icon: Grid },
    { id: 'map', label: 'Interactive Map', icon: Map },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'export', label: 'Export & Reports', icon: Download },
    { id: 'admin', label: 'Admin & Health', icon: Activity },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/60 sticky top-[98px] md:top-[69px] z-30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
