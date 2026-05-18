"use client";

import { Circle, CheckCircle2, MessageCircleQuestion, Wrench } from "lucide-react";
import type { ExceptionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ExceptionStatusPillProps {
  status: ExceptionStatus;
  size?: "sm" | "md";
  /** Compact mode shortens "Needs Culinary Input" → "Culinary" and
   *  "Needs Procurement Action" → "Procurement" so the pill fits in
   *  tight rows (e.g. the 340px Exceptions sidebar). Other statuses
   *  are already short and render unchanged. */
  compact?: boolean;
}

const CONFIG: Record<
  ExceptionStatus,
  {
    label: string;
    /** Optional shorter label used when `compact` is set. */
    compactLabel?: string;
    bgClass: string;
    textClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  open: { label: "Open", bgClass: "bg-muted", textClass: "text-muted-foreground", icon: Circle },
  linked: {
    label: "Linked",
    bgClass: "bg-green-queue-soft",
    textClass: "text-green-queue",
    icon: CheckCircle2,
  },
  "pending-culinary": {
    label: "Needs Culinary Input",
    compactLabel: "Culinary",
    bgClass: "bg-blue-queue-soft",
    textClass: "text-blue-queue",
    icon: MessageCircleQuestion,
  },
  "pending-procurement": {
    label: "Needs Procurement Action",
    compactLabel: "Procurement",
    bgClass: "bg-amber-queue-soft",
    textClass: "text-amber-queue",
    icon: Wrench,
  },
  resolved: {
    label: "Resolved",
    bgClass: "bg-green-queue-soft",
    textClass: "text-green-queue",
    icon: CheckCircle2,
  },
};

export function ExceptionStatusPill({
  status,
  size = "md",
  compact = false,
}: ExceptionStatusPillProps) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  const label = compact ? cfg.compactLabel ?? cfg.label : cfg.label;
  return (
    <span
      className={cn(
        // whitespace-nowrap defends against the pill's label
        // wrapping mid-word inside a tight flex parent — without it
        // the pill could break "Procurement" across two lines on
        // very narrow viewports.
        "inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        cfg.bgClass,
        cfg.textClass
      )}
    >
      <Icon className={cn("shrink-0", size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {label}
    </span>
  );
}
