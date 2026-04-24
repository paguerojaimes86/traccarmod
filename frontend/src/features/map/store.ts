import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MapState {
  center: [number, number];
  zoom: number;
  selectedDeviceId: number | null;
  bearing: number;
  pitch: number;
  followMode: boolean;
  showHistory: boolean;
  showMileageReport: boolean;
}

interface MapActions {
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setSelectedDevice: (deviceId: number | null) => void;
  setBearing: (bearing: number) => void;
  setPitch: (pitch: number) => void;
  setFollowMode: (follow: boolean) => void;
  setShowHistory: (show: boolean) => void;
  setShowMileageReport: (show: boolean) => void;
  flyToDevice: (deviceId: number, center: [number, number], zoom?: number) => void;
}

export const useMapStore = create<MapState & MapActions>()(
  persist(
    (set) => ({
      center: [0, 0],
      zoom: 2,
      selectedDeviceId: null,
      bearing: 0,
      pitch: 0,
      followMode: false,
      showHistory: false,
      showMileageReport: false,

      setCenter: (center) => set({ center }),
      setZoom: (zoom) => set({ zoom }),
      setSelectedDevice: (deviceId) => set({ selectedDeviceId: deviceId, followMode: !!deviceId }),
      setBearing: (bearing) => set({ bearing }),
      setPitch: (pitch) => set({ pitch }),
      setFollowMode: (followMode) => set({ followMode }),
      setShowHistory: (showHistory) => set({ showHistory }),
      setShowMileageReport: (showMileageReport) => set({ showMileageReport }),

      flyToDevice: (deviceId, center, zoom) =>
        set({
          selectedDeviceId: deviceId,
          center,
          zoom: zoom ?? 15,
          followMode: true,
        }),
    }),
    {
      name: 'traccar-map',
      partialize: (state) => ({
        center: state.center,
        zoom: state.zoom,
      }),
    },
  ),
);
