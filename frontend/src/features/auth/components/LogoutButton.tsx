import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { useLogout } from '../hooks/useLogout';

const buttonStyle: CSSProperties = {
  padding: '0.375rem 0.75rem',
  borderRadius: '0.375rem',
  border: '1px solid rgba(15, 23, 42, 0.12)',
  backgroundColor: 'rgba(15, 23, 42, 0.04)',
  color: '#475569',
  fontSize: '0.8125rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const buttonDisabledStyle: CSSProperties = {
  ...buttonStyle,
  opacity: 0.6,
  cursor: 'not-allowed',
};

export function LogoutButton() {
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login', { replace: true });
      },
    });
  };

  return (
    <button
      onClick={handleLogout}
      style={logoutMutation.isPending ? buttonDisabledStyle : buttonStyle}
      disabled={logoutMutation.isPending}
    >
      {logoutMutation.isPending ? 'Cerrando sesión...' : 'Cerrar sesión'}
    </button>
  );
}