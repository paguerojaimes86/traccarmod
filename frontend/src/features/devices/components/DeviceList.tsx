import { useState, useMemo, type CSSProperties, type ReactNode } from 'react';
import { useDevices } from '../hooks/useDevices';
import { usePositions } from '@features/positions/hooks/usePositions';
import { DeviceListItem } from './DeviceListItem';
import { useMapStore } from '@features/map/store';
import { LoadingState } from '@shared/ui';
import { ErrorState } from '@shared/ui';
import { IconMenu, IconClose, IconSearch, IconNavigation, IconFileText, IconActivity, IconPlay, IconPause, IconEyeOff } from '@shared/ui/icons';
import { WsStatusIndicator } from '@features/positions/components/WsStatusIndicator';

const sidebarStyle: CSSProperties = {
  width: '340px',
  minWidth: '340px',
  margin: '1.25rem 0 1.25rem 1.25rem',
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

const searchContainerStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const searchInputStyle: CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem 0.75rem 2.5rem',
  borderRadius: '0.875rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: '#0f172a',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
};

const listStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  listStyle: 'none',
  margin: 0,
  padding: '0.75rem 0.5rem',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(15, 23, 42, 0.1) transparent',
};

const toggleButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '1.25rem',
  left: '1.25rem',
  zIndex: 30,
  padding: '0.625rem 1rem',
  borderRadius: '1.25rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(12px)',
  color: '#0f172a',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'all 0.2s',
};

export function DeviceList() {
  const { data: devices = [], isLoading, isError, refetch } = useDevices();
  const { data: positions = [] } = usePositions();
  const selectedDeviceId = useMapStore((s) => s.selectedDeviceId);
  const setShowMileageReport = useMapStore((s) => s.setShowMileageReport);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen((o) => !o);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'moving' | 'stopped' | 'offline'>('all');

  const positionMap = useMemo(
    () => new Map(positions.map((p) => [p.deviceId, p])),
    [positions],
  );

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
      <button style={toggleButtonStyle} onClick={toggleSidebar}>
        <IconMenu size={16} />
        <span>Flota</span>
      </button>
    );
  }

  if (isLoading) return <div style={sidebarStyle}><LoadingState message="Cargando flota..." /></div>;
  if (isError) return <div style={sidebarStyle}><ErrorState message="Error al conectar" onRetry={() => refetch()} /></div>;

  const FilterCard = ({ type, label, count, color, icon }: { type: typeof activeFilter, label: string, count: number, color: string, icon: ReactNode }) => {
    const isActive = activeFilter === type;

    return (
    <button
      title={label}
      aria-label={`Filtrar: ${label}`}
      aria-pressed={isActive}
      onClick={() => setActiveFilter(type)}
      style={{
        minWidth: '3.65rem',
        height: '2.5rem',
        padding: '0.45rem 0.6rem',
        borderRadius: '0.85rem',
        border: '1px solid',
        borderColor: isActive ? `${color}50` : 'rgba(15, 23, 42, 0.06)',
        background: isActive
          ? `linear-gradient(135deg, ${color}18, rgba(255, 255, 255, 0.6))`
          : 'rgba(15, 23, 42, 0.02)',
        color: isActive ? color : '#64748b',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isActive ? `0 0 18px -8px ${color}` : 'none',
        position: 'relative',
      }}
    >
      <span style={{ display: 'flex', color: isActive ? color : '#94a3b8' }}>{icon}</span>
      <span style={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'Outfit', lineHeight: 1 }}>{count}</span>
    </button>
    );
  };

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <IconNavigation size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontFamily: 'Outfit', fontWeight: 700, color: '#0f172a' }}>Mi Flota</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{stats.all} unidades</span>
                <WsStatusIndicator />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              title="Reporte de Flota"
              onClick={() => setShowMileageReport(true)}
              style={{
                padding: '0.5rem',
                backgroundColor: 'rgba(15, 23, 42, 0.04)',
                border: '1px solid rgba(15, 23, 42, 0.06)',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                color: '#6366f1',
                display: 'flex',
                transition: 'all 0.2s ease',
              }}
            >
              <IconFileText size={18} />
            </button>
            <button
              title="Cerrar Panel"
              style={{ padding: '0.5rem', border: 'none', background: 'rgba(15, 23, 42, 0.04)', borderRadius: '0.75rem', cursor: 'pointer', color: '#475569', display: 'flex' }}
              onClick={toggleSidebar}
            >
              <IconClose size={18} />
            </button>
          </div>
        </div>

        <div style={{ ...searchContainerStyle, marginBottom: '0.875rem' }}>
          <IconSearch size={15} style={{ position: 'absolute', left: '0.875rem', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar unidad o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        <div 
          style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '0.5rem', 
            padding: '0.125rem 0.125rem 0.625rem 0',
          }} 
        >
          <FilterCard type="all" label="Todos" count={stats.all} color="#6366f1" icon={<IconActivity size={15} />} />
          <FilterCard type="moving" label="En movimiento" count={stats.moving} color="#10b981" icon={<IconPlay size={13} />} />
          <FilterCard type="stopped" label="Detenidos" count={stats.stopped} color="#f59e0b" icon={<IconPause size={13} />} />
          <FilterCard type="offline" label="Offline" count={stats.offline} color="#94a3b8" icon={<IconEyeOff size={15} />} />
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
          <li style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>
            <div style={{ marginBottom: '0.5rem', opacity: 0.5 }}><IconSearch size={32} style={{ margin: '0 auto' }} /></div>
            No hay unidades que coincidan
          </li>
        )}
      </ul>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.1); border-radius: 10px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}