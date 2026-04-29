import { useState, useEffect, type CSSProperties, type FormEvent } from 'react';
import { useCreateUser } from '@features/users/hooks/useCreateUser';
import { useUpdateUser } from '@features/users/hooks/useUpdateUser';
import { IconClose, IconCheck } from '@shared/ui/icons';
import type { User } from '@shared/api/types.models';

interface UserFormProps {
  open: boolean;
  user?: User | null;
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

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
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
  borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
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

export function UserForm({ open, user, onClose, onSuccess }: UserFormProps) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const isEdit = !!user?.id;
  const isPending = createUser.isPending || updateUser.isPending;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [administrator, setAdministrator] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [deviceLimit, setDeviceLimit] = useState('');
  const [userLimit, setUserLimit] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (user) {
        setName(user.name ?? '');
        setEmail(user.email ?? '');
        setPassword('');
        setPhone(user.phone ?? '');
        setAdministrator(user.administrator ?? false);
        setDisabled(user.disabled ?? false);
        setDeviceLimit(user.deviceLimit != null ? String(user.deviceLimit) : '');
        setUserLimit(user.userLimit != null ? String(user.userLimit) : '');
      } else {
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setAdministrator(false);
        setDisabled(false);
        setDeviceLimit('');
        setUserLimit('');
      }
      setErrors({});
    }
  }, [open, user]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'El nombre es obligatorio';
    if (!email.trim()) nextErrors.email = 'El email es obligatorio';
    if (!isEdit && !password.trim()) nextErrors.password = 'La contraseña es obligatoria';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEdit) {
        const updatedUser: User = {
          ...user!,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          administrator,
          disabled,
          deviceLimit: deviceLimit ? Number(deviceLimit) : undefined,
          userLimit: userLimit ? Number(userLimit) : undefined,
          attributes: user!.attributes ?? {},
        };
        if (password.trim()) updatedUser.password = password.trim();
        await updateUser.mutateAsync(updatedUser);
      } else {
        const payload: Partial<User> = {
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim() || undefined,
          administrator,
          disabled,
          deviceLimit: deviceLimit ? Number(deviceLimit) : undefined,
          userLimit: userLimit ? Number(userLimit) : undefined,
          attributes: {},
        };
        await createUser.mutateAsync(payload);
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
          <h2 style={titleStyle}>{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          <button
            onClick={onClose}
            style={{ background: 'rgba(15, 23, 42, 0.04)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.625rem', borderRadius: '0.75rem', display: 'flex' }}
          >
            <IconClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={fieldStyle}>
            <label htmlFor="user-name" style={labelStyle}>Nombre *</label>
            <input id="user-name" type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.name && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.name}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="user-email" style={labelStyle}>Email *</label>
            <input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.email && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.email}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="user-password" style={labelStyle}>{isEdit ? 'Nueva Contraseña' : 'Contraseña *'}</label>
            <input id="user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder={isEdit ? 'Dejar vacío para no cambiar' : ''}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
            {errors.password && <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>{errors.password}</div>}
          </div>

          <div style={fieldStyle}>
            <label htmlFor="user-phone" style={labelStyle}>Teléfono</label>
            <input id="user-phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
            />
          </div>

          <div style={rowStyle}>
            <div style={{ ...fieldStyle, flex: 1 }}>
              <label htmlFor="user-device-limit" style={labelStyle}>Límite Dispositivos</label>
              <input id="user-device-limit" type="number" value={deviceLimit} onChange={(e) => setDeviceLimit(e.target.value)} style={inputStyle} placeholder="0 = sin límite"
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
              />
            </div>
            <div style={{ ...fieldStyle, flex: 1 }}>
              <label htmlFor="user-user-limit" style={labelStyle}>Límite Usuarios</label>
              <input id="user-user-limit" type="number" value={userLimit} onChange={(e) => setUserLimit(e.target.value)} style={inputStyle} placeholder="0 = sin límite"
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
              />
            </div>
          </div>

          <div style={toggleRowStyle}>
            <span style={toggleLabelStyle}>Administrador</span>
            <button type="button" style={toggleSwitchStyle(administrator)} onClick={() => setAdministrator((v) => !v)}>
              <div style={toggleDotStyle(administrator)} />
            </button>
          </div>

          <div style={toggleRowStyle}>
            <span style={toggleLabelStyle}>Desactivado</span>
            <button type="button" style={toggleSwitchStyle(disabled)} onClick={() => setDisabled((v) => !v)}>
              <div style={toggleDotStyle(disabled)} />
            </button>
          </div>

          {(createUser.error || updateUser.error) && (
            <div style={errorStyle}>
              {(createUser.error as Error)?.message ?? (updateUser.error as Error)?.message ?? 'Error al guardar el usuario'}
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
              {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}