"use client";

import { CalendarClock, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { paceVerdict, workloadFor, effectiveTargetDate } from "@/lib/selectors";
import { cn } from "@/lib/utils";

const CURRENT_USER = "Aman";

const STATUS_COPY: Record<
  ReturnType<typeof paceVerdict>["status"],
  { label: string; tone: string; ring: string; icon: typeof CheckCircle2 }
> = {
  "on-track": {
    label: "On track",
    tone: "bg-green-queue-soft text-green-queue border-green-queue/30",
    ring: "ring-green-queue/20",
    icon: CheckCircle2,
  },
  tight: {
    label: "Tight",
    tone: "bg-amber-queue-soft text-amber-queue border-amber-queue/30",
    ring: "ring-amber-queue/20",
    icon: AlertTriangle,
  },
  late: {
    label: "Will miss target",
    tone: "bg-red-queue-soft text-red-queue border-red-queue/30",
    ring: "ring-red-queue/20",
    icon: AlertCircle,
  },
  stalled: {
    label: "Stalled",
    tone: "bg-red-queue-soft text-red-queue border-red-queue/30",
    ring: "ring-red-queue/20",
    icon: AlertCircle,
  },
};

export function DashboardGreeting() {
  const decisions = useMockStore((s) => s.decisions);
  const mogs = useMockStore((s) => s.mogs);
  const audit = useMockStore((s) => s.audit);
  const target = useMockStore((s) => s.target);
  const siteFilter = useMockStore((s) => s.siteFilter);
  const sites = useMockStore((s) => s.sites);

  const original = workloadFor({ decisions, mogs }, "original");
  const verdict = paceVerdict({ decisions, mogs, audit, target, siteFilter });
  const status = STATUS_COPY[verdict.status];
  const Icon = status.icon;

  const greeting = greet(new Date());
  const exerciseDays = exerciseDay(target.exerciseStartedOn);
  const targetLabel = new Date(effectiveTargetDate(target, siteFilter)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const isOverride =
    siteFilter !== "all" && Boolean(target.siteTargetDates?.[siteFilter]);
  const overrideSite = isOverride ? sites.find((s) => s.id === siteFilter) : null;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card px-6 py-5 lg:px-8 lg:py-5 ring-2",
        status.ring,
        "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
            {greeting} · Day {exerciseDays} of the exercise
          </p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            {greeting}, {CURRENT_USER}.
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/85 max-w-3xl">
            You&apos;ve mapped{" "}
            <span className="font-semibold text-foreground">
              {original.mapped} of {original.total}
            </span>{" "}
            Ingredients in the original baseline (
            <span className="font-semibold text-foreground">{original.percentComplete}%</span>).{" "}
            {verdict.oneLine}
          </p>
          <div className="mt-2.5 flex items-center gap-3 text-[11.5px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              Target {targetLabel}
              {isOverride && overrideSite && (
                <span className="text-amber-queue ml-1">· {overrideSite.city} override</span>
              )}
            </span>
            <span className="opacity-50">·</span>
            <span>
              {verdict.daysToTarget} day{verdict.daysToTarget === 1 ? "" : "s"} remaining
            </span>
            <span className="opacity-50">·</span>
            <span>
              Pace{" "}
              <span className="text-foreground font-medium numeric-tabular">
                {verdict.ratePerDay.toFixed(1)}
              </span>
              /day
            </span>
          </div>
        </div>
        <div
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
            status.tone
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          {status.label}
        </div>
      </div>
    </div>
  );
}

function greet(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function exerciseDay(startIso: string): number {
  const start = new Date(startIso).getTime();
  const now = Date.now();
  return Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
}

