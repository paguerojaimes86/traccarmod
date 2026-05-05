import { useState, useEffect, type CSSProperties, type FormEvent } from 'react';
import { useCreateMaintenance } from '../hooks/useCreateMaintenance';
import { useUpdateMaintenance } from '../hooks/useUpdateMaintenance';
import { IconClose, IconCheck } from '@shared/ui/icons';
import { apiClient } from '@shared/api/client';
import { useDevices } from '@features/devices/hooks/useDevices';
import type { Maintenance } from '@shared/api/types.models';

interface MaintenanceFormProps {
  open: boolean;
  item?: Maintenance | null;
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
  width: '560px',
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

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
};

export function MaintenanceForm({ open, item, onClose, onSuccess }: MaintenanceFormProps) {
  const createItem = useCreateMaintenance();
  const updateItem = useUpdateMaintenance();
  const { data: devices = [] } = useDevices();

  const isEdit = !!item?.id;
  const isPending = createItem.isPending || updateItem.isPending;

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [start, setStart] = useState('');
  const [period, setPeriod] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name ?? '');
        setType(item.type ?? '');
        setStart(item.start != null ? String(item.start) : '');
        setPeriod(item.period != null ? String(item.period) : '');
        setSelectedDeviceIds([]);
      } else {
        setName('');
        setType('');
        setStart('');
        setPeriod('');
        setSelectedDeviceIds([]);
      }
      setErrors({});
    }
  }, [open, item]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'El nombre es obligatorio';
    if (!period.trim() || Number(period) <= 0) next.period = 'El período debe ser mayor a 0';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload: Partial<Maintenance> & { id?: number } = {
        name: name.trim(),
        type: type.trim() || undefined,
        start: start ? Number(start) : 0,
        period: Number(period),
        attributes: item?.attributes ?? {},
      };

      let savedId: number;
      if (isEdit) {
        const result = await updateItem.mutateAsync({ ...payload, id: item!.id! });
        savedId = result.id!;
      } else {
        const result = await createItem.mutateAsync(payload);
        savedId = result.id!;
      }

      // Link selected devices via permissions
      if (selectedDeviceIds.length > 0) {
        await Promise.allSettled(
          selectedDeviceIds.map((deviceId) =>
            apiClient.POST('/permissions', {
              body: { deviceId, maintenanceId: savedId },
            })
          )
        );
      }

      onSuccess?.();
      onClose();
    } catch {}
  };

  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isEdit ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'rgba(15, 23, 42, 0.04)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.625rem', borderRadius: '0.75rem', display: 'flex' }}
          >
            <IconClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={fieldStyle}>
            <label htmlFor="maintenance-name" style={labelStyle}>Nombre *</label>
            <input id="maintenance-name" type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.name && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.name}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="maintenance-type" style={labelStyle}>Métrica</label>
            <input id="maintenance-type" type="text" value={type} onChange={(e) => setType(e.target.value)} style={inputStyle} placeholder="Ej: distance, engineHours"
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
          </div>

          <div style={rowStyle}>
            <div style={{ ...fieldStyle, flex: 1 }}>
              <label htmlFor="maintenance-start" style={labelStyle}>Valor Inicial</label>
              <input id="maintenance-start" type="number" value={start} onChange={(e) => setStart(e.target.value)} style={inputStyle} placeholder="0"
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
              />
            </div>
            <div style={{ ...fieldStyle, flex: 1 }}>
              <label htmlFor="maintenance-period" style={labelStyle}>Período *</label>
              <input id="maintenance-period" type="number" value={period} onChange={(e) => setPeriod(e.target.value)} style={inputStyle} placeholder="Ej: 10000"
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
              />
              {errors.period && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.period}</div>}
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Dispositivos</label>
            <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '0.75rem', padding: '0.5rem' }}>
              {devices.length === 0 && (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '0.5rem', textAlign: 'center' }}>Sin dispositivos disponibles</div>
              )}
              {devices.map((d) => (
                <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                  <input
                    type="checkbox"
                    checked={selectedDeviceIds.includes(d.id!)}
                    onChange={(e) => {
                      setSelectedDeviceIds((prev) =>
                        e.target.checked
                          ? [...prev, d.id!]
                          : prev.filter((id) => id !== d.id)
                      );
                    }}
                    style={{ accentColor: '#6366f1' }}
                  />
                  {d.name}
                </label>
              ))}
            </div>
          </div>

          {(createItem.error || updateItem.error) && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 600 }}>
              {(createItem.error as Error)?.message ?? (updateItem.error as Error)?.message ?? 'Error al guardar'}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button"
              style={{ padding: '0.625rem 1.25rem', borderRadius: '0.875rem', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-family-base)', cursor: 'pointer', backgroundColor: 'rgba(15, 23, 42, 0.04)', color: '#64748b', border: '1px solid rgba(15, 23, 42, 0.08)' }}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              style={{ padding: '0.625rem 1.25rem', borderRadius: '0.875rem', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-family-base)', cursor: 'pointer', backgroundColor: '#6366f1', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <IconCheck size={14} />
              {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Mantenimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
