import { useState, useCallback } from 'react';
import { DeviceList } from '@features/devices/components/DeviceList';
import { MapView } from '@features/map/components/MapView';
import { DeviceMarkers } from '@features/map/layers/DeviceMarkers';
import { MotionTrails } from '@features/map/layers/MotionTrails';
import { HistoryPath, type HistoryPosition } from '@features/map/layers/HistoryPath';
import { GeofenceLayers } from '@features/geofences/components/GeofenceLayers';
import { RouteLayers } from '@features/map/layers/RouteLayers';
import { HistoryPanel } from '@features/positions/components/HistoryPanel';
import { useWebSocket } from '@features/positions/hooks/useWebSocket';
import { useEvents } from '@features/events/hooks/useEvents';
import { useMapStore } from '@features/map/store';
import { DeviceInfoPanel } from '@features/map/components/DeviceInfoPanel';
import { MileageReport } from '@features/reports/components/MileageReport';
import { AlertsPanel } from '@features/alerts/components/AlertsPanel';
import { AlertToastContainer } from '@features/alerts/components/AlertToastContainer';
import { AlertWizard } from '@features/alerts/components/AlertWizard';
import { IconEyeOff, IconEye, IconMenu, IconClose } from '@shared/ui/icons';

const mapOverlayBtn: React.CSSProperties = {
  position: 'absolute',
  zIndex: 10,
  width: 36,
  height: 36,
  border: '1px solid rgba(15, 23, 42, 0.08)',
  borderRadius: '0.625rem',
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(8px)',
  color: '#64748b',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.1)',
  // a11y + perf
  outline: '2px solid transparent',
  outlineOffset: 2,
  transition: 'background-color 0.2s, box-shadow 0.2s, border-color 0.2s, outline-color 0.15s',
  fontFamily: 'Outfit, system-ui, sans-serif',
  touchAction: 'manipulation',
};


export function DashboardPage() {
  useWebSocket();
  useEvents();
  const selectedDeviceId = useMapStore((s) => s.selectedDeviceId);
  const showHistory = useMapStore((s) => s.showHistory);
  const setShowHistory = useMapStore((s) => s.setShowHistory);
  const showMileageReport = useMapStore((s) => s.showMileageReport);
  const setShowMileageReport = useMapStore((s) => s.setShowMileageReport);
  const showRoutes = useMapStore((s) => s.showRoutes);
  const setShowRoutes = useMapStore((s) => s.setShowRoutes);

  const [historyPositions, setHistoryPositions] = useState<HistoryPosition[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [alertTab, setAlertTab] = useState<'active' | 'configured'>('active');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handlePositionsLoaded = useCallback(
    (positions: HistoryPosition[]) => {
      setHistoryPositions(positions);
    },
    [],
  );

  const handleCancelHistory = useCallback(() => {
    setShowHistory(false);
    setHistoryPositions([]);
  }, [setShowHistory]);

  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', height: '100%', width: '100%', position: 'relative' }}>
        {!sidebarCollapsed && <DeviceList />}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapView>
            <MotionTrails />
            <GeofenceLayers />
            <RouteLayers visible={showRoutes} />
            <DeviceMarkers />
            {showHistory && selectedDeviceId && (
              <HistoryPath positions={historyPositions} />
            )}
          </MapView>

          {/* Map overlay controls — grouped top-right */}
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 8, flexDirection: 'column' }}>

            {/* Sidebar toggle */}
            <button
              aria-label={sidebarCollapsed ? 'Mostrar panel de dispositivos' : 'Ocultar panel de dispositivos'}
              aria-pressed={!sidebarCollapsed}
              style={{
                ...mapOverlayBtn,
                alignSelf: 'flex-end',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.92)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.1)'; }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <IconMenu size={16} aria-hidden="true" /> : <IconClose size={16} aria-hidden="true" />}
            </button>

            {/* Routes toggle */}
            <button
              aria-label={showRoutes ? 'Ocultar rutas' : 'Mostrar rutas'}
              aria-pressed={showRoutes}
              style={{
                ...mapOverlayBtn,
                alignSelf: 'flex-end',
                borderColor: showRoutes ? 'rgba(99, 102, 241, 0.35)' : 'rgba(15, 23, 42, 0.08)',
                backgroundColor: showRoutes ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.92)',
                color: showRoutes ? '#6366f1' : '#64748b',
                boxShadow: showRoutes ? '0 2px 8px rgba(99, 102, 241, 0.18)' : '0 2px 8px rgba(15, 23, 42, 0.1)',
              }}
              onClick={() => setShowRoutes(!showRoutes)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = showRoutes ? 'rgba(99, 102, 241, 0.18)' : '#ffffff';
                e.currentTarget.style.boxShadow = showRoutes ? '0 4px 14px rgba(99, 102, 241, 0.25)' : '0 4px 12px rgba(15, 23, 42, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = showRoutes ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.92)';
                e.currentTarget.style.boxShadow = showRoutes ? '0 2px 8px rgba(99, 102, 241, 0.18)' : '0 2px 8px rgba(15, 23, 42, 0.1)';
              }}
            >
              {showRoutes ? <IconEyeOff size={16} aria-hidden="true" /> : <IconEye size={16} aria-hidden="true" />}
            </button>
          </div>

          {showMileageReport && (
            <MileageReport onClose={() => setShowMileageReport(false)} />
          )}
          
          {showHistory && selectedDeviceId && (
            <HistoryPanel
              deviceId={selectedDeviceId}
              onPositionsLoaded={handlePositionsLoaded}
              onClose={handleCancelHistory}
            />
          )}
          {!showHistory && <DeviceInfoPanel />}
        </div>
        <AlertsPanel onCreateAlert={() => setShowWizard(true)} initialTab={alertTab} onTabChange={setAlertTab} />
      </div>
      <AlertToastContainer />
      {showWizard && <AlertWizard open={showWizard} onClose={() => setShowWizard(false)} onSuccess={() => setAlertTab('configured')} />}
    </>
  );
}

export default DashboardPage;
