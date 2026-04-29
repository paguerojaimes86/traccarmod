import { useState, useCallback, useMemo, type CSSProperties } from 'react';
import { AlertTypeSelect } from './AlertTypeSelect';
import { AlertConfig } from './AlertConfig';
import { AlertDeviceSelect } from './AlertDeviceSelect';
import { useCreateNotification } from '@features/notifications/hooks/useNotifications';
import { useLinkNotification } from '@features/notifications/hooks/useLinkNotification';
import type { AlertWizardConfig } from '@shared/lib/alert-types';
import { hasConfigRequirements } from '@shared/lib/alert-types';
import { alertsDebug, alertsWarn } from '@shared/lib/debug';
import { IconArrowLeft, IconCheck } from '@shared/ui/icons';

interface AlertWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** When true, the wizard runs in standalone mode (outside DashboardPage context).
   *  Currently a no-op prop reserved for future extensibility. */
  standalone?: boolean;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  backdropFilter: 'blur(4px)',
};

const cardStyle: CSSProperties = {
  width: '480px',
  maxWidth: '90vw',
  maxHeight: '85vh',
  overflowY: 'auto',
  borderRadius: '1.25rem',
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(15, 23, 42, 0.06)',
  boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
  padding: '2rem',
};

const stepIndicatorStyle = (isActive: boolean, isCompleted: boolean): CSSProperties => ({
  width: '2rem',
  height: '2rem',
  borderRadius: '9999px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 700,
  fontFamily: 'Outfit',
  backgroundColor: isCompleted
    ? '#10b981'
    : isActive
      ? '#6366f1'
      : 'rgba(15, 23, 42, 0.06)',
  color: isCompleted || isActive ? '#fff' : '#94a3b8',
  transition: 'all 0.3s',
});

const stepLineStyle = (isCompleted: boolean): CSSProperties => ({
  flex: 1,
  height: '2px',
  backgroundColor: isCompleted ? '#10b981' : 'rgba(15, 23, 42, 0.08)',
  transition: 'background-color 0.3s',
});

const stepLabelStyle = (isActive: boolean): CSSProperties => ({
  fontSize: '0.625rem',
  color: isActive ? '#6366f1' : '#94a3b8',
  fontWeight: 600,
  fontFamily: 'Outfit',
  textAlign: 'center',
  marginTop: '0.25rem',
});

const titleStyle: CSSProperties = {
  fontFamily: 'Outfit',
  fontSize: '1.125rem',
  fontWeight: 700,
  color: '#0f172a',
  margin: '0 0 1.5rem 0',
};

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

const cancelButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: 'rgba(15, 23, 42, 0.04)',
  color: '#64748b',
  border: '1px solid rgba(15, 23, 42, 0.08)',
};

const backButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: 'rgba(15, 23, 42, 0.04)',
  color: '#475569',
  border: '1px solid rgba(15, 23, 42, 0.08)',
};

const nextButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: '#6366f1',
  color: '#fff',
  border: 'none',
};

const confirmButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: '#10b981',
  color: '#fff',
  border: 'none',
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

type StepKey = 'type' | 'config' | 'devices' | 'confirm';

const initialConfig: AlertWizardConfig = {
  type: '',
  deviceIds: [],
};

