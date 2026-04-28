import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wsService } from '@features/positions/services/websocket';
import type { EventMessage } from '@features/positions/services/websocket';
import { useAlertStore } from '@features/alerts/store';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import { useDevices } from '@features/devices/hooks/useDevices';
import { useNotifications } from '@features/notifications/hooks/useNotifications';

const POLLING_INTERVAL = 30_000;
const EVENT_WINDOW_MS = 3_600_000; // 1 hour

export function useEvents() {
  const addEvents = useAlertStore((s) => s.addEvents);
  const [isActive, setIsActive] = useState(false);
  const lastFetchRef = useRef<string>('');
  const { data: devices = [] } = useDevices();
  const { data: notifications = [] } = useNotifications();

  const activeEventTypes = useMemo(() => {
    const types = new Set<string>();
    for (const n of notifications) {
      if (n.type) types.add(n.type);
    }
    return types;
  }, [notifications]);

  // Pass notification types to the API query so we only fetch what we need
  const eventTypeArray = useMemo(() => Array.from(activeEventTypes), [activeEventTypes]);

  const deviceIds = useMemo(
    () => devices.map((d) => d.id).filter((id): id is number => id != null),
    [devices]
  );

  const { data: polledEvents } = useQuery({
    queryKey: [QUERY_KEYS.events, deviceIds, eventTypeArray],
    queryFn: async () => {
      if (deviceIds.length === 0) return [];

      const from = new Date(Date.now() - EVENT_WINDOW_MS).toISOString();
      const to = new Date().toISOString();

      const params = {
        deviceId: deviceIds,
        from,
        to,
        ...(eventTypeArray.length > 0 ? { type: eventTypeArray } : {}),
      };

      const { data, error } = await apiClient.GET('/reports/events', {
        params: { query: params },
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: POLLING_INTERVAL,
    refetchInterval: POLLING_INTERVAL,
    enabled: deviceIds.length > 0,
  });

  // Feed polled events into alert store — only new ones
  useEffect(() => {
    if (!polledEvents || polledEvents.length === 0) return;

    const filtered = (polledEvents as EventMessage[]).filter(
      (e) => activeEventTypes.size > 0 && activeEventTypes.has(e.type)
    );
    if (filtered.length === 0) return;

    // Build a fingerprint to avoid re-adding the same batch
    const fingerprint = filtered.map((e) => e.id).join(',');
    if (fingerprint === lastFetchRef.current) return;
    lastFetchRef.current = fingerprint;

    addEvents(filtered);
  }, [polledEvents, addEvents, activeEventTypes]);

  // WebSocket: real-time events
  const handleEvents = useCallback((events: EventMessage[]) => {
    const filtered = events.filter(
      (e) => activeEventTypes.size > 0 && activeEventTypes.has(e.type)
    );
    if (filtered.length > 0) {
      addEvents(filtered);
    }
    setIsActive(true);
  }, [addEvents, activeEventTypes]);

  useEffect(() => {
    const unsub = wsService.onEvent((events: EventMessage[]) => {
      handleEvents(events);
    });

    const unsubStatus = wsService.onStatus((status) => {
      if (status === 'disconnected') {
        setIsActive(false);
      } else if (status === 'connected') {
        setIsActive(true);
      }
    });

    return () => {
      unsub();
      unsubStatus();
    };
  }, [handleEvents]);

  return { isActive };
}