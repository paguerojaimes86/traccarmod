import type { ReactNode } from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

export function ErrorState({
  title = 'Ocurrió un error',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '2rem',
        color: '#dc2626',
        textAlign: 'center',
      }}
    >
      <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{title}</h3>
      {message && <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid #dc2626',
            backgroundColor: 'transparent',
            color: '#dc2626',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}