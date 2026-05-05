import { useState, useEffect, useRef, type CSSProperties, type FormEvent, type ChangeEvent } from 'react';
import { useServer } from '../hooks/useServer';
import { useUpdateServer } from '../hooks/useUpdateServer';
import { useServerActions } from '../hooks/useServerActions';
import { LoadingState, ErrorState } from '@shared/ui';
import { IconCheck, IconReset, IconTrash2, IconFileBarChart, IconSettings as IconServer } from '@shared/ui/icons';
import type { Server } from '@shared/api/types.models';

// ─── Design System ─────────────────────────────────────────────────
const colors = {
  bg: '#f8fafc',
  surface: '#ffffff',
  border: 'rgba(15, 23, 42, 0.06)',
  borderHover: 'rgba(15, 23, 42, 0.12)',
  text: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  accent: '#6366f1',
  accentBg: 'rgba(99, 102, 241, 0.08)',
  green: '#10b981',
  red: '#ef4444',
  redBg: 'rgba(239, 68, 68, 0.08)',
};

const sectionItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.875rem 1rem',
  borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
  transition: 'background-color 0.15s',
  cursor: 'default',
};

const labelPrimary: CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: colors.text,
  fontFamily: 'Outfit, sans-serif',
  letterSpacing: '-0.01em',
};

const labelSecondary: CSSProperties = {
  fontSize: '0.6875rem',
  color: colors.textTertiary,
  fontFamily: 'Outfit, sans-serif',
  marginTop: '0.125rem',
};

const cardBase: CSSProperties = {
  backgroundColor: colors.surface,
  borderRadius: '1rem',
  border: `1px solid ${colors.border}`,
  overflow: 'hidden',
  transition: 'box-shadow 0.2s',
};

const cardHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  padding: '1.125rem 1.25rem',
  borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
  backgroundColor: 'rgba(15, 23, 42, 0.02)',
};

const cardTitle: CSSProperties = {
  fontFamily: 'Outfit, sans-serif',
  fontSize: '0.8125rem',
  fontWeight: 700,
  color: colors.text,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
};

const cardBody: CSSProperties = {
  padding: '0.5rem 0',
};

const inputBase: CSSProperties = {
  width: '100%',
  padding: '0.625rem 1rem',
  borderRadius: '0.625rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(15, 23, 42, 0.02)',
  color: colors.text,
  fontSize: '0.8125rem',
  fontWeight: 500,
  outline: 'none',
  transition: 'all 0.15s',
  fontFamily: 'Outfit, sans-serif',
  boxSizing: 'border-box',
};

const fieldLabel: CSSProperties = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 700,
  color: colors.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.375rem',
  fontFamily: 'Outfit, sans-serif',
};

const tagPill = (bg: string, color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.2rem 0.5rem',
  borderRadius: '0.375rem',
  backgroundColor: bg,
  color,
  fontSize: '0.625rem',
  fontWeight: 700,
  fontFamily: 'Outfit, sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
});

// ─── Toggle Switch ─────────────────────────────────────────────────
const trackBase: CSSProperties = {
  position: 'relative',
  width: 40,
  height: 22,
  borderRadius: 11,
  cursor: 'pointer',
  transition: 'background-color 0.2s, box-shadow 0.2s',
  border: 'none',
  padding: 0,
  flexShrink: 0,
};

const thumbStyle = (active: boolean): CSSProperties => ({
  position: 'absolute',
  top: 2,
  left: active ? 20 : 2,
  width: 18,
  height: 18,
  borderRadius: '50%',
  backgroundColor: '#fff',
  transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)',
});

