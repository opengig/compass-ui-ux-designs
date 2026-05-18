import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  BookOpen,
  Globe,
  ChevronDown,
} from 'lucide-react';
import type { Screen } from '../types';

const NAV_ITEMS: { icon: React.ElementType; label: string; screen: Screen; badge?: number }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', screen: 'dashboard' },
  { icon: ClipboardList,   label: 'Tasks',     screen: 'queue',     badge: 76 },
  { icon: CheckCircle2,    label: 'Approved',  screen: 'approved' },
  { icon: BookOpen,        label: 'Audit',     screen: 'audit' },
  { icon: Globe,           label: 'Sites',     screen: 'sites' },
];

interface IconNavRailProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function IconNavRail({ activeScreen, onNavigate }: IconNavRailProps) {
  return (
    <aside className="w-[60px] min-w-[70px] flex flex-col items-center py-4 border-r border-border bg-white h-full">
      <div className="mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm">⚡</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(item => {
          const active = activeScreen === item.screen;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.screen)}
              className={`relative flex flex-col items-center justify-center w-12 h-14 rounded-lg text-xs gap-1 transition-colors ${
                active
                  ? 'text-primary bg-primary/10 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge != null && (
                  <span className="absolute -top-2 -right-3 bg-primary text-primary-foreground text-[0.625rem] font-medium rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto">
        <div className="w-8 h-8 rounded-full bg-primary/85 flex items-center justify-center text-primary-foreground text-xs font-medium">
          PS
        </div>
        <span className="text-xs text-muted-foreground mt-1 block text-center">Priya</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground mx-auto mt-0.5" />
      </div>
    </aside>
  );
}
