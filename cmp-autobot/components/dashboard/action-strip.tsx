"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { pendingDecisionCounts } from "@/lib/selectors";
import { QUEUES, QUEUE_ORDER } from "@/lib/queue-config";
import type { Queue } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ActionStrip() {
  const decisions = useMockStore((s) => s.decisions);
  const counts = pendingDecisionCounts({ decisions });

  // "Start here today" = first queue in priority order with a non-zero pending count.
  // Priority mirrors QUEUE_ORDER: amber → red → green → blue.
  const startHere: Queue | null = QUEUE_ORDER.find((q) => counts[q] > 0) ?? null;

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            Open this morning
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Tap a queue to start working through it
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {QUEUE_ORDER.map((k) => {
          const cfg = QUEUES[k];
          const Icon = cfg.icon;
          const isStart = startHere === k;
          const empty = counts[k] === 0;
          return (
            <Link
              key={k}
              href={`/worklist?queue=${k}`}
              aria-label={`Open ${cfg.shortLabel} queue — ${counts[k]} pending`}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-xl border bg-background px-3 pt-3 pb-2 transition-all",
                "hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                cfg.borderClass,
                isStart && !empty && cn("ring-2", cfg.ringClass),
                empty && "opacity-60"
              )}
            >
              <span className={cn("absolute left-0 top-0 bottom-0 w-1", cfg.stripeClass)} />
              <div className="flex items-center justify-between pl-2">
                <div className="flex items-center gap-1.5">
                  <Icon className={cn("h-3 w-3", cfg.textClass)} />
                  <span className="text-[10.5px] uppercase tracking-wide font-medium text-foreground/80">
                    {cfg.shortLabel}
                  </span>
                </div>
                {isStart && !empty && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                      cfg.bgSoftClass,
                      cfg.textClass
                    )}
                  >
                    Start
                  </span>
                )}
              </div>
              <div className="pl-2 text-[34px] font-semibold leading-none numeric-tabular tracking-tight">
                {counts[k]}
              </div>
              <div className="pl-2 text-[10.5px] text-muted-foreground">
                {empty
                  ? "nothing pending"
                  : counts[k] === 1
                  ? "mapping pending"
                  : "mappings pending"}
              </div>
              {/* Explicit CTA footer — turns the whole card from "informational tile" into "clickable action". */}
              <div
                className={cn(
                  "mt-2 -mx-3 -mb-2 px-3 py-1.5 border-t flex items-center justify-between transition-colors",
                  empty
                    ? "border-border bg-muted/30 text-muted-foreground"
                    : cn(
                        "border-transparent",
                        cfg.bgSoftClass,
                        cfg.textClass,
                        "group-hover:brightness-95"
                      )
                )}
              >
                <span className="text-[11px] font-semibold tracking-tight">
                  {empty ? "All clear" : `Open ${cfg.shortLabel}`}
                </span>
                {!empty && <ArrowRight className="h-3.5 w-3.5" />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
