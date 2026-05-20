import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MapPin, Settings, ChevronRight, ChevronLeft, LogOut } from 'lucide-react';
import { ADMIN_ROUTES, SHARED_ROUTES } from '../../router/routes';

const COLLAPSE_KEY = 'retina:admin-nav-collapsed';

type Tab = { to: string; icon: React.ElementType; label: string; match: (p: string) => boolean };

const TABS: Tab[] = [
  { to: ADMIN_ROUTES.dashboard, icon: LayoutDashboard, label: 'Dashboard', match: (p) => p === ADMIN_ROUTES.dashboard },
  { to: ADMIN_ROUTES.users,     icon: Users,           label: 'Users',     match: (p) => p.startsWith(ADMIN_ROUTES.users) },
  { to: ADMIN_ROUTES.sites,     icon: MapPin,          label: 'Sites',     match: (p) => p.startsWith(ADMIN_ROUTES.sites) },
  { to: ADMIN_ROUTES.config,    icon: Settings,        label: 'Config',    match: (p) => p.startsWith(ADMIN_ROUTES.config) },
];

export function AdminShell() {
  return (
    <div className="flex w-full h-screen bg-background font-heading text-foreground overflow-hidden">
      <AdminSideNav />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

function AdminSideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(COLLAPSE_KEY) !== '1';
  });
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement | null>(null);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '0' : '1');
      }
      return next;
    });
  };

  React.useEffect(() => {
    if (!profileOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [profileOpen]);

  const signOut = () => {
    setProfileOpen(false);
    navigate(SHARED_ROUTES.login);
  };

  return (
    <aside
      className={`flex-shrink-0 flex flex-col py-3 bg-card border-r border-border transition-[width] duration-150 ${
        expanded ? 'w-48' : 'w-14'
      }`}
    >
      <button
        onClick={toggleExpanded}
        className={`flex items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors mb-3 ${
          expanded ? 'gap-2 mx-2 px-2 py-1.5 justify-end' : 'mx-2 justify-center py-1.5'
        }`}
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {expanded ? <ChevronLeft className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
      </button>

      {expanded ? (
        <div className="px-3 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Administration</p>
        </div>
      ) : null}

      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {TABS.map((tab) => {
          const isActive = tab.match(location.pathname);
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              title={!expanded ? tab.label : undefined}
              className={`relative flex items-center rounded-md transition-colors ${
                expanded ? 'gap-2 px-2 py-1.5' : 'justify-center py-2'
              } ${
                isActive
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {isActive ? (
                <span
                  className={`absolute bg-primary rounded-r-full ${
                    expanded ? 'left-0 top-1.5 bottom-1.5 w-0.5' : 'left-0 top-1 bottom-1 w-0.5'
                  }`}
                  aria-hidden
                />
              ) : null}
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
              {expanded ? <span className="text-[12.5px]">{tab.label}</span> : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-2 border-t border-border">
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className={`w-full flex items-center rounded-md transition-colors hover:bg-muted/40 ${
              expanded ? 'gap-2 px-2 py-1.5' : 'justify-center py-1.5'
            } ${profileOpen ? 'bg-muted/40' : ''}`}
            aria-label="Profile menu"
            title="Profile"
          >
            <span className="w-7 h-7 rounded-full border border-foreground/40 text-foreground flex items-center justify-center text-[11px] font-semibold shrink-0">
              AV
            </span>
            {expanded ? (
              <div className="min-w-0 text-left">
                <p className="text-[12.5px] font-medium text-foreground leading-tight truncate">Aditi Verma</p>
                <p className="text-[10.5px] text-muted-foreground truncate">Super Admin</p>
              </div>
            ) : null}
          </button>

          {profileOpen ? (
            <div className="absolute bottom-full left-full ml-2 mb-1 w-44 rounded-lg border border-border bg-card shadow-soft overflow-hidden z-50">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
