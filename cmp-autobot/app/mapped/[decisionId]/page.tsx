"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useMockStore } from "@/lib/mock-store";
import { MappedList } from "@/components/mapped/mapped-list";
import { MappedDetail } from "@/components/mapped/mapped-detail";

const MAPPED_STATUSES = new Set(["confirmed", "entered"]);

export default function MappedDetailPage({
  params,
}: {
  params: Promise<{ decisionId: string }>;
}) {
  const { decisionId } = use(params);
  const decision = useMockStore((s) => s.decisions.find((d) => d.id === decisionId));

  // Guard: a decision belongs on this page if it's fully done (status
  // confirmed/entered) OR partially mapped (any APL committed). The
  // latter is the new dual-visibility behaviour — a partial decision
  // is reachable here AND from the Worklist simultaneously.
  const isVisibleHere =
    !!decision &&
    (MAPPED_STATUSES.has(decision.status) ||
      (decision.mappedAplIds?.length ?? 0) > 0);
  if (!decision || !isVisibleHere) return notFound();

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-w-0 overflow-hidden">
      <aside className="w-[340px] shrink-0 border-r border-border min-w-0 flex flex-col overflow-hidden">
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border bg-card/40">
          <h2 className="text-sm font-semibold">Mapped to CookBook</h2>
          <p className="text-xs text-muted-foreground mt-1">
            These ingredients have been successfully mapped to Articles and added
            to CookBook.
          </p>
        </div>
        <div className="flex-1 min-h-0">
          <MappedList activeId={decisionId} />
        </div>
      </aside>
      <div className="flex-1 min-w-0 min-h-0 overflow-y-auto bg-background">
        <MappedDetail decision={decision} />
      </div>
    </div>
  );
}
