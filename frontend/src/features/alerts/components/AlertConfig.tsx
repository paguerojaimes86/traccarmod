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

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'Outfit',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#0f172a',
  marginBottom: '0.5rem',
};

const selectStyle: CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.875rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: '#0f172a',
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  outline: 'none',
  cursor: 'pointer',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.875rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: '#0f172a',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const helperTextStyle: CSSProperties = {
  fontSize: '0.6875rem',
  color: '#94a3b8',
  marginTop: '0.375rem',
};

const sectionStyle: CSSProperties = {
  marginBottom: '1.5rem',
};

const noConfigStyle: CSSProperties = {
  textAlign: 'center' as const,
  padding: '2rem 1rem',
  color: '#64748b',
  fontSize: '0.875rem',
};

export function AlertConfig({ type, config, onChange }: AlertConfigProps) {
  const { data: geofences = [] } = useGeofences();
  const { speedUnit } = useUnitConversion();
  const typeConfig = ALERT_TYPE_CONFIG[type];
  const requirements = typeConfig?.configRequirements ?? {};

  // If no config requirements, show message
  if (!hasConfigRequirements(type)) {
    return (
      <div style={noConfigStyle}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
          {typeConfig?.icon ?? '✅'}
        </div>
        <div style={{ fontFamily: 'Outfit', fontWeight: 600, marginBottom: '0.25rem' }}>
          Sin configuración adicional
        </div>
        <div style={{ fontSize: '0.75rem' }}>
          Esta alerta se activará automáticamente para los dispositivos seleccionados
        </div>
      </div>
    );
  }

  return (
    <div>
      {requirements.needsGeofence && (
        <div style={sectionStyle}>
          <label style={labelStyle}>Geozona</label>
          <select
            style={selectStyle}
            value={config.geofenceId ?? ''}
            onChange={(e) => onChange({ geofenceId: Number(e.target.value) || undefined })}
          >
            <option value="">Seleccionar geozona...</option>
            {geofences.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <p style={helperTextStyle}>
            Se notificará cuando un dispositivo {type === 'geofenceEnter' ? 'entre' : 'salga'} de la geozona seleccionada
          </p>
        </div>
      )}

      {requirements.needsSpeedLimit && (
        <div style={sectionStyle}>
          <label style={labelStyle}>Límite de Velocidad (km/h)</label>
          <input
            type="number"
            style={inputStyle}
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
            min={1}
            max={500}
          />
          <p style={helperTextStyle}>Velocidad máxima permitida</p>
        </div>
      )}

      {requirements.needsAlarmSubtype && (
        <div style={sectionStyle}>
          <label style={labelStyle}>Subtipo de Alarma</label>
          <select
            style={selectStyle}
            value={config.alarmSubtype ?? ''}
            onChange={(e) => onChange({ alarmSubtype: e.target.value || undefined })}
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
        <div style={sectionStyle}>
          <label style={labelStyle}>Mantenimiento</label>
          <select style={selectStyle} value="">
            <option value="">Próximamente...</option>
          </select>
          <p style={helperTextStyle}>La configuración de mantenimiento estará disponible pronto</p>
        </div>
      )}

      {requirements.needsDriverId && (
        <div style={sectionStyle}>
          <label style={labelStyle}>Conductor</label>
          <select style={selectStyle} value="">
            <option value="">Próximamente...</option>
          </select>
          <p style={helperTextStyle}>La selección de conductores estará disponible pronto</p>
        </div>
      )}

      {requirements.needsCommandId && (
        <div style={sectionStyle}>
          <label style={labelStyle}>Comando</label>
          <select style={selectStyle} value="">
            <option value="">Próximamente...</option>
          </select>
          <p style={helperTextStyle}>La selección de comandos estará disponible pronto</p>
        </div>
      )}
    </div>
  );
}
