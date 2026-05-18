"use client";

import { Search } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { pendingDecisionCounts } from "@/lib/selectors";
import { QUEUES, QUEUE_ORDER } from "@/lib/queue-config";
import type { Queue } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  activeQueue: Queue;
  onSelectQueue: (q: Queue) => void;
  search: string;
  onSearchChange: (q: string) => void;
}

export function FilterBar({ activeQueue, onSelectQueue, search, onSearchChange }: FilterBarProps) {
  const decisions = useMockStore((s) => s.decisions);
  const counts = pendingDecisionCounts({ decisions });
  // Recommended highlights the first non-empty queue if it isn't already
  // selected — a soft hint without overriding the user's choice.
  const startHere: Queue | null = QUEUE_ORDER.find((q) => counts[q] > 0) ?? null;

  return (
    <div
      role="tablist"
      aria-label="Queue filter"
      className="border-b border-border bg-card/40"
    >
      <div className="grid grid-cols-4 gap-2 px-3 pt-3">
        {QUEUE_ORDER.map((q) => (
          <QueueTabCard
            key={q}
            queue={q}
            count={counts[q]}
            active={q === activeQueue}
            recommended={q === startHere && q !== activeQueue}
            onClick={() => onSelectQueue(q)}
          />
        ))}
      </div>
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Ingredient name or generic ingredient…"
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

interface QueueTabCardProps {
  queue: Queue;
  count: number;
  active: boolean;
  recommended: boolean;
  onClick: () => void;
}

function QueueTabCard({ queue, count, active, recommended, onClick }: QueueTabCardProps) {
  const cfg = QUEUES[queue];
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        // Compact 3-section card — count / label / subtext stacked
        // with a tight 4px gap. py-2.5 (≈10px) keeps the vertical
        // padding inside the spec's 10–12px target; min-h-[92px]
        // reserves room for a 2-line label OR a 2-line subtext
        // without lurching the row. min-w-0 keeps long subtext
        // confined to the card width so the line-clamp engages
        // instead of the button expanding. grid-cols-4 in the
        // parent syncs all four cards to the same height.
        "group relative flex flex-col items-start text-left rounded-lg border px-3 py-2.5 pl-3.5 min-h-[92px] min-w-0 gap-1",
        "transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? cn(cfg.bgSoftClass, cfg.borderClass, "shadow-xs")
          : "border-border bg-background text-muted-foreground hover:bg-accent/40 hover:text-foreground",
        recommended && !active && cn("ring-1", cfg.ringClass)
      )}
    >
      {/* Queue stripe — vertical accent on the left edge. Opacity
          drops to 50% when inactive so the active tab still owns the
          row's dominant color. */}
      <span
        className={cn(
          "absolute left-0 top-2 bottom-2 w-[3px] rounded-r transition-opacity duration-150",
          cfg.stripeClass,
          !active && "opacity-50"
        )}
      />

      {/* Section 1 — COUNT (top, prominent).
          Size unchanged from the previous pass per spec ("Keep count
          size unchanged"). leading-none + tabular-nums keep
          multi-digit counts crisp and aligned across tabs. */}
      <span
        className={cn(
          "text-xl font-semibold leading-none numeric-tabular tabular-nums transition-colors duration-150",
          active ? cfg.textClass : "text-foreground/85 group-hover:text-foreground"
        )}
      >
        {count}
      </span>

      {/* Section 2 — STATUS LABEL (middle).
          Trimmed from 11.5px → 11px (one-pixel reduction) per the
          compactness pass; leading-tight keeps wrapped two-line
          captions tight without feeling cramped. */}
      <span
        className={cn(
          "text-[11px] font-medium leading-tight transition-colors duration-150",
          active ? cfg.textClass : "text-foreground/80 group-hover:text-foreground"
        )}
      >
        {cfg.tabCaption}
      </span>

      {/* Section 3 — SUBTEXT (bottom).
          line-clamp-2 caps the subtext at 2 lines via the
          -webkit-line-clamp CSS rule, so long captions wrap
          gracefully instead of getting truncated mid-word. The
          card's min-h floor + grid-cols-4 row sync keep all four
          tabs at the same height even when one tab needs the 2nd
          subtext line. title= preserves the full text on hover for
          assistive tech and as a courtesy fallback. */}
      <span
        className="block w-full text-[10px] leading-[1.2] text-muted-foreground/60 group-hover:text-muted-foreground/80 transition-colors duration-150 line-clamp-2"
        title={cfg.tabSubtext}
      >
        {cfg.tabSubtext}
      </span>
    </button>
  );
}
