import { useNavigate } from 'react-router';
import { useLogin } from '../hooks/useLogin';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleLogin = (email: string, password: string) => {
    loginMutation.mutate(
      { email, password },
      { onSuccess: () => navigate('/', { replace: true }) },
    );
  };

  return (
    <LoginForm
      onSubmit={handleLogin}
      isLoading={loginMutation.isPending}
      error={loginMutation.isError ? 'Correo o contraseña incorrectos' : null}
    />
  );
}
