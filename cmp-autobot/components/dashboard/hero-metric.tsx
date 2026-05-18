"use client";

import { CalendarClock, Target } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { workloadFor, daysToTarget, effectiveTargetDate } from "@/lib/selectors";
import { cn } from "@/lib/utils";

export function HeroMetric() {
  const decisions = useMockStore((s) => s.decisions);
  const mogs = useMockStore((s) => s.mogs);
  const sites = useMockStore((s) => s.sites);
  const target = useMockStore((s) => s.target);
  const siteFilter = useMockStore((s) => s.siteFilter);

  const original = workloadFor({ decisions, mogs }, "original");
  const effective = effectiveTargetDate(target, siteFilter);
  const isOverride =
    siteFilter !== "all" && Boolean(target.siteTargetDates?.[siteFilter]);
  const overrideSite = isOverride ? sites.find((s) => s.id === siteFilter) : null;
  const days = daysToTarget(effective);
  const targetLabel = new Date(effective).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const subLabel = isOverride
    ? `${days} day${days === 1 ? "" : "s"} · ${overrideSite?.city ?? "site"} override`
    : `${days} day${days === 1 ? "" : "s"} remaining`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      <div className="lg:col-span-7 rounded-2xl border border-border bg-card px-6 py-4 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-green-queue-soft opacity-60 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-queue" />
            Original workload progress
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-[64px] leading-none font-semibold tracking-tight numeric-tabular">
              {original.percentComplete}
              <span className="text-[30px] text-muted-foreground/70">%</span>
            </span>
            <span className="text-xs text-muted-foreground max-w-[260px] leading-snug">
              {original.mapped} of {original.total} Ingredients mapped against the baseline you committed to.
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-foreground/85 transition-all"
              style={{ width: `${original.percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 grid grid-rows-2 gap-3">
        <KpiCard
          icon={<Target className="h-3.5 w-3.5" />}
          label={isOverride ? "Target date · site override" : "Target date"}
          value={targetLabel}
          accent={cn(days <= 14 && "text-amber-queue")}
          sub={subLabel}
        />
        <KpiCard
          icon={<CalendarClock className="h-3.5 w-3.5" />}
          label="Exercise day"
          value={`Day ${exerciseDay(target.exerciseStartedOn)}`}
          sub={`Started ${new Date(target.exerciseStartedOn).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          })}`}
        />
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-3 flex flex-col justify-between">
      <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
        <span>{label}</span>
        <span>{icon}</span>
      </div>
      <div>
        <div className={cn("text-xl font-medium tracking-tight numeric-tabular", accent)}>{value}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function exerciseDay(startIso: string) {
  const start = new Date(startIso).getTime();
  const now = Date.now();
  return Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
}
