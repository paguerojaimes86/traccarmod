import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@features/auth/store';
import { wsService } from '../services/websocket';
import { QUERY_KEYS, DEVICES_INVALIDATE_THROTTLE_MS } from '@shared/lib/constants';

export function useWebSocket() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const mountedRef = useRef(false);
  // Throttle: solo invalidamos /devices a lo sumo una vez cada 30s.
  // Las posiciones se actualizan SIEMPRE directo en el cache (sin HTTP call).
  const devicesThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      wsService.disconnect();
      return;
    }

    if (mountedRef.current) return;
    mountedRef.current = true;

    const unsub = wsService.onPosition((positions) => {
      if (positions.length === 0) return;

      // 1. Actualizar posiciones en el cache directamente — sin API call
      queryClient.setQueryData(QUERY_KEYS.allPositions, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        const map = new Map(old.map((p: { deviceId?: number }) => [p.deviceId, p]));
        for (const pos of positions) {
          if (pos.deviceId != null) {
            map.set(pos.deviceId, pos);
          }
        }
        return Array.from(map.values());
      });

      // 2. Invalidar devices con throttle — status/lastUpdate cambian poco
      // Sin throttle: una llamada HTTP a /devices por cada mensaje WS (puede ser 1/seg)
      // Con throttle: máximo 1 llamada cada DEVICES_INVALIDATE_THROTTLE_MS
      if (devicesThrottleRef.current == null) {
        devicesThrottleRef.current = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devices });
          devicesThrottleRef.current = null;
        }, DEVICES_INVALIDATE_THROTTLE_MS);
      }
    });

    wsService.connect();

    return () => {
      mountedRef.current = false;
      unsub();
      wsService.disconnect();
      // Limpiar el timer de throttle al desmontar
      if (devicesThrottleRef.current != null) {
        clearTimeout(devicesThrottleRef.current);
        devicesThrottleRef.current = null;
      }
    };
  }, [isAuthenticated, queryClient]);
}
