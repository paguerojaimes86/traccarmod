import { create } from 'zustand';
import type { EventMessage } from '@features/positions/services/websocket';
import { alertsDebug } from '@shared/lib/debug';

interface AlertState {
  recentEvents: EventMessage[];
  maxVisible: number;
}

interface AlertActions {
  addEvent: (event: EventMessage) => void;
  addEvents: (events: EventMessage[]) => void;
  clearEvents: () => void;
  removeEvent: (id: number) => void;
}

export const useAlertStore = create<AlertState & AlertActions>()((set) => ({
  recentEvents: [],
  maxVisible: 50,

  addEvent: (event) =>
    set((s) => {
      // Deduplicate by id
      if (s.recentEvents.some((e) => e.id === event.id)) {
        alertsDebug('store', 'event deduplicated', { id: event.id, type: event.type });
        return s;
      }
      alertsDebug('store', 'single event added', { id: event.id, type: event.type });
      return {
        recentEvents: [event, ...s.recentEvents].slice(0, s.maxVisible),
      };
    }),

  addEvents: (events) =>
    set((s) => {
      const existingIds = new Set(s.recentEvents.map((e) => e.id));
      const newEvents = events.filter((e) => !existingIds.has(e.id));
      if (newEvents.length === 0) {
        alertsDebug('store', 'batch ignored: all events duplicated', {
          incoming: events.length,
          totalStored: s.recentEvents.length,
        });
        return s;
      }
      alertsDebug('store', 'batch events added', {
        incoming: events.length,
        added: newEvents.length,
        ids: newEvents.map((e) => e.id),
      });
      return {
        recentEvents: [...newEvents, ...s.recentEvents].slice(0, s.maxVisible),
      };
    }),

  clearEvents: () => set({ recentEvents: [] }),

  removeEvent: (id) =>
    set((s) => ({
      recentEvents: s.recentEvents.filter((e) => e.id !== id),
    })),
}));
