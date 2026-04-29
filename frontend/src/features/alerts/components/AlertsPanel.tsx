import { useState, useMemo, useEffect, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { PositionMessage } from '@features/positions/services/websocket';
import { useAlertStore } from '@features/alerts/store';
import { useDevices } from '@features/devices/hooks/useDevices';
import { usePermissions } from '@shared/permissions';
import { useMapStore } from '@features/map/store';
import { getAlertConfig, ALERT_TYPE_CONFIG } from '@shared/lib/alert-types';
import type { TypeConfig } from '@shared/lib/alert-types';
import { AlertItem } from './AlertItem';
import { IconBell, IconClose, IconPlus } from '@shared/ui/icons';
import { useDeleteNotification, useNotifications } from '@features/notifications/hooks/useNotifications';
import { useEvents } from '@features/events/hooks/useEvents';
import { alertsDebug } from '@shared/lib/debug';

type FilterCategory = 'all' | TypeConfig['category'];

const panelStyle: CSSProperties = {
  width: '340px',
  minWidth: '340px',
  margin: '1.25rem 1.25rem 1.25rem 0',
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '1.25rem',
  overflow: 'hidden',
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(15, 23, 42, 0.06)',
  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
};

const headerStyle: CSSProperties = {
  padding: '1.25rem 1rem',
  borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.02), transparent)',
};

const listStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  listStyle: 'none',
  margin: 0,
  padding: '0.5rem 0.5rem',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(15, 23, 42, 0.1) transparent',
};

const badgeStyle = (count: number): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '1.25rem',
  height: '1.25rem',
  padding: '0 0.375rem',
  borderRadius: '9999px',
  backgroundColor: count > 0 ? 'var(--color-error)' : 'rgba(15, 23, 42, 0.06)',
  color: count > 0 ? 'var(--text-inverse)' : 'var(--text-muted)',
  fontSize: '0.625rem',
  fontWeight: 700,
  fontFamily: 'var(--font-family-base)',
});

const filterButtonStyle = (isActive: boolean, color: string): CSSProperties => ({
  minWidth: '3.2rem',
  padding: '0.4rem 0.6rem',
  borderRadius: '0.85rem',
  border: '1px solid',
  borderColor: isActive ? `${color}50` : 'var(--border-default)',
  background: isActive
    ? `linear-gradient(135deg, ${color}18, rgba(255, 255, 255, 0.6))`
    : 'rgba(15, 23, 42, 0.02)',
  color: isActive ? color : '#64748b',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.35rem',
  transition: 'border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
  boxShadow: isActive ? `0 0 18px -8px ${color}` : 'none',
  fontSize: '0.7rem',
  fontWeight: 700,
  fontFamily: 'var(--font-family-base)',
});

const createButtonStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  margin: '0.5rem 0.75rem 0.75rem',
  borderRadius: '0.875rem',
  border: '1px solid var(--color-primary-border)',
  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))',
  color: 'var(--color-primary)',
  fontSize: '0.8125rem',
  fontWeight: 600,
  fontFamily: 'var(--font-family-base)',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
};

const collapseButtonStyle: CSSProperties = {
  padding: '0.375rem',
  border: 'none',
  background: 'rgba(15, 23, 42, 0.04)',
  borderRadius: '0.625rem',
  cursor: 'pointer',
  color: '#475569',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.2s ease, background-color 0.2s ease',
};

const tabStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: '0.5rem',
  border: 'none',
  background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
  color: active ? 'var(--color-primary)' : '#64748b',
  fontWeight: 600,
  fontFamily: 'var(--font-family-base)',
  fontSize: '0.75rem',
  cursor: 'pointer',
  borderRadius: '0.625rem',
  transition: 'background-color 0.2s ease, color 0.2s ease',
});

const notifItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  padding: '0.625rem 0.75rem',
  borderRadius: '0.75rem',
  transition: 'background-color 0.15s',
  cursor: 'default',
};

const notifDeleteBtn: CSSProperties = {
  padding: '0.25rem',
  border: 'none',
  background: 'transparent',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  color: '#94a3b8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.2s',
};

interface AlertsPanelProps {
  onCreateAlert?: () => void;
  initialTab?: 'active' | 'configured';
  onTabChange?: (tab: 'active' | 'configured') => void;
}

