import { useState, useEffect, type CSSProperties } from 'react';
import { apiClient } from '@shared/api/client';
import { useAttributesList } from '@features/attributes/hooks/useAttributesList';
import { useDeviceLinkedAttributes } from '@features/devices/hooks/useDeviceLinkedAttributes';
import { IconClose, IconCheck, IconLink } from '@shared/ui/icons';

interface AttributeLinkModalProps {
  open: boolean;
  deviceId: number;
  deviceName: string;
  onClose: () => void;
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
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '1.25rem',
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(15, 23, 42, 0.06)',
  boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
  padding: '2rem',
};

const listStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  margin: '1rem 0',
  border: '1px solid rgba(15, 23, 42, 0.06)',
  borderRadius: '0.75rem',
  padding: '0.5rem',
};

const itemRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.5rem 0.75rem',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  transition: 'background-color 0.15s',
};

export function AttributeLinkModal({ open, deviceId, deviceName, onClose }: AttributeLinkModalProps) {
  const { data: allAttrs = [] } = useAttributesList();
  const { data: linkedIds = [], isLoading: linkedLoading } = useDeviceLinkedAttributes(open ? deviceId : null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && !linkedLoading) {
      setSelected(new Set(linkedIds));
      setError('');
    }
  }, [open, linkedLoading, linkedIds]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const currentLinked = new Set(linkedIds);
      const toCreate: number[] = [];
      const toDelete: number[] = [];

      for (const id of selected) {
        if (!currentLinked.has(id)) toCreate.push(id);
      }
      for (const id of linkedIds) {
        if (!selected.has(id)) toDelete.push(id);
      }

      // Create new links
      if (toCreate.length > 0) {
        await Promise.allSettled(
          toCreate.map((attributeId) =>
            apiClient.POST('/permissions', {
              body: { deviceId, attributeId },
            })
          )
        );
      }

      // Remove old links
      if (toDelete.length > 0) {
        await Promise.allSettled(
          toDelete.map((attributeId) =>
            apiClient.DELETE('/permissions', {
              body: { deviceId, attributeId },
            })
          )
        );
      }

      onClose();
    } catch (err) {
      setError((err as Error).message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconLink size={18} color="#6366f1" />
            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Vincular Atributos
            </h2>
          </div>
          <button onClick={onClose}
            style={{ background: 'rgba(15, 23, 42, 0.04)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.625rem', borderRadius: '0.75rem', display: 'flex' }}
          >
            <IconClose size={20} />
          </button>
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 600 }}>
          Dispositivo: <span style={{ color: '#0f172a' }}>{deviceName}</span>
        </div>

        {linkedLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600 }}>
            Cargando atributos vinculados...
          </div>
        ) : (
          <div style={listStyle}>
            {allAttrs.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>
                No hay atributos calculados. Creálos primero en Atributos.
              </div>
            )}
            {allAttrs.map((attr) => (
              <label key={attr.id} style={itemRowStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(attr.id!)}
                  onChange={() => toggle(attr.id!)}
                  style={{ accentColor: '#6366f1' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{attr.description}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.125rem' }}>
                    {attr.attribute} · {attr.type}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8125rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
          <button onClick={onClose}
            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.875rem', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-family-base)', cursor: 'pointer', backgroundColor: 'rgba(15, 23, 42, 0.04)', color: '#64748b', border: '1px solid rgba(15, 23, 42, 0.08)' }}
          >
            CANCELAR
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.875rem', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-family-base)', cursor: 'pointer', backgroundColor: '#6366f1', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <IconCheck size={14} />
            {saving ? 'Guardando...' : 'GUARDAR'}
          </button>
        </div>
      </div>
    </div>
  );
}
