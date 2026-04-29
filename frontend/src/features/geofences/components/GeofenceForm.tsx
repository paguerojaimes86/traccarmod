import { useState, useEffect, useCallback, type CSSProperties, type FormEvent } from 'react';
import { useCreateGeofence } from '@features/geofences/hooks/useCreateGeofence';
import { useUpdateGeofence } from '@features/geofences/hooks/useUpdateGeofence';
import { GeofenceDrawMap } from './GeofenceDrawMap';
import { IconClose, IconCheck } from '@shared/ui/icons';
import type { Geofence } from '@shared/api/types.models';

interface GeofenceFormProps {
  open: boolean;
  geofence?: Geofence | null;
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
  width: '680px',
  maxWidth: '95vw',
  maxHeight: '90vh',
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

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical',
};

const errorStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.625rem',
  backgroundColor: 'var(--color-error-bg)',
  border: '1px solid var(--color-error-border)',
  color: 'var(--color-error)',
  fontSize: '0.8125rem',
  marginBottom: '1rem',
};

const wktHintStyle: CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--text-secondary)',
  marginTop: '0.375rem',
  fontFamily: 'monospace',
  wordBreak: 'break-all',
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

export function GeofenceForm({ open, geofence, onClose, onSuccess }: GeofenceFormProps) {
  const createGeofence = useCreateGeofence();
  const updateGeofence = useUpdateGeofence();

  const isEdit = !!geofence?.id;
  const isPending = createGeofence.isPending || updateGeofence.isPending;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (geofence) {
        setName(geofence.name ?? '');
        setDescription(geofence.description ?? '');
        setArea(geofence.area ?? null);
      } else {
        setName('');
        setDescription('');
        setArea(null);
      }
      setErrors({});
    }
  }, [open, geofence]);

  const handleAreaChange = useCallback((wkt: string | null) => {
    setArea(wkt);
    if (wkt && errors.area) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.area;
        return next;
      });
    }
  }, [errors.area]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'El nombre es obligatorio';
    if (!area?.trim()) nextErrors.area = 'Dibuje el área en el mapa';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    console.log('[GeofenceForm] handleSubmit, area:', area?.substring(0, 80));
    try {
      if (isEdit) {
        const updates: Partial<Geofence> = {
          name: name.trim(),
          description: description.trim() || undefined,
          area: area!.trim(),
          attributes: geofence!.attributes ?? {},
        };
        console.log('[GeofenceForm] updating geofence:', updates);
        await updateGeofence.mutateAsync({ id: geofence!.id!, ...updates });
      } else {
        const payload: Partial<Geofence> = {
          name: name.trim(),
          description: description.trim() || undefined,
          area: area!.trim(),
          attributes: {},
        };
        console.log('[GeofenceForm] creating geofence:', payload);
        await createGeofence.mutateAsync(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('[GeofenceForm] save error:', err);
    }
  };

  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={titleStyle}>{isEdit ? 'Editar Geocerca' : 'Nueva Geocerca'}</h2>
          <button
            onClick={onClose}
            style={{ background: 'rgba(15, 23, 42, 0.04)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.625rem', borderRadius: '0.75rem', display: 'flex' }}
          >
            <IconClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={fieldStyle}>
            <label htmlFor="geofence-name" style={labelStyle}>Nombre *</label>
            <input
              id="geofence-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.name && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.name}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="geofence-description" style={labelStyle}>Descripción</label>
            <textarea
              id="geofence-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={textareaStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Área — Dibuje en el mapa *</label>
            <GeofenceDrawMap
              initialWkt={geofence?.area ?? null}
              onWktChange={handleAreaChange}
            />
            {area && (
              <div style={wktHintStyle}>
                {area.length > 100 ? area.substring(0, 100) + '...' : area}
              </div>
            )}
            {errors.area && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.area}</div>}
          </div>

          {(createGeofence.error || updateGeofence.error) && (
            <div style={errorStyle}>
              {(createGeofence.error as Error)?.message ?? (updateGeofence.error as Error)?.message ?? 'Error al guardar la geocerca'}
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
              {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Geocerca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}