export function AlertsPanel({ onCreateAlert, initialTab, onTabChange }: AlertsPanelProps) {
  const recentEvents = useAlertStore((s) => s.recentEvents);
  const removeEvent = useAlertStore((s) => s.removeEvent);
  const clearEvents = useAlertStore((s) => s.clearEvents);
  const { canCreateAlerts, canDeleteAlerts } = usePermissions();
  const { data: devices = [] } = useDevices();
  const { data: notifications = [] } = useNotifications();
  const { isActive: wsEventsActive } = useEvents();
  const flyToDevice = useMapStore((s) => s.flyToDevice);
  const deleteNotification = useDeleteNotification();
  const queryClient = useQueryClient();

  const handleDeleteEvent = (eventId: number) => {
    removeEvent(eventId);
  };

  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [tab, setTab] = useState<'active' | 'configured'>(initialTab ?? 'active');

  const handleSetTab = (newTab: 'active' | 'configured') => {
    setTab(newTab);
    onTabChange?.(newTab);
  };

  const deviceMap = useMemo(() => new Map(devices.map((d) => [d.id ?? 0, d])), [devices]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return recentEvents;
    return recentEvents.filter((e) => {
      const config = getAlertConfig(e.type);
      return config.category === filter;
    });
  }, [recentEvents, filter]);

  useEffect(() => {
    alertsDebug('panel', 'alerts panel state updated', {
      tab,
      filter,
      recentEvents: recentEvents.length,
      filteredEvents: filteredEvents.length,
      notifications: notifications.length,
    });
  }, [tab, filter, recentEvents.length, filteredEvents.length, notifications.length]);

  const handleAlertClick = (event: typeof recentEvents[number]) => {
    const device = deviceMap.get(event.deviceId);
    if (device) {
      // Look up the device's current position from React Query cache (updated via WebSocket)
      const cached = queryClient.getQueryData<PositionMessage[]>(QUERY_KEYS.allPositions);
      const devicePos = cached?.find((p) => p.deviceId === event.deviceId);
      if (devicePos?.latitude != null && devicePos?.longitude != null) {
        flyToDevice(event.deviceId, [devicePos.latitude, devicePos.longitude], 15);
      }
    }
  };

  const allCategories: TypeConfig['category'][] = ['status', 'movement', 'geofence', 'speed', 'alarm', 'maintenance', 'other'];

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: recentEvents.length };
    for (const cat of allCategories) {
      counts[cat] = recentEvents.filter((e) => getAlertConfig(e.type).category === cat).length;
    }
    return counts;
  }, [recentEvents]);

  if (collapsed) {
    return (
      <button
        style={{
          position: 'relative',
          margin: '1.25rem 1.25rem 1.25rem 0',
          width: 'auto',
          padding: '0.625rem 1rem',
          borderRadius: '1.25rem',
          border: '1px solid var(--border-default)',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8125rem',
          fontWeight: 600,
          fontFamily: 'var(--font-family-base)',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
          alignSelf: 'flex-start',
        }}
        onClick={() => setCollapsed(false)}
      >
        <IconBell size={16} color="var(--color-error)" />
        <span>Alertas</span>
        {filterCounts.all > 0 && <span style={badgeStyle(filterCounts.all)}>{filterCounts.all}</span>}
      </button>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.5rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
            }}>
              <IconBell size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontFamily: 'Outfit', fontWeight: 700, color: '#0f172a' }}>
                Alertas
              </h2>
