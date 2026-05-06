import { useState, useEffect, type CSSProperties, type FormEvent } from 'react';
import { useCreateAttribute } from '@features/attributes/hooks/useCreateAttribute';
import { IconClose, IconCheck } from '@shared/ui/icons';
import type { Attribute, AttributeWithPriority } from '@shared/api/types.models';

interface AttributeFormProps {
  open: boolean;
  attribute?: Attribute | null;
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
  resize: 'vertical',
  minHeight: '120px',
  fontFamily: 'monospace',
  fontSize: '0.8125rem',
  lineHeight: 1.5,
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
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

const TYPE_OPTIONS = ['string', 'number', 'boolean'] as const;

export function AttributeForm({ open, attribute, onClose, onSuccess }: AttributeFormProps) {
  const createAttr = useCreateAttribute();

  const isEdit = !!attribute?.id;
  const isPending = createAttr.isPending;

  const [description, setDescription] = useState('');
  const [attrKey, setAttrKey] = useState('');
  const [expression, setExpression] = useState('');
  const [type, setType] = useState<string>('string');
  const [priority, setPriority] = useState('0');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (attribute) {
        setDescription(attribute.description ?? '');
        setAttrKey(attribute.attribute ?? '');
        setExpression(attribute.expression ?? '');
        setType(attribute.type ?? 'string');
        setPriority(String((attribute as AttributeWithPriority).priority ?? 0));
      } else {
        setDescription('');
        setAttrKey('');
        setExpression('');
        setType('string');
        setPriority('0');
      }
      setErrors({});
    }
  }, [open, attribute]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!description.trim()) nextErrors.description = 'La descripción es obligatoria';
    if (!attrKey.trim()) nextErrors.attribute = 'El atributo es obligatorio';
    if (!expression.trim()) nextErrors.expression = 'La expresión es obligatoria';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEdit) {
        // Traccar API does not support PUT for computed attributes
        throw new Error('La edición de atributos no está soportada por esta versión de Traccar');
      } else {
        const payload: Partial<Attribute> & { priority?: number } = {
          description: description.trim(),
          attribute: attrKey.trim(),
          expression: expression.trim(),
          type,
          priority: Number(priority) || 0,
        };
        await createAttr.mutateAsync(payload);
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
          <h2 style={titleStyle}>{isEdit ? 'Editar Atributo' : 'Nuevo Atributo'}</h2>
          <button
            onClick={onClose}
            style={{ background: 'rgba(15, 23, 42, 0.04)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.625rem', borderRadius: '0.75rem', display: 'flex' }}
          >
            <IconClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={fieldStyle}>
            <label htmlFor="attr-description" style={labelStyle}>Descripción *</label>
            <input id="attr-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.description && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.description}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="attr-key" style={labelStyle}>Atributo *</label>
            <input id="attr-key" type="text" value={attrKey} onChange={(e) => setAttrKey(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.attribute && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.attribute}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="attr-expression" style={labelStyle}>Expresión *</label>
            <textarea id="attr-expression" value={expression} onChange={(e) => setExpression(e.target.value)} style={textareaStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.expression && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.expression}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="attr-type" style={labelStyle}>Tipo *</label>
            <select id="attr-type" value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label htmlFor="attr-priority" style={labelStyle}>Prioridad</label>
            <input id="attr-priority" type="number" value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle} placeholder="0"
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            <div style={{ marginTop: '0.25rem', fontSize: '0.6875rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Valores más altos se ejecutan primero. Usá valores negativos para ejecución temprana.
            </div>
          </div>

          {(createAttr.error) && (
            <div style={errorStyle}>
              {(createAttr.error as Error)?.message ?? 'Error al guardar el atributo'}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" style={cancelButton} onClick={onClose}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
            >
              Cancelar
            </button>
            <button type="submit" style={submitButton} disabled={isPending}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5558e0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
            >
              <IconCheck size={14} />
              {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Atributo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
