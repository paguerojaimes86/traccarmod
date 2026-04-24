import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SpeedUnit = 'kn' | 'kmh' | 'mph';
export type DistanceUnit = 'm' | 'km' | 'mi';

interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  speedUnit: SpeedUnit;
  distanceUnit: DistanceUnit;
  wsStatus: 'connected' | 'reconnecting' | 'disconnected';
}

interface UiActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSpeedUnit: (unit: SpeedUnit) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  setWsStatus: (status: UiState['wsStatus']) => void;
}

export const useUiStore = create<UiState & UiActions>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      speedUnit: 'kmh',
      distanceUnit: 'km',
      wsStatus: 'disconnected',

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setSpeedUnit: (unit) => set({ speedUnit: unit }),
      setDistanceUnit: (unit) => set({ distanceUnit: unit }),
      setWsStatus: (status) => set({ wsStatus: status }),
    }),
    {
      name: 'traccar-ui',
      partialize: (state) => ({
        theme: state.theme,
        speedUnit: state.speedUnit,
        distanceUnit: state.distanceUnit,
      }),
    },
  ),
);
