import { useState, useCallback, useMemo, type CSSProperties } from 'react';
import { AlertTypeSelect } from './AlertTypeSelect';
import { AlertConfig } from './AlertConfig';
import { AlertDeviceSelect } from './AlertDeviceSelect';
import { AlertChannels } from './AlertChannels';
import { useCreateNotification } from '@features/notifications/hooks/useNotifications';
import { useLinkNotification } from '@features/notifications/hooks/useLinkNotification';
import type { AlertWizardConfig } from '@shared/lib/alert-types';
import { hasConfigRequirements, getAlertConfig, validateAlertConfig, NOTIFICATOR_LABELS } from '@shared/lib/alert-types';
import { alertsDebug, alertsWarn } from '@shared/lib/debug';
import { IconArrowLeft, IconCheck } from '@shared/ui/icons';

interface AlertWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  standalone?: boolean;
}

// ─── Overlay & Card ───────────────────────────────────────────────
const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(2, 6, 23, 0.6)',
  backdropFilter: 'blur(8px)',
  animation: 'wizardFadeIn 0.2s ease-out',
};

const cardStyle: CSSProperties = {
  width: '520px',
  maxWidth: '92vw',
  maxHeight: '88vh',
  overflowY: 'auto',
  borderRadius: '1.5rem',
  backgroundColor: '#fff',
  border: '1px solid rgba(15, 23, 42, 0.06)',
  boxShadow:
    '0 0 0 1px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.08), 0 24px 60px rgba(0,0,0,0.12)',
  padding: '0',
  animation: 'wizardSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  position: 'relative',
};

// ─── Step Indicator ───────────────────────────────────────────────
const stepIndicatorStyle = (isActive: boolean, isCompleted: boolean, accentColor: string): CSSProperties => ({
  width: '2.25rem',
  height: '2.25rem',
  borderRadius: '9999px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 700,
  fontFamily: "'Inter', system-ui, sans-serif",
  backgroundColor: isCompleted
    ? accentColor
    : isActive
      ? accentColor
      : 'rgba(15, 23, 42, 0.04)',
  color: isCompleted || isActive ? '#fff' : '#94a3b8',
  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: isActive ? `0 0 0 4px ${accentColor}20` : 'none',
  transform: isActive ? 'scale(1.05)' : 'scale(1)',
});

const stepLineStyle = (isCompleted: boolean, accentColor: string): CSSProperties => ({
  flex: 1,
  height: '2px',
  backgroundColor: isCompleted ? accentColor : 'rgba(15, 23, 42, 0.06)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  borderRadius: '1px',
});

const stepLabelStyle = (isActive: boolean): CSSProperties => ({
  fontSize: '0.625rem',
  color: isActive ? '#0f172a' : '#94a3b8',
  fontWeight: isActive ? 700 : 500,
  fontFamily: "'Inter', system-ui, sans-serif",
  textAlign: 'center',
  marginTop: '0.375rem',
  transition: 'color 0.3s',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
});

// ─── Typography ───────────────────────────────────────────────────
const headerStyle: CSSProperties = {
  padding: '1.75rem 2rem 0',
};

const titleStyle: CSSProperties = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#0f172a',
  margin: '0 0 0.25rem 0',
  letterSpacing: '-0.02em',
};

const subtitleStyle: CSSProperties = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: '0.8125rem',
  color: '#64748b',
  margin: '0 0 1.25rem 0',
  lineHeight: 1.5,
};

// ─── Content Area ─────────────────────────────────────────────────
const contentStyle: CSSProperties = {
  padding: '0 2rem 1.5rem',
};

// ─── Buttons ──────────────────────────────────────────────────────
const buttonBase: CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: '0.75rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  fontFamily: "'Inter', system-ui, sans-serif",
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  border: 'none',
  letterSpacing: '-0.01em',
};

const cancelButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: 'transparent',
  color: '#64748b',
};

const backButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: 'rgba(15, 23, 42, 0.04)',
  color: '#475569',
  border: '1px solid rgba(15, 23, 42, 0.06)',
};

const nextButton = (accentColor: string): CSSProperties => ({
  ...buttonBase,
  backgroundColor: accentColor,
  color: '#fff',
  boxShadow: `0 2px 8px ${accentColor}30`,
});

const confirmButton = (accentColor: string): CSSProperties => ({
  ...buttonBase,
  backgroundColor: accentColor,
  color: '#fff',
  boxShadow: `0 2px 12px ${accentColor}40`,
  minWidth: '9rem',
});

// ─── Error ────────────────────────────────────────────────────────
const errorStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  backgroundColor: 'rgba(239, 68, 68, 0.06)',
  border: '1px solid rgba(239, 68, 68, 0.12)',
  color: '#dc2626',
  fontSize: '0.8125rem',
  marginBottom: '1rem',
  fontFamily: "'Inter', system-ui, sans-serif",
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

