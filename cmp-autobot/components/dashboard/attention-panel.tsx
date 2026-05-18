"use client";

import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { dashboardAlerts, type AlertSeverity } from "@/lib/selectors";
import { cn } from "@/lib/utils";

const ICON: Record<AlertSeverity, LucideIcon> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const TONE: Record<
  AlertSeverity,
  { wrap: string; icon: string; cta: string; eyebrow: string; label: string }
> = {
  critical: {
    wrap: "border-red-queue/40 bg-red-queue-soft/40",
    icon: "text-red-queue bg-red-queue/15",
    cta: "bg-red-queue text-white hover:bg-red-queue/90 border-red-queue",
    eyebrow: "text-red-queue",
    label: "Needs attention now",
  },
  warning: {
    wrap: "border-amber-queue/40 bg-amber-queue-soft/40",
    icon: "text-amber-queue bg-amber-queue/15",
    cta: "bg-amber-queue text-white hover:bg-amber-queue/90 border-amber-queue",
    eyebrow: "text-amber-queue",
    label: "Watch list",
  },
  info: {
    wrap: "border-blue-queue/30 bg-blue-queue-soft/40",
    icon: "text-blue-queue bg-blue-queue/15",
    cta: "bg-blue-queue text-white hover:bg-blue-queue/90 border-blue-queue",
    eyebrow: "text-blue-queue",
    label: "Heads up",
  },
  success: {
    wrap: "border-green-queue/35 bg-green-queue-soft/40",
    icon: "text-green-queue bg-green-queue/15",
    cta: "bg-green-queue text-white hover:bg-green-queue/90 border-green-queue",
    eyebrow: "text-green-queue",
    label: "All good",
  },
};

export function AttentionPanel() {
  const decisions = useMockStore((s) => s.decisions);
  const mogs = useMockStore((s) => s.mogs);
  const audit = useMockStore((s) => s.audit);
  const target = useMockStore((s) => s.target);
  const siteFilter = useMockStore((s) => s.siteFilter);

  const alerts = dashboardAlerts({ decisions, mogs, audit, target, siteFilter });
  // Pick the most pressing alert that has an action; otherwise fall back to first.
  const top = alerts.find((a) => a.href && a.cta) ?? alerts[0];
  if (!top) return null;

  const tone = TONE[top.severity];
  const Icon = ICON[top.severity];

  return (
    <div className={cn("rounded-2xl border p-5 flex flex-col h-full", tone.wrap)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl",
            tone.icon
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[10.5px] uppercase tracking-[0.16em] font-semibold",
              tone.eyebrow
            )}
          >
            {tone.label}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold tracking-tight leading-tight">{top.title}</h3>
        </div>
      </div>
      <p className="mt-3 text-[13.5px] text-foreground/85 leading-relaxed">{top.subtitle}</p>
      {top.href && top.cta && (
        <div className="mt-auto pt-4">
          <Link
            href={top.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px] font-semibold shadow-sm transition-colors",
              tone.cta
            )}
          >
            {top.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
