import { useState, useEffect, type CSSProperties, type FormEvent, type ChangeEvent } from 'react';
import { useServer } from '../hooks/useServer';
import { useUpdateServer } from '../hooks/useUpdateServer';
import { useServerActions } from '../hooks/useServerActions';
import { LoadingState, ErrorState } from '@shared/ui';
import { IconCheck, IconReset, IconTrash2, IconFileBarChart, IconSettings as IconServer } from '@shared/ui/icons';
import type { Server } from '@shared/api/types.models';

const cardStyle: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(16px)',
  borderRadius: '1.25rem',
  border: '1px solid rgba(15, 23, 42, 0.06)',
  boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
  padding: '2rem',
  marginBottom: '1.5rem',
};

const sectionTitleStyle: CSSProperties = {
  fontFamily: 'Outfit',
  fontSize: '1rem',
  fontWeight: 700,
  color: '#0f172a',
  margin: '0 0 1.25rem 0',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const fieldStyle: CSSProperties = {
  marginBottom: '1rem',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.375rem',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.625rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(15, 23, 42, 0.1)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: '#0f172a',
  fontSize: '0.8125rem',
  fontWeight: 600,
  outline: 'none',
  transition: 'all 0.2s',
  fontFamily: 'Outfit, system-ui, sans-serif',
  boxSizing: 'border-box',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
};

const toggleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 0',
  borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
};

const toggleLabelStyle: CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#0f172a',
};

const toggleSwitchStyle = (active: boolean): CSSProperties => ({
  position: 'relative',
  width: '44px',
  height: '24px',
  borderRadius: '12px',
  backgroundColor: active ? '#6366f1' : 'rgba(15, 23, 42, 0.1)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: 'none',
  padding: 0,
});

const toggleDotStyle = (active: boolean): CSSProperties => ({
  position: 'absolute' as const,
  top: '2px',
  left: active ? '22px' : '2px',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: '#fff',
  transition: 'all 0.2s',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
});

const buttonBase: CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: '0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  fontFamily: 'Outfit',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  border: 'none',
};

const saveButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: '#6366f1',
  color: '#fff',
};

const actionButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: 'rgba(15, 23, 42, 0.04)',
  color: '#64748b',
  border: '1px solid rgba(15, 23, 42, 0.08)',
};

const dangerButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: 'rgba(239, 68, 68, 0.08)',
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.2)',
};

const errorStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.625rem',
  backgroundColor: 'rgba(239, 68, 68, 0.08)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  color: '#ef4444',
  fontSize: '0.8125rem',
  marginBottom: '1rem',
};

const successStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.625rem',
  backgroundColor: 'rgba(34, 197, 94, 0.08)',
  border: '1px solid rgba(34, 197, 94, 0.2)',
  color: '#22c55e',
  fontSize: '0.8125rem',
  marginBottom: '1rem',
};

export function ServerConfigForm() {
  const { data: server, isLoading, error } = useServer();
  const updateServer = useUpdateServer();
  const { reboot, gc, cacheInfo } = useServerActions();

  const [form, setForm] = useState<Partial<Server>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (server) {
      setForm({ ...server });
    }
  }, [server]);

  useEffect(() => {
    if (updateServer.isSuccess) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(t);
    }
  }, [updateServer.isSuccess]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={(error as Error).message} />;
  if (!server) return <ErrorState message="No se pudo cargar la configuración del servidor" />;

  const handleChange = (field: keyof Server, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof Server, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? undefined : Number(e.target.value);
    handleChange(field, val);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await updateServer.mutateAsync(form as Server);
  };

  const isPending = updateServer.isPending;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* General */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}><IconServer size={18} /> General</h2>

        <div style={toggleRowStyle}>
          <span style={toggleLabelStyle}>Registro de nuevos usuarios</span>
          <button type="button" style={toggleSwitchStyle(!!form.registration)} onClick={() => handleChange('registration', !form.registration)}>
            <div style={toggleDotStyle(!!form.registration)} />
          </button>
        </div>

        <div style={toggleRowStyle}>
          <span style={toggleLabelStyle}>Solo admins modifican configuración global</span>
          <button type="button" style={toggleSwitchStyle(!!form.readonly)} onClick={() => handleChange('readonly', !form.readonly)}>
            <div style={toggleDotStyle(!!form.readonly)} />
          </button>
        </div>

        <div style={toggleRowStyle}>
          <span style={toggleLabelStyle}>Atributos de dispositivos solo lectura (no admins)</span>
          <button type="button" style={toggleSwitchStyle(!!form.deviceReadonly)} onClick={() => handleChange('deviceReadonly', !form.deviceReadonly)}>
            <div style={toggleDotStyle(!!form.deviceReadonly)} />
          </button>
        </div>

        <div style={toggleRowStyle}>
          <span style={toggleLabelStyle}>Limitar comandos a protocolos soportados</span>
          <button type="button" style={toggleSwitchStyle(!!form.limitCommands)} onClick={() => handleChange('limitCommands', !form.limitCommands)}>
            <div style={toggleDotStyle(!!form.limitCommands)} />
          </button>
        </div>

        <div style={toggleRowStyle}>
          <span style={toggleLabelStyle}>Forzar configuración global a todos los usuarios</span>
          <button type="button" style={toggleSwitchStyle(!!form.forceSettings)} onClick={() => handleChange('forceSettings', !form.forceSettings)}>
            <div style={toggleDotStyle(!!form.forceSettings)} />
          </button>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Anuncio global</label>
          <input
            type="text"
            value={form.announcement ?? ''}
            onChange={(e) => handleChange('announcement', e.target.value || undefined)}
            style={inputStyle}
            placeholder="Mensaje mostrado a todos los usuarios..."
          />
        </div>
      </div>

      {/* Mapa */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Mapa</h2>

        <div style={fieldStyle}>
          <label style={labelStyle}>Capa de mapa por defecto</label>
          <input
            type="text"
            value={form.map ?? ''}
            onChange={(e) => handleChange('map', e.target.value || undefined)}
            style={inputStyle}
            placeholder=" Ej: carto, osm, bing..."
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Bing Maps API Key</label>
          <input
            type="text"
            value={form.bingKey ?? ''}
            onChange={(e) => handleChange('bingKey', e.target.value || undefined)}
            style={inputStyle}
            placeholder="Clave de API de Bing Maps"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>URL de tiles personalizada</label>
          <input
            type="text"
            value={form.mapUrl ?? ''}
            onChange={(e) => handleChange('mapUrl', e.target.value || undefined)}
            style={inputStyle}
            placeholder="https://.../{z}/{x}/{y}.png"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Capa POI externa</label>
          <input
            type="text"
            value={form.poiLayer ?? ''}
            onChange={(e) => handleChange('poiLayer', e.target.value || undefined)}
            style={inputStyle}
            placeholder="Configuración de capa de POI"
          />
        </div>

        <div style={rowStyle}>
          <div style={{ ...fieldStyle, flex: 1 }}>
            <label style={labelStyle}>Latitud centro</label>
            <input
              type="number"
              step="any"
              value={form.latitude ?? ''}
              onChange={(e) => handleNumberChange('latitude', e)}
              style={inputStyle}
            />
          </div>
          <div style={{ ...fieldStyle, flex: 1 }}>
            <label style={labelStyle}>Longitud centro</label>
            <input
              type="number"
              step="any"
              value={form.longitude ?? ''}
              onChange={(e) => handleNumberChange('longitude', e)}
              style={inputStyle}
            />
          </div>
          <div style={{ ...fieldStyle, flex: 1 }}>
            <label style={labelStyle}>Zoom por defecto</label>
            <input
              type="number"
              value={form.zoom ?? ''}
              onChange={(e) => handleNumberChange('zoom', e)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Formato de coordenadas</label>
          <input
            type="text"
            value={form.coordinateFormat ?? ''}
            onChange={(e) => handleChange('coordinateFormat', e.target.value || undefined)}
            style={inputStyle}
            placeholder="Ej: dd, ddm, dms"
          />
        </div>
      </div>

      {/* OpenID */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>OpenID</h2>
        <div style={toggleRowStyle}>
          <span style={toggleLabelStyle}>OpenID habilitado</span>
          <button type="button" style={toggleSwitchStyle(!!form.openIdEnabled)} onClick={() => handleChange('openIdEnabled', !form.openIdEnabled)}>
            <div style={toggleDotStyle(!!form.openIdEnabled)} />
          </button>
        </div>
        <div style={toggleRowStyle}>
          <span style={toggleLabelStyle}>Forzar OpenID (deshabilitar login nativo)</span>
          <button type="button" style={toggleSwitchStyle(!!form.openIdForce)} onClick={() => handleChange('openIdForce', !form.openIdForce)}>
            <div style={toggleDotStyle(!!form.openIdForce)} />
          </button>
        </div>
      </div>

      {/* Server Info */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Información del Servidor</h2>
        <div style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6 }}>
          <div><strong style={{ color: '#0f172a' }}>Versión:</strong> {server.version ?? '—'}</div>
          <div><strong style={{ color: '#0f172a' }}>ID:</strong> {server.id ?? '—'}</div>
        </div>
      </div>

      {/* Acciones */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Acciones del Servidor</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={dangerButton}
            onClick={() => {
              if (window.confirm('¿Reiniciar el servidor? Esto desconectará a todos los usuarios.')) {
                reboot.mutate();
              }
            }}
            disabled={reboot.isPending}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <IconReset size={14} />
            {reboot.isPending ? 'Reiniciando...' : 'Reiniciar Servidor'}
          </button>
          <button
            type="button"
            style={actionButton}
            onClick={() => gc.mutate()}
            disabled={gc.isPending}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <IconTrash2 size={14} />
            {gc.isPending ? 'Ejecutando...' : 'Garbage Collection'}
          </button>
          <button
            type="button"
            style={actionButton}
            onClick={() => cacheInfo.mutate()}
            disabled={cacheInfo.isPending}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <IconFileBarChart size={14} />
            {cacheInfo.isPending ? 'Consultando...' : 'Cache Info'}
          </button>
        </div>

        {reboot.isSuccess && <div style={successStyle}>Servidor reiniciado correctamente</div>}
        {gc.isSuccess && <div style={successStyle}>Garbage collection ejecutado</div>}
        {cacheInfo.isSuccess && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(15, 23, 42, 0.03)', fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#64748b' }}>
            {String(cacheInfo.data ?? 'Sin datos')}
          </div>
        )}
        {(reboot.error || gc.error || cacheInfo.error) && (
          <div style={errorStyle}>
            {(reboot.error as Error)?.message ?? (gc.error as Error)?.message ?? (cacheInfo.error as Error)?.message ?? 'Error en la acción'}
          </div>
        )}
      </div>

      {/* Feedback + Save */}
      {updateServer.error && (
        <div style={errorStyle}>
          {(updateServer.error as Error)?.message ?? 'Error al guardar la configuración'}
        </div>
      )}
      {saved && (
        <div style={successStyle}>
          Configuración guardada correctamente
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button
          type="submit"
          style={saveButton}
          disabled={isPending}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5558e0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
        >
          <IconCheck size={14} />
          {isPending ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </form>
  );
}