// ─── Footer ───────────────────────────────────────────────────────
const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem 2rem 1.5rem',
  borderTop: '1px solid rgba(15, 23, 42, 0.05)',
  gap: '0.75rem',
};

// ─── Success Overlay ──────────────────────────────────────────────
const successOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  borderRadius: '1.5rem',
  animation: 'wizardFadeIn 0.2s ease-out',
};

const successRingStyle = (accentColor: string): CSSProperties => ({
  width: '4.5rem',
  height: '4.5rem',
  borderRadius: '50%',
  backgroundColor: `${accentColor}12`,
  border: `3px solid ${accentColor}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'successPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
});

type StepKey = 'type' | 'config' | 'devices' | 'channels' | 'confirm';

const initialConfig: AlertWizardConfig = {
  type: '',
  deviceIds: [],
  notificators: ['web'],
  always: true,
};

export function AlertWizard({ open, onClose, onSuccess }: AlertWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<AlertWizardConfig>(initialConfig);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const createNotification = useCreateNotification();
  const linkNotification = useLinkNotification();

  const needsConfig = useMemo(() => hasConfigRequirements(config.type), [config.type]);
  const stepKeys: StepKey[] = needsConfig
    ? ['type', 'config', 'devices', 'channels', 'confirm']
    : ['type', 'devices', 'channels', 'confirm'];
  const totalSteps = stepKeys.length;

  const stepLabels: { key: StepKey; label: string }[] = needsConfig
    ? [
        { key: 'type', label: 'Tipo' },
        { key: 'config', label: 'Config' },
        { key: 'devices', label: 'Equipos' },
        { key: 'channels', label: 'Canales' },
        { key: 'confirm', label: 'Listo' },
      ]
    : [
        { key: 'type', label: 'Tipo' },
        { key: 'devices', label: 'Equipos' },
        { key: 'channels', label: 'Canales' },
        { key: 'confirm', label: 'Listo' },
      ];

  const currentStepKey = stepKeys[step - 1] as StepKey;

  // Accent color derived from selected type
  const typeConfig = getAlertConfig(config.type);
  const accentColor = config.type ? typeConfig.color : '#6366f1';

  const handleTypeSelect = (type: string) => {
    setConfig((prev) => ({ ...prev, type }));
    setStep(2);
    setError(null);
  };

  const handleConfigChange = (partial: Partial<AlertWizardConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const handleNext = () => {
    setError(null);

    if (currentStepKey === 'config') {
      const error = validateAlertConfig(config.type, config);
      if (error) { setError(error); return; }
    }

    if (currentStepKey === 'devices') {
      if (config.deviceIds.length === 0) { setError('Selecciona al menos un dispositivo'); return; }
    }

    if (currentStepKey === 'channels') {
      if (config.notificators.length === 0) { setError('Selecciona al menos un canal de notificación'); return; }
    }

    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleConfirm = useCallback(async () => {
    if (config.deviceIds.length === 0) { setError('Selecciona al menos un dispositivo'); return; }

    try {
      setError(null);
      alertsDebug('wizard', 'starting alert creation flow', {
        type: config.type,
        deviceIds: config.deviceIds,
        geofenceId: config.geofenceId,
      });

      const attributes: Record<string, unknown> = {};
      if (config.speedLimit) attributes.speedLimit = config.speedLimit;
      if (config.alarmSubtype) attributes.alarmType = config.alarmSubtype;

      const result = await createNotification.mutateAsync({
        type: config.type,
        notificators: config.notificators.join(','),
        always: config.always,
        attributes,
      } as any);
      alertsDebug('wizard', 'notification created from wizard', { id: result?.id, type: result?.type });

      if (result?.id) {
        await linkNotification.mutateAsync({
          notificationId: result.id,
          deviceIds: config.deviceIds,
          geofenceId: config.geofenceId,
          maintenanceId: config.maintenanceId,
          driverId: config.driverId,
          calendarId: config.calendarId,
          commandId: config.commandId,
        });
        alertsDebug('wizard', 'notification linked to entities', {
          notificationId: result.id,
          devices: config.deviceIds.length,
        });
      }

      setShowSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        onClose();
        setStep(1);
        setConfig(initialConfig);
        setShowSuccess(false);
      }, 2000);
    } catch (err: any) {
      alertsWarn('wizard', 'alert creation failed', err);
      setError(err?.message ?? 'Error al crear la alerta. Intenta de nuevo.');
    }
  }, [config, createNotification, linkNotification, onClose, onSuccess]);

  const isLoading = createNotification.isPending || linkNotification.isPending;

  if (!open) return null;

  const isLastStep = step === totalSteps;
  const isConfirmStep = currentStepKey === 'confirm';
  const hasNextStep = !isLastStep;

  // Build confirmation summary items
  const summaryItems: { label: string; value: string }[] = [];
  summaryItems.push({ label: 'Tipo', value: typeConfig.label || config.type });
  if (config.geofenceId) summaryItems.push({ label: 'Geozona ID', value: String(config.geofenceId) });
  if (config.speedLimit) summaryItems.push({ label: 'Límite velocidad', value: `${config.speedLimit} kn` });
  if (config.alarmSubtype) summaryItems.push({ label: 'Alarma', value: config.alarmSubtype });
  summaryItems.push({ label: 'Dispositivos', value: `${config.deviceIds.length} seleccionado(s)` });
  summaryItems.push({
    label: 'Canales',
    value: config.notificators.map((n) => NOTIFICATOR_LABELS[n] ?? n).join(', ') || 'Web',
  });
  summaryItems.push({ label: 'Modo', value: config.always ? 'Siempre activo' : 'Programado' });

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={cardStyle}>
        {/* Success overlay */}
        {showSuccess && (
          <div style={successOverlayStyle}>
            <div style={successRingStyle(accentColor)}>
              <IconCheck size={28} color={accentColor} />
            </div>
            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Alerta creada
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b', fontFamily: "'Inter', system-ui, sans-serif" }}>
              La notificación se configuró correctamente
            </div>
          </div>
        )}

        {/* Header */}
        <div style={headerStyle}>
          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem', marginBottom: '1.5rem' }}>
            {stepLabels.map((s, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < stepLabels.length - 1 ? 1 : undefined }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={stepIndicatorStyle(isActive, isCompleted, accentColor)}>
                      {isCompleted ? <IconCheck size={14} color="#fff" /> : stepNum}
                    </div>
                    <span style={stepLabelStyle(isActive)}>{s.label}</span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 0.25rem', marginBottom: '1.25rem' }}>
                      <div style={stepLineStyle(isCompleted, accentColor)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <h2 style={titleStyle}>
            {currentStepKey === 'type' && 'Qué querés monitorear?'}
            {currentStepKey === 'config' && 'Configuración'}
            {currentStepKey === 'devices' && 'A qué equipos aplica?'}
            {currentStepKey === 'channels' && 'Cómo te notificamos?'}
            {currentStepKey === 'confirm' && 'Revisá y confirmá'}
          </h2>
          <p style={subtitleStyle}>
            {currentStepKey === 'type' && 'Elegí el tipo de evento que querés rastrear'}
            {currentStepKey === 'config' && 'Ajustá los parámetros de la alerta'}
            {currentStepKey === 'devices' && 'Seleccioná los dispositivos que dispararán esta alerta'}
            {currentStepKey === 'channels' && 'Elegí por dónde recibir las notificaciones'}
            {currentStepKey === 'confirm' && 'Verificá que todo esté correcto antes de crear'}
          </p>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {error && (
            <div style={errorStyle}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11" r="0.75" fill="currentColor" />
              </svg>
              {error}
            </div>
          )}

          {currentStepKey === 'type' && (
            <AlertTypeSelect onSelect={handleTypeSelect} />
          )}

          {currentStepKey === 'config' && (
            <AlertConfig type={config.type} config={config} onChange={handleConfigChange} />
          )}

          {currentStepKey === 'devices' && (
            <AlertDeviceSelect
              selectedDeviceIds={config.deviceIds}
              onChange={(ids) => {
                setConfig((prev) => ({ ...prev, deviceIds: ids }));
                setError(null);
              }}
            />
          )}

          {currentStepKey === 'channels' && (
            <AlertChannels
              selectedChannels={config.notificators}
              always={config.always}
              onChannelsChange={(channels) => {
                setConfig((prev) => ({ ...prev, notificators: channels }));
                setError(null);
              }}
              onAlwaysChange={(always) => {
                setConfig((prev) => ({ ...prev, always }));
              }}
            />
          )}

          {currentStepKey === 'confirm' && (
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.02)',
              borderRadius: '1rem',
              border: '1px solid rgba(15, 23, 42, 0.05)',
              overflow: 'hidden',
            }}>
              {summaryItems.map((item, i) => (
                <div key={item.label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1.25rem',
                  borderBottom: i < summaryItems.length - 1 ? '1px solid rgba(15, 23, 42, 0.05)' : 'none',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: '0.8125rem', color: '#0f172a', fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <div>
            {step > 1 && (
              <button
                style={backButton}
                onClick={() => { setStep(step - 1); setError(null); }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                <IconArrowLeft size={14} />
                Atrás
              </button>
            )}
          </div>

          <button
            style={cancelButton}
            onClick={() => { setStep(1); setConfig(initialConfig); setError(null); onClose(); }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
          >
            Cancelar
          </button>

          <div>
            {hasNextStep && !isConfirmStep && (
              <button
                style={nextButton(accentColor)}
                onClick={handleNext}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.92)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
              >
                Siguiente
              </button>
            )}
            {isConfirmStep && (
              <button
                style={confirmButton(accentColor)}
                onClick={handleConfirm}
                disabled={isLoading}
                onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.filter = 'brightness(0.92)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
              >
                {isLoading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
                    </svg>
                    Creando...
                  </>
                ) : (
                  <>
                    <IconCheck size={14} />
                    Crear Alerta
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wizardFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes wizardSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes successPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
