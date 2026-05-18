"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMockStore } from "@/lib/mock-store";
import type { Queue } from "@/lib/types";
import { FilterBar } from "./filter-bar";
import { WorklistRow } from "./worklist-row";

const ALL_QUEUES: Queue[] = ["green", "amber", "red", "blue"];

// Progressive loading. The list is action-driven, not a data table — we
// avoid page numbers entirely. Initial render shows enough work for one
// session; an IntersectionObserver auto-loads the next batch as the user
// scrolls near the bottom, with a visible "Load more" button as fallback
// (keyboard users, observers that miss, etc.).
const INITIAL_BATCH = 25;
const BATCH_INCREMENT = 25;

export function WorklistPane() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const activeId = (params?.decisionId as string | undefined) ?? null;

  const decisions = useMockStore((s) => s.decisions);
  const mogs = useMockStore((s) => s.mogs);
  const siteFilter = useMockStore((s) => s.siteFilter);

  // Single-select queue tab. From URL (?queue=amber) or default amber.
  // If multiple queues are in the URL, the first valid one wins (legacy
  // multi-select URLs degrade gracefully to single-select).
  const initialQueue = useMemo<Queue>(() => {
    const q = searchParams.get("queue");
    if (q) {
      const first = q
        .split(",")
        .find((x): x is Queue => ALL_QUEUES.includes(x as Queue));
      if (first) return first;
    }
    return "amber";
  }, [searchParams]);

  const scopeParam = searchParams.get("scope");
  const scope: "all" | "original" | "incremental" =
    scopeParam === "original" || scopeParam === "incremental" ? scopeParam : "all";

  const [activeQueue, setActiveQueueState] = useState<Queue>(initialQueue);
  const [search, setSearch] = useState("");

  // Setter wraps state + URL replace.
  //
  // Tab clicks ALWAYS land on /worklist (root), never on /worklist/[id].
  // This is the single mechanism that resets `selectedMOG` to null when
  // the user changes tabs — the route segment carries the selection, so
  // dropping the segment drops the selection. Without this, switching
  // tabs on a detail page would only flip ?queue= and the previous MOG
  // would stay open under the new tab (the bug being fixed here).
  //
  // Same-tab clicks also route home, which doubles as a "back to
  // Top Priorities for this queue" affordance.
  const setActiveQueue = (q: Queue) => {
    setActiveQueueState(q);
    const next = new URLSearchParams(searchParams.toString());
    next.set("queue", q);
    router.replace(`/worklist?${next.toString()}`, { scroll: false });
  };

  // If the URL changes externally (back/forward), keep state in sync.
  useEffect(() => {
    const urlQueue = searchParams.get("queue");
    if (urlQueue && ALL_QUEUES.includes(urlQueue as Queue) && urlQueue !== activeQueue) {
      setActiveQueueState(urlQueue as Queue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const incrementalMogIds = useMemo(
    () => new Set(mogs.filter((m) => m.scopeOrigin === "incremental").map((m) => m.id)),
    [mogs]
  );
  const originalMogIds = useMemo(
    () => new Set(mogs.filter((m) => m.scopeOrigin === "original").map((m) => m.id)),
    [mogs]
  );

  const visible = useMemo(() => {
    const search_l = search.toLowerCase();
    return decisions
      .filter((d) => {
        // Pending + planned are always visible; escalated items also show in
        // the Red queue (with an "Escalated to Procurement" status pill) so
        // the user can track in-flight escalations without leaving Red.
        if (d.status === "pending" || d.status === "planned") return true;
        if (d.status === "escalated" && d.queue === "red") return true;
        return false;
      })
      .filter((d) => d.queue === activeQueue)
      .filter((d) => siteFilter === "all" || d.siteId === siteFilter)
      .filter((d) => {
        if (scope === "incremental") return incrementalMogIds.has(d.mogId);
        if (scope === "original") return originalMogIds.has(d.mogId);
        return true;
      })
      .filter((d) => {
        if (!search_l) return true;
        const mog = mogs.find((m) => m.id === d.mogId);
        return (
          mog?.name.toLowerCase().includes(search_l) ||
          mog?.genericIngredient.toLowerCase().includes(search_l)
        );
      })
      .sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
  }, [decisions, activeQueue, siteFilter, search, mogs, scope, incrementalMogIds, originalMogIds]);

  // ─── Progressive loading state ──────────────────────────────────────────
  // visibleCount caps the slice we render; sentinelRef is the IO target.
  // Whenever the filter inputs change, the displayed list semantically
  // changes too — reset the slice back to INITIAL_BATCH so the user
  // doesn't land 200 rows deep into a freshly filtered list.
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [activeQueue, scope, search, siteFilter]);

  // Auto-load on scroll. Observer's root is the Radix ScrollArea viewport
  // (the actual scroll container) — falling back to the document viewport
  // wouldn't trigger because the page itself doesn't scroll, only this
  // pane does. rootMargin gives us a 240px head-start so the next batch
  // is in the DOM before the user reaches the sentinel — feels seamless.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    if (visibleCount >= visible.length) return;

    const root = sentinel.closest("[data-radix-scroll-area-viewport]");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + BATCH_INCREMENT, visible.length));
        }
      },
      { root: (root as Element | null) ?? null, rootMargin: "240px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, visible.length]);

  const shown = Math.min(visibleCount, visible.length);
  const hasMore = shown < visible.length;
  const loadMore = () =>
    setVisibleCount((c) => Math.min(c + BATCH_INCREMENT, visible.length));

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        activeQueue={activeQueue}
        onSelectQueue={setActiveQueue}
        search={search}
        onSearchChange={setSearch}
      />
      <ScrollArea className="flex-1">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
            <div className="text-base font-medium">All clear</div>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              Nothing matches the current filter. Tomorrow&apos;s ODS refresh will queue more work.
            </p>
          </div>
        ) : (
          <>
            {visible.slice(0, shown).map((d) => {
              // Preserve current filter state (queue, scope, …) on the
              // decision link so the WorklistPane remount keeps the same tab.
              const qs = searchParams.toString();
              const href = qs ? `/worklist/${d.id}?${qs}` : `/worklist/${d.id}`;
              return (
                <WorklistRow
                  key={d.id}
                  decision={d}
                  active={activeId === d.id}
                  href={href}
                />
              );
            })}

            {/* Footer — context-aware copy.
                Three states based on whether the list ever needed
                progressive loading:
                  • Small list (≤ INITIAL_BATCH)   → "29 items in this queue"
                  • Loading more remaining          → "Showing 25 of 58 items"
                                                     + Load more button
                  • All loaded after a load-more    → "Showing all 58 items"
                The sentinel sits flush against the footer so the IO can
                fire as soon as the footer enters the viewport. */}
            <div className="px-4 py-3 flex flex-col items-center gap-2 text-center">
              <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
              {hasMore ? (
                <>
                  <button
                    type="button"
                    onClick={loadMore}
                    className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/85 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    Load more
                  </button>
                  <p
                    aria-live="polite"
                    className="text-[11px] text-muted-foreground numeric-tabular"
                  >
                    Showing{" "}
                    <span className="text-foreground font-medium">{shown}</span>{" "}
                    of{" "}
                    <span className="text-foreground font-medium">
                      {visible.length}
                    </span>{" "}
                    items
                  </p>
                </>
              ) : visible.length > INITIAL_BATCH ? (
                // Reached the end of a list that needed progressive loading.
                <p className="text-[11px] text-muted-foreground">
                  Showing all{" "}
                  <span className="text-foreground font-medium numeric-tabular">
                    {visible.length}
                  </span>{" "}
                  items
                </p>
              ) : (
                // Small list — never needed loading. Avoid implying there's
                // ever more by saying "Showing X of X". Just give a clean
                // total count so the user knows the list is complete.
                <p className="text-[11px] text-muted-foreground">
                  <span className="text-foreground font-medium numeric-tabular">
                    {visible.length}
                  </span>{" "}
                  item{visible.length === 1 ? "" : "s"} in this queue
                </p>
              )}
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  );
}
