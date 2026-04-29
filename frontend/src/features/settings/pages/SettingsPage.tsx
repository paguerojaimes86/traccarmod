import type { CSSProperties } from 'react';
import { ServerConfigForm } from '../components/ServerConfigForm';

const pageStyle: CSSProperties = {
  padding: '2rem',
  height: '100%',
  overflow: 'auto',
};

const headerStyle: CSSProperties = {
  fontFamily: 'Outfit',
  fontWeight: 800,
  fontSize: '1.5rem',
  color: '#0f172a',
  marginBottom: '0.5rem',
};

const subStyle: CSSProperties = {
  color: '#64748b',
  marginBottom: '1.5rem',
};

export function SettingsPage() {
  return (
    <div style={pageStyle}>
      <h1 style={headerStyle}>Configuración</h1>
      <p style={subStyle}>Ajustes del sistema y configuración del servidor.</p>
      <ServerConfigForm />
    </div>
  );
}

export default SettingsPage;
