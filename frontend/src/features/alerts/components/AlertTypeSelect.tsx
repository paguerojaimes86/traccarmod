import { useState, useMemo, type CSSProperties } from 'react';
import { getTypesByCategory, type TypeConfig } from '@shared/lib/alert-types';
import { IconSearch } from '@shared/ui/icons';

interface AlertTypeSelectProps {
  onSelect: (type: string) => void;
}

const categoryHeaderStyle: CSSProperties = {
  fontFamily: 'Outfit',
  fontSize: '0.6875rem',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginTop: '1rem',
  marginBottom: '0.5rem',
};

const cardStyle = (_color: string): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '1.25rem 1rem',
  borderRadius: '0.875rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(16px)',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
});

const searchInputStyle: CSSProperties = {
  width: '100%',
  padding: '0.625rem 1rem 0.625rem 2.25rem',
  borderRadius: '0.625rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: '#0f172a',
  fontSize: '0.8125rem',
  outline: 'none',
  fontFamily: 'inherit',
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

  const categoryLabels: Record<string, string> = {
    status: 'Estado',
    movement: 'Movimiento',
    geofence: 'Geozona',
    speed: 'Velocidad',
    alarm: 'Alarma',
    maintenance: 'Mantenimiento',
    other: 'Otros',
  };

  return (
    <div>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <IconSearch size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Buscar tipo de alerta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      {/* Types by category */}
      {Object.entries(filteredCategories).map(([category, types]) => (
        <div key={category}>
          <div style={categoryHeaderStyle}>{categoryLabels[category] ?? category}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {types.map((typeConfig) => (
              <div
                key={typeConfig.type}
                style={cardStyle(typeConfig.color)}
                onClick={() => onSelect(typeConfig.type)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 24px -8px ${typeConfig.color}`;
                  e.currentTarget.style.borderColor = `${typeConfig.color}50`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>{typeConfig.icon}</div>
                <div style={{ fontFamily: 'Outfit', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>
                  {typeConfig.label}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', textAlign: 'center', lineHeight: 1.3 }}>
                  {typeConfig.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(filteredCategories).length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.8125rem' }}>
          No se encontraron tipos de alerta
        </div>
      )}
    </div>
  );
}
