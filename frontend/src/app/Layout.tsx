import { Outlet, Link } from 'react-router';
import { useAuthStore } from '@features/auth/store';
import { useUiStore } from '@shared/lib/ui-store';
import { MenuSidebar } from '@shared/navigation/MenuSidebar';
import { useLogout } from '@features/auth/hooks/useLogout';
import { useNavigate } from 'react-router';
import { IconMenu, IconLogout } from '@shared/ui/icons';
import { useIsMobile } from '@shared/hooks';

function UserBadge({ name, email }: { name?: string; email?: string }) {
  const initials = (name ?? email ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.375rem 0.75rem 0.375rem 0.375rem',
        borderRadius: '10px',
        backgroundColor: 'rgba(15, 23, 42, 0.04)',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        transition: 'all 200ms ease',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          backgroundColor: '#0f172a',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 700,
          fontFamily: 'Outfit, sans-serif',
          letterSpacing: '-0.02em',
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <div style={{ overflow: 'hidden' }}>
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#0f172a',
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 160,
            lineHeight: 1.2,
          }}
        >
          {name ?? 'Usuario'}
        </div>
        <div
          style={{
            fontSize: '0.6875rem',
            color: '#94a3b8',
            fontFamily: 'Outfit, sans-serif',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 160,
            lineHeight: 1.2,
            marginTop: 1,
          }}
        >
          {email}
        </div>
      </div>
    </div>
  );
}

function LogoutButton() {
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login', { replace: true });
      },
    });
  };

  return (
    <button
      onClick={handleLogout}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: '8px',
        border: '1px solid rgba(15, 23, 42, 0.1)',
        backgroundColor: 'transparent',
        color: '#94a3b8',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.06)';
        e.currentTarget.style.color = '#0f172a';
        e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#94a3b8';
        e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)';
      }}
    >
      <IconLogout size={15} strokeWidth={2} />
    </button>
  );
}

function HeaderLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      {/* GPS Pulse indicator */}
      <div style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '8px',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.3)',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }}
          />
        </div>
        {/* Outer ring */}
        <div
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: '10px',
            border: '1.5px solid rgba(15, 23, 42, 0.12)',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <span
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '1.0625rem',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}
        >
          MSGLOBAL
        </span>
        <span
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '0.5625rem',
            fontWeight: 600,
            color: '#94a3b8',
            letterSpacing: '0.18em',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          GPS Tracking
        </span>
      </div>
    </div>
  );
}

function AppHeader() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const isMobile = useIsMobile();
  const user = useAuthStore((s) => s.user);
  const headerVisible = !isMobile || sidebarOpen;

  return (
    <>
      {/* Accent line top */}
      <div
        style={{
          height: 3,
          background: 'linear-gradient(90deg, #0f172a 0%, #334155 50%, #0f172a 100%)',
          opacity: headerVisible ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
      />
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: headerVisible ? '0.625rem 1.25rem' : '0',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
          height: headerVisible ? 52 : 0,
          opacity: headerVisible ? 1 : 0,
          overflow: 'hidden',
          transition: 'height 250ms ease, padding 250ms ease, opacity 200ms ease',
          zIndex: 50,
        }}
      >
        {/* Left: hamburger + logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
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
              color: '#475569',
              display: 'flex',
              padding: '0.375rem',
              borderRadius: '6px',
              transition: 'background 200ms ease, color 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(15,23,42,0.06)';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#475569';
            }}
          >
            <IconMenu size={18} />
          </button>

          <Link to="/" style={{ textDecoration: 'none' }}>
            <HeaderLogo />
          </Link>
        </div>

        {/* Right: user + logout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: headerVisible ? 1 : 0,
            transition: 'opacity 200ms ease',
            transitionDelay: headerVisible ? '50ms' : '0ms',
            pointerEvents: headerVisible ? 'auto' : 'none',
          }}
        >
          <UserBadge name={user?.name} email={user?.email} />
          <LogoutButton />
        </div>
      </header>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15); }
        }
      `}</style>
    </>
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