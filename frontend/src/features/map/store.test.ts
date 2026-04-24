import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '@features/map/store';

describe('mapStore', () => {
  beforeEach(() => {
    useMapStore.setState({
      center: [0, 0],
      zoom: 2,
      selectedDeviceId: null,
      bearing: 0,
      pitch: 0,
    });
  });

  it('sets center', () => {
    useMapStore.getState().setCenter([10, 20]);
    expect(useMapStore.getState().center).toEqual([10, 20]);
  });

  it('sets zoom', () => {
    useMapStore.getState().setZoom(10);
    expect(useMapStore.getState().zoom).toBe(10);
  });

  it('sets selected device', () => {
    useMapStore.getState().setSelectedDevice(42);
    expect(useMapStore.getState().selectedDeviceId).toBe(42);
  });

  it('clears selected device', () => {
    useMapStore.getState().setSelectedDevice(42);
    useMapStore.getState().setSelectedDevice(null);
    expect(useMapStore.getState().selectedDeviceId).toBeNull();
  });

  it('flyToDevice sets center, zoom, and selectedDevice', () => {
    useMapStore.getState().flyToDevice(5, [-58.38, -34.6], 14);
    const state = useMapStore.getState();
    expect(state.selectedDeviceId).toBe(5);
    expect(state.center).toEqual([-58.38, -34.6]);
    expect(state.zoom).toBe(14);
  });

  it('flyToDevice defaults zoom to 15', () => {
    useMapStore.getState().flyToDevice(1, [0, 0]);
    expect(useMapStore.getState().zoom).toBe(15);
  });
});
