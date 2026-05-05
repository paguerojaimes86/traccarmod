import { useState, useEffect, type CSSProperties, type FormEvent } from 'react';
import { useCreateOrder } from '@features/orders/hooks/useCreateOrder';
import { useUpdateOrder } from '@features/orders/hooks/useUpdateOrder';
import { IconClose, IconCheck } from '@shared/ui/icons';
import type { Order } from '@shared/api/types.models';

interface OrderFormProps {
  open: boolean;
  order?: Order | null;
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

export function OrderForm({ open, order, onClose, onSuccess }: OrderFormProps) {
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();

  const isEdit = !!order?.id;
  const isPending = createOrder.isPending || updateOrder.isPending;

  const [uniqueId, setUniqueId] = useState('');
  const [description, setDescription] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (order) {
        setUniqueId(order.uniqueId ?? '');
        setDescription(order.description ?? '');
        setFromAddress(order.fromAddress ?? '');
        setToAddress(order.toAddress ?? '');
      } else {
        setUniqueId('');
        setDescription('');
        setFromAddress('');
        setToAddress('');
      }
      setErrors({});
    }
  }, [open, order]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!uniqueId.trim()) nextErrors.uniqueId = 'El ID único es obligatorio';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEdit) {
        await updateOrder.mutateAsync({
          id: order!.id!,
          uniqueId: uniqueId.trim(),
          description: description.trim() || undefined,
          fromAddress: fromAddress.trim() || undefined,
          toAddress: toAddress.trim() || undefined,
          attributes: order!.attributes ?? {},
        } as Parameters<typeof updateOrder.mutateAsync>[0]);
      } else {
        const payload: Partial<Order> = {
          uniqueId: uniqueId.trim(),
          description: description.trim() || undefined,
          fromAddress: fromAddress.trim() || undefined,
          toAddress: toAddress.trim() || undefined,
          attributes: {},
        };
        await createOrder.mutateAsync(payload);
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
          <h2 style={titleStyle}>{isEdit ? 'Editar Orden' : 'Nueva Orden'}</h2>
          <button
            onClick={onClose}
            style={{ background: 'rgba(15, 23, 42, 0.04)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.625rem', borderRadius: '0.75rem', display: 'flex' }}
          >
            <IconClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={fieldStyle}>
            <label htmlFor="order-unique-id" style={labelStyle}>ID Único *</label>
            <input id="order-unique-id" type="text" value={uniqueId} onChange={(e) => setUniqueId(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.uniqueId && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.uniqueId}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="order-description" style={labelStyle}>Descripción</label>
            <input id="order-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="order-from-address" style={labelStyle}>Dirección Origen</label>
            <input id="order-from-address" type="text" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="order-to-address" style={labelStyle}>Dirección Destino</label>
            <input id="order-to-address" type="text" value={toAddress} onChange={(e) => setToAddress(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
          </div>

          {(createOrder.error || updateOrder.error) && (
            <div style={errorStyle}>
              {(createOrder.error as Error)?.message ?? (updateOrder.error as Error)?.message ?? 'Error al guardar la orden'}
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
              {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
