import { Outlet } from 'react-router';
import { useAuthStore } from '@features/auth/store';
import { useUiStore } from '@shared/lib/ui-store';
import { MenuSidebar } from '@shared/navigation/MenuSidebar';
import { LogoutButton } from '@features/auth/components/LogoutButton';
import { IconMenu } from '@shared/ui/icons';
import { useIsMobile } from '@shared/hooks';

function AppHeader() {
  const user = useAuthStore((s) => s.user);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const isMobile = useIsMobile();
  const headerVisible = !isMobile || sidebarOpen;

  return (
    <header
      className="glass"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: headerVisible ? '0.75rem 1.5rem' : '0',
        borderBottom: headerVisible ? '1px solid var(--border-default)' : 'none',
        height: headerVisible ? 'var(--header-height)' : '0',
        opacity: headerVisible ? 1 : 0,
        overflow: 'hidden',
        transition: 'height 250ms var(--ease-default), padding 250ms var(--ease-default), opacity 200ms ease',
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          opacity: headerVisible ? 1 : 0,
          transition: 'opacity 200ms ease',
          transitionDelay: headerVisible ? '50ms' : '0ms',
          pointerEvents: headerVisible ? 'auto' : 'none',
        }}
      >
        <button
          onClick={toggleSidebar}
          aria-expanded={sidebarOpen}
          aria-controls="mobile-menu-sidebar"
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#0f172a',
            display: 'flex',
            padding: '0.25rem',
          }}
        >
          <IconMenu size={20} />
        </button>
        <span style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.05em' }}>
          MSGLOBAL GPS
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          opacity: headerVisible ? 1 : 0,
          transition: 'opacity 200ms ease',
          transitionDelay: headerVisible ? '50ms' : '0ms',
          pointerEvents: headerVisible ? 'auto' : 'none',
        }}
      >
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {user?.name ?? user?.email ?? ''}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}

export function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppHeader />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <MenuSidebar />
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
