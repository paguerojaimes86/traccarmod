export const QUERY_KEYS = {
  devices: ['devices'] as const,
  device: (id: number) => ['devices', id] as const,
  allPositions: ['positions'] as const,
  positions: (params: { deviceId: number; from: string; to: string }) =>
    ['positions', params] as const,
  geofences: ['geofences'] as const,
  routes: ['routes'] as const,
  session: ['session'] as const,
  groups: ['groups'] as const,
  reports: ['reports'] as const,
  users: ['users'] as const,
  commands: ['commands'] as const,
  server: ['server'] as const,
  // Alerts / Notifications / Events
  notifications: ['notifications'] as const,
  notificationTypes: ['notificationTypes'] as const,
  events: ['events'] as const,
  reportEvents: (params: { deviceId?: number | number[]; type?: string | string[]; from: string; to: string }) =>
    ['reportEvents', params] as const,
} as const;

export const WS_URL = import.meta.env.VITE_WS_URL || '';

export const DEFAULT_MAP_CENTER: [number, number] = [0, 0];
export const DEFAULT_MAP_ZOOM = 2;

export const WS_RECONNECT_MAX_INTERVAL = 30_000;
export const WS_RECONNECT_BASE_DELAY = 1_000;

// Throttle para invalidar la query de dispositivos desde el WebSocket.
// Las posiciones llegan cada segundo pero el status del dispositivo cambia mucho menos.
export const DEVICES_INVALIDATE_THROTTLE_MS = 30_000;
