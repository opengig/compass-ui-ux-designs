"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatRelativeDays } from "@/lib/utils";

// A decision shows up in Mapped Items when ANY APL has been mapped on
// it — regardless of whether the rest of its candidates are still
// being worked on in the Worklist. This is the spec's "as soon as 1
// APL is confirmed, MOG appears in Mapped Items" behaviour. Status
// "confirmed"/"entered" are the fully-done terminal states; partials
// stay status="pending" but light up here via mappedAplIds.length.
const MAPPED_STATUSES = new Set(["confirmed", "entered"]);
const isMappedView = (
  d: import("@/lib/types").MappingDecision
): boolean =>
  MAPPED_STATUSES.has(d.status) || (d.mappedAplIds?.length ?? 0) > 0;

interface MappedListProps {
  activeId: string | null;
}

export function MappedList({ activeId }: MappedListProps) {
  const decisions = useMockStore((s) => s.decisions);
  const mogs = useMockStore((s) => s.mogs);
  const siteFilter = useMockStore((s) => s.siteFilter);

  const list = useMemo(() => {
    return decisions
      .filter(isMappedView)
      .filter((d) => siteFilter === "all" || d.siteId === siteFilter)
      .sort((a, b) => {
        // Most-recently confirmed first
        const at = a.actionedAt ? new Date(a.actionedAt).getTime() : 0;
        const bt = b.actionedAt ? new Date(b.actionedAt).getTime() : 0;
        return bt - at;
      });
  }, [decisions, siteFilter]);

  // Outer flex column owns the height; the ScrollArea inside grows to
  // fill the remaining space (flex-1 + min-h-0). Without this wrapper
  // the ScrollArea was auto-sizing to its content and the aside's
  // overflow-hidden clipped the bottom rows — list felt stuck because
  // there was no actual scroll surface.
  return (
    <div className="flex flex-col h-full min-h-0">
      {list.length === 0 ? (
        <div className="flex items-center justify-center flex-1 p-8 text-center">
          <div>
            <div className="text-base font-medium">No mapped items yet</div>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              Confirmed mappings from the Worklist appear here.
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          {list.map((d) => {
            const mog = mogs.find((m) => m.id === d.mogId);
            const isActive = activeId === d.id;
            return (
              <Link
                key={d.id}
                href={`/mapped/${d.id}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative block border-b border-border/70 pl-4 pr-3 py-3 transition-colors",
                  "hover:bg-accent/60",
                  isActive ? "bg-accent" : "bg-card"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r transition-opacity",
                    isActive ? "bg-primary opacity-100" : "opacity-0"
                  )}
                />
                {/* Two-line row, status-free per spec.
                    L1: Ingredient name (sm/medium)
                    L2: relative time (smaller, muted)
                    Active stripe on the left + chevron on the right
                    are navigation affordances, not status, so they
                    stay. */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {mog?.name ?? d.mogId}
                    </div>
                    {d.actionedAt && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatRelativeDays(d.actionedAt)}
                      </div>
                    )}
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform mt-1 shrink-0",
                      "group-hover:translate-x-0.5 group-hover:text-foreground"
                    )}
                  />
                </div>
              </Link>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );
}
