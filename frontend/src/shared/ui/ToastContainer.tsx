import { useEffect, useCallback } from 'react';
import { useToastStore, type Toast } from '@shared/lib/toast-store';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ICONS: Record<Toast['type'], typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS: Record<Toast['type'], { bg: string; border: string; icon: string }> = {
  success: { bg: '#064e3b', border: '#10b981', icon: '#10b981' },
  error: { bg: '#450a0a', border: '#ef4444', icon: '#ef4444' },
  info: { bg: '#1e3a5f', border: '#3b82f6', icon: '#3b82f6' },
  warning: { bg: '#451a03', border: '#f59e0b', icon: '#f59e0b' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const Icon = ICONS[toast.type];
  const colors = COLORS[toast.type];

  useEffect(() => {
    if (!toast.duration) return;
    const timer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.border}`,
        borderRadius: '0.375rem',
        color: '#f8fafc',
        fontSize: '0.875rem',
        lineHeight: '1.4',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        animation: 'toast-in 0.2s ease-out',
        maxWidth: '400px',
      }}
    >
      <Icon size={18} color={colors.icon} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Cerrar notificación"
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '0.25rem',
          display: 'flex',
          borderRadius: '0.25rem',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  const handleRemove = useCallback(
    (id: string) => remove(id),
    [remove],
  );

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        aria-label="Notificaciones"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onRemove={handleRemove} />
          </div>
        ))}
      </div>
    </>
  );
}
