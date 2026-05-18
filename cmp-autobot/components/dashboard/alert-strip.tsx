"use client";

import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { dashboardAlerts, type AlertSeverity, type DashboardAlert } from "@/lib/selectors";
import { cn } from "@/lib/utils";

const ICON: Record<AlertSeverity, LucideIcon> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const TONE: Record<
  AlertSeverity,
  { wrap: string; icon: string; cta: string; label: string }
> = {
  critical: {
    wrap: "border-red-queue/40 bg-red-queue-soft/55",
    icon: "text-red-queue bg-red-queue/10",
    cta: "text-red-queue hover:text-red-queue/80",
    label: "Critical",
  },
  warning: {
    wrap: "border-amber-queue/40 bg-amber-queue-soft/55",
    icon: "text-amber-queue bg-amber-queue/10",
    cta: "text-amber-queue hover:text-amber-queue/80",
    label: "Watch",
  },
  info: {
    wrap: "border-blue-queue/30 bg-blue-queue-soft/45",
    icon: "text-blue-queue bg-blue-queue/10",
    cta: "text-blue-queue hover:text-blue-queue/80",
    label: "Info",
  },
  success: {
    wrap: "border-green-queue/35 bg-green-queue-soft/45",
    icon: "text-green-queue bg-green-queue/10",
    cta: "text-green-queue hover:text-green-queue/80",
    label: "On track",
  },
};

export function AlertStrip() {
  const decisions = useMockStore((s) => s.decisions);
  const mogs = useMockStore((s) => s.mogs);
  const audit = useMockStore((s) => s.audit);
  const target = useMockStore((s) => s.target);
  const siteFilter = useMockStore((s) => s.siteFilter);

  const alerts = dashboardAlerts({ decisions, mogs, audit, target, siteFilter });

  return (
    <section aria-label="Proactive alerts">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
          Proactive alerts
        </div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
          Top {alerts.length} of what we&apos;re watching
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {alerts.map((a) => (
          <AlertCard key={a.id} alert={a} />
        ))}
      </div>
    </section>
  );
}

function AlertCard({ alert }: { alert: DashboardAlert }) {
  const Icon = ICON[alert.severity];
  const tone = TONE[alert.severity];
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-2.5 flex items-start gap-2.5",
        tone.wrap
      )}
    >
      <div
        className={cn(
          "mt-0.5 h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md",
          tone.icon
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[12.5px] font-semibold tracking-tight text-foreground truncate">
            {alert.title}
          </div>
          <span className={cn("text-[9px] uppercase tracking-wider font-semibold", tone.cta)}>
            {tone.label}
          </span>
        </div>
        <div className="mt-0.5 text-[11.5px] text-muted-foreground leading-snug line-clamp-2">
          {alert.subtitle}
        </div>
        {alert.href && alert.cta && (
          <Link
            href={alert.href}
            className={cn(
              "mt-1.5 inline-flex items-center gap-1 rounded-md border bg-background/80 px-2 py-0.5 text-[11px] font-semibold transition-colors hover:bg-background",
              tone.cta,
              alert.severity === "critical" && "border-red-queue/40",
              alert.severity === "warning" && "border-amber-queue/40",
              alert.severity === "info" && "border-blue-queue/40",
              alert.severity === "success" && "border-green-queue/40"
            )}
          >
            {alert.cta}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
