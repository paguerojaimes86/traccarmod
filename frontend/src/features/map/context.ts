import { createContext, useContext } from 'react';
import type { Map } from 'maplibre-gl';

interface MapContextValue {
  map: Map | null;
  styleVersion: number;
}

export const MapContext = createContext<MapContextValue>({ map: null, styleVersion: 0 });

export function useMapInstance(): Map {
  const ctx = useContext(MapContext);
  if (!ctx.map) throw new Error('useMapInstance must be used within MapProvider');
  return ctx.map;
}

export function useMapStyleVersion(): number {
  return useContext(MapContext).styleVersion;
}
