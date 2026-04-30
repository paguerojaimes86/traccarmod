import { useState, useMemo, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { useUiStore } from '@shared/lib/ui-store';
import { getMenuItems, type MenuItem, type MenuCategory } from './menuConfig';
import { useIsMobile, useEscapeKey, useFocusTrap } from '@shared/hooks';

function MenuItemWithTooltip({
  item,
  isActive,
  sidebarOpen,
  onClick,
}: {
  item: MenuItem;
  isActive: boolean;
  sidebarOpen: boolean;
  onClick?: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const iconColor = isActive ? '#0f172a' : '#64748b';

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <Link
        to={item.path}
        onClick={onClick}
        onMouseEnter={() => !sidebarOpen && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: sidebarOpen ? '0.625rem 0.75rem' : '0.625rem',
          borderRadius: '0.75rem',
          marginBottom: '0.25rem',
          color: iconColor,
          backgroundColor: isActive ? 'rgba(15,23,42,0.06)' : 'transparent',
          textDecoration: 'none',
          fontSize: '0.8125rem',
          fontWeight: isActive ? 600 : 500,
          transition: 'all 200ms ease',
          fontFamily: 'Outfit, sans-serif',
          letterSpacing: '-0.01em',
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
          width: '100%',
        }}
      >
        <item.icon
          size={20}
          strokeWidth={1.75}
          color={iconColor}
          style={{
            transition: 'all 200ms ease',
            flexShrink: 0,
          }}
        />
        {sidebarOpen && <span>{item.label}</span>}
      </Link>
      {!sidebarOpen && showTooltip && (
        <div
          style={{
            position: 'absolute',
            left: 'calc(100% + 12px)',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '0.375rem 0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            fontFamily: 'Outfit, sans-serif',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        >
          {item.label}
          <div
            style={{
              position: 'absolute',
              right: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              border: '6px solid transparent',
              borderRightColor: '#0f172a',
            }}
          />
        </div>
      )}
    </div>
  );
}

export function MenuSidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const location = useLocation();
  const isMobile = useIsMobile();
  const asideRef = useRef<HTMLElement>(null);

  const closeSidebar = useCallback(() => {
    if (sidebarOpen) toggleSidebar();
  }, [sidebarOpen, toggleSidebar]);

  useFocusTrap(isMobile && sidebarOpen, asideRef);
  useEscapeKey(isMobile && sidebarOpen, closeSidebar);

  const items = useMemo(() => getMenuItems(null), []);

  const groups = useMemo(() => {
    const map = new Map<MenuCategory, MenuItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [items]);

  const handleLinkClick = useCallback(() => {
    if (isMobile && sidebarOpen) {
      toggleSidebar();
    }
  }, [isMobile, sidebarOpen, toggleSidebar]);

  const nav = (
    <nav style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.5rem' }}>
        {groups.map(([category, groupItems]) => (
          <div key={category} style={{ marginBottom: '1.25rem' }}>
            {sidebarOpen && (
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: 'Outfit, sans-serif',
                  marginBottom: '0.25rem',
                }}
              >
                {category}
              </div>
            )}
            {groupItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <MenuItemWithTooltip
                  key={item.path}
                  item={item}
                  isActive={isActive}
                  sidebarOpen={sidebarOpen}
                  onClick={handleLinkClick}
                />
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );

  if (isMobile) {
    return (
      <>
        {sidebarOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15,23,42,0.4)',
              zIndex: 60,
              backdropFilter: 'blur(2px)',
            }}
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}
        <aside
          id="mobile-menu-sidebar"
          ref={asideRef}
          aria-hidden={!sidebarOpen}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: sidebarOpen ? 240 : 0,
            overflow: 'hidden',
            backgroundColor: '#f1f5f9',
            zIndex: 70,
            transition: 'width 200ms ease',
            boxShadow: sidebarOpen ? '4px 0 24px rgba(15,23,42,0.12)' : 'none',
          }}
        >
          {nav}
        </aside>
      </>
    );
  }

  return (
    <aside
      style={{
        width: sidebarOpen ? 240 : 64,
        minWidth: sidebarOpen ? 240 : 64,
        backgroundColor: '#f1f5f9',
        borderRight: '1px solid rgba(15,23,42,0.06)',
        transition: 'width 200ms ease, min-width 200ms ease',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {nav}
    </aside>
  );
}