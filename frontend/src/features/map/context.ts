import { createContext, useContext } from 'react';
import type { Map } from 'maplibre-gl';

export const MapContext = createContext<Map | null>(null);

export function useMapInstance(): Map {
  const map = useContext(MapContext);
  if (!map) throw new Error('useMapInstance must be used within MapProvider');
  return map;
}
