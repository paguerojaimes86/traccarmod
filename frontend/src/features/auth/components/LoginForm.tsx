import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, Mail, MapPin, ShieldCheck, Signal, Sparkles } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
}

const benefits = [
  { icon: Signal, title: 'Tiempo real', text: 'Estado de flota al instante' },
  { icon: MapPin, title: 'Rutas claras', text: 'Ubicación y seguimiento GPS' },
  { icon: ShieldCheck, title: 'Acceso seguro', text: 'Sesión protegida' },
];

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailError = touched.email && !email.trim() ? 'Ingresa tu correo electrónico.' : null;
  const passwordError = touched.password && !password ? 'Ingresa tu contraseña.' : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!email.trim() || !password) return;
    onSubmit(email.trim(), password);
  };

  return (
    <main className="login-screen">
      <section className="login-shell" aria-label="Inicio de sesión MSGLOBAL GPS">
        <aside className="login-brand" aria-label="Información de plataforma">
          <div>
            <div className="login-badge">
              <Sparkles size={14} aria-hidden="true" />
              Plataforma GPS
            </div>
            <h1 className="login-logo">
              MSGLOBAL <span>GPS</span>
            </h1>
            <p className="login-copy">
              Acceso claro y seguro al centro de monitoreo de flotas en tiempo real.
            </p>
          </div>

          <div className="benefit-list">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div className="benefit-card" key={title}>
                <div className="benefit-icon">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <div>
                  <div className="benefit-title">{title}</div>
                  <div className="benefit-text">{text}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="login-panel">
          <div className="login-form-wrap">
            <header className="form-header">
              <div className="form-icon">
                <Signal size={25} aria-hidden="true" />
              </div>
              <h2>Iniciar sesión</h2>
              <p>Ingresa con tu cuenta para continuar.</p>
            </header>

            {error && (
              <div className="login-error" role="alert">
                Credenciales incorrectas. Verifica tu correo y contraseña.
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="login-form">
              <div className="field-group">
                <label htmlFor="email">
                  <Mail size={16} aria-hidden="true" />
                  Correo electrónico
                </label>
                <div className="input-shell">
                  <Mail className="input-icon" size={20} aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                    placeholder="nombre@empresa.com"
                    autoComplete="email"
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'email-error' : undefined}
                    disabled={isLoading}
                    className={emailError ? 'has-error' : ''}
                  />
                </div>
                {emailError && <p id="email-error" className="field-error">{emailError}</p>}
              </div>

              <div className="field-group">
                <div className="label-row">
                  <label htmlFor="password">
                    <Lock size={16} aria-hidden="true" />
                    Contraseña
                  </label>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <div className="input-shell">
                  <Lock className="input-icon" size={20} aria-hidden="true" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                    disabled={isLoading}
                    className={passwordError ? 'has-error with-right-icon' : 'with-right-icon'}
                  />
                  {showPassword ? (
                    <Eye className="input-icon-right" size={20} aria-hidden="true" />
                  ) : (
                    <EyeOff className="input-icon-right" size={20} aria-hidden="true" />
                  )}
                </div>
                {passwordError && <p id="password-error" className="field-error">{passwordError}</p>}
              </div>

              <div className="form-options">
                <label htmlFor="remember-me" className="remember">
                  <input id="remember-me" type="checkbox" />
                  Recordarme
                </label>
                <button type="button" className="link-button" onClick={() => {}}>Olvidé mi contraseña</button>
              </div>

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar al sistema'
                )}
              </button>
            </form>

            <p className="secure-copy">Conexión protegida para usuarios autorizados.</p>
          </div>
        </div>
      </section>

      <style>{`
        .login-screen {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          color: #0f172a;
          background:
            radial-gradient(circle at 18% 12%, rgba(37, 99, 235, 0.14), transparent 30%),
            radial-gradient(circle at 82% 18%, rgba(14, 165, 233, 0.12), transparent 26%),
            linear-gradient(180deg, #ffffff 0%, #eef3f8 100%);
          position: fixed;
          inset: 0;
          overflow: auto;
        }

        .login-screen::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.25;
          background-image:
            linear-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 0.08) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        .login-shell {
          position: relative;
          width: min(100%, 1040px);
          max-width: calc(100vw - 64px);
          min-height: 640px;
          display: grid;
          grid-template-columns: 430px 1fr;
          overflow: hidden;
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.95);
          background: #ffffff;
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.18);
        }

        .login-brand {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 32px;
          padding: 48px;
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
        }

        .login-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          border: 1px solid #dbeafe;
          background: #ffffff;
          padding: 8px 14px;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
        }

        .login-logo {
          margin: 28px 0 0;
          font-family: Outfit, Inter, sans-serif;
          font-size: 56px;
          line-height: 0.95;
          letter-spacing: -0.06em;
          font-weight: 900;
          color: #020617;
        }

        .login-logo span { color: #1d4ed8; }

        .login-copy {
          margin: 20px 0 0;
          max-width: 340px;
          color: #334155;
          font-size: 18px;
          line-height: 1.65;
          font-weight: 500;
        }

        .benefit-list { display: grid; gap: 14px; }

        .benefit-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
        }

        .benefit-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          flex: none;
          border-radius: 14px;
          color: #1d4ed8;
          background: #eff6ff;
        }

        .benefit-title { color: #0f172a; font-size: 14px; font-weight: 900; }
        .benefit-text { margin-top: 3px; color: #475569; font-size: 14px; font-weight: 500; }

        .login-panel {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 56px;
          background: #ffffff;
        }

        .login-form-wrap { width: 100%; max-width: 420px; min-width: 0; }

        .form-header { margin-bottom: 32px; }

        .form-icon {
          width: 56px;
          height: 56px;
          display: grid;
          place-items: center;
          margin-bottom: 20px;
          border-radius: 18px;
          background: #1d4ed8;
          color: #ffffff;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
        }

        .form-header h2 {
          margin: 0;
          font-family: Outfit, Inter, sans-serif;
          color: #020617;
          font-size: 40px;
          line-height: 1;
          letter-spacing: -0.055em;
          font-weight: 900;
        }

        .form-header p {
          margin: 12px 0 0;
          color: #334155;
          font-size: 16px;
          line-height: 1.55;
          font-weight: 500;
        }

        .login-error {
          margin-bottom: 24px;
          border-radius: 16px;
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 700;
        }

        .login-form { display: grid; gap: 24px; }
        .field-group { display: grid; gap: 8px; }

        label, .label-row label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1e293b;
          font-size: 14px;
          line-height: 1.2;
          font-weight: 900;
        }

        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .input-shell { position: relative; }

        .input-shell input {
          width: 100%;
          height: 56px;
          border-radius: 16px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          padding: 0 16px 0 48px;
          font-size: 16px;
          font-weight: 600;
          outline: none;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
          box-sizing: border-box;
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }

        .input-shell input.with-right-icon { padding-right: 48px; }
        .input-shell input::placeholder { color: #64748b; font-weight: 600; }
        .input-shell input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px #dbeafe; }
        .input-shell input.has-error { border-color: #f87171; }
        .input-shell input.has-error:focus { border-color: #dc2626; box-shadow: 0 0 0 4px #fee2e2; }
        .input-shell input:disabled { cursor: not-allowed; background: #f8fafc; color: #64748b; }

        .input-icon,
        .input-icon-right {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }

        .input-icon { left: 16px; }
        .input-icon-right { right: 16px; }

        .field-error { margin: 2px 0 0; color: #b91c1c; font-size: 14px; font-weight: 700; }

        .link-button,
        .form-options a {
          border: 0;
          background: transparent;
          color: #1d4ed8;
          padding: 0;
          font-size: 14px;
          line-height: 1.2;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
        }

        .link-button:hover,
        .form-options a:hover { text-decoration: underline; text-underline-offset: 4px; }
        .link-button:focus-visible,
        .form-options a:focus-visible,
        .submit-button:focus-visible { outline: none; box-shadow: 0 0 0 4px #dbeafe; }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 14px;
        }

        .remember { color: #334155; font-weight: 700; }
        .remember input { width: 16px; height: 16px; accent-color: #1d4ed8; }

        .submit-button {
          height: 56px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 0;
          border-radius: 16px;
          background: #1d4ed8;
          color: #ffffff;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
          transition: background 160ms ease, transform 160ms ease;
        }

        .submit-button:hover:not(:disabled) { background: #1e40af; transform: translateY(-1px); }
        .submit-button:disabled { cursor: not-allowed; opacity: 0.7; }

        .spinner {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          border: 2px solid rgba(255,255,255,0.45);
          border-top-color: #ffffff;
          animation: login-spin 800ms linear infinite;
        }

        .secure-copy {
          margin: 28px 0 0;
          color: #475569;
          text-align: center;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 700;
        }

        @keyframes login-spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .login-screen { padding: 20px; align-items: center; }
          .login-shell { grid-template-columns: 1fr; min-height: auto; width: min(100%, 520px); max-width: calc(100vw - 40px); }
          .login-brand { display: none; }
          .login-panel { padding: 32px 24px; }
          .form-header h2 { font-size: 34px; }
        }

        @media (max-width: 600px) {
          .form-options { align-items: flex-start; flex-direction: column; gap: 12px; }
        }

        @media (max-width: 420px) {
          .login-screen { padding: 12px; }
          .login-panel { padding: 28px 18px; }
          .login-shell { border-radius: 24px; max-width: calc(100vw - 24px); }
          }
        }
      `}</style>
    </main>
  );
}
