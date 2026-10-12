/**
 * ClimatePulse Unit & Formatting Utilities
 */

export function formatTemp(celsius: number, unit: 'C' | 'F' = 'C'): string {
  if (unit === 'F') {
    const f = (celsius * 9) / 5 + 32;
    return `${f.toFixed(1)}°F`;
  }
  return `${celsius.toFixed(1)}°C`;
}

export function formatWind(kmh: number, unit: 'kmh' | 'mph' = 'kmh'): string {
  if (unit === 'mph') {
    const mph = kmh * 0.621371;
    return `${mph.toFixed(1)} mph`;
  }
  return `${kmh.toFixed(1)} km/h`;
}

export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function getAqiColor(aqi: number): { bg: string; text: string; border: string; label: string } {
  if (aqi <= 50) {
    return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'Good' };
  }
  if (aqi <= 100) {
    return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40', label: 'Moderate' };
  }
  if (aqi <= 150) {
    return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', label: 'Sensitive' };
  }
  if (aqi <= 200) {
    return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', label: 'Unhealthy' };
  }
  if (aqi <= 300) {
    return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40', label: 'Very Unhealthy' };
  }
  return { bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-600', label: 'Hazardous' };
}

export function getUvLevel(uv: number): { label: string; color: string } {
  if (uv < 3) return { label: 'Low', color: 'text-emerald-400' };
  if (uv < 6) return { label: 'Moderate', color: 'text-yellow-400' };
  if (uv < 8) return { label: 'High', color: 'text-orange-400' };
  if (uv < 11) return { label: 'Very High', color: 'text-red-400' };
  return { label: 'Extreme', color: 'text-purple-400' };
}
