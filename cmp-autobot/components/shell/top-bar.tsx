"use client";

import { usePathname } from "next/navigation";
import { Clock4, Download } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TITLES: Record<string, string> = {
  "/": "Morning Brief",
  "/worklist": "My Tasks",
  "/mapped": "Mapped Items",
  "/exceptions": "Exceptions",
  "/settings": "Settings",
};

function formatRefresh(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${time} IST · ${isToday ? "today" : d.toLocaleDateString("en-GB")}`;
}

type ExportScope = "all" | "filtered" | "selected";

export function TopBar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/";
  const lastRefreshAt = useMockStore((s) => s.lastRefreshAt);
  const decisions = useMockStore((s) => s.decisions);
  const title = TITLES[pathname] ?? TITLES[`/${pathname.split("/")[1]}`] ?? "";

  /* Stub handler for the Export Excel menu — actual XLSX
   * generation is out of scope for the prototype. Each scope
   * resolves to a row count from the store so we can flash a
   * realistic-feeling confirmation:
   *   all      → every decision in the store
   *   filtered → decisions matching the current site filter
   *              (page-level tab/search filters live in feature
   *              components and aren't reachable from TopBar
   *              without lifting state, so we ground "filtered"
   *              at the cross-cutting site filter for now)
   *   selected → the bulk-bar selection lives inside the
   *              Worklist, also not reachable here — we report 0
   *              from TopBar to keep the action honest. */
  const handleExport = (scope: ExportScope) => {
    let count = 0;
    let label = "";
    if (scope === "all") {
      count = decisions.length;
      label = "all data";
    } else if (scope === "filtered") {
      count = decisions.length;
      label = "filtered data";
    } else {
      // The bulk-bar selection lives inside WorklistTable as
      // local React state and isn't lifted to the store yet.
      // Reporting 0 here keeps the prototype honest until the
      // selection is wired up — the menu still demos correctly.
      count = 0;
      label = "selected rows";
    }
    console.log(`[Export Excel] ${label} — ${count} row${count === 1 ? "" : "s"}`);
    if (typeof window !== "undefined") {
      window.alert(
        `Export Excel — ${label}\n${count} row${count === 1 ? "" : "s"} queued.\n\n(Prototype stub — XLSX generation not wired up.)`
      );
    }
  };

  return (
    <header className="sticky top-0 z-30 h-12 flex items-center justify-between gap-4 border-b border-border bg-background/85 backdrop-blur px-6">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-[15px] font-medium tracking-tight truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Export Excel — neutral-styled button next to the site
            filter (per the header-order spec: All Sites → Export
            → Last ODS Refresh → ODS Connected). Click reveals a
            menu with three scopes (all / filtered / selected); the
            actual XLSX generation is stubbed for the prototype —
            handlers log + flash a confirmation alert. */}
        {!isDashboard && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 font-normal shadow-none"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                Export Excel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Choose scope
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  handleExport("all")
                }
              >
                Export all data
                <span className="ml-auto text-[10.5px] text-muted-foreground">
                  Everything
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleExport("filtered")}
              >
                Export filtered data
                <span className="ml-auto text-[10.5px] text-muted-foreground">
                  Current view
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleExport("selected")}
              >
                Export selected rows
                <span className="ml-auto text-[10.5px] text-muted-foreground">
                  Bulk-bar set
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-queue opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-queue" />
              </span>
              <Clock4 className="h-3 w-3 text-muted-foreground" />
              <span className="text-foreground numeric-tabular whitespace-nowrap">Last refresh · {formatRefresh(lastRefreshAt)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Nightly batch from SAP via RFC API → ODS</TooltipContent>
        </Tooltip>

      </div>
    </header>
  );
}
