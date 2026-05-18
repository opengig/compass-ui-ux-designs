"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Settings,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { cn } from "@/lib/utils";
import { SITES } from "@/data/sites";

// Audit Trail intentionally excluded from main nav — surfaced contextually
// per-MOG via the Audit Log drawer in detail views. The /audit route still
// exists for admin/internal access.
//
// Mapped Items intentionally removed from main nav — all mapped data now
// lives inline inside the Worklist (filter via the "Mapped" tab). The
// /mapped route still exists in the codebase but is no longer linked from
// here so the unified Worklist surface is the single source of truth.
const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/worklist", label: "My Tasks", icon: Inbox },
  // Exceptions tab hidden from nav for now — surface still lives at
  // /exceptions but isn't linked from the sidebar.
  { href: "/settings", label: "Settings", icon: Settings },
];

const OPEN_EXCEPTION_STATUSES = new Set(["open", "pending-culinary", "pending-procurement"]);

export function AppSidebar() {
  const pathname = usePathname();
  const decisions = useMockStore((s) => s.decisions);
  const exceptions = useMockStore((s) => s.exceptions);
  const siteFilter = useMockStore((s) => s.siteFilter);
  const setSiteFilter = useMockStore((s) => s.setSiteFilter);
  const [siteOpen, setSiteOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const inSite = (siteId?: string) =>
    siteFilter === "all" || (siteId !== undefined && siteId === siteFilter);
  const selectedSite = SITES.find((s) => s.id === siteFilter);

  const worklistCount = decisions.filter((d) => d.status === "pending" && inSite(d.siteId)).length;
  const exceptionsCount = exceptions.filter(
    (e) => OPEN_EXCEPTION_STATUSES.has(e.status) && inSite(e.siteId)
  ).length;

  const COUNTS: Record<string, number | undefined> = {
    "/worklist": worklistCount,
    "/exceptions": exceptionsCount,
  };

  // Collapsed state — local UI only (intentionally not persisted; matches the
  // spec's `useState` example). Width swaps between 240px and 70px with a
  // smooth transition; text labels collapse, icons stay centered.
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute fixed dropdown position from trigger rect whenever it opens.
  // Fixed positioning escapes overflow:hidden on the aside.
  useEffect(() => {
    if (siteOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    } else {
      setDropdownPos(null);
    }
  }, [siteOpen]);

  return (
    <aside
      className={cn(
        // Sticky + viewport-tall + own overflow → sidebar stays put while
        // child pages scroll independently. self-start prevents the flex
        // parent from forcing it to stretch to a taller-than-viewport size
        // when a heavy child page tries to grow the layout.
        "hidden md:flex shrink-0 flex-col border-r border-border bg-card/40",
        "sticky top-0 self-start h-screen overflow-hidden",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      {/* Compass Group brand gold top-stripe */}
      <div className="h-[3px] w-full bg-brand shrink-0" />

      {/* Top: logo + toggle */}
      <div
        className={cn(
          "px-3 pt-3.5 pb-3 flex items-center gap-2",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {/* Brand block — wordmark only, no logo or subtitle. */}
        {!isCollapsed && (
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[14px] font-semibold tracking-tight truncate text-brand">CMP Autobot</span>
          </div>
        )}

        {/* Toggle button — only visible when expanded so the logo can center
            cleanly when collapsed; collapsed users hit the standalone toggle
            below the logo. */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse sidebar"
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Standalone expand button when collapsed (full-width tap target) */}
      {isCollapsed && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand sidebar"
            className="flex w-full h-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Site selector */}
      <div className="px-3 mt-3 mb-1">
        {isCollapsed ? (
          <button
            type="button"
            title={selectedSite ? `${selectedSite.name} · ${selectedSite.code}` : "Site"}
            onClick={() => setSiteOpen((o) => !o)}
            className="flex h-9 w-9 mx-auto items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <MapPin className="h-4 w-4 shrink-0" />
          </button>
        ) : (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setSiteOpen((o) => !o)}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-sm text-[12px] transition-all outline-none",
              "bg-white text-zinc-900 font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-zinc-200"
            )}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-left truncate">
              {selectedSite ? `${selectedSite.name} · ${selectedSite.code}` : "Select site"}
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", siteOpen && "rotate-180")} />
          </button>
        )}
      </div>

      {/* Site dropdown — fixed so overflow:hidden on aside doesn't clip it */}
      {siteOpen && dropdownPos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setSiteOpen(false)} />
          <div
            className="fixed z-50 rounded-md border border-border bg-popover shadow-md overflow-hidden"
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
          >
            {SITES.map((site) => (
              <button
                key={site.id}
                type="button"
                onClick={() => { setSiteFilter(site.id); setSiteOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-2 text-[12px] transition-colors hover:bg-accent flex items-center justify-between",
                  siteFilter === site.id ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                <span>{site.name}</span>
                <span className="text-[10.5px] text-muted-foreground/60">{site.code}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 mt-2">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const count = COUNTS[item.href];
          const showCount = typeof count === "number" && count > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "group flex items-center rounded-md text-sm transition-colors",
                isCollapsed
                  ? "justify-center h-9 w-9 mx-auto"
                  : "gap-2 px-2.5 py-1.5",
                active
                  ? "bg-brand-soft text-brand font-medium"
                  : "text-muted-foreground/55 hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer — text hides when collapsed */}
      {!isCollapsed && (
        <div className="mt-auto px-5 py-4 border-t border-border">
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <div className="font-medium text-brand">Compass Group India</div>
            <div>Logged in as Aman Verma</div>
            <div>CMP Team · Menu Planning</div>
          </div>
        </div>
      )}
    </aside>
  );
}
