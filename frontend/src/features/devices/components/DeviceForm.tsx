import { useState, useEffect, type CSSProperties, type FormEvent } from 'react';
import { useGroups } from '@features/groups/hooks/useGroups';
import { useCreateDevice } from '@features/devices/hooks/useCreateDevice';
import { useUpdateDevice } from '@features/devices/hooks/useUpdateDevice';
import { IconClose, IconCheck } from '@shared/ui/icons';
import type { Device } from '@shared/api/types.models';

interface DeviceFormProps {
  open: boolean;
  device?: Device | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
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

const titleStyle: CSSProperties = {
  fontFamily: 'Outfit',
  fontSize: '1.125rem',
  fontWeight: 700,
  color: '#0f172a',
  margin: '0 0 1.5rem 0',
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
  border: '1px solid var(--border-strong)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: 'var(--text-primary)',
  fontSize: '0.8125rem',
  fontWeight: 600,
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
  fontFamily: 'var(--font-family-base)',
  boxSizing: 'border-box',
};

const selectStyle: CSSProperties = {
  width: '100%',
  padding: '0.625rem 2.5rem 0.625rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--border-strong)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: 'var(--text-primary)',
  fontSize: '0.8125rem',
  fontWeight: 600,
  outline: 'none',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
  fontFamily: 'var(--font-family-base)',
  appearance: 'none',
  boxSizing: 'border-box',
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

const buttonBase: CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: '0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  fontFamily: 'var(--font-family-base)',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
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

const submitButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: '#6366f1',
  color: '#fff',
  border: 'none',
};

export function DeviceForm({ open, device, onClose, onSuccess }: DeviceFormProps) {
  const { data: groups = [] } = useGroups();
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();

  const isEdit = !!device?.id;
  const isPending = createDevice.isPending || updateDevice.isPending;

  const [name, setName] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [groupId, setGroupId] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [model, setModel] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (device) {
        setName(device.name ?? '');
        setUniqueId(device.uniqueId ?? '');
        setGroupId(device.groupId != null ? String(device.groupId) : '');
        setPhone(device.phone ?? '');
        setModel(device.model ?? '');
        setContact(device.contact ?? '');
        setCategory(device.category ?? '');
      } else {
        setName('');
        setUniqueId('');
        setGroupId('');
        setPhone('');
        setModel('');
        setContact('');
        setCategory('');
      }
      setErrors({});
    }
  }, [open, device]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'El nombre es obligatorio';
    if (!uniqueId.trim()) nextErrors.uniqueId = 'El Unique ID es obligatorio';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEdit) {
        const updates: Partial<Device> = {
          name: name.trim(),
          uniqueId: device!.uniqueId,
          groupId: groupId ? Number(groupId) : undefined,
          phone: phone.trim() || undefined,
          model: model.trim() || undefined,
          contact: contact.trim() || undefined,
          category: category.trim() || undefined,
          attributes: device!.attributes ?? {},
        };
        await updateDevice.mutateAsync({ id: device!.id!, ...updates });
      } else {
        const payload: Partial<Device> = {
          name: name.trim(),
          uniqueId: uniqueId.trim(),
          groupId: groupId ? Number(groupId) : undefined,
          phone: phone.trim() || undefined,
          model: model.trim() || undefined,
          contact: contact.trim() || undefined,
          category: category.trim() || undefined,
          attributes: {},
        };
        await createDevice.mutateAsync(payload);
      }
      onSuccess?.();
      onClose();
    } catch {
      // Mutation error is handled by TanStack Query; nothing to do here
    }
  };

  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={titleStyle}>{isEdit ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ background: 'rgba(15, 23, 42, 0.04)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.625rem', borderRadius: '0.75rem', display: 'flex' }}
          >
            <IconClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={fieldStyle}>
            <label htmlFor="device-name" style={labelStyle}>Nombre *</label>
            <input
              id="device-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              autoComplete="off"
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'device-name-error' : undefined}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.name && <div id="device-name-error" style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-error)', fontWeight: 600 }}>{errors.name}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="device-uniqueId" style={labelStyle}>Unique ID *</label>
            <input
              id="device-uniqueId"
              type="text"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              style={inputStyle}
              disabled={isEdit}
              autoComplete="off"
              aria-required="true"
              aria-invalid={Boolean(errors.uniqueId)}
              aria-describedby={errors.uniqueId ? 'device-uniqueId-error' : undefined}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.uniqueId && <div id="device-uniqueId-error" style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-error)', fontWeight: 600 }}>{errors.uniqueId}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="device-groupId" style={labelStyle}>Grupo</label>
            <div style={{ position: 'relative' }}>
              <select
                id="device-groupId"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                style={selectStyle}
                autoComplete="off"
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
              >
                <option value="">Sin grupo</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={fieldStyle}>
            <label htmlFor="device-phone" style={labelStyle}>Teléfono</label>
            <input
              id="device-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle}
              autoComplete="tel"
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="device-model" style={labelStyle}>Modelo</label>
            <input
              id="device-model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={inputStyle}
              autoComplete="off"
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="device-contact" style={labelStyle}>Contacto</label>
            <input
              id="device-contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={inputStyle}
              autoComplete="name"
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="device-category" style={labelStyle}>Categoría</label>
            <input
              id="device-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={inputStyle}
              autoComplete="off"
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
          </div>

          {(createDevice.error || updateDevice.error) && (
            <div style={errorStyle} role="alert">
              {(createDevice.error as Error)?.message ?? (updateDevice.error as Error)?.message ?? 'Error al guardar el dispositivo'}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              style={cancelButton}
              onClick={onClose}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={submitButton}
              disabled={isPending}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5558e0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
            >
              <IconCheck size={14} />
              {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Dispositivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
