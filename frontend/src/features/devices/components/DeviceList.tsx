import { useState, useMemo, type CSSProperties, type ReactNode } from 'react';
import { useDevices } from '../hooks/useDevices';
import { useDevicePositionsMap } from '@features/positions/hooks/usePositions';
import { DeviceListItem } from './DeviceListItem';
import { useMapStore } from '@features/map/store';
import { LoadingState } from '@shared/ui';
import { ErrorState } from '@shared/ui';
import {
  IconClose,
  IconSearch,
  IconFileText,
  IconActivity,
  IconPlay,
  IconPause,
  IconEyeOff,
  IconMap,
} from '@shared/ui/icons';
import { WsStatusIndicator } from '@features/positions/components/WsStatusIndicator';

const sidebarStyle: CSSProperties = {
  width: '320px',
  minWidth: '320px',
  margin: '1rem 0 1rem 1rem',
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

const searchInputStyle: CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem 0.625rem 2.25rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: '#0f172a',
  fontSize: '0.8125rem',
  fontWeight: 500,
  fontFamily: 'Outfit, sans-serif',
  outline: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
};

const listStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  listStyle: 'none',
  margin: 0,
  padding: '0.5rem 0.375rem',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(15, 23, 42, 0.08) transparent',
};

const toggleButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '1rem',
  left: '1rem',
  zIndex: 30,
  padding: '0.5rem 0.875rem',
  borderRadius: '0.875rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(12px)',
  color: '#0f172a',
  fontSize: '0.8125rem',
  fontWeight: 600,
  fontFamily: 'Outfit, sans-serif',
  cursor: 'pointer',
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'all 0.2s ease',
};

function FilterCard({ label, count, color, icon, isActive, onClick }: { label: string, count: number, color: string, icon: ReactNode, isActive: boolean, onClick: () => void }) {
  return (
    <button
      title={label}
      aria-label={`Filtrar: ${label}`}
      aria-pressed={isActive}
      onClick={onClick}
      style={{
        minWidth: '3.5rem',
        height: '2.25rem',
        padding: '0.375rem 0.5rem',
        borderRadius: '0.75rem',
        border: '1px solid',
        borderColor: isActive ? `${color}40` : 'rgba(15, 23, 42, 0.06)',
        background: isActive
          ? `linear-gradient(135deg, ${color}15, rgba(255, 255, 255, 0.8))`
          : 'rgba(15, 23, 42, 0.02)',
        color: isActive ? color : '#94a3b8',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.375rem',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isActive ? `0 0 16px -6px ${color}` : 'none',
        flex: 1,
      }}
    >
      <span style={{ display: 'flex', color: isActive ? color : '#cbd5e1', transition: 'color 0.2s' }}>{icon}</span>
      <span style={{ fontSize: '0.6875rem', fontWeight: 800, fontFamily: 'Outfit', lineHeight: 1, letterSpacing: '-0.01em' }}>{count}</span>
    </button>
  );
}

export function DeviceList() {
  const { data: devices = [], isLoading, isError, refetch } = useDevices();
  const { data: positionMap = new Map() } = useDevicePositionsMap();
  const selectedDeviceId = useMapStore((s) => s.selectedDeviceId);
  const setShowMileageReport = useMapStore((s) => s.setShowMileageReport);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen((o) => !o);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'moving' | 'stopped' | 'offline'>('all');

  const stats = useMemo(() => {
    const counts = { all: 0, moving: 0, stopped: 0, offline: 0 };
    devices.forEach(d => {
      if (d.disabled) return;
      counts.all++;
      const pos = positionMap.get(d.id ?? 0);
      const isOnline = d.status === 'online';
      const isMoving = (pos?.speed ?? 0) > 0.5;
      if (!isOnline) counts.offline++;
      else if (isMoving) counts.moving++;
      else counts.stopped++;
    });
    return counts;
  }, [devices, positionMap]);

  const processedDevices = useMemo(() => {
    let list = devices.filter((d) => !d.disabled);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.uniqueId?.toLowerCase().includes(q)
      );
    }

    if (activeFilter !== 'all') {
      list = list.filter(d => {
        const pos = positionMap.get(d.id ?? 0);
        const isOnline = d.status === 'online';
        const isMoving = (pos?.speed ?? 0) > 0.5;
        if (activeFilter === 'offline') return !isOnline;
        if (activeFilter === 'moving') return isOnline && isMoving;
        if (activeFilter === 'stopped') return isOnline && !isMoving;
        return true;
      });
    }

    return list.sort((a, b) => {
      const posA = positionMap.get(a.id ?? 0);
      const posB = positionMap.get(b.id ?? 0);
      const weight = (d: typeof a, p: typeof posA) => {
        if (d.status !== 'online') return 100;
        if ((p?.speed ?? 0) > 80) return 0;
        if ((p?.speed ?? 0) > 0.5) return 10;
        const ignition = p?.attributes?.ignition ?? p?.attributes?.acc;
        if (ignition) return 20;
        return 30;
      };
      return weight(a, posA) - weight(b, posB);
    });
  }, [devices, search, activeFilter, positionMap]);

  if (!sidebarOpen) {
    return (
      <button
        style={toggleButtonStyle}
        onClick={toggleSidebar}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(15, 23, 42, 0.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.1)'; }}
      >
        <IconMap size={15} />
        <span>Flota</span>
      </button>
    );
  }

  if (isLoading) return <div style={sidebarStyle}><LoadingState message="Cargando flota..." /></div>;
  if (isError) return <div style={sidebarStyle}><ErrorState message="Error al conectar" onRetry={() => refetch()} /></div>;

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              color: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconMap size={17} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '0.9375rem', fontFamily: 'Outfit', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>Mi Flota</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600, fontFamily: 'Outfit' }}>{stats.all} unidades</span>
                <WsStatusIndicator />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              title="Reporte de Flota"
              onClick={() => setShowMileageReport(true)}
              style={{
                padding: '0.375rem',
                backgroundColor: 'rgba(15, 23, 42, 0.03)',
                border: '1px solid rgba(15, 23, 42, 0.06)',
                borderRadius: '0.625rem',
                cursor: 'pointer',
                color: '#6366f1',
                display: 'flex',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.06)'; }}
            >
              <IconFileText size={16} />
            </button>
            <button
              title="Cerrar Panel"
              style={{
                padding: '0.375rem',
                border: 'none',
                background: 'rgba(15, 23, 42, 0.03)',
                borderRadius: '0.625rem',
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                transition: 'all 0.2s ease',
              }}
              onClick={toggleSidebar}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.06)'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <IconClose size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
          <IconSearch size={14} style={{ position: 'absolute', left: '0.75rem', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar unidad o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInputStyle}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(99, 102, 241, 0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(15, 23, 42, 0.08)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.375rem' }}>
          <FilterCard label="Todos" count={stats.all} color="#6366f1" icon={<IconActivity size={13} />} isActive={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
          <FilterCard label="En movimiento" count={stats.moving} color="#10b981" icon={<IconPlay size={12} />} isActive={activeFilter === 'moving'} onClick={() => setActiveFilter('moving')} />
          <FilterCard label="Detenidos" count={stats.stopped} color="#f59e0b" icon={<IconPause size={12} />} isActive={activeFilter === 'stopped'} onClick={() => setActiveFilter('stopped')} />
          <FilterCard label="Offline" count={stats.offline} color="#94a3b8" icon={<IconEyeOff size={13} />} isActive={activeFilter === 'offline'} onClick={() => setActiveFilter('offline')} />
        </div>
      </div>

      <ul style={listStyle} className="custom-scrollbar">
        {processedDevices.map((device) => (
          <DeviceListItem
            key={device.id}
            device={device}
            position={positionMap.get(device.id ?? 0)}
            isSelected={device.id === selectedDeviceId}
          />
        ))}
        {processedDevices.length === 0 && (
          <li style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <IconSearch size={20} style={{ color: '#cbd5e1' }} />
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', fontFamily: 'Outfit' }}>Sin resultados</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'Outfit' }}>Adjustá los filtros o el buscador</p>
          </li>
        )}
      </ul>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(15, 23, 42, 0.15); }
      `}</style>
    </div>
  );
}