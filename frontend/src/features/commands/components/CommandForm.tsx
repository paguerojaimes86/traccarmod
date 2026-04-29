import { useState, useEffect, type CSSProperties, type FormEvent } from 'react';
import { useCreateCommand } from '@features/commands/hooks/useCreateCommand';
import { useUpdateCommand } from '@features/commands/hooks/useUpdateCommand';
import { useCommandTypes } from '@features/commands/hooks/useCommandTypes';
import { IconClose, IconCheck } from '@shared/ui/icons';
import type { Command } from '@shared/api/types.models';

interface CommandFormProps {
  open: boolean;
  command?: Command | null;
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
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
  fontFamily: 'var(--font-family-base)',
  appearance: 'none',
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

const toggleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 0',
};

const toggleLabelStyle: CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#0f172a',
};

const toggleSwitchStyle = (active: boolean): CSSProperties => ({
  position: 'relative',
  width: '44px',
  height: '24px',
  borderRadius: '12px',
  backgroundColor: active ? '#6366f1' : 'rgba(15, 23, 42, 0.1)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: 'none',
  padding: 0,
});

const toggleDotStyle = (active: boolean): CSSProperties => ({
  position: 'absolute' as const,
  top: '2px',
  left: active ? '22px' : '2px',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: '#fff',
  transition: 'all 0.2s',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
});

export function CommandForm({ open, command, onClose, onSuccess }: CommandFormProps) {
  const { data: commandTypes = [] } = useCommandTypes();
  const createCommand = useCreateCommand();
  const updateCommand = useUpdateCommand();

  const isEdit = !!command?.id;
  const isPending = createCommand.isPending || updateCommand.isPending;

  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [textChannel, setTextChannel] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (command) {
        setDescription(command.description ?? '');
        setType(command.type ?? '');
        setDeviceId(command.deviceId != null ? String(command.deviceId) : '');
        setTextChannel(command.textChannel ?? false);
      } else {
        setDescription('');
        setType('');
        setDeviceId('');
        setTextChannel(false);
      }
      setErrors({});
    }
  }, [open, command]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!description.trim()) nextErrors.description = 'La descripción es obligatoria';
    if (!type.trim()) nextErrors.type = 'El tipo es obligatorio';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEdit) {
        const updatedCommand: Command = {
          ...command!,
          description: description.trim(),
          type: type.trim(),
          deviceId: deviceId ? Number(deviceId) : undefined,
          textChannel,
          attributes: command!.attributes ?? {},
        };
        await updateCommand.mutateAsync(updatedCommand);
      } else {
        const payload: Partial<Command> = {
          description: description.trim(),
          type: type.trim(),
          deviceId: deviceId ? Number(deviceId) : undefined,
          textChannel,
          attributes: {},
        };
        await createCommand.mutateAsync(payload);
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
          <h2 style={titleStyle}>{isEdit ? 'Editar Comando' : 'Nuevo Comando'}</h2>
          <button
            onClick={onClose}
            style={{ background: 'rgba(15, 23, 42, 0.04)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.625rem', borderRadius: '0.75rem', display: 'flex' }}
          >
            <IconClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={fieldStyle}>
            <label htmlFor="cmd-description" style={labelStyle}>Descripción *</label>
            <input
              id="cmd-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.description && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.description}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="cmd-type" style={labelStyle}>Tipo *</label>
            <div style={{ position: 'relative' }}>
              <select
                id="cmd-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={selectStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
              >
                <option value="">Seleccionar tipo</option>
                {commandTypes.map((ct) => (
                  <option key={ct.type} value={ct.type}>
                    {ct.type}
                  </option>
                ))}
              </select>
            </div>
            {errors.type && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.type}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="cmd-deviceId" style={labelStyle}>Dispositivo (ID)</label>
            <input
              id="cmd-deviceId"
              type="number"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              style={inputStyle}
              placeholder="Dejar vacío para global"
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
          </div>

          <div style={toggleRowStyle}>
            <span style={toggleLabelStyle}>Enviar por SMS</span>
            <button type="button" style={toggleSwitchStyle(textChannel)} onClick={() => setTextChannel((v) => !v)}>
              <div style={toggleDotStyle(textChannel)} />
            </button>
          </div>

          {(createCommand.error || updateCommand.error) && (
            <div style={errorStyle}>
              {(createCommand.error as Error)?.message ?? (updateCommand.error as Error)?.message ?? 'Error al guardar el comando'}
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
              {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Comando'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}