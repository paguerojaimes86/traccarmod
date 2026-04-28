import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import { wktToGeoJSON } from '@shared/lib/wkt';
import type { Geofence } from '@shared/api/types.models';
import type { WktFeature } from '@shared/lib/wkt';

export interface Route {
  id: number;
  name: string;
  routeType: string;
  routeColor: string;
  routeLabel: string;
  geoJSON: WktFeature;
}

export function useRoutes() {
  return useQuery({
    queryKey: QUERY_KEYS.routes,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/geofences');
      if (error) throw error;
      const geofences = data ?? [];
      return geofences
        .filter((gf: Geofence) => (gf.attributes as Record<string, string>)?.isRoute === 'true')
        .map((gf: Geofence): Route | null => {
          const feature = wktToGeoJSON(gf.area ?? '');
          if (!feature) return null;
          const attrs = gf.attributes as Record<string, string> | undefined;
          return {
            id: gf.id!,
            name: gf.name ?? '',
            routeType: attrs?.routeType ?? '',
            routeColor: attrs?.routeColor ?? '',
            // Prefer geofence name (user can change it in Traccar UI)
            // routeLabel attribute is an optional override
            routeLabel: gf.name || attrs?.routeLabel || '',
            geoJSON: feature,
          };
        })
        .filter((r): r is Route => r !== null);
    },
    staleTime: 300_000,
  });
}