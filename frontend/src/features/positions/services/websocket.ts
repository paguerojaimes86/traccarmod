import { useAuthStore } from '@features/auth/store';
import { useUiStore } from '@shared/lib/ui-store';
import { WS_URL, WS_RECONNECT_BASE_DELAY, WS_RECONNECT_MAX_INTERVAL } from '@shared/lib/constants';
import { alertsDebug, alertsWarn } from '@shared/lib/debug';

export type PositionMessage = {
  id?: number;
  deviceId?: number;
  protocol?: string;
  deviceTime?: string;
  fixTime?: string;
  serverTime?: string;
  valid?: boolean;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  speed?: number;
  course?: number;
  address?: string;
  accuracy?: number;
  attributes?: Record<string, unknown>;
};

export type EventMessage = {
  id: number;
  type: string;
  deviceId: number;
  eventTime: string;
  positionId?: number;
  geofenceId?: number;
  attributes?: Record<string, unknown>;
};

type WsMessage = {
  positions?: PositionMessage[];
  devices?: unknown[];
  events?: EventMessage[];
};

type PositionHandler = (positions: PositionMessage[]) => void;
type EventHandler = (events: EventMessage[]) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let positionListeners: Set<PositionHandler> = new Set();
let eventListeners: Set<EventHandler> = new Set();
let statusListeners: Set<(status: 'connected' | 'reconnecting' | 'disconnected') => void> = new Set();

function getWsUrl(): string {
  if (WS_URL) return WS_URL;
  if (import.meta.env.DEV) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/socket`;
  }
  // Production: connect directly to Traccar server (same host as API client)
  return 'wss://gps.msglobalgps.com/api/socket';
}

function clearReconnect() {
  if (reconnectTimer != null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function setStatus(status: 'connected' | 'reconnecting' | 'disconnected') {
  useUiStore.getState().setWsStatus(status);
  statusListeners.forEach((fn) => fn(status));
}

function connect() {
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) {
    alertsDebug('ws', 'skip connect: not authenticated');
    return;
  }

  clearReconnect();

  try {
    alertsDebug('ws', 'connecting', { url: getWsUrl() });
    ws = new WebSocket(getWsUrl());
  } catch {
    alertsWarn('ws', 'failed to construct websocket, scheduling reconnect');
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    reconnectAttempt = 0;
    setStatus('connected');
    alertsDebug('ws', 'connected');
  };

  ws.onmessage = (event) => {
    try {
      const message: WsMessage = JSON.parse(event.data);

      // Traccar WebSocket format: { "positions": [...], "devices": [...], "events": [...] }
      // Keys are at the root level, not nested in type/data

      if (Array.isArray(message.positions) && message.positions.length > 0) {
        alertsDebug('ws', 'positions message received', { count: message.positions.length });
        positionListeners.forEach((fn) => fn(message.positions!));
      }

      if (Array.isArray(message.events) && message.events.length > 0) {
        alertsDebug('ws', 'events message received', {
          count: message.events.length,
          types: message.events.map((e) => e.type),
          ids: message.events.map((e) => e.id),
        });
        eventListeners.forEach((fn) => fn(message.events!));
      }
    } catch {
      alertsWarn('ws', 'malformed message ignored');
    }
  };

  ws.onclose = () => {
    setStatus('disconnected');
    alertsWarn('ws', 'socket closed');
    ws = null;
    if (useAuthStore.getState().isAuthenticated) {
      scheduleReconnect();
    }
  };

  ws.onerror = () => {
    setStatus('disconnected');
    alertsWarn('ws', 'socket error');
  };
}

function scheduleReconnect() {
  clearReconnect();
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) {
    alertsDebug('ws', 'skip reconnect: not authenticated');
    return;
  }

  setStatus('reconnecting');

  const delay = Math.min(
    WS_RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempt),
    WS_RECONNECT_MAX_INTERVAL,
  );
  alertsWarn('ws', 'scheduling reconnect', { attempt: reconnectAttempt + 1, delayMs: delay });
  reconnectAttempt++;

  reconnectTimer = setTimeout(() => {
    connect();
  }, delay);
}

export const wsService = {
  connect,
  disconnect() {
    alertsDebug('ws', 'disconnect requested');
    clearReconnect();
    reconnectAttempt = 0;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      ws = null;
    }
    setStatus('disconnected');
  },
  onPosition(handler: PositionHandler) {
    positionListeners.add(handler);
    return () => {
      positionListeners.delete(handler);
    };
  },
  onEvent(handler: EventHandler) {
    eventListeners.add(handler);
    return () => {
      eventListeners.delete(handler);
    };
  },
  onStatus(handler: (status: 'connected' | 'reconnecting' | 'disconnected') => void) {
    statusListeners.add(handler);
    return () => {
      statusListeners.delete(handler);
    };
  },
};