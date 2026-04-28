/**
 * GPX Route Import Script for Traccar
 *
 * Parses GPX files, converts trackpoints to simplified WKT LINESTRINGs,
 * and creates route geofences via the Traccar API.
 *
 * Usage:
 *   npx tsx scripts/import-gpx-routes.ts \
 *     --url https://gps.msglobalgps.com/api \
 *     --email admin@example.com \
 *     --password secret \
 *     --files /ruta/subida.gpx /ruta/bajada.gpx \
 *     [--force]
 *
 * Environment variables (alternatives to CLI flags):
 *   TRACCAR_URL, TRACCAR_EMAIL, TRACCAR_PASSWORD
 */

import simplify from 'simplify-js';
import { XMLParser } from 'fast-xml-parser';

// ─── Configuration ──────────────────────────────────────────────────────

interface Config {
  url: string;
  email: string;
  password: string;
  files: string[];
  force: boolean;
  deviceIds: number[];
}

function parseArgs(args: string[]): Config {
  const config: Config = {
    url: process.env.TRACCAR_URL || 'https://gps.msglobalgps.com/api',
    email: process.env.TRACCAR_EMAIL || '',
    password: process.env.TRACCAR_PASSWORD || '',
    files: [],
    force: false,
    deviceIds: [],
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        config.url = args[++i];
        break;
      case '--email':
        config.email = args[++i];
        break;
      case '--password':
        config.password = args[++i];
        break;
      case '--force':
        config.force = true;
        break;
      case '--deviceIds': {
        config.deviceIds = args[++i].split(',').map(Number);
        break;
      }
      default:
        if (args[i].endsWith('.gpx')) {
          config.files.push(args[i]);
        }
    }
  }

  if (!config.email || !config.password) {
    console.error('Error: --email and --password are required (or set TRACCAR_EMAIL/TRACCAR_PASSWORD env vars)');
    process.exit(1);
  }

  if (config.files.length === 0) {
    console.error('Error: Provide at least one .gpx file path');
    process.exit(1);
  }

  return config;
}

// ─── GPX Parsing ─────────────────────────────────────────────────────────

interface TrackPoint {
  lat: number;
  lon: number;
}

function parseGpx(xmlContent: string): { name?: string; points: TrackPoint[] } {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (name: string) => name === 'trkpt' || name === 'trkseg',
  });
  const parsed = parser.parse(xmlContent);

  const gpx = parsed.gpx ?? parsed.GPX;
  if (!gpx) throw new Error('Invalid GPX: no gpx root element');

  const trk = Array.isArray(gpx.trk) ? gpx.trk[0] : gpx.trk;
  if (!trk) throw new Error('Invalid GPX: no trk element');

  const name: string | undefined = trk.name ?? undefined;

  const segments = Array.isArray(trk.trkseg) ? trk.trkseg : [trk.trkseg];
  const points: TrackPoint[] = [];

  for (const seg of segments) {
    if (!seg?.trkpt) continue;
    const trkpts = Array.isArray(seg.trkpt) ? seg.trkpt : [seg.trkpt];
    for (const pt of trkpts) {
      const lat = parseFloat(pt.lat);
      const lon = parseFloat(pt.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        points.push({ lat, lon });
      }
    }
  }

  return { name, points };
}

// ─── Douglas-Peucker Simplification ────────────────────────────────────

const SIMPLIFY_EPSILON = 0.0001; // ~11 meters

function simplifyPoints(points: TrackPoint[]): TrackPoint[] {
  // simplify-js expects {x, y} — we map lat→y, lon→x
  const input = points.map((p) => ({ x: p.lon, y: p.lat }));
  const simplified = simplify(input, SIMPLIFY_EPSILON, true);
  return simplified.map((p) => ({ lon: p.x, lat: p.y }));
}

// ─── WKT Construction ───────────────────────────────────────────────────

function buildLinestringWkt(points: TrackPoint[]): string {
  // WKT LINESTRING uses (lon lat) order — GPX uses (lat lon)
  // We've already got lat/lon, so swap: lon first, then lat
  const coords = points.map((p) => `${p.lon} ${p.lat}`).join(', ');
  return `LINESTRING(${coords})`;
}

// ─── Route Type Detection ────────────────────────────────────────────────

interface RouteConfig {
  routeType: 'subida' | 'bajada' | string;
  routeColor: string;
  routeLabel: string;
  defaultName: string;
}

function getRouteConfig(filePath: string, gpxName?: string): RouteConfig {
  const filename = filePath.toLowerCase();

  if (filename.includes('subida')) {
    return {
      routeType: 'subida',
      routeColor: '#3b82f6',
      routeLabel: gpxName || 'Subida',
      defaultName: 'ROUTE: Subida',
    };
  }

  if (filename.includes('bajada')) {
    return {
      routeType: 'bajada',
      routeColor: '#ef4444',
      routeLabel: gpxName || 'Bajada',
      defaultName: 'ROUTE: Bajada',
    };
  }

  return {
    routeType: '',
    routeColor: '#9ca3af',
    routeLabel: gpxName || 'Route',
    defaultName: gpxName ? `ROUTE: ${gpxName}` : 'ROUTE: Unknown',
  };
}

// ─── Traccar API Client ─────────────────────────────────────────────────

class TraccarClient {
  private baseUrl: string;
  private cookie: string = '';

