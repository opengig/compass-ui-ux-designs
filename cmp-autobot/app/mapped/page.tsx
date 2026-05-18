"use client";

import { CheckCircle2 } from "lucide-react";
import { MappedList } from "@/components/mapped/mapped-list";

export default function MappedPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-w-0 overflow-hidden">
      {/* Left list — bounded height with own internal scroll (ScrollArea
          inside MappedList). overflow-hidden on this aside prevents any
          stray child from triggering a body-level scroll. */}
      <aside className="w-[340px] shrink-0 border-r border-border min-w-0 flex flex-col overflow-hidden">
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border bg-card/40">
          <h2 className="text-sm font-semibold">Mapped to CookBook</h2>
          <p className="text-xs text-muted-foreground mt-1">
            These ingredients have been successfully mapped to Articles and added
            to CookBook.
          </p>
        </div>
        <div className="flex-1 min-h-0">
          <MappedList activeId={null} />
        </div>
      </aside>

      {/* Right empty state */}
      <div className="flex-1 min-w-0 min-h-0 overflow-y-auto bg-background flex flex-col items-center justify-center text-center px-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-queue-soft text-green-queue">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-medium">Select a mapping to view details</h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
          Pick a confirmed mapping from the list to see the chosen Article, other
          candidates, and the autobot&rsquo;s reasoning at the time of confirmation.
        </p>
      </div>
    </div>
  );
}
