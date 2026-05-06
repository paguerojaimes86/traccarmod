import { create } from 'zustand';
import type { EventMessage } from '@features/positions/services/websocket';
import { alertsDebug } from '@shared/lib/debug';

const DISMISSED_STORAGE_KEY = 'alert-dismissed-ids';
const MAX_DISMISSED = 500;

function loadDismissed(): number[] {
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDismissed(ids: number[]) {
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_DISMISSED)));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

interface AlertState {
  recentEvents: EventMessage[];
  maxVisible: number;
  dismissedEventIds: number[];
}

interface AlertActions {
  addEvent: (event: EventMessage) => void;
  addEvents: (events: EventMessage[]) => void;
  clearEvents: () => void;
  removeEvent: (id: number) => void;
  dismissEvent: (id: number) => void;
}

export const useAlertStore = create<AlertState & AlertActions>()((set) => ({
  recentEvents: [],
  maxVisible: 50,
  dismissedEventIds: loadDismissed(),

  addEvent: (event) =>
    set((s) => {
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

  dismissEvent: (id) =>
    set((s) => {
      if (s.dismissedEventIds.includes(id)) return s;
      const newDismissed = [...s.dismissedEventIds, id];
      saveDismissed(newDismissed);
      return { dismissedEventIds: newDismissed };
    }),
}));
