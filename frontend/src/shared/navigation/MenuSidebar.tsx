import { useMemo, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuthStore } from '@features/auth/store';
import { useUiStore } from '@shared/lib/ui-store';
import { getMenuItems, type MenuItem, type MenuCategory } from './menuConfig';
import { useIsMobile, useEscapeKey, useFocusTrap } from '@shared/hooks';

export function MenuSidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const isMobile = useIsMobile();
  const asideRef = useRef<HTMLElement>(null);

  const closeSidebar = useCallback(() => {
    if (sidebarOpen) toggleSidebar();
  }, [sidebarOpen, toggleSidebar]);

  useFocusTrap(isMobile && sidebarOpen, asideRef);
  useEscapeKey(isMobile && sidebarOpen, closeSidebar);

  const items = useMemo(() => getMenuItems(user), [user]);

  const groups = useMemo(() => {
    const map = new Map<MenuCategory, MenuItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [items]);

  const handleLinkClick = () => {
    if (isMobile && sidebarOpen) {
      toggleSidebar();
    }
  };

  const nav = (
    <nav style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Solo espacio para alinear con el header */}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.5rem' }}>
        {groups.map(([category, groupItems]) => (
          <div key={category} style={{ marginBottom: '1rem' }}>
            {sidebarOpen && (
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {category}
              </div>
            )}
            {groupItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: sidebarOpen ? '0.625rem 0.75rem' : '0.625rem',
                    borderRadius: '0.75rem',
                    marginBottom: '0.25rem',
                    color: isActive ? '#6366f1' : '#475569',
                    backgroundColor: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                    textDecoration: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    transition: 'background-color 0.2s ease, color 0.2s ease, padding 0.2s ease',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  }}
                >
                  <item.icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
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
              backgroundColor: 'rgba(15,23,42,0.3)',
              zIndex: 60,
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
            backgroundColor: '#fff',
            zIndex: 70,
            transition: 'width 200ms ease',
            boxShadow: sidebarOpen ? '4px 0 20px rgba(15,23,42,0.08)' : 'none',
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
        backgroundColor: '#fff',
        borderRight: '1px solid rgba(15,23,42,0.06)',
        transition: 'width 200ms ease, min-width 200ms ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {nav}
    </aside>
  );
}
