import type { CSSProperties } from 'react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: '1rem',
  md: '2rem',
  lg: '3rem',
} as const;

const spinnerStyle: CSSProperties = {
  border: '3px solid #e2e8f0',
  borderTopColor: '#6366f1',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

export function LoadingState({ message = 'Cargando...', size = 'md' }: LoadingStateProps) {
  const dimension = sizeMap[size];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '2rem',
        color: '#64748b',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ ...spinnerStyle, width: dimension, height: dimension }} />
      <span style={{ fontSize: '0.875rem' }}>{message}</span>
    </div>
  );
}