/**
 * Resuelve el estilo de mapa según el identificador del servidor Traccar.
 *
 * Devuelve un string (URL de estilo GL) o un objeto (estilo inline para raster tiles).
 * MapLibre acepta ambos formatos.
 */

interface RasterStyle {
  version: 8;
  name: string;
  glyphs: string;
  sources: Record<string, {
    type: 'raster';
    tiles: string[];
    tileSize: number;
    maxzoom: number;
    attribution?: string;
  }>;
  layers: Array<{
    id: string;
    type: 'raster';
    source: string;
  }>;
}

function rasterStyle(tileUrl: string, maxZoom = 20, attribution?: string): RasterStyle {
  const style: RasterStyle = {
    version: 8,
    name: 'raster',
    glyphs: 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
    sources: {
      r: { type: 'raster', tiles: [tileUrl], tileSize: 256, maxzoom: maxZoom },
    },
    layers: [{ id: 'r', type: 'raster', source: 'r' }],
  };
  if (attribution) {
    style.sources.r.attribution = attribution;
  }
  return style;
}

export function resolveMapStyle(
  serverMap?: string | null,
  mapUrl?: string | null,
): string | RasterStyle {
  // 1. URL personalizada → usarla directamente
  if (mapUrl) return mapUrl;

  const key = (serverMap ?? '').toLowerCase().replace(/\s+/g, '');

  // 2. Proveedores con GL Style JSON nativo
  const glStyles: Record<string, string> = {
    // CartoDB (gratis, sin API key)
    carto: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    cartolight: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    cartopositron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    cartodark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    cartovoyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',

    // OpenFreeMap (gratis, GL style)
    openfreemap: 'https://tiles.openfreemap.org/styles/liberty', // JSON
  };

  if (glStyles[key]) return glStyles[key];

  // 3. Proveedores con raster tiles (creamos un style inline)
  const rasterTiles: Record<string, string> = {
    // OpenStreetMap
    osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    openstreetmap: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',

    // OpenTopoMap
    opentopomap: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',

    // Google (patrones conocidos, pueden requerir referrer)
    googleroad: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    googlecarreteras: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    googlesatellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    googlesatélite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    googlehybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    googlehíbrido: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',

    // LocationIQ (requiere API key en mapUrl, esto es fallback)
    locationiqstreets: 'https://tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png',
    locationiqdark: 'https://tiles.locationiq.com/v3/dark/r/{z}/{x}/{y}.png',

    // MapTiler (requiere API key)
    maptilerbasic: 'https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png',
    maptilerhybrid: 'https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.png',

    // Yandex
    yandex: 'https://core-sat.maps.yandex.net/tiles?l=sat&x={x}&y={y}&z={z}',

    // AutoNavi (China)
    autonavi: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',

    // Ordnance Survey (Reino Unido, requiere API key)
    ordnancesurvey: 'https://api.os.uk/maps/raster/v1/zxy/Light_3857/{z}/{x}/{y}.png',
  };

  if (rasterTiles[key]) return rasterStyle(rasterTiles[key]);

  // 4. Proveedores con múltiples URLs/subdominios
  const multiTile: Record<string, { urls: string[] }> = {
    herebasic: {
      urls: [
        'https://1.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8',
      ],
    },
    heresecond: {
      urls: [
        'https://2.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8',
      ],
    },
    heretre: {
      urls: [
        'https://3.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8',
      ],
    },
  };

  if (multiTile[key]) return rasterStyle(multiTile[key].urls[0]);

  // 5. Por defecto: CartoDB Voyager (mismo que antes)
  return 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
}
