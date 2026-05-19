import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Inbox,
  LayoutDashboard,
  BookMarked,
  Settings,
  ChevronRight,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { ROUTES } from '../router/routes';

type NavItemDef = {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
};

export function IconNavRail() {
  const [expanded, setExpanded] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem('retina:nav-expanded') === '1';
  });
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement | null>(null);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('retina:nav-expanded', next ? '1' : '0');
      }
      return next;
    });
  };

  React.useEffect(() => {
    if (!profileOpen) {
      return;
    }
    const onDocClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [profileOpen]);

  const items: NavItemDef[] = [
    { to: ROUTES.review, icon: Inbox, label: 'Inbox' },
    { to: ROUTES.dashboard, icon: LayoutDashboard, label: 'Dashboard' },
    { to: ROUTES.catalog, icon: BookMarked, label: 'Catalog' },
  ];

  return (
    <aside
      className={`flex-shrink-0 flex flex-col py-3 bg-card border-r border-border transition-[width] duration-150 ${
        expanded ? 'w-48' : 'w-14'
      }`}
    >
      {/* Collapse toggle — top of the rail */}
      <button
        onClick={toggleExpanded}
        className={`flex items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors mb-3 ${
          expanded ? 'gap-2 mx-2 px-2 py-1.5 justify-end' : 'mx-2 justify-center py-1.5'
        }`}
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {expanded ? (
          <ChevronLeft className="w-4 h-4 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0" />
        )}
      </button>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {items.map((item) => (
          <NavItem key={item.to} item={item} expanded={expanded} />
        ))}
      </nav>

      {/* Footer: Settings + Profile */}
      <div className="mt-auto flex flex-col gap-0.5 px-2 pt-2 border-t border-border">
        <NavItem
          item={{ to: ROUTES.settings, icon: Settings, label: 'Settings' }}
          expanded={expanded}
        />

        {/* Profile button */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className={`w-full flex items-center rounded-md transition-colors hover:bg-muted/40 ${
              expanded ? 'gap-2 px-2 py-1.5' : 'justify-center py-1.5'
            } ${profileOpen ? 'bg-muted/40' : ''}`}
            aria-label="Profile menu"
            title="Profile"
          >
            <span className="w-7 h-7 rounded-full border border-foreground/40 text-foreground flex items-center justify-center text-[11px] font-semibold shrink-0">
              PS
            </span>
            {expanded ? (
              <div className="min-w-0 text-left">
                <p className="text-[12.5px] font-medium text-foreground leading-tight truncate">
                  Priya Sharma
                </p>
                <p className="text-[10.5px] text-muted-foreground truncate">Article SME</p>
              </div>
            ) : null}
          </button>

          {profileOpen ? (
            <div className="absolute bottom-full left-full ml-2 mb-1 w-48 rounded-lg border border-border bg-card shadow-soft overflow-hidden z-50">
              <NavLink
                to={ROUTES.settings}
                onClick={() => setProfileOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground hover:bg-muted/40"
              >
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                Settings
              </NavLink>
              <button
                onClick={() => setProfileOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground hover:bg-muted/40 border-t border-border/70"
              >
                <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function NavItem({ item, expanded }: { item: NavItemDef; expanded: boolean }) {
  return (
    <NavLink
      to={item.to}
      title={!expanded ? item.label : undefined}
      className={({ isActive }) =>
        `relative flex items-center rounded-md transition-colors ${
          expanded ? 'gap-2 px-2 py-1.5' : 'justify-center py-2'
        } ${
          isActive
            ? 'bg-primary/15 text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              className={`absolute bg-primary rounded-r-full ${
                expanded ? 'left-0 top-1.5 bottom-1.5 w-0.5' : 'left-0 top-1 bottom-1 w-0.5'
              }`}
              aria-hidden
            />
          ) : null}
          <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
          {expanded ? <span className="text-[12.5px]">{item.label}</span> : null}
          {item.badge && item.badge > 0 ? (
            expanded ? (
              <span
                className={`ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] tabular-nums ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground'
                }`}
              >
                {item.badge}
              </span>
            ) : (
              <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] tabular-nums">
                {item.badge}
              </span>
            )
          ) : null}
        </>
      )}
    </NavLink>
  );
}
