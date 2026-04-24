import { useAuthStore } from '@features/auth/store';
import { useUiStore } from '@shared/lib/ui-store';
import { WS_URL, WS_RECONNECT_BASE_DELAY, WS_RECONNECT_MAX_INTERVAL } from '@shared/lib/constants';

type PositionMessage = {
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

type WsMessage = {
  type?: 'positions' | 'devices' | string;
  data?: PositionMessage[] | unknown;
};

type PositionHandler = (positions: PositionMessage[]) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let positionListeners: Set<PositionHandler> = new Set();
let statusListeners: Set<(status: 'connected' | 'reconnecting' | 'disconnected') => void> = new Set();

function getWsUrl(): string {
  if (WS_URL) return WS_URL;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/socket`;
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
  if (!isAuthenticated) return;

  clearReconnect();

  try {
    ws = new WebSocket(getWsUrl());
  } catch {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    reconnectAttempt = 0;
    setStatus('connected');
  };

  ws.onmessage = (event) => {
    try {
      const message: WsMessage = JSON.parse(event.data);
      if (message.type === 'positions' && Array.isArray(message.data)) {
        const positions = message.data as PositionMessage[];
        positionListeners.forEach((fn) => fn(positions));
      }
    } catch {
      // ignore malformed messages
    }
  };

  ws.onclose = () => {
    setStatus('disconnected');
    ws = null;
    if (useAuthStore.getState().isAuthenticated) {
      scheduleReconnect();
    }
  };

  ws.onerror = () => {
    setStatus('disconnected');
  };
}

function scheduleReconnect() {
  clearReconnect();
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) return;

  setStatus('reconnecting');

  const delay = Math.min(
    WS_RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempt),
    WS_RECONNECT_MAX_INTERVAL,
  );
  reconnectAttempt++;

  reconnectTimer = setTimeout(() => {
    connect();
  }, delay);
}

export const wsService = {
  connect,
  disconnect() {
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
  onStatus(handler: (status: 'connected' | 'reconnecting' | 'disconnected') => void) {
    statusListeners.add(handler);
    return () => {
      statusListeners.delete(handler);
    };
  },
};
