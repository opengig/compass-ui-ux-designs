"use client";

import Link from "next/link";
import { useMemo } from "react";
import { QUEUES } from "@/lib/queue-config";
import type { MappingDecision } from "@/lib/types";
import { useMockStore } from "@/lib/mock-store";
import { cn } from "@/lib/utils";

interface WorklistRowProps {
  decision: MappingDecision;
  active: boolean;
  href: string;
}

export function WorklistRow({ decision, active, href }: WorklistRowProps) {
  const mogs = useMockStore((s) => s.mogs);
  const cfg = QUEUES[decision.queue];

  const mog = useMemo(() => mogs.find((m) => m.id === decision.mogId), [mogs, decision.mogId]);

  const isDone = decision.status !== "pending";
  const isEscalated = decision.status === "escalated";
  const isPending = decision.status === "pending";
  // "Needs action" pill — only on Red queue pending items, where the
  // status badge clarifies what the user is being asked to do.
  const showNeedsAction = isPending && decision.queue === "red";

  // Single APL count per spec — "X APLs" instead of the older
  // "X candidate APLs" or progress-aware "N mapped · M remaining".
  // The detail view is the place to see partial-mapping progress;
  // the list stays a quick navigation aid with one consistent
  // right-aligned number per row.
  const totalCount = decision.candidateAplIds.length;

  return (
    <Link
      href={href}
      className={cn(
        "group relative block px-4 py-3 border-b border-border/70 transition-colors",
        active ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <div className="min-w-0">
        {/* Line 1 — MOG name (left) + APL count (right).
            justify-between anchors the count to the right edge so it
            lines up vertically across rows. items-center (vs the old
            items-baseline) keeps the count optically centered against
            the title's cap-height — at this small size baseline-align
            made the count look like it was sagging. */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <span
            className={cn(
              "text-sm font-medium tracking-tight truncate",
              isDone && !isEscalated && "line-through text-muted-foreground"
            )}
          >
            {mog?.name ?? decision.mogId}
          </span>
          {/* Lighter than text-muted-foreground so the count recedes
              and the MOG name owns the row's primary attention. */}
          <span className="shrink-0 text-xs text-muted-foreground/60 numeric-tabular tabular-nums">
            {totalCount} Article{totalCount === 1 ? "" : "s"}
          </span>
        </div>

        {/* Status pills — conditional, sit on a second line only
            when the queue/state warrants surfacing them. */}
        {isEscalated && (
          <span className="mt-1.5 inline-flex items-center rounded-md bg-amber-queue-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-queue">
            Escalated
          </span>
        )}
        {showNeedsAction && (
          <span className="mt-1.5 inline-flex items-center rounded-md bg-red-queue-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-queue">
            Needs action
          </span>
        )}
      </div>
    </Link>
  );
}
