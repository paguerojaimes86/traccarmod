import { useState, useCallback, useEffect } from 'react';
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
import { useDevices } from '@features/devices/hooks/useDevices';
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

  // ─── Compartir: leer ?vehiculos= de la URL ───
  const setSelectedDevice = useMapStore((s) => s.setSelectedDevice);
  const { data: devices = [] } = useDevices();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawIds = params.get('vehiculos');
    if (!rawIds) return;

    const sharedIds = rawIds.split(',').map(Number).filter((id) => !isNaN(id) && id > 0);
    if (sharedIds.length === 0) return;

    // Esperar a que los dispositivos carguen
    if (devices.length === 0) return;

    const shared = devices.filter((d) => d.id != null && sharedIds.includes(d.id));
    if (shared.length === 0) return;

    // Seleccionar el primero y enfocar todos
    setSelectedDevice(shared[0].id!);

    // fitBounds via el store (el map lo lee en el efecto de cámara)
    // También podemos actualizar el store directamente
    const flyToDevice = useMapStore.getState().flyToDevice;
    if (shared[0].id) {
      flyToDevice(shared[0].id, [0, 0]); // La cámara se ajusta con las posiciones reales
    }
  }, [devices, setSelectedDevice]);

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
              zIndex: 10,
              width: 36,
              height: 36,
              border: '1px solid',
              borderColor: showRoutes ? 'rgba(99, 102, 241, 0.3)' : 'rgba(15, 23, 42, 0.08)',
              borderRadius: '0.625rem',
              backgroundColor: showRoutes ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(8px)',
              color: showRoutes ? '#6366f1' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: showRoutes ? '0 2px 8px rgba(99, 102, 241, 0.15)' : '0 2px 8px rgba(15, 23, 42, 0.1)',
              transition: 'all 0.15s',
            }}
            onClick={() => setShowRoutes(!showRoutes)}
            onMouseEnter={(e) => { if (!showRoutes) { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.15)'; }}}
            onMouseLeave={(e) => { if (!showRoutes) { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.92)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.1)'; }}}
          >
            {showRoutes ? <IconEyeOff size={16} /> : <IconEye size={16} />}
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
