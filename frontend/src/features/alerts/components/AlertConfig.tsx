import { type CSSProperties } from 'react';
import type { AlertWizardConfig } from '@shared/lib/alert-types';
import { ALERT_TYPE_CONFIG, ALARM_SUBTYPES, hasConfigRequirements } from '@shared/lib/alert-types';
import { useGeofences } from '@features/geofences/hooks/useGeofences';
import { useUnitConversion } from '@shared/hooks/useUnitConversion';

interface AlertConfigProps {
  type: string;
  config: AlertWizardConfig;
  onChange: (config: Partial<AlertWizardConfig>) => void;
}

// ─── Form Field ───────────────────────────────────────────────────
const fieldGroupStyle: CSSProperties = {
  marginBottom: '1.25rem',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#334155',
  marginBottom: '0.375rem',
  letterSpacing: '-0.01em',
};

const sharedInputStyle: CSSProperties = {
  width: '100%',
  padding: '0.7rem 1rem',
  borderRadius: '0.75rem',
  border: '1.5px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(15, 23, 42, 0.02)',
  color: '#0f172a',
  fontSize: '0.875rem',
  fontFamily: "'Inter', system-ui, sans-serif",
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box' as const,
};

const helperTextStyle: CSSProperties = {
  fontSize: '0.6875rem',
  color: '#94a3b8',
  marginTop: '0.375rem',
  fontFamily: "'Inter', system-ui, sans-serif",
  lineHeight: 1.4,
};

// ─── No-config State ──────────────────────────────────────────────
const noConfigStyle: CSSProperties = {
  textAlign: 'center' as const,
  padding: '2rem 1rem',
};

const noConfigIconStyle: CSSProperties = {
  fontSize: '2.5rem',
  marginBottom: '0.75rem',
};

const noConfigTitleStyle: CSSProperties = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontWeight: 600,
  fontSize: '0.9375rem',
  color: '#0f172a',
  marginBottom: '0.25rem',
  letterSpacing: '-0.01em',
};

const noConfigDescStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: '#64748b',
  fontFamily: "'Inter', system-ui, sans-serif",
  lineHeight: 1.5,
};

// ─── Info Banner ──────────────────────────────────────────────────
const comingSoonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1rem 1.25rem',
  borderRadius: '0.875rem',
  backgroundColor: 'rgba(245, 158, 11, 0.06)',
  border: '1px solid rgba(245, 158, 11, 0.12)',
};

const comingSoonIconStyle: CSSProperties = {
  fontSize: '1.25rem',
  flexShrink: 0,
};

const comingSoonTextStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: '#92400e',
  fontFamily: "'Inter', system-ui, sans-serif",
  lineHeight: 1.4,
};

export function AlertConfig({ type, config, onChange }: AlertConfigProps) {
  const { data: geofences = [] } = useGeofences();
  const { speedUnit } = useUnitConversion();
  const speedLabel = speedUnit === 'kmh' ? 'km/h' : speedUnit === 'mph' ? 'mph' : 'kn';
  const typeConfig = ALERT_TYPE_CONFIG[type];
  const requirements = typeConfig?.configRequirements ?? {};

  if (!hasConfigRequirements(type)) {
    return (
      <div style={noConfigStyle}>
        <div style={noConfigIconStyle}>{typeConfig?.icon ?? '✅'}</div>
        <div style={noConfigTitleStyle}>Sin configuración adicional</div>
        <div style={noConfigDescStyle}>
          Esta alerta se activará automáticamente para los dispositivos seleccionados
        </div>
      </div>
    );
  }

  return (
    <div>
      {(requirements.needsGeofence || type === 'deviceOverspeed') && (
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Geozona</label>
          <select
            style={sharedInputStyle}
            value={config.geofenceId ?? ''}
            onChange={(e) => onChange({ geofenceId: Number(e.target.value) || undefined })}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.08)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)';
              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="">(Sin geozona — aplica en cualquier lado)</option>
            {geofences.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <p style={helperTextStyle}>
            {type === 'deviceOverspeed'
              ? 'Opcional: seleccioná una geozona para restringir la alerta. Si no elegís ninguna, aplica en cualquier ubicación.'
              : `Se notificará cuando un dispositivo ${type === 'geofenceEnter' ? 'entre' : 'salga'} de la geozona seleccionada`
            }
          </p>
        </div>
      )}

      {requirements.needsSpeedLimit && (
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Límite de Velocidad ({speedLabel})</label>
          <input
            type="number"
            style={sharedInputStyle}
            placeholder="Ej: 80"
            value={config.speedLimit ? Math.round(config.speedLimit * (speedUnit === 'kmh' ? 1.852 : 1.15078)) : ''}
            onChange={(e) => {
              const displayValue = Number(e.target.value);
              if (!displayValue || displayValue <= 0) {
                onChange({ speedLimit: undefined });
                return;
              }
              const knotsValue = displayValue / (speedUnit === 'kmh' ? 1.852 : 1.15078);
              onChange({ speedLimit: Math.round(knotsValue * 10) / 10 });
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.08)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)';
              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            min={1}
            max={500}
          />
          <p style={helperTextStyle}>Velocidad máxima permitida antes de disparar la alerta</p>
        </div>
      )}

      {requirements.needsAlarmSubtype && (
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Subtipo de Alarma</label>
          <select
            style={sharedInputStyle}
            value={config.alarmSubtype ?? ''}
            onChange={(e) => onChange({ alarmSubtype: e.target.value || undefined })}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.08)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)';
              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="">Seleccionar subtipo...</option>
            {ALARM_SUBTYPES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <p style={helperTextStyle}>Tipo específico de alarma reportada por el dispositivo</p>
        </div>
      )}

      {requirements.needsMaintenanceId && (
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Mantenimiento</label>
          <div style={comingSoonStyle}>
            <span style={comingSoonIconStyle}>🔧</span>
            <span style={comingSoonTextStyle}>La configuración de mantenimiento estará disponible pronto</span>
          </div>
        </div>
      )}

      {requirements.needsDriverId && (
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Conductor</label>
          <div style={comingSoonStyle}>
            <span style={comingSoonIconStyle}>👤</span>
            <span style={comingSoonTextStyle}>La selección de conductores estará disponible pronto</span>
          </div>
        </div>
      )}

      {requirements.needsCommandId && (
        <div style={fieldGroupStyle}>
          <label style={labelStyle}>Comando</label>
          <div style={comingSoonStyle}>
            <span style={comingSoonIconStyle}>💻</span>
            <span style={comingSoonTextStyle}>La selección de comandos estará disponible pronto</span>
          </div>
        </div>
      )}
    </div>
  );
}
