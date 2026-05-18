"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Timer } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { nextBestAction } from "@/lib/selectors";
import { QUEUES } from "@/lib/queue-config";
import { cn } from "@/lib/utils";

export function NextActionPanel() {
  const decisions = useMockStore((s) => s.decisions);
  const siteFilter = useMockStore((s) => s.siteFilter);
  const action = nextBestAction({ decisions, siteFilter });

  if (!action) {
    return (
      <div className="rounded-2xl border border-green-queue/30 bg-green-queue-soft/30 p-5 flex flex-col h-full">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-green-queue/15 text-green-queue">
            <Sparkles className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] uppercase tracking-[0.16em] font-semibold text-green-queue">
              Next best action
            </p>
            <h3 className="mt-0.5 text-lg font-semibold tracking-tight leading-tight">
              Nothing pending
            </h3>
          </div>
        </div>
        <p className="mt-3 text-[13.5px] text-foreground/85 leading-relaxed">
          You&apos;re all caught up. Tomorrow&apos;s ODS refresh will queue more work. In the
          meantime, the Green queue has any auto-confirmed mappings ready to enter into
          CookBook.
        </p>
        <div className="mt-auto pt-4">
          <Link
            href="/worklist?queue=green"
            className="inline-flex items-center gap-1.5 rounded-md border border-green-queue bg-green-queue text-white px-3 py-1.5 text-[12.5px] font-semibold shadow-sm hover:bg-green-queue/90"
          >
            Open Green queue
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const cfg = QUEUES[action.queue];
  const Icon = cfg.icon;
  const ctaClass =
    action.queue === "amber"
      ? "bg-amber-queue hover:bg-amber-queue/90 border-amber-queue"
      : action.queue === "red"
      ? "bg-red-queue hover:bg-red-queue/90 border-red-queue"
      : action.queue === "green"
      ? "bg-green-queue hover:bg-green-queue/90 border-green-queue"
      : "bg-blue-queue hover:bg-blue-queue/90 border-blue-queue";

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 flex flex-col h-full bg-card",
        cfg.borderClass
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl",
            cfg.bgSoftClass,
            cfg.textClass
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[10.5px] uppercase tracking-[0.16em] font-semibold",
              cfg.textClass
            )}
          >
            Next best action
          </p>
          <h3 className="mt-0.5 text-lg font-semibold tracking-tight leading-tight">
            {action.headline}
          </h3>
        </div>
      </div>
      <p className="mt-3 text-[13.5px] text-foreground/85 leading-relaxed">{action.reason}</p>
      <div className="mt-3 flex items-center gap-3 text-[11.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Timer className="h-3 w-3" />~{action.estimatedMinutes} min at usual speed
        </span>
      </div>
      <div className="mt-auto pt-4">
        <Link
          href={action.href}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border text-white px-3 py-1.5 text-[12.5px] font-semibold shadow-sm transition-colors",
            ctaClass
          )}
        >
          {action.ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
