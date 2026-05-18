"use client";

import { QUEUES } from "@/lib/queue-config";
import type { Queue } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QueueChipProps {
  queue: Queue;
  active?: boolean;
  count?: number;
  onClick?: () => void;
  size?: "sm" | "md";
  recommended?: boolean;
}

export function QueueChip({ queue, active, count, onClick, size = "md", recommended }: QueueChipProps) {
  const cfg = QUEUES[queue];
  const Icon = cfg.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={recommended ? `${cfg.shortLabel} — start here today` : cfg.shortLabel}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        active
          ? cn("border-transparent text-foreground", cfg.bgSoftClass)
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
        recommended && !active && cn("ring-1", cfg.ringClass)
      )}
    >
      <Icon className={cn("h-3 w-3", active ? cfg.textClass : "text-muted-foreground")} />
      <span>{cfg.shortLabel}</span>
      {typeof count === "number" && (
        <span className={cn("numeric-tabular tabular-nums opacity-80")}>{count}</span>
      )}
      {recommended && (
        <span
          className={cn(
            "ml-0.5 inline-flex items-center rounded-full px-1.5 py-px text-[9px] uppercase tracking-wider font-semibold",
            cfg.bgSoftClass,
            cfg.textClass
          )}
        >
          Start
        </span>
      )}
    </button>
  );
}

export function QueueBadge({ queue, className }: { queue: Queue; className?: string }) {
  const cfg = QUEUES[queue];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        cfg.bgSoftClass,
        cfg.textClass,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.shortLabel}
    </span>
  );
}