<span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                {tab === 'active' ? filterCounts.all : notifications.length} {tab === 'active' ? 'activas' : 'configuradas'}
                {' '}<span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: wsEventsActive ? '#10b981' : '#ef4444',
                  marginLeft: '4px',
                  verticalAlign: 'middle',
                }} title={wsEventsActive ? 'WebSocket conectado' : 'WebSocket desconectado'} />
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {/* Clear button */}
            {canDeleteAlerts && filterCounts.all > 0 && tab === 'active' && (
              <button
                title="Limpiar alertas"
                style={collapseButtonStyle}
                onClick={() => clearEvents()}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
              >
                <IconClose size={16} />
              </button>
            )}
            <button
              title="Colapsar panel"
              style={collapseButtonStyle}
              onClick={() => setCollapsed(true)}
            >
              <IconClose size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', backgroundColor: 'rgba(15, 23, 42, 0.03)', borderRadius: '0.75rem', marginBottom: '0.75rem' }}>
          <button style={tabStyle(tab === 'active')} onClick={() => handleSetTab('active')}>
            Activas {filterCounts.all > 0 ? `(${filterCounts.all})` : ''}
          </button>
          <button style={tabStyle(tab === 'configured')} onClick={() => handleSetTab('configured')}>
            Configuradas {notifications.length > 0 ? `(${notifications.length})` : ''}
          </button>
        </div>

        {tab === 'active' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          <button
            style={filterButtonStyle(filter === 'all', '#6366f1')}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          {allCategories.map((cat) => {
            if (filterCounts[cat] === 0 && filter !== cat) return null;
            const sampleConfig = ALERT_TYPE_CONFIG[Object.keys(ALERT_TYPE_CONFIG).find((k) => ALERT_TYPE_CONFIG[k].category === cat) ?? ''] ;
            const color = sampleConfig?.color ?? '#6b7280';
            const label = cat === 'status' ? 'Estado'
              : cat === 'movement' ? 'Movimiento'
              : cat === 'geofence' ? 'Geozona'
              : cat === 'speed' ? 'Velocidad'
              : cat === 'alarm' ? 'Alarma'
              : cat === 'maintenance' ? 'Mantenimiento'
              : 'Otros';
            return (
              <button
                key={cat}
                style={filterButtonStyle(filter === cat, color)}
                onClick={() => setFilter(cat)}
              >
                {label}
              </button>
            );
          })}
        </div>
        )}

        {tab === 'configured' && null}
      </div>

      {tab === 'active' && (
      <ul style={listStyle} className="custom-scrollbar">
        {filteredEvents.map((event) => (
          <AlertItem
            key={event.id}
            event={event}
            canDelete={canDeleteAlerts}
            onDelete={canDeleteAlerts ? handleDeleteEvent : undefined}
            onClick={() => handleAlertClick(event)}
            deviceName={deviceMap.get(event.deviceId)?.name}
          />
        ))}
        {filteredEvents.length === 0 && (
          <li style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>
            <div style={{ marginBottom: '0.5rem', opacity: 0.5 }}>🔔</div>
            Sin alertas activas
          </li>
        )}
      </ul>
      )}

      {tab === 'configured' && (
      <>
        <ul style={listStyle} className="custom-scrollbar">
          {notifications.map((n) => {
            const config = getAlertConfig(n.type ?? '');
            const typeLabel = config.label || n.type || 'Desconocido';
            const typeColor = config.color || '#6b7280';
            const typeIcon = config.icon || '🔔';
            const channels: string[] = [];
            if (n.notificators?.includes('web')) channels.push('Web');
            if (n.notificators?.includes('mail')) channels.push('Email');
            if (n.notificators?.includes('sms')) channels.push('SMS');
            const channelLabel = channels.length > 0 ? channels.join(', ') : 'Web';
            return (
              <li
                key={n.id}
                style={notifItemStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                <div style={{
                  padding: '0.375rem',
                  borderRadius: '0.625rem',
                  backgroundColor: `${typeColor}18`,
                  color: typeColor,
                  border: `1px solid ${typeColor}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}>
                  {typeIcon}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: 'Outfit', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {typeLabel}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                    <span>{channelLabel}</span>
                    <span style={{ color: 'rgba(15, 23, 42, 0.15)' }}>·</span>
                    <span>{n.always ? 'Siempre' : 'Programado'}</span>
                  </div>
                </div>
                {canDeleteAlerts && (
                  <button
                    style={notifDeleteBtn}
                    onClick={() => {
                      if (n.id) {
                        deleteNotification.mutate(n.id);
                      }
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                    title="Eliminar notificación"
                  >
                    <IconClose size={14} />
                  </button>
                )}
              </li>
            );
          })}
          {notifications.length === 0 && (
            <li style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>
              <div style={{ marginBottom: '0.5rem', opacity: 0.5 }}>⚙️</div>
              Sin alertas configuradas
            </li>
          )}
        </ul>
        <div style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
          <Link
            to="/alerts"
            style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'Outfit' }}
          >
            Ver todas las alertas →
          </Link>
        </div>
      </>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.1); border-radius: 10px; }
      `}</style>

      {canCreateAlerts && onCreateAlert && (
        <button
          style={createButtonStyle}
          onClick={onCreateAlert}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.18)';
            e.currentTarget.style.boxShadow = '0 0 20px -6px rgba(99, 102, 241, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <IconPlus size={16} />
          Crear Alerta
        </button>
      )}
    </div>
  );
}