export function AlertWizard({ open, onClose, onSuccess, standalone }: AlertWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<AlertWizardConfig>(initialConfig);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const createNotification = useCreateNotification();
  const linkNotification = useLinkNotification();

  // Dynamic step flow based on selected type
  const needsConfig = useMemo(() => hasConfigRequirements(config.type), [config.type]);
  const stepKeys: StepKey[] = needsConfig
    ? ['type', 'config', 'devices', 'confirm']
    : ['type', 'devices', 'confirm'];
  const totalSteps = stepKeys.length;

  const stepLabels: { key: StepKey; label: string }[] = needsConfig
    ? [
        { key: 'type', label: 'Tipo' },
        { key: 'config', label: 'Config' },
        { key: 'devices', label: 'Dispositivos' },
        { key: 'confirm', label: 'Confirmar' },
      ]
    : [
        { key: 'type', label: 'Tipo' },
        { key: 'devices', label: 'Dispositivos' },
        { key: 'confirm', label: 'Confirmar' },
      ];

  const currentStepKey = stepKeys[step - 1] as StepKey;

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
      // Validate config requirements
      const req = config.type;
      if (req === 'geofenceEnter' || req === 'geofenceExit') {
        if (!config.geofenceId) {
          setError('Selecciona una geozona');
          return;
        }
      }
      if (req === 'deviceOverspeed') {
        if (!config.speedLimit) {
          setError('Ingresa un límite de velocidad');
          return;
        }
      }
      if (req === 'alarm') {
        if (!config.alarmSubtype) {
          setError('Selecciona un subtipo de alarma');
          return;
        }
      }
      if (req === 'maintenance') {
        if (!config.maintenanceId) {
          setError('Selecciona un mantenimiento');
          return;
        }
      }
      if (req === 'driverChanged') {
        if (!config.driverId) {
          setError('Selecciona un conductor');
          return;
        }
      }
      if (req === 'commandResult') {
        if (!config.commandId) {
          setError('Selecciona un comando');
          return;
        }
      }
    }

    if (currentStepKey === 'devices') {
      if (config.deviceIds.length === 0) {
        setError('Selecciona al menos un dispositivo');
        return;
      }
    }

    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleConfirm = useCallback(async () => {
    if (config.deviceIds.length === 0) {
      setError('Selecciona al menos un dispositivo');
      return;
    }

    try {
      setError(null);
      alertsDebug('wizard', 'starting alert creation flow', {
        type: config.type,
        deviceIds: config.deviceIds,
        geofenceId: config.geofenceId,
      });

      const attributes: Record<string, unknown> = {};
      if (config.speedLimit) {
        attributes.speedLimit = config.speedLimit;
      }
      if (config.alarmSubtype) {
        attributes.alarmType = config.alarmSubtype;
      }

      const result = await createNotification.mutateAsync({
        type: config.type,
        notificators: 'web',
        always: true,
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

  const successOverlayStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: '1.25rem',
  };

  const successCheckStyle: CSSProperties = {
    width: '4rem',
    height: '4rem',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  // Determine which step shows the confirm button
  const isLastStep = step === totalSteps;
  const isConfirmStep = currentStepKey === 'confirm';
  const hasNextStep = !isLastStep;

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...cardStyle, position: 'relative' }}>
        {/* Success overlay */}
        {showSuccess && (
          <div style={successOverlayStyle}>
            <div style={successCheckStyle}>
              <IconCheck size={32} color="#fff" />
            </div>
            <div style={{ fontFamily: 'Outfit', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
              Alerta creada
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              La notificación se configuró correctamente
            </div>
          </div>
        )}
        {/* Step indicator — dynamic based on type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {stepLabels.map((s, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < stepLabels.length - 1 ? 1 : undefined }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={stepIndicatorStyle(isActive, isCompleted)}>
                    {isCompleted ? <IconCheck size={12} color="#fff" /> : stepNum}
                  </div>
                  <span style={stepLabelStyle(isActive)}>{s.label}</span>
                </div>
                {i < stepLabels.length - 1 && <div style={stepLineStyle(isCompleted)} />}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        {currentStepKey === 'type' && (
          <>
            <h2 style={titleStyle}>Tipo de Alerta</h2>
            <AlertTypeSelect onSelect={handleTypeSelect} />
          </>
        )}

        {currentStepKey === 'config' && (
          <>
            <h2 style={titleStyle}>Configuración</h2>
            {error && <div style={errorStyle}>{error}</div>}
            <AlertConfig type={config.type} config={config} onChange={handleConfigChange} />
          </>
        )}

        {currentStepKey === 'devices' && (
          <>
            <h2 style={titleStyle}>Seleccionar Dispositivos</h2>
            {error && <div style={errorStyle}>{error}</div>}
            <AlertDeviceSelect
              selectedDeviceIds={config.deviceIds}
              onChange={(ids) => {
                setConfig((prev) => ({ ...prev, deviceIds: ids }));
                setError(null);
              }}
            />
          </>
        )}

        {currentStepKey === 'confirm' && (
          <>
            <h2 style={titleStyle}>Confirmar</h2>
            {error && <div style={errorStyle}>{error}</div>}
            <div style={{ fontFamily: 'Outfit', fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 0.75rem' }}>
                Estás por crear una alerta de tipo <strong>{config.type}</strong> para{' '}
                <strong>{config.deviceIds.length} dispositivo(s)</strong>.
              </p>
              {config.geofenceId && <p style={{ margin: '0 0 0.5rem' }}>Geozona: {config.geofenceId}</p>}
              {config.speedLimit && <p style={{ margin: '0 0 0.5rem' }}>Límite: {config.speedLimit} knots</p>}
              {config.alarmSubtype && <p style={{ margin: '0 0 0.5rem' }}>Alarma: {config.alarmSubtype}</p>}
            </div>
          </>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', gap: '0.75rem' }}>
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
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            Cancelar
          </button>

          <div>
            {hasNextStep && !isConfirmStep && (
              <button
                style={nextButton}
                onClick={handleNext}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5558e0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                Siguiente
              </button>
            )}
            {isConfirmStep && (
              <button
                style={confirmButton}
                onClick={handleConfirm}
                disabled={isLoading}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0ea472'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                <IconCheck size={14} />
                {isLoading ? 'Creando...' : 'Crear Alerta'}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
      `}</style>
    </div>
  );
}
