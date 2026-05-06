import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { useAlertStore } from '@features/alerts/store';
import { AlertToast } from './AlertToast';

const containerStyle: CSSProperties = {
  position: 'fixed',
  bottom: '1.25rem',
  right: '1.25rem',
  zIndex: 50,
  display: 'flex',
  flexDirection: 'column-reverse',
  gap: '0.5rem',
  pointerEvents: 'none',
};

export function AlertToastContainer() {
  const recentEvents = useAlertStore((s) => s.recentEvents);
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
  const [exitingIds, setExitingIds] = useState<Set<number>>(new Set());

  // Show only the last 5 events as toasts. When new events arrive that we
  // haven't shown yet, add them to the visible set.
  const latestEvents = useMemo(() => recentEvents.slice(0, 5), [recentEvents]);

  useEffect(() => {
    setVisibleIds((prev) => {
      const newIds = new Set(prev);
      let changed = false;
      for (const event of latestEvents) {
        if (!newIds.has(event.id)) {
          newIds.add(event.id);
          changed = true;
        }
      }
      return changed ? newIds : prev;
    });
  }, [latestEvents]);

  const dismissToast = (id: number) => {
    setExitingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setVisibleIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300); // match animation duration
  };

  // Determine which events should currently be shown as toasts
  const visibleEvents = latestEvents.filter((e) => visibleIds.has(e.id));

  if (visibleEvents.length === 0) return null;

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(50%);
            opacity: 0;
          }
        }
      `}</style>
      {visibleEvents.map((event) => {
        const isExiting = exitingIds.has(event.id);
        return (
          <div
            key={event.id}
            style={{
              pointerEvents: 'auto',
              animation: isExiting
                ? 'fadeOutRight 0.3s cubic-bezier(0.4, 0, 1, 1) forwards'
                : 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <AlertToast
              event={event}
              onDismiss={() => dismissToast(event.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
