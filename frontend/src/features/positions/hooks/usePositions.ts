import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Position } from '@shared/api/types.models';

/**
 * Hook genérico — suscribe a TODAS las posiciones.
 * Usar SOLO en componentes que necesitan el array completo (MapView).
 * Para casos específicos, usar los hooks especializados de abajo.
 */
export function usePositions() {
  return useQuery({
    queryKey: QUERY_KEYS.allPositions,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/positions');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });
}

/**
 * Devuelve la última posición de un device específico.
 * Solo re-renderiza cuando ESE device cambia de posición.
 */
export function useDevicePosition(deviceId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.allPositions,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/positions');
      if (error) throw error;
      return data ?? [];
    },
    select: (all: Position[]) => {
      if (deviceId == null) return null;
      // Cada posición tiene deviceId; buscamos la última de este device
      return all.find((p) => p.deviceId === deviceId) ?? null;
    },
    staleTime: 10_000,
    enabled: deviceId != null,
  });
}

/**
 * Devuelve un Map de deviceId → última posición.
 * Solo re-renderiza si cambia la última posición de algún device.
 * Ideal para DeviceList que muestra status de cada device.
 */
export function useDevicePositionsMap() {
  return useQuery({
    queryKey: QUERY_KEYS.allPositions,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/positions');
      if (error) throw error;
      return data ?? [];
    },
    select: (all: Position[]) => {
      const map = new Map<number, Position>();
      for (const p of all) {
        if (p.deviceId != null) {
          map.set(p.deviceId, p);
        }
      }
      return map;
    },
    staleTime: 10_000,
  });
}

/**
 * Devuelve las posiciones de un device para el historial (path en mapa).
 * NO se suscribe al WebSocket — usa query con from/to.
 */
export function useDevicePositions(deviceId: number, from: string, to: string) {
  return useQuery({
    queryKey: QUERY_KEYS.positions({ deviceId, from, to }),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/positions', {
        params: { query: { deviceId, from, to } },
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!deviceId && !!from && !!to,
  });
}
