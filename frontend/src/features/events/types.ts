export type EventFilterType =
  | 'deviceOverspeed'
  | 'geofenceEnter'
  | 'geofenceExit'
  | 'deviceOnline'
  | 'deviceOffline'
  | 'deviceMoving'
  | 'deviceStopped'
  | 'alarm';

// Re-export EventMessage from websocket for convenience
export type { EventMessage } from '@features/positions/services/websocket';