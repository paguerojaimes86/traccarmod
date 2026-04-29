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
import { IconEyeOff, IconEye } from '@shared/ui/icons';

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
      <div style={{ display: 'flex', height: '100%', width: '100%', position: 'relative' }}>
        <DeviceList />
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

          <button
            title={showRoutes ? 'Ocultar Rutas' : 'Mostrar Rutas'}
            aria-pressed={showRoutes}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
              padding: '0.4rem 0.6rem',
              border: '1px solid',
              borderColor: showRoutes ? 'var(--color-primary)' : 'rgba(15, 23, 42, 0.1)',
              background: showRoutes ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.92)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: showRoutes ? 'var(--color-primary)' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.65rem',
              fontWeight: 700,
              transition: 'border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease',
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            }}
            onClick={() => setShowRoutes(!showRoutes)}
          >
            {showRoutes ? <IconEyeOff size={14} /> : <IconEye size={14} />}
            <span>{showRoutes ? 'RUTAS' : 'RUTAS'}</span>
          </button>

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
