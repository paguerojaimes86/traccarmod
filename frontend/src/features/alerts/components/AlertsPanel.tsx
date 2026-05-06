import { useState, useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { PositionMessage } from '@features/positions/services/websocket';
import { useAlertStore } from '@features/alerts/store';
import { useDevices } from '@features/devices/hooks/useDevices';
import { usePermissions } from '@shared/permissions';
import { useMapStore } from '@features/map/store';
import { getAlertConfig, ALERT_TYPE_CONFIG, NOTIFICATOR_LABELS } from '@shared/lib/alert-types';
import type { TypeConfig } from '@shared/lib/alert-types';
import { AlertItem } from './AlertItem';
import { IconBell, IconClose, IconPlus, IconSettings } from '@shared/ui/icons';
import { useDeleteNotification, useNotifications } from '@features/notifications/hooks/useNotifications';
import { useEvents } from '@features/events/hooks/useEvents';

type FilterCategory = 'all' | TypeConfig['category'];

const panelStyle: CSSProperties = {
  width: '320px',
  minWidth: '320px',
  margin: '1rem 1rem 1rem 0',
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '1rem',
  overflow: 'hidden',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(15, 23, 42, 0.06)',
  boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
};

const headerStyle: CSSProperties = {
  padding: '1rem',
  borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
};

const listStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  listStyle: 'none',
  margin: 0,
  padding: '0.375rem 0.375rem',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(15, 23, 42, 0.08) transparent',
};

const badgeStyle = (count: number): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '1.125rem',
  height: '1.125rem',
  padding: '0 0.375rem',
  borderRadius: '9999px',
  backgroundColor: count > 0 ? '#ef4444' : 'rgba(15, 23, 42, 0.06)',
  color: count > 0 ? '#fff' : '#94a3b8',
  fontSize: '0.5625rem',
  fontWeight: 800,
  fontFamily: 'Outfit, sans-serif',
});

const filterButtonStyle = (isActive: boolean, color: string): CSSProperties => ({
  padding: '0.35rem 0.5rem',
  borderRadius: '0.75rem',
  border: '1px solid',
  borderColor: isActive ? `${color}45` : 'rgba(15, 23, 42, 0.06)',
  background: isActive
    ? `linear-gradient(135deg, ${color}15, rgba(255, 255, 255, 0.8))`
    : 'rgba(15, 23, 42, 0.02)',
  color: isActive ? color : '#94a3b8',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.3rem',
  transition: 'background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s',
  boxShadow: isActive ? `0 0 16px -6px ${color}` : 'none',
  fontSize: '0.625rem',
  fontWeight: 800,
  fontFamily: 'Outfit, sans-serif',
  letterSpacing: '0.01em',
  flex: 1,
});

const createButtonStyle: CSSProperties = {
  width: 'calc(100% - 1.5rem)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.625rem 1rem',
  margin: '0.5rem 0.75rem',
  borderRadius: '0.875rem',
  border: '1px solid rgba(99, 102, 241, 0.3)',
  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0.04))',
  color: '#6366f1',
  fontSize: '0.8125rem',
  fontWeight: 700,
  fontFamily: 'Outfit, sans-serif',
  cursor: 'pointer',
  transition: 'background-color 0.2s, border-color 0.2s',
};

const collapseButtonStyle: CSSProperties = {
  padding: '0.375rem',
  border: 'none',
  background: 'rgba(15, 23, 42, 0.03)',
  borderRadius: '0.625rem',
  cursor: 'pointer',
  color: '#94a3b8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s, color 0.2s',
};

const tabStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: '0.5rem',
  border: 'none',
  background: active ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
  color: active ? '#6366f1' : '#64748b',
  fontWeight: 700,
  fontFamily: 'Outfit, sans-serif',
  fontSize: '0.75rem',
  cursor: 'pointer',
  borderRadius: '0.625rem',
  transition: 'background-color 0.2s, color 0.2s',
  letterSpacing: '-0.01em',
});

const notifItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  padding: '0.625rem 0.75rem',
  borderRadius: '0.75rem',
  transition: 'background-color 0.15s ease',
  cursor: 'default',
};

