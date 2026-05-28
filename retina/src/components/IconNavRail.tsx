import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Inbox, Send } from 'lucide-react';
import { ROUTES } from '../router/routes';
import { COMPASS_LOGO } from './nutritionist/data/images';

type NavItemDef = {
  key: string;
  label: string;
  Icon: React.ElementType;
  path: string;
};

/**
 * Left-side icon nav rail for the Article SME flow.
 * Mirrors the Nutritionist SideNav look: fixed 72px rail, Compass logo on top,
 * vertical icon+label buttons, user avatar pinned to the bottom.
 */
export function IconNavRail() {
  const location = useLocation();
  const navigate = useNavigate();

  const NAV: NavItemDef[] = [
    { key: 'inbox', label: 'My Tasks', Icon: Inbox, path: ROUTES.review },
    { key: 'submitted', label: 'Submitted', Icon: Send, path: ROUTES.submitted },
  ];

  const pathname = location.pathname;
  const active = pathname.startsWith(ROUTES.submitted) ? 'submitted' : 'inbox';

  return (
    <aside className="flex-shrink-0 flex flex-col w-[72px] bg-card border-r border-border relative z-[100]">
      {/* Logo */}
      <div className="flex items-center justify-center flex-shrink-0 h-[52px] px-2 pt-2.5 pb-1">
        <img src={COMPASS_LOGO} alt="Compass Group" className="w-11 h-11 object-contain" />
      </div>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col overflow-y-auto py-1">
        {NAV.map((item) => (
          <NavBtn
            key={item.key}
            item={item}
            isActive={active === item.key}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      {/* User avatar */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center py-3 gap-1 border-t border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted border border-border">
          <span className="text-[11px] font-semibold text-muted-foreground -tracking-[0.01em]">PS</span>
        </div>
        <span className="text-[10px] text-muted-foreground/80 tracking-wide leading-none">Priya</span>
      </div>
    </aside>
  );
}

function NavBtn({
  item,
  isActive,
  onClick,
}: {
  item: NavItemDef;
  isActive: boolean;
  onClick: () => void;
}) {
  const { Icon } = item;
  return (
    <button
      onClick={onClick}
      title={item.label}
      className={`relative w-full h-16 flex flex-col items-center justify-center gap-[3px] transition-colors ${
        isActive ? '' : 'hover:bg-muted/40'
      }`}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-primary"
          aria-hidden
        />
      )}
      <div className="relative flex items-center justify-center w-10 h-8 rounded-lg">
        <Icon size={17} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
      </div>
      <span
        className={`text-[10px] tracking-wide leading-none ${
          isActive ? 'text-primary font-semibold' : 'text-muted-foreground font-normal'
        }`}
      >
        {item.label}
      </span>
    </button>
  );
}
