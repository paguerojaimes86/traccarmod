import { useState, useCallback } from 'react';
import { DeviceList } from '@features/devices/components/DeviceList';
import { MapView } from '@features/map/components/MapView';
import { DeviceMarkers } from '@features/map/layers/DeviceMarkers';
import { MotionTrails } from '@features/map/layers/MotionTrails';
import { HistoryPath, type HistoryPosition } from '@features/map/layers/HistoryPath';
import { GeofenceLayers } from '@features/geofences/components/GeofenceLayers';
import { HistoryPanel } from '@features/positions/components/HistoryPanel';
import { useWebSocket } from '@features/positions/hooks/useWebSocket';
import { useMapStore } from '@features/map/store';
import { DeviceInfoPanel } from '@features/map/components/DeviceInfoPanel';
import { MileageReport } from '@features/reports/components/MileageReport';

export function DashboardPage() {
  useWebSocket();
  const selectedDeviceId = useMapStore((s) => s.selectedDeviceId);
  const showHistory = useMapStore((s) => s.showHistory);
  const setShowHistory = useMapStore((s) => s.setShowHistory);
  const showMileageReport = useMapStore((s) => s.showMileageReport);
  const setShowMileageReport = useMapStore((s) => s.setShowMileageReport);

  const [historyPositions, setHistoryPositions] = useState<HistoryPosition[]>([]);

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
    <div style={{ display: 'flex', height: '100%', width: '100%', position: 'relative' }}>
      <DeviceList />
      <div style={{ flex: 1, position: 'relative' }}>
        <MapView>
          <MotionTrails />
          <DeviceMarkers />
          <GeofenceLayers />
          {showHistory && selectedDeviceId && (
            <HistoryPath positions={historyPositions} />
          )}
        </MapView>

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
    </div>
  );
}

export default DashboardPage;