const notifDeleteBtn: CSSProperties = {
  padding: '0.25rem',
  border: 'none',
  background: 'transparent',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  color: '#cbd5e1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.2s, background-color 0.2s',
  flexShrink: 0,
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

  const handleDeleteEvent = (eventId: number) => {
    removeEvent(eventId);
  };

  const handleAlertClick = (event: typeof recentEvents[number]) => {
    const device = deviceMap.get(event.deviceId);
    if (device) {
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
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 20,
          width: 'auto',
          padding: '0.5rem 0.875rem',
          borderRadius: '0.875rem',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          color: '#0f172a',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8125rem',
          fontWeight: 600,
          fontFamily: 'Outfit, sans-serif',
          transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
        }}
        onClick={() => setCollapsed(false)}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.2)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.08)'; e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.85)'; }}
      >
        <IconBell size={15} style={{ color: '#ef4444' }} />
        <span>Alertas</span>
        {filterCounts.all > 0 && <span style={badgeStyle(filterCounts.all)}>{filterCounts.all}</span>}
      </button>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconBell size={17} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '0.9375rem', fontFamily: 'Outfit', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                Alertas
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '1px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600, fontFamily: 'Outfit' }}>
                  {tab === 'active' ? `${filterCounts.all} activas` : `${notifications.length} configuradas`}
                </span>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: wsEventsActive ? '#10b981' : '#ef4444',
                  boxShadow: wsEventsActive ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : '0 0 0 2px rgba(239, 68, 68, 0.2)',
                }} title={wsEventsActive ? 'WebSocket conectado' : 'WebSocket desconectado'} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {canDeleteAlerts && filterCounts.all > 0 && tab === 'active' && (
              <button
                title="Limpiar alertas"
                style={collapseButtonStyle}
                onClick={() => clearEvents()}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
              >
                <IconClose size={15} />
              </button>
            )}
            <button
              title="Colapsar panel"
              style={collapseButtonStyle}
              onClick={() => setCollapsed(true)}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            >
              <IconClose size={15} />
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

        {/* Category Filters */}
        {tab === 'active' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            <button style={filterButtonStyle(filter === 'all', '#6366f1')} onClick={() => setFilter('all')}>
              Todos
            </button>
            {allCategories.map((cat) => {
              if (filterCounts[cat] === 0 && filter !== cat) return null;
              const sampleConfig = ALERT_TYPE_CONFIG[Object.keys(ALERT_TYPE_CONFIG).find((k) => ALERT_TYPE_CONFIG[k].category === cat) ?? ''];
              const color = sampleConfig?.color ?? '#6b7280';
              const label = cat === 'status' ? 'Estado'
                : cat === 'movement' ? 'Movimiento'
                : cat === 'geofence' ? 'Geozona'
                : cat === 'speed' ? 'Velocidad'
                : cat === 'alarm' ? 'Alarma'
                : cat === 'maintenance' ? 'Mant.'
                : 'Otros';
              return (
                <button key={cat} style={filterButtonStyle(filter === cat, color)} onClick={() => setFilter(cat)}>
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Events List */}
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
            <li style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <IconBell size={20} style={{ color: '#cbd5e1' }} />
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', fontFamily: 'Outfit' }}>Sin alertas activas</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'Outfit' }}>Las alertas aparecerán aquí</p>
            </li>
          )}
        </ul>
      )}

      {/* Configured Notifications List */}
      {tab === 'configured' && (
        <>
          <ul style={listStyle} className="custom-scrollbar">
            {notifications.map((n) => {
              const config = getAlertConfig(n.type ?? '');
              const typeLabel = config.label || n.type || 'Desconocido';
              const typeColor = config.color || '#6b7280';
              const typeIcon = config.icon || '🔔';
              const channels: string[] = [];
              const notifs = (n.notificators ?? '').split(',').filter(Boolean);
              for (const ch of notifs) {
                channels.push(NOTIFICATOR_LABELS[ch] ?? ch);
              }
              const channelLabel = channels.length > 0 ? channels.join(', ') : 'Sin canal';
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
                    fontSize: '0.875rem',
                    flexShrink: 0,
                    minWidth: 32,
                  }}>
                    {typeIcon}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: 'Outfit', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {typeLabel}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'flex', gap: '0.375rem', alignItems: 'center', marginTop: '1px' }}>
                      <span>{channelLabel}</span>
                      <span style={{ color: 'rgba(15, 23, 42, 0.15)' }}>·</span>
                      <span>{n.always ? 'Siempre' : 'Programado'}</span>
                    </div>
                  </div>
                  {canDeleteAlerts && (
                    <button
                      style={notifDeleteBtn}
                      onClick={() => { n.id && deleteNotification.mutate(n.id); }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                      title="Eliminar notificación"
                    >
                      <IconClose size={13} />
                    </button>
                  )}
                </li>
              );
            })}
            {notifications.length === 0 && (
              <li style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                  <IconSettings size={20} style={{ color: '#cbd5e1' }} />
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', fontFamily: 'Outfit' }}>Sin alertas configuradas</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'Outfit' }}>Creá una alerta para comenzar</p>
              </li>
            )}
          </ul>
          <div style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderTop: '1px solid rgba(15, 23, 42, 0.05)' }}>
            <Link
              to="/alerts"
              style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', fontFamily: 'Outfit', letterSpacing: '-0.01em' }}
            >
              Ver todas las alertas →
            </Link>
          </div>
        </>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(15, 23, 42, 0.15); }
      `}</style>

      {canCreateAlerts && onCreateAlert && (
        <button
          style={createButtonStyle}
          onClick={onCreateAlert}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 20px -6px rgba(99, 102, 241, 0.35)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
            e.currentTarget.style.boxShadow = '';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <IconPlus size={15} />
          Crear Alerta
        </button>
      )}
    </div>
  );
}