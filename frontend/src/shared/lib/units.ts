export type SpeedUnit = 'kn' | 'kmh' | 'mph';
export type DistanceUnit = 'm' | 'km' | 'mi';

const KNOTS_TO_KMH = 1.852;
const KNOTS_TO_MPH = 1.15078;
const METERS_TO_KM = 0.001;
const METERS_TO_MI = 0.000621371;

export function convertSpeed(knots: number, to: SpeedUnit): number {
  switch (to) {
    case 'kn':
      return knots;
    case 'kmh':
      return knots * KNOTS_TO_KMH;
    case 'mph':
      return knots * KNOTS_TO_MPH;
  }
}

export function formatSpeed(knots: number, unit: SpeedUnit, decimals = 2): string {
  const value = convertSpeed(knots, unit);
  const labels: Record<SpeedUnit, string> = {
    kn: 'kn',
    kmh: 'km/h',
    mph: 'mph',
  };
  return `${value.toFixed(decimals)} ${labels[unit]}`;
}

export function convertDistance(meters: number, to: DistanceUnit): number {
  switch (to) {
    case 'm':
      return meters;
    case 'km':
      return meters * METERS_TO_KM;
    case 'mi':
      return meters * METERS_TO_MI;
  }
}

export function formatDistance(meters: number, unit: DistanceUnit, decimals = 2): string {
  const value = convertDistance(meters, unit);
  const labels: Record<DistanceUnit, string> = {
    m: 'm',
    km: 'km',
    mi: 'mi',
  };
  return `${value.toFixed(decimals)} ${labels[unit]}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then) / 1000;

  if (diff < 60) return 'ahora mismo';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}
