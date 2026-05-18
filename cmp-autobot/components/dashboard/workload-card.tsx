"use client";

import Link from "next/link";
import { Eye, ArrowUpRight } from "lucide-react";
import { QUEUES } from "@/lib/queue-config";
import type { WorkloadCounts } from "@/lib/selectors";
import { cn } from "@/lib/utils";

interface WorkloadCardProps {
  title: string;
  subtitle: string;
  counts: WorkloadCounts;
  banner?: React.ReactNode;
  tone?: "neutral" | "warning";
}

export function WorkloadCard({ title, subtitle, counts, banner, tone = "neutral" }: WorkloadCardProps) {
  const rows = [
    {
      key: "mapped",
      label: "Mapped",
      value: counts.mapped,
      pct: pct(counts.mapped, counts.total),
      stripe: "bg-green-queue",
      text: "text-green-queue",
    },
    {
      key: "amber",
      label: "Unmapped — Amber",
      value: counts.amber,
      pct: pct(counts.amber, counts.total),
      stripe: QUEUES.amber.stripeClass,
      text: QUEUES.amber.textClass,
    },
    {
      key: "red",
      label: "Unmapped — Red",
      value: counts.red,
      pct: pct(counts.red, counts.total),
      stripe: QUEUES.red.stripeClass,
      text: QUEUES.red.textClass,
    },
  ];

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card flex flex-col overflow-hidden",
        tone === "warning" ? "border-amber-queue/40" : "border-border"
      )}
    >
      <div className="px-5 pt-3 pb-2 flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">{subtitle}</div>
          <div className="font-medium text-sm mt-0.5">
            {title} <span className="text-muted-foreground numeric-tabular">· {counts.total} Ingredients</span>
          </div>
          <p className="text-[11.5px] text-muted-foreground mt-1.5 leading-relaxed">
            {storyLine(counts)}
          </p>
        </div>
      </div>
      {banner}
      <div className="px-5 pt-1 pb-3 flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[12.5px]">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-sm", r.stripe)} />
                  <span className="text-foreground/90">{r.label}</span>
                </div>
                <div className="numeric-tabular text-muted-foreground">
                  <span className="text-foreground font-medium">{r.value}</span>
                  <span className="text-muted-foreground/70 ml-2">{r.pct}%</span>
                </div>
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full", r.stripe)} style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          </div>
        ))}

        <BlueWatchRow value={counts.blueWatch} total={counts.total} />
      </div>

      <div className="mt-auto px-5 py-2 border-t border-border bg-muted/40 flex items-center justify-between">
        <div className="text-[11px] text-muted-foreground">
          {counts.mapped + counts.amber + counts.red} processed · {counts.unmapped} pending
        </div>
        <Link
          href="/worklist"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-accent transition-colors"
        >
          Open Worklist <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function BlueWatchRow({ value, total: _total }: { value: number; total: number }) {
  const label =
    value === 0
      ? "No transitions pending"
      : `${value} mapping${value === 1 ? "" : "s"} with retired Article`;
  return (
    <div className="mt-1.5 flex items-start gap-2.5 rounded-lg border border-blue-queue/25 bg-blue-queue-soft/55 px-2.5 py-2">
      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-blue-queue/15 text-blue-queue">
        <Eye className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="font-medium text-foreground">Blue Watch — counted as Mapped</span>
          <span className="text-foreground font-medium numeric-tabular">{value}</span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{label} · plan the transition</div>
      </div>
    </div>
  );
}

function pct(n: number, total: number) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

function storyLine(c: WorkloadCounts): string {
  if (c.total === 0) return "Nothing in this scope yet.";
  if (c.unmapped === 0) return "All Ingredients mapped.";
  const reviewed = c.mapped;
  const pending = c.unmapped;
  return `${reviewed} mapped, ${pending} still pending — ${c.amber} need review, ${c.red} need procurement attention.`;
}
