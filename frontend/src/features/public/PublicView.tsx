import { useEffect, useState, useRef, type CSSProperties } from 'react';
import maplibregl from 'maplibre-gl';

interface SharedPosition {
  id: number;
  deviceId: number;
  latitude: number;
  longitude: number;
  fixTime: string;
  speed?: number;
  attributes?: Record<string, unknown>;
}

export function PublicView() {
  const token = window.location.pathname.replace('/v/', '');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'expired' | 'ok'>('loading');
  const [positions, setPositions] = useState<SharedPosition[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('Token no proporcionado'); return; }

    fetch(`/api/public/view?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.status === 410) { setStatus('expired'); return; }
        if (!res.ok) {
          const text = await res.text();
          let msg = 'Error al cargar';
          try { msg = JSON.parse(text).error || msg; } catch {}
          setStatus('error');
          setErrorMsg(msg);
          return;
        }
        const data = await res.json();
        setPositions(data.positions ?? []);
        setStatus('ok');
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Error de conexión');
      });
  }, [token]);

  useEffect(() => {
    if (status !== 'ok' || positions.length === 0 || !containerRef.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [positions[0].longitude, positions[0].latitude],
      zoom: 12,
      attributionControl: false,
    });

    map.on('load', () => {
      const features = positions
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          type: 'Feature' as const,
          properties: { deviceId: p.deviceId },
          geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
        }));

      map.addSource('points', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });

      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-color': '#6366f1',
          'circle-radius': 8,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      // fitBounds
      const bounds = new maplibregl.LngLatBounds();
      features.forEach((f) => bounds.extend(f.geometry.coordinates as [number, number]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    });

    mapRef.current = map;
  }, [status, positions]);

  const containerStyle: CSSProperties = {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  };

  const overlayStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(180deg, rgba(15,23,42,0.6) 0%, transparent 100%)',
    pointerEvents: 'none',
  };

  const logoStyle: CSSProperties = {
    fontFamily: 'Outfit, sans-serif',
    fontSize: 18,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '0.06em',
  };

  const badgeStyle: CSSProperties = {
    padding: '4px 12px',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'Outfit, sans-serif',
    backdropFilter: 'blur(8px)',
  };

  if (status === 'loading') {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 600 }}>
          Cargando...
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontFamily: 'Outfit, sans-serif' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Enlace expirado</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Solicitá un nuevo enlace al administrador</div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontFamily: 'Outfit, sans-serif' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{errorMsg || 'Error'}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {positions.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontFamily: 'Outfit, sans-serif' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Sin ubicación disponible</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Los vehículos no han reportado posición recientemente</div>
        </div>
      ) : (
        <>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
          <div style={overlayStyle}>
            <span style={logoStyle}>MSGLOBAL GPS</span>
            <span style={badgeStyle}>{positions.length} vehículo{positions.length !== 1 ? 's' : ''}</span>
          </div>
        </>
      )}
    </div>
  );
}
