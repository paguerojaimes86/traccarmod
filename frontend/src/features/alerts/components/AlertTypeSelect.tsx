import { useState, useMemo, type CSSProperties } from 'react';
import { getTypesByCategory, type TypeConfig } from '@shared/lib/alert-types';
import { IconSearch } from '@shared/ui/icons';

interface AlertTypeSelectProps {
  onSelect: (type: string) => void;
}

// ─── Search ───────────────────────────────────────────────────────
const searchWrapperStyle: CSSProperties = {
  position: 'relative',
  marginBottom: '1.25rem',
};

const searchInputStyle: CSSProperties = {
  width: '100%',
  padding: '0.7rem 1rem 0.7rem 2.5rem',
  borderRadius: '0.875rem',
  border: '1.5px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(15, 23, 42, 0.02)',
  color: '#0f172a',
  fontSize: '0.8125rem',
  outline: 'none',
  fontFamily: "'Inter', system-ui, sans-serif",
  transition: 'all 0.2s',
  boxSizing: 'border-box',
};

// ─── Category Header ──────────────────────────────────────────────
const categoryHeaderStyle: CSSProperties = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: '0.625rem',
  fontWeight: 700,
  color: '#94a3b8',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginTop: '1.25rem',
  marginBottom: '0.625rem',
  paddingBottom: '0.375rem',
  borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
};

// ─── Type Card ────────────────────────────────────────────────────
const typeCardStyle = (_color: string): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.375rem',
  padding: '1rem 0.75rem',
  borderRadius: '1rem',
  border: '1.5px solid rgba(15, 23, 42, 0.06)',
  backgroundColor: '#fff',
  cursor: 'pointer',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative' as const,
  overflow: 'hidden' as const,
});

const typeCardGlowStyle = (color: string): CSSProperties => ({
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  height: '3px',
  backgroundColor: color,
  opacity: 0,
  transition: 'opacity 0.25s',
});

const iconWrapperStyle = (color: string): CSSProperties => ({
  width: '2.5rem',
  height: '2.5rem',
  borderRadius: '0.75rem',
  backgroundColor: `${color}10`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.25rem',
  transition: 'all 0.25s',
});

const typeLabelStyle: CSSProperties = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#0f172a',
  textAlign: 'center' as const,
  lineHeight: 1.3,
};

const typeDescStyle: CSSProperties = {
  fontSize: '0.625rem',
  color: '#94a3b8',
  textAlign: 'center' as const,
  lineHeight: 1.35,
};

// ─── Empty State ──────────────────────────────────────────────────
const emptyStateStyle: CSSProperties = {
  textAlign: 'center' as const,
  padding: '2.5rem 1rem',
  color: '#94a3b8',
  fontSize: '0.8125rem',
  fontFamily: "'Inter', system-ui, sans-serif",
};

const categoryLabels: Record<string, string> = {
  status: 'Estado',
  movement: 'Movimiento',
  geofence: 'Geozona',
  speed: 'Velocidad',
  alarm: 'Alarma',
  maintenance: 'Mantenimiento',
  other: 'Otros',
};

export function AlertTypeSelect({ onSelect }: AlertTypeSelectProps) {
  const [search, setSearch] = useState('');
  const typesByCategory = getTypesByCategory();

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return typesByCategory;
    const q = search.toLowerCase();
    const result: Record<string, TypeConfig[]> = {};
    for (const [category, types] of Object.entries(typesByCategory)) {
      const filtered = types.filter(
        (t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.type.toLowerCase().includes(q)
      );
      if (filtered.length > 0) result[category] = filtered;
    }
    return result;
  }, [search, typesByCategory]);

  return (
    <div>
      {/* Search */}
      <div style={searchWrapperStyle}>
        <IconSearch
          size={16}
          style={{
            position: 'absolute',
            left: '0.875rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Buscar tipo de alerta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.08)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)';
            e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Types by category */}
      {Object.entries(filteredCategories).map(([category, types]) => (
        <div key={category}>
          <div style={categoryHeaderStyle}>{categoryLabels[category] ?? category}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.625rem' }}>
            {types.map((typeConfig) => (
              <div
                key={typeConfig.type}
                style={typeCardStyle(typeConfig.color)}
                onClick={() => onSelect(typeConfig.type)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${typeConfig.color}40`;
                  e.currentTarget.style.boxShadow = `0 4px 16px -4px ${typeConfig.color}25`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  const glow = e.currentTarget.querySelector('[data-glow]') as HTMLElement;
                  if (glow) glow.style.opacity = '1';
                  const iconWrap = e.currentTarget.querySelector('[data-icon-wrap]') as HTMLElement;
                  if (iconWrap) {
                    iconWrap.style.backgroundColor = `${typeConfig.color}18`;
                    iconWrap.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                  const glow = e.currentTarget.querySelector('[data-glow]') as HTMLElement;
                  if (glow) glow.style.opacity = '0';
                  const iconWrap = e.currentTarget.querySelector('[data-icon-wrap]') as HTMLElement;
                  if (iconWrap) {
                    iconWrap.style.backgroundColor = `${typeConfig.color}10`;
                    iconWrap.style.transform = 'scale(1)';
                  }
                }}
              >
                <div data-glow style={typeCardGlowStyle(typeConfig.color)} />
                <div data-icon-wrap style={iconWrapperStyle(typeConfig.color)}>
                  {typeConfig.icon}
                </div>
                <div style={typeLabelStyle}>{typeConfig.label}</div>
                <div style={typeDescStyle}>{typeConfig.description}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(filteredCategories).length === 0 && (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>🔍</div>
          No se encontraron tipos de alerta
        </div>
      )}
    </div>
  );
}
