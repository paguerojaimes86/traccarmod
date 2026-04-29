import type { CSSProperties } from 'react';

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

export function ReportsPage() {
  return (
    <div style={pageStyle}>
      <h1 style={headerStyle}>Reportes</h1>
      <p style={subStyle}>Visualización de reportes y estadísticas.</p>
    </div>
  );
}

export default ReportsPage;
