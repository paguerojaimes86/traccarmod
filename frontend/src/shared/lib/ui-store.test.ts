import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '@shared/lib/ui-store';

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      sidebarOpen: true,
      theme: 'light',
      speedUnit: 'kmh',
      distanceUnit: 'km',
      wsStatus: 'disconnected',
    });
  });

  it('toggles sidebar', () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarOpen).toBe(false);
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarOpen).toBe(true);
  });

  it('sets sidebar open explicitly', () => {
    useUiStore.getState().setSidebarOpen(false);
    expect(useUiStore.getState().sidebarOpen).toBe(false);
  });

  it('sets speed unit', () => {
    useUiStore.getState().setSpeedUnit('mph');
    expect(useUiStore.getState().speedUnit).toBe('mph');
  });

  it('sets distance unit', () => {
    useUiStore.getState().setDistanceUnit('mi');
    expect(useUiStore.getState().distanceUnit).toBe('mi');
  });

  it('sets ws status', () => {
    useUiStore.getState().setWsStatus('connected');
    expect(useUiStore.getState().wsStatus).toBe('connected');
  });

  it('sets theme', () => {
    useUiStore.getState().setTheme('dark');
    expect(useUiStore.getState().theme).toBe('dark');
  });
});
