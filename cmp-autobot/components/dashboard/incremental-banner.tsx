"use client";

import Link from "next/link";
import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { INCREMENTAL_BATCH } from "@/data/mogs";

export function IncrementalBanner() {
  const dateLabel = new Date(INCREMENTAL_BATCH.addedOn).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mx-5 mb-2 flex items-start gap-2 rounded-lg bg-amber-queue-soft border border-amber-queue/40 px-2.5 py-2">
      <TriangleAlert className="h-3.5 w-3.5 text-amber-queue mt-0.5 shrink-0" />
      <div className="flex-1 text-[11.5px] leading-relaxed">
        <div className="font-medium text-foreground">
          {INCREMENTAL_BATCH.count} Ingredients entered scope on {dateLabel}
        </div>
        <div className="text-muted-foreground">
          Tracked separately. Assess impact on the target date.
        </div>
      </div>
      <Link
        href="/worklist?scope=incremental"
        className="shrink-0 inline-flex items-center gap-1 self-center rounded-md border border-amber-queue/40 bg-background/70 px-2 py-1 text-[10.5px] font-medium text-amber-queue hover:bg-amber-queue/10"
      >
        Review <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
