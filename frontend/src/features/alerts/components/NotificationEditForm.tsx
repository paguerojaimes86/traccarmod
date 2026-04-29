import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { useUpdateNotification } from '@features/notifications/hooks/useNotifications';
import { useLinkNotification } from '@features/notifications/hooks/useLinkNotification';
import { useUnlinkNotification } from '@features/notifications/hooks/useUnlinkNotification';
import { useLinkedDeviceIds, useInvalidateLinkedDevices } from '@features/notifications/hooks/useLinkedDeviceIds';
import { useDevices } from '@features/devices/hooks/useDevices';
import { getAlertConfig, ALERT_TYPE_CONFIG, ALARM_SUBTYPES } from '@shared/lib/alert-types';
import { IconClose } from '@shared/ui/icons';
import type { Notification } from '@shared/api/types.models';

interface NotificationEditFormProps {
  open: boolean;
  notification: Notification | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const NOTIFICATOR_OPTIONS = [
  { key: 'web', label: 'Web' },
  { key: 'mail', label: 'Email' },
  { key: 'sms', label: 'SMS' },
] as const;

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
  width: '520px',
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

const titleStyle: CSSProperties = {
  fontFamily: 'Outfit',
  fontSize: '1.125rem',
  fontWeight: 700,
  color: '#0f172a',
  margin: '0 0 1.5rem 0',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'Outfit',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#0f172a',
  marginBottom: '0.5rem',
};

const sectionStyle: CSSProperties = {
  marginBottom: '1.25rem',
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
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical',
  fontFamily: 'inherit',
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
  boxSizing: 'border-box',
};

const buttonBase: CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: '0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  fontFamily: 'Outfit',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'inline-flex',
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

const saveButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: '#6366f1',
  color: '#fff',
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

const pillStyle = (color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.375rem 0.875rem',
  borderRadius: '2rem',
  backgroundColor: `${color}18`,
  color,
  fontSize: '0.75rem',
  fontWeight: 700,
  border: `1px solid ${color}30`,
});

const toggleTrackStyle = (active: boolean): CSSProperties => ({
  width: '36px',
  height: '20px',
  borderRadius: '10px',
  backgroundColor: active ? '#10b981' : '#d1d5db',
  position: 'relative',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  border: 'none',
  padding: 0,
  flexShrink: 0,
});

const toggleThumbStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  backgroundColor: '#fff',
  position: 'absolute',
  top: '2px',
  left: '2px',
  transition: 'transform 0.2s',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const checkboxStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.625rem 0.875rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(15, 23, 42, 0.02)',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const deviceChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.375rem 0.75rem',
  borderRadius: '2rem',
  backgroundColor: 'rgba(99, 102, 241, 0.08)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#6366f1',
  fontFamily: 'Outfit',
};

const removeDeviceBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0',
  borderRadius: '50%',
  width: '18px',
  height: '18px',
  border: 'none',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: '#ef4444',
  cursor: 'pointer',
  fontSize: '0.625rem',
  lineHeight: 1,
  transition: 'all 0.2s',
  flexShrink: 0,
};

const searchInputStyle: CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  borderRadius: '0.625rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(15, 23, 42, 0.02)',
  color: '#0f172a',
  fontSize: '0.8125rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Outfit, system-ui, sans-serif',
  marginBottom: '0.5rem',
};

const addDeviceBtn: CSSProperties = {
  ...buttonBase,
  padding: '0.375rem 0.75rem',
  fontSize: '0.7rem',
  backgroundColor: 'rgba(16, 185, 129, 0.08)',
  color: '#10b981',
  border: '1px solid rgba(16, 185, 129, 0.2)',
  borderRadius: '2rem',
};

const deviceListItem: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.5rem 0.75rem',
  borderRadius: '0.625rem',
  transition: 'background-color 0.2s',
  cursor: 'pointer',
};

export function NotificationEditForm({ open, notification, onClose, onSuccess }: NotificationEditFormProps) {
  const updateNotification = useUpdateNotification();
  const linkNotification = useLinkNotification();
  const unlinkNotification = useUnlinkNotification();
  const invalidateLinked = useInvalidateLinkedDevices();
  const { data: linkedDeviceIds = [], isLoading: isLoadingLinked } = useLinkedDeviceIds(notification?.id);
  const { data: allDevices = [] } = useDevices();

  const [notificators, setNotificators] = useState<string[]>([]);
  const [always, setAlways] = useState(true);
  const [description, setDescription] = useState('');
  const [speedLimit, setSpeedLimit] = useState<string>('');
  const [alarmSubtype, setAlarmSubtype] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [showDeviceList, setShowDeviceList] = useState(false);

  // Reset form when notification changes
  useEffect(() => {
    if (notification) {
      const notifArray = (notification.notificators ?? '').split(',').filter(Boolean);
      setNotificators(notifArray.length > 0 ? notifArray : ['web']);
      setAlways(notification.always ?? true);
      setDescription(notification.description ?? '');
      const attrs = (notification.attributes ?? {}) as Record<string, unknown>;
      setSpeedLimit(attrs.speedLimit != null ? String(attrs.speedLimit) : '');
      setAlarmSubtype((attrs.alarmType as string) ?? '');
      setShowDeviceList(false);
      setDeviceSearch('');
    }
  }, [notification]);

  // Available devices = all devices not already linked
  const availableDevices = useMemo(() => {
    const linked = new Set(linkedDeviceIds);
    const filtered = deviceSearch.toLowerCase()
      ? allDevices.filter((d) => d.name?.toLowerCase().includes(deviceSearch.toLowerCase()))
      : allDevices;
    return filtered.filter((d) => !linked.has(d.id!));
  }, [allDevices, linkedDeviceIds, deviceSearch]);

  // Linked device names
  const linkedDevices = useMemo(() => {
    const idSet = new Set(linkedDeviceIds);
    return allDevices.filter((d) => idSet.has(d.id!));
  }, [allDevices, linkedDeviceIds]);

  if (!open || !notification) return null;

  const config = getAlertConfig(notification.type ?? '');
  const typeConfig = ALERT_TYPE_CONFIG[notification.type ?? ''];

  const handleNotificatorToggle = (key: string) => {
    setNotificators((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleRemoveDevice = async (deviceId: number) => {
    try {
      await unlinkNotification.mutateAsync({ notificationId: notification.id!, deviceId });
      invalidateLinked(notification.id);
    } catch {
      // Error handled by mutation
    }
  };

  const handleAddDevice = async (deviceId: number) => {
    try {
      await linkNotification.mutateAsync({
        notificationId: notification.id!,
        deviceIds: [deviceId],
      });
      invalidateLinked(notification.id);
    } catch {
      // Error handled by mutation
    }
  };

  const handleSave = async () => {
    if (notificators.length === 0) {
      setError('Selecciona al menos un canal de notificación');
      return;
    }

    setError(null);

    const attributes: Record<string, unknown> = {};
    if (typeConfig?.configRequirements?.needsSpeedLimit && speedLimit) {
      attributes.speedLimit = Number(speedLimit);
    }
    if (typeConfig?.configRequirements?.needsAlarmSubtype && alarmSubtype) {
      attributes.alarmType = alarmSubtype;
    }

    try {
      await updateNotification.mutateAsync({
        id: notification.id!,
        notificators: notificators.join(','),
        always,
        description: description || null,
        attributes: attributes as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar. Intenta de nuevo.';
      setError(message);
    }
  };

  const isSaving = updateNotification.isPending;
  const isLinkingDevice = linkNotification.isPending || unlinkNotification.isPending;

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={cardStyle}>
        {/* Type badge — read-only */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={labelStyle}>Tipo de Alerta</span>
          <div style={pillStyle(config.color)}>
            <span style={{ fontSize: '1rem' }}>{config.icon}</span>
            <span>{config.label}</span>
          </div>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {/* Notificators checkboxes */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Canales de Notificación</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {NOTIFICATOR_OPTIONS.map((opt) => {
              const checked = notificators.includes(opt.key);
              return (
                <label
                  key={opt.key}
                  style={{
                    ...checkboxStyle,
                    borderColor: checked ? 'rgba(99, 102, 241, 0.3)' : 'rgba(15, 23, 42, 0.08)',
                    backgroundColor: checked ? 'rgba(99, 102, 241, 0.06)' : 'rgba(15, 23, 42, 0.02)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleNotificatorToggle(opt.key)}
                    style={{ accentColor: '#6366f1', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', fontFamily: 'Outfit' }}>
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Always toggle */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Modo de Activación</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              style={toggleTrackStyle(always)}
              onClick={() => setAlways(!always)}
              title={always ? 'Cambiar a Programado' : 'Cambiar a Siempre'}
              aria-label={always ? 'Desactivar siempre' : 'Activar siempre'}
            >
              <span style={{
                ...toggleThumbStyle,
                transform: always ? 'translateX(16px)' : 'translateX(0)',
              }} />
            </button>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: always ? '#10b981' : '#6366f1',
              fontFamily: 'Outfit',
            }}>
              {always ? 'Siempre activo' : 'Programado'}
            </span>
          </div>
        </div>

        {/* Linked Devices */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Dispositivos Vinculados</span>
          {isLoadingLinked ? (
            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Cargando...</span>
          ) : linkedDevices.length === 0 ? (
            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Sin dispositivos vinculados</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {linkedDevices.map((device) => (
                <span key={device.id} style={deviceChipStyle}>
                  {device.name ?? `Dispositivo ${device.id}`}
                  <button
                    style={removeDeviceBtn}
                    onClick={() => handleRemoveDevice(device.id!)}
                    disabled={isLinkingDevice}
                    title="Desvincular dispositivo"
                    aria-label={`Desvincular ${device.name}`}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                  >
                    <IconClose size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add device toggle */}
          <button
            style={addDeviceBtn}
            onClick={() => setShowDeviceList(!showDeviceList)}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            {showDeviceList ? 'Cerrar lista' : '+ Agregar dispositivo'}
          </button>

          {/* Device search & list */}
          {showDeviceList && (
            <div style={{ marginTop: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              <input
                type="text"
                placeholder="Buscar dispositivo..."
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                style={searchInputStyle}
              />
              {availableDevices.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '0.5rem', textAlign: 'center' }}>
                  {deviceSearch ? 'No se encontraron dispositivos' : 'Todos los dispositivos ya están vinculados'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {availableDevices.slice(0, 20).map((device) => (
                    <div
                      key={device.id}
                      style={deviceListItem}
                      onClick={() => handleAddDevice(device.id!)}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.06)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                    >
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', fontFamily: 'Outfit' }}>
                        {device.name ?? `Dispositivo ${device.id}`}
                      </span>
                      <span style={{ ...addDeviceBtn, pointerEvents: 'none' }}>+</span>
                    </div>
                  ))}
                  {availableDevices.length > 20 && (
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', padding: '0.25rem' }}>
                      Y {availableDevices.length - 20} más...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div style={sectionStyle}>
          <span style={labelStyle}>Descripción</span>
          <textarea
            style={textareaStyle}
            placeholder="Descripción opcional..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Dynamic attributes based on type */}
        {typeConfig?.configRequirements?.needsSpeedLimit && (
          <div style={sectionStyle}>
            <span style={labelStyle}>Límite de Velocidad (nudos)</span>
            <input
              type="number"
              style={inputStyle}
              placeholder="Ej: 80"
              value={speedLimit}
              onChange={(e) => setSpeedLimit(e.target.value)}
              min={1}
              max={500}
            />
          </div>
        )}

        {typeConfig?.configRequirements?.needsAlarmSubtype && (
          <div style={sectionStyle}>
            <span style={labelStyle}>Subtipo de Alarma</span>
            <select
              style={selectStyle}
              value={alarmSubtype}
              onChange={(e) => setAlarmSubtype(e.target.value)}
            >
              <option value="">Seleccionar subtipo...</option>
              {ALARM_SUBTYPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <button
            style={cancelButton}
            onClick={onClose}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            Cancelar
          </button>
          <button
            style={saveButton}
            onClick={handleSave}
            disabled={isSaving}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5558e0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}