  constructor(url: string) {
    // Remove trailing slash
    this.baseUrl = url.replace(/\/+$/, '');
  }

  async authenticate(email: string, password: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email, password }),
      redirect: 'manual',
    });

    // Traccar may return 302 or 200; extract JSESSIONID from Set-Cookie header
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/JSESSIONID=[^;]+/);
      if (match) {
        this.cookie = match[0];
      }
    }

    // If no cookie from redirect, try reading body (some Traccar versions)
    if (!this.cookie) {
      // Consume body to avoid leaks, then retry without redirect manual
      const resp2 = await fetch(`${this.baseUrl}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password }),
      });
      if (!resp2.ok) {
        throw new Error(`Authentication failed: ${resp2.status} ${resp2.statusText}`);
      }
      const setCookie2 = resp2.headers.get('set-cookie');
      if (setCookie2) {
        const match = setCookie2.match(/JSESSIONID=[^;]+/);
        if (match) {
          this.cookie = match[0];
        }
      }
      // Try also Bearer token from response body
      const data = await resp2.json();
      if (!this.cookie && data.token) {
        this.cookie = `token=${data.token}`;
      }
    }

    if (!this.cookie) {
      throw new Error('Authentication succeeded but no session cookie received');
    }

    console.log('  🍪 Auth cookie obtained');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }
    return headers;
  }

  async getGeofences(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/geofences`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) throw new Error(`GET /geofences failed: ${response.status}`);
    return response.json();
  }

  async createGeofence(geofence: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/geofences`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(geofence),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`POST /geofences failed: ${response.status} — ${text}`);
    }
    return response.json();
  }

  async updateGeofence(id: number, geofence: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/geofences/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(geofence),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PUT /geofences/${id} failed: ${response.status} — ${text}`);
    }
    return response.json();
  }

  async linkGeofenceToDevice(geofenceId: number, deviceId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/permissions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ geofenceId, deviceId }),
    });
    // 409 = permission already exists, that's OK
    if (!response.ok && response.status !== 409) {
      console.warn(`Failed to link geofence ${geofenceId} to device ${deviceId}: ${response.status}`);
    }
  }
}

// ─── Main Import Logic ──────────────────────────────────────────────────

async function importRoute(
  filePath: string,
  config: Config,
  client: TraccarClient,
): Promise<void> {
  console.log(`\n📁 Processing: ${filePath}`);

  // 1. Read and parse GPX
  const fs = await import('fs');
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  const { name: gpxName, points: rawPoints } = parseGpx(xmlContent);

  if (rawPoints.length === 0) {
    console.error('  ❌ No trackpoints found in GPX file');
    return;
  }

  console.log(`  📍 Raw trackpoints: ${rawPoints.length}`);

  // 2. Simplify with Douglas-Peucker
  const simplifiedPoints = simplifyPoints(rawPoints);
  console.log(`  ✂️  Simplified points: ${simplifiedPoints.length}`);

  // 3. Build WKT (lon/lat order)
  const wkt = buildLinestringWkt(simplifiedPoints);
  console.log(`  📐 WKT length: ${wkt.length} chars`);

  // 4. Determine route config from filename
  const routeConfig = getRouteConfig(filePath, gpxName);
  const geofenceName = gpxName && !config.force ? gpxName : routeConfig.defaultName;
  const finalName = config.force ? routeConfig.defaultName : geofenceName;

  // 5. Check idempotency
  const existingGeofences = await client.getGeofences();
  const existing = existingGeofences.find((g: any) => g.name === finalName);

  // 6. Build geofence payload
  const payload = {
    name: finalName,
    area: wkt,
    description: `Route imported from ${filePath} (${rawPoints.length} points → ${simplifiedPoints.length} simplified)`,
    attributes: {
      isRoute: 'true',
      routeType: routeConfig.routeType,
      routeColor: routeConfig.routeColor,
      routeLabel: routeConfig.routeLabel,
    },
  };

  let geofenceId: number;

  if (existing) {
    if (!config.force) {
      console.log(`  ⏭️  Geofence "${finalName}" already exists (id: ${existing.id}). Use --force to update.`);
      return;
    }
    // Update existing
    console.log(`  🔄 Updating existing geofence (id: ${existing.id})...`);
    const updated = await client.updateGeofence(existing.id, { ...existing, ...payload });
    geofenceId = updated.id;
    console.log(`  ✅ Updated geofence "${finalName}" (id: ${geofenceId})`);
  } else {
    // Create new
    console.log(`  ➕ Creating new geofence...`);
    const created = await client.createGeofence(payload);
    geofenceId = created.id;
    console.log(`  ✅ Created geofence "${finalName}" (id: ${geofenceId})`);
  }

  // 7. Link to devices if specified
  if (config.deviceIds.length > 0) {
    for (const deviceId of config.deviceIds) {
      console.log(`  🔗 Linking to device ${deviceId}...`);
      await client.linkGeofenceToDevice(geofenceId, deviceId);
    }
  }
}

async function main(): Promise<void> {
  const config = parseArgs(process.argv.slice(2));
  const client = new TraccarClient(config.url);

  console.log('🔐 Authenticating...');
  await client.authenticate(config.email, config.password);
  console.log('✅ Authenticated');

  for (const file of config.files) {
    await importRoute(file, config, client);
  }

  console.log('\n🎉 Import complete!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});