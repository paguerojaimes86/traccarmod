import { type CSSProperties } from 'react';
import { NOTIFICATOR_OPTIONS } from '@shared/lib/alert-types';

interface AlertChannelsProps {
  selectedChannels: string[];
  always: boolean;
  onChannelsChange: (channels: string[]) => void;
  onAlwaysChange: (always: boolean) => void;
}

// ─── Section ──────────────────────────────────────────────────────
const sectionStyle: CSSProperties = {
  marginBottom: '1.5rem',
};

const sectionLabelStyle: CSSProperties = {
  display: 'block',
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#334155',
  marginBottom: '0.625rem',
  letterSpacing: '-0.01em',
};

// ─── Channel Card ─────────────────────────────────────────────────
const channelCardStyle = (checked: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  border: `1.5px solid ${checked ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.06)'}`,
  backgroundColor: checked ? 'rgba(99, 102, 241, 0.04)' : 'rgba(15, 23, 42, 0.01)',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
});

const channelCheckboxStyle = (checked: boolean): CSSProperties => ({
  width: '1.25rem',
  height: '1.25rem',
  borderRadius: '0.375rem',
  border: checked ? 'none' : '1.5px solid rgba(15, 23, 42, 0.15)',
  backgroundColor: checked ? '#6366f1' : 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 0.2s',
  boxShadow: checked ? '0 1px 4px rgba(99, 102, 241, 0.25)' : 'none',
});

const channelIconStyle: CSSProperties = {
  fontSize: '1.125rem',
  flexShrink: 0,
};

const channelLabelStyle: CSSProperties = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#0f172a',
};

// ─── Always Toggle ────────────────────────────────────────────────
const toggleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  backgroundColor: 'rgba(15, 23, 42, 0.02)',
  border: '1px solid rgba(15, 23, 42, 0.05)',
};

const toggleTrackStyle = (active: boolean): CSSProperties => ({
  width: '40px',
  height: '22px',
  borderRadius: '11px',
  backgroundColor: active ? '#10b981' : '#d1d5db',
  position: 'relative' as const,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  border: 'none',
  padding: 0,
  flexShrink: 0,
});

const toggleThumbStyle = (active: boolean): CSSProperties => ({
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  backgroundColor: '#fff',
  position: 'absolute' as const,
  top: '2px',
  left: '2px',
  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: active ? 'translateX(18px)' : 'translateX(0)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
});

const toggleLabelStyle = (active: boolean): CSSProperties => ({
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: active ? '#10b981' : '#6366f1',
});

const toggleDescStyle: CSSProperties = {
  fontSize: '0.6875rem',
  color: '#94a3b8',
  fontFamily: "'Inter', system-ui, sans-serif",
  marginTop: '0.125rem',
};

export function AlertChannels({
  selectedChannels,
  always,
  onChannelsChange,
  onAlwaysChange,
}: AlertChannelsProps) {
  const handleChannelToggle = (key: string) => {
    if (selectedChannels.includes(key)) {
      onChannelsChange(selectedChannels.filter((k) => k !== key));
    } else {
      onChannelsChange([...selectedChannels, key]);
    }
  };

  return (
    <div>
      {/* Channels */}
      <div style={sectionStyle}>
        <span style={sectionLabelStyle}>Canales de Notificación</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {NOTIFICATOR_OPTIONS.map((opt) => {
            const checked = selectedChannels.includes(opt.key);
            return (
              <div
                key={opt.key}
                style={channelCardStyle(checked)}
                onClick={() => handleChannelToggle(opt.key)}
                onMouseEnter={(e) => {
                  if (!checked) {
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!checked) {
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.01)';
                    e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.06)';
                  }
                }}
              >
                <div style={channelCheckboxStyle(checked)}>
                  {checked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={channelIconStyle}>{opt.icon}</span>
                <span style={channelLabelStyle}>{opt.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Always / Scheduled toggle */}
      <div style={sectionStyle}>
        <span style={sectionLabelStyle}>Modo de Activación</span>
        <div style={toggleRowStyle}>
          <div>
            <div style={toggleLabelStyle(always)}>
              {always ? 'Siempre activo' : 'Programado'}
            </div>
            <div style={toggleDescStyle}>
              {always
                ? 'La alerta se dispara en cualquier momento'
                : 'La alerta sigue un calendario (próximamente)'}
            </div>
          </div>
          <button
            style={toggleTrackStyle(always)}
            onClick={() => onAlwaysChange(!always)}
            title={always ? 'Cambiar a Programado' : 'Cambiar a Siempre'}
            aria-label={always ? 'Desactivar siempre' : 'Activar siempre'}
          >
            <span style={toggleThumbStyle(always)} />
          </button>
        </div>
      </div>
    </div>
  );
}
