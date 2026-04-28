import { Outlet } from 'react-router';
import { useAuthStore } from '@features/auth/store';
import { useUiStore } from '@shared/lib/ui-store';
import { MenuSidebar } from '@shared/navigation/MenuSidebar';
import { LogoutButton } from '@features/auth/components/LogoutButton';
import { IconMenu } from '@shared/ui/icons';

function AppHeader() {
  const user = useAuthStore((s) => s.user);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <header
      className="glass"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        height: '60px',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={toggleSidebar}
          aria-expanded={sidebarOpen}
          aria-controls="mobile-menu-sidebar"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#0f172a',
            display: 'flex',
            padding: '0.25rem',
          }}
          aria-label="Abrir menú"
        >
          <IconMenu size={20} />
        </button>
        <span style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.05em' }}>
          MSGLOBAL GPS
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
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