// ─── Feedback Banner ───────────────────────────────────────────────
function FeedbackBanner({ type, message, onDismiss, style }: {
  type: 'success' | 'error';
  message: string;
  onDismiss?: () => void;
  style?: CSSProperties;
}) {
  const isSuccess = type === 'success';
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      borderRadius: '0.75rem',
      backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.06)' : colors.redBg,
      border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          backgroundColor: isSuccess ? colors.green : colors.red,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.625rem', fontWeight: 800, flexShrink: 0,
        }}>
          {isSuccess ? '✓' : '!'}
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isSuccess ? colors.green : colors.red, fontFamily: 'Outfit, sans-serif' }}>
          {message}
        </span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: isSuccess ? colors.green : colors.red, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', opacity: 0.6 }}>×</button>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export function ServerConfigForm() {
  const { data: server, isLoading, error } = useServer();
  const updateServer = useUpdateServer();
  const { reboot, gc, cacheInfo } = useServerActions();
  const formRef = useRef<HTMLFormElement>(null);

  const [form, setForm] = useState<Partial<Server>>({});
  const [saved, setSaved] = useState(false);
  const [timezone, setTimezone] = useState('');
  const [speedUnit, setSpeedUnit] = useState('kmh');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (server) {
      setForm({ ...server });
      const attrs = (server as unknown as { attributes?: Record<string, string> }).attributes ?? {};
      setTimezone(attrs.timezone ?? '');
      setSpeedUnit(attrs.speedUnit ?? 'kmh');
    }
  }, [server]);

  useEffect(() => {
    if (updateServer.isSuccess) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(t);
    }
  }, [updateServer.isSuccess]);

  // Intersection Observer for active section tracking
  useEffect(() => {
    const sections = document.querySelectorAll('[data-section]');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.getAttribute('data-section'));
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [server]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) return <div style={{ padding: '3rem' }}><LoadingState /></div>;
  if (error) return <div style={{ padding: '3rem' }}><ErrorState message={(error as Error).message} /></div>;
  if (!server) return <div style={{ padding: '3rem' }}><ErrorState message="No se pudo cargar la configuración del servidor" /></div>;

  const handleChange = (field: keyof Server, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof Server, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? undefined : Number(e.target.value);
    handleChange(field, val);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      attributes: {
        ...(form.attributes ?? {}) as Record<string, string>,
        timezone: timezone || undefined,
        speedUnit: speedUnit || undefined,
      },
    } as unknown as Server;
    await updateServer.mutateAsync(payload as Server);
  };

  const isPending = updateServer.isPending;

  const sections = [
    { id: 'general', label: 'General' },
    { id: 'mapa', label: 'Mapa' },
    { id: 'openid', label: 'OpenID' },
    { id: 'info', label: 'Servidor' },
    { id: 'acciones', label: 'Acciones' },
  ] as const;

  const navItem = (section: typeof sections[number]): CSSProperties => ({
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: activeSection === section.id ? colors.accentBg : 'transparent',
    color: activeSection === section.id ? colors.accent : colors.textSecondary,
    fontSize: '0.75rem',
    fontWeight: 600,
    fontFamily: 'Outfit, sans-serif',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
      {/* Sidebar nav */}
      <div style={{
        position: 'sticky',
        top: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.125rem',
        padding: '0.5rem',
        backgroundColor: colors.surface,
        borderRadius: '0.875rem',
        border: `1px solid ${colors.border}`,
        minWidth: 120,
        flexShrink: 0,
      }}>
        <div style={{ padding: '0.5rem 0.75rem 0.625rem', fontSize: '0.625rem', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Outfit, sans-serif', borderBottom: `1px solid ${colors.border}`, marginBottom: '0.25rem' }}>
          Secciones
        </div>
        {sections.map((s) => (
          <button key={s.id} style={navItem(s)} onClick={() => scrollTo(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Main form */}
      <form ref={formRef} onSubmit={handleSubmit} noValidate style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* General */}
        <div id="general" data-section="general" style={cardBase}>
          <div style={cardHeader}>
            <IconServer size={16} color={colors.accent} />
            <span style={{ ...cardTitle, flex: 1 }}>General</span>
            <span style={tagPill(colors.accentBg, colors.accent)}>{Object.values(form).filter(v => v === true).length} activos</span>
          </div>
          <div style={cardBody}>
            {([
              { field: 'registration' as const, label: 'Registro de usuarios', desc: 'Permitir que nuevos usuarios se registren solos' },
              { field: 'readonly' as const, label: 'Configuración solo admins', desc: 'Solo administradores pueden modificar ajustes globales' },
              { field: 'deviceReadonly' as const, label: 'Atributos solo lectura', desc: 'Usuarios no-admin no pueden modificar atributos de dispositivos' },
              { field: 'limitCommands' as const, label: 'Limitar comandos', desc: 'Restringir comandos a protocolos que los soporten' },
              { field: 'forceSettings' as const, label: 'Forzar configuración global', desc: 'Sobrescribir preferencias individuales de usuarios' },
            ]).map((item) => (
              <div key={item.field} style={sectionItemStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div>
                  <div style={labelPrimary}>{item.label}</div>
                  <div style={labelSecondary}>{item.desc}</div>
                </div>
                <button
                  type="button"
                  style={{ ...trackBase, backgroundColor: form[item.field] ? colors.accent : 'rgba(15, 23, 42, 0.08)', boxShadow: form[item.field] ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none' }}
                  onClick={() => handleChange(item.field, !form[item.field])}
                  aria-label={item.label}
                >
                  <div style={thumbStyle(!!form[item.field])} />
                </button>
              </div>
            ))}
            <div style={{ padding: '1rem 1rem 0.75rem', borderTop: '1px solid rgba(15, 23, 42, 0.03)' }}>
              <div style={fieldLabel}>Anuncio global</div>
              <input type="text" value={form.announcement ?? ''} onChange={(e) => handleChange('announcement', e.target.value || undefined)}
                style={inputBase} placeholder="Mensaje visible para todos los usuarios..."
                onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.backgroundColor = colors.accentBg; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)'; }}
              />
            </div>
            <div style={{ padding: '0.75rem 1rem 1rem', display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={fieldLabel}>Zona horaria</div>
                <input type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  style={inputBase} placeholder="Ej: America/Lima"
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.backgroundColor = colors.accentBg; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)'; }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={fieldLabel}>Unidad de velocidad</div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {(['kmh', 'mph', 'kn'] as const).map((unit) => (
                    <label key={unit} style={{
                      flex: 1, padding: '0.5rem 0.375rem', borderRadius: '0.5rem',
                      border: speedUnit === unit ? `1.5px solid ${colors.accent}` : '1px solid rgba(15, 23, 42, 0.06)',
                      backgroundColor: speedUnit === unit ? colors.accentBg : 'rgba(15, 23, 42, 0.02)',
                      color: speedUnit === unit ? colors.accent : colors.textSecondary,
                      fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center',
                      fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s',
                    }}>
                      <input type="radio" name="speedUnit" value={unit} checked={speedUnit === unit}
                        onChange={(e) => setSpeedUnit(e.target.value)} style={{ display: 'none' }} />
                      {unit === 'kmh' ? 'Km/h' : unit === 'mph' ? 'Mph' : 'Nudos'}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div id="mapa" data-section="mapa" style={cardBase}>
          <div style={cardHeader}>
            <span style={cardTitle}>🗺️ Mapa</span>
          </div>
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={fieldLabel}>Proveedor de mapa</div>
              <select value={form.map ?? ''}
                onChange={(e) => handleChange('map', e.target.value || undefined)}
                style={{
                  ...inputBase,
                  appearance: 'none',
                  cursor: 'pointer',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.25rem',
                  paddingRight: '2rem',
                }}
              >
                <option value="">Default (CartoDB)</option>
                <optgroup label="Gratis (sin API key)">
                  <option value="carto">CartoDB Voyager</option>
                  <option value="cartoLight">CartoDB Positron</option>
                  <option value="cartoDark">CartoDB Dark Matter</option>
                  <option value="openFreeMap">OpenFreeMap</option>
                  <option value="osm">OpenStreetMap</option>
                  <option value="openTopoMap">OpenTopoMap</option>
                </optgroup>
                <optgroup label="Google (sin API key)">
                  <option value="googleRoad">Google Carreteras</option>
                  <option value="googleSatellite">Google Satélite</option>
                  <option value="googleHybrid">Google Híbrido</option>
                </optgroup>
                <optgroup label="Requieren API key">
                  <option value="locationIqStreets">LocationIQ Streets</option>
                  <option value="locationIqDark">LocationIQ Dark</option>
                  <option value="mapTilerBasic">MapTiler Basic</option>
                  <option value="mapTilerHybrid">MapTiler Hybrid</option>
                  <option value="bingMapsRoad">Bing Maps Carretera</option>
                  <option value="bingMapsAerial">Bing Maps Aéreo</option>
                  <option value="bingMapsHybrid">Bing Maps Híbrido</option>
                  <option value="tomTomBasic">TomTom Basic</option>
                  <option value="hereBasic">Here Basic</option>
                  <option value="hereHybrid">Here Hybrid</option>
                  <option value="hereSatellite">Here Satellite</option>
                  <option value="mapboxStreets">Mapbox Streets</option>
                  <option value="mapboxStreetsDark">Mapbox Streets Dark</option>
                  <option value="ordnanceSurvey">Ordnance Survey</option>
                </optgroup>
                <optgroup label="Otros">
                  <option value="yandex">Yandex</option>
                  <option value="autoNavi">AutoNavi</option>
                </optgroup>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <div style={fieldLabel}>Bing Maps Key</div>
                <input type="password" value={form.bingKey ?? ''}
                  onChange={(e) => handleChange('bingKey', e.target.value || undefined)}
                  style={inputBase} placeholder="API Key para Bing Maps"
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.backgroundColor = colors.accentBg; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)'; }}
                />
              </div>
              <div>
                <div style={fieldLabel}>Tiles URL personalizada</div>
                <input type="text" value={form.mapUrl ?? ''}
                  onChange={(e) => handleChange('mapUrl', e.target.value || undefined)}
                  style={inputBase} placeholder="https://.../{z}/{x}/{y}.png"
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.backgroundColor = colors.accentBg; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)'; }}
                />
              </div>
            </div>
            <div>
              <div style={fieldLabel}>Capa POI</div>
              <input type="text" value={form.poiLayer ?? ''}
                onChange={(e) => handleChange('poiLayer', e.target.value || undefined)}
                style={inputBase} placeholder="Configuración de capa de POI"
                onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.backgroundColor = colors.accentBg; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)'; }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
              {([
                { field: 'latitude' as const, label: 'Latitud', step: 'any' },
                { field: 'longitude' as const, label: 'Longitud', step: 'any' },
                { field: 'zoom' as const, label: 'Zoom', step: '1' },
                { field: 'coordinateFormat' as const, label: 'Coordenadas', placeholder: 'dd, ddm, dms' },
              ]).map(({ field, label, step, placeholder }) => (
                <div key={field}>
                  <div style={fieldLabel}>{label}</div>
                  <input type={field === 'coordinateFormat' ? 'text' : 'number'} step={step}
                    value={form[field] ?? ''}
                    onChange={field === 'coordinateFormat' 
                      ? (e) => handleChange(field, e.target.value || undefined)
                      : (e) => handleNumberChange(field, e)}
                    style={inputBase} placeholder={placeholder}
                    onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.backgroundColor = colors.accentBg; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)'; }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OpenID */}
        <div id="openid" data-section="openid" style={cardBase}>
          <div style={cardHeader}>
            <span style={cardTitle}>🔑 OpenID</span>
          </div>
          <div style={cardBody}>
            {([
              { field: 'openIdEnabled' as const, label: 'OpenID habilitado', desc: 'Permitir autenticación mediante OpenID' },
              { field: 'openIdForce' as const, label: 'Forzar OpenID', desc: 'Deshabilitar el login nativo de Traccar' },
            ]).map(({ field, label, desc }) => (
              <div key={field} style={sectionItemStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div>
                  <div style={labelPrimary}>{label}</div>
                  <div style={labelSecondary}>{desc}</div>
                </div>
                <button type="button"
                  style={{ ...trackBase, backgroundColor: form[field] ? colors.accent : 'rgba(15, 23, 42, 0.08)', boxShadow: form[field] ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none' }}
                  onClick={() => handleChange(field, !form[field])}
                  aria-label={label}
                >
                  <div style={thumbStyle(!!form[field])} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Server Info */}
        <div id="info" data-section="info" style={cardBase}>
          <div style={cardHeader}>
            <span style={cardTitle}>ℹ️ Servidor</span>
          </div>
          <div style={{ padding: '1rem 1.25rem', display: 'flex', gap: '2rem' }}>
            {[
              { label: 'Versión', value: server.version ?? '—' },
              { label: 'ID', value: String(server.id ?? '—') },
              { label: 'Registro', value: server.registration ? 'Abierto' : 'Cerrado' },
              { label: 'Mapa default', value: server.map ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '0.625rem', fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Outfit, sans-serif', marginBottom: '0.25rem' }}>{label}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: colors.text, fontFamily: 'Outfit, sans-serif' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div id="acciones" data-section="acciones" style={cardBase}>
          <div style={cardHeader}>
            <span style={cardTitle}>⚡ Acciones</span>
          </div>
          <div style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              <ActionButton
                label={reboot.isPending ? 'Reiniciando...' : 'Reiniciar Servidor'}
                icon={<IconReset size={14} />}
                variant="danger"
                disabled={reboot.isPending}
                onClick={() => { if (window.confirm('¿Reiniciar el servidor? Se desconectarán todos los usuarios.')) reboot.mutate(); }}
              />
              <ActionButton
                label={gc.isPending ? 'Ejecutando...' : 'Garbage Collection'}
                icon={<IconTrash2 size={14} />}
                variant="secondary"
                disabled={gc.isPending}
                onClick={() => gc.mutate()}
              />
              <ActionButton
                label={cacheInfo.isPending ? 'Consultando...' : 'Cache Info'}
                icon={<IconFileBarChart size={14} />}
                variant="secondary"
                disabled={cacheInfo.isPending}
                onClick={() => cacheInfo.mutate()}
              />
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {reboot.isSuccess && <FeedbackBanner type="success" message="Servidor reiniciado" />}
              {gc.isSuccess && <FeedbackBanner type="success" message="Garbage collection ejecutado" />}
              {(reboot.error || gc.error || cacheInfo.error) && (
                <FeedbackBanner type="error" message={(reboot.error as Error)?.message ?? (gc.error as Error)?.message ?? (cacheInfo.error as Error)?.message ?? 'Error'} />
              )}
              {cacheInfo.isSuccess && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(15, 23, 42, 0.02)', fontSize: '0.6875rem', fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', color: colors.textSecondary, border: `1px solid ${colors.border}` }}>
                  {String(cacheInfo.data ?? 'Sin datos')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save bar */}
        <div style={{
          position: 'sticky', bottom: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
          padding: '0.875rem 1.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          borderRadius: '1rem',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            {updateServer.error && <FeedbackBanner type="error" message={(updateServer.error as Error).message ?? 'Error'} style={{ flex: 1, marginBottom: 0 }} />}
            {saved && <FeedbackBanner type="success" message="Configuración guardada" onDismiss={() => setSaved(false)} style={{ flex: 1, marginBottom: 0 }} />}
          </div>
          <button type="submit" disabled={isPending}
            style={{
              padding: '0.625rem 1.25rem', borderRadius: '0.625rem', border: 'none',
              backgroundColor: isPending ? colors.textTertiary : colors.accent,
              color: '#fff', fontSize: '0.8125rem', fontWeight: 700,
              fontFamily: 'Outfit, sans-serif', cursor: isPending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              boxShadow: isPending ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.3)',
            }}
            onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.4)'; }}
            onMouseLeave={(e) => { if (!isPending) e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)'; }}
          >
            <IconCheck size={14} />
            {isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Action Button Component ──────────────────────────────────────
function ActionButton({ label, icon, variant, disabled, onClick }: {
  label: string;
  icon: React.ReactNode;
  variant: 'danger' | 'secondary';
  disabled?: boolean;
  onClick: () => void;
}) {
  const isDanger = variant === 'danger';
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      style={{
        padding: '0.5rem 0.875rem', borderRadius: '0.625rem', border: 'none',
        fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
        backgroundColor: isDanger ? colors.redBg : 'rgba(15, 23, 42, 0.04)',
        color: isDanger ? colors.red : colors.textSecondary,
        transition: 'all 0.15s',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.backgroundColor = isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.08)'; }}}
      onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.backgroundColor = isDanger ? colors.redBg : 'rgba(15, 23, 42, 0.04)'; }}}
    >
      {icon}
      {label}
    </button>
  );
}
