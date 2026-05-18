"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  ExceptionRecord,
  ExceptionStatus,
} from "@/lib/types";
import { useMockStore } from "@/lib/mock-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatRelativeDays } from "@/lib/utils";
import { ExceptionStatusPill } from "./exception-status-pill";
import {
  isMissingArticle,
  isInvalidArticle,
  type ExceptionTypeFilter,
} from "./exception-tabs";

const VALID_FILTERS = new Set<"all" | ExceptionStatus>([
  "open",
  "pending-culinary",
  "pending-procurement",
  "all",
]);

// URL filter key per tab. Each tab keeps its own filter
// independently so a click on "Open" inside Invalid Articles never
// touches the Missing Articles filter (and vice versa). Both keys
// coexist in the URL across tab switches → state is preserved per
// tab.
const FILTER_KEY: Record<ExceptionTypeFilter, string> = {
  "missing-articles": "filterMissing",
  "invalid-articles": "filterInvalid",
};

interface ExceptionListProps {
  tab: ExceptionTypeFilter;
  activeId: string | null;
}

interface FilterDef {
  key: "all" | ExceptionStatus;
  label: string;
  activeClass: string;
  description?: string;
}

// Per-tab status chip strip — replaces the previous single shared
// set. Each tab only surfaces statuses that actually occur for its
// problem type, so users never see an empty chip. "Linked" and
// "Resolved" are intentionally omitted from both since both tab
// predicates already exclude finalised items.
const MISSING_ARTICLE_FILTERS: FilterDef[] = [
  {
    key: "all",
    label: "All",
    activeClass: "bg-foreground text-background",
    description: "Articles that are not linked to any Ingredient.",
  },
  {
    key: "open",
    label: "Open",
    activeClass: "bg-foreground text-background",
    description: "Untouched. Decide whether to link to an Ingredient or escalate.",
  },
  {
    key: "pending-culinary",
    // Shortened from "Needs Culinary Input" so all four Unmapped
    // Articles chips fit comfortably in a 340px sidebar without
    // truncation. The longer description below the chip strip
    // surfaces the full meaning when the chip is active.
    label: "Culinary",
    activeClass: "bg-blue-queue text-white",
    description: "Waiting for the culinary team to confirm usage or scope a new Ingredient.",
  },
  {
    key: "pending-procurement",
    label: "Procurement",
    activeClass: "bg-amber-queue text-white",
    description: "Request sent to Procurement to create the Article in SAP.",
  },
];

// Quarantine items only exist in two real states (open / resolved).
// The tab predicate already excludes resolved, so every visible
// Invalid Articles item is "Missing Fields" / open. With only one
// effective category there's nothing to filter between — All and
// Missing Fields would show identical lists. Drop "All" entirely
// and render the remaining single entry as a static informational
// label (not a clickable chip) so the UI doesn't pretend to offer
// a choice that doesn't exist. If quarantine ever grows a second
// open-state category, add the chip back here and the renderer
// flips to the multi-chip layout automatically.
const INVALID_ARTICLE_FILTERS: FilterDef[] = [
  {
    key: "open",
    label: "Missing Fields",
    activeClass: "bg-foreground text-background",
    description: "Articles whose SAP record is missing pack size, cost, brand, or another required field.",
  },
];

const STATUS_FILTERS_BY_TAB: Record<ExceptionTypeFilter, FilterDef[]> = {
  "missing-articles": MISSING_ARTICLE_FILTERS,
  "invalid-articles": INVALID_ARTICLE_FILTERS,
};

export function ExceptionList({ tab, activeId }: ExceptionListProps) {
  const exceptions = useMockStore((s) => s.exceptions);
  const mogs = useMockStore((s) => s.mogs);
  const apls = useMockStore((s) => s.apls);
  const router = useRouter();
  const pathname = usePathname() ?? "/exceptions";
  const searchParams = useSearchParams();

  // Per-tab filter URL key. Each tab reads/writes its OWN key so a
  // click on Open inside Unlinked Articles never touches the Needs
  // Attention filter (and vice versa). Both keys coexist in the URL
  // across tab switches → state is preserved per tab.
  const filterKey = FILTER_KEY[tab];

  // Status sub-filter for THIS tab. Default = "all". Only valid
  // statuses pass the gate.
  const filter: "all" | ExceptionStatus = useMemo(() => {
    const f = searchParams.get(filterKey) ?? "all";
    return VALID_FILTERS.has(f as "all" | ExceptionStatus)
      ? (f as "all" | ExceptionStatus)
      : "all";
  }, [searchParams, filterKey]);

  const setFilter = (key: "all" | ExceptionStatus) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set(filterKey, key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  // Tab-level filter — uses the same predicates ExceptionTabs uses
  // for its tab counts so list contents always match what the tab
  // labels promise.
  const baseList = useMemo(() => {
    const predicate =
      tab === "invalid-articles" ? isInvalidArticle : isMissingArticle;
    return exceptions.filter(predicate);
  }, [exceptions, tab]);
  const filterDefs = STATUS_FILTERS_BY_TAB[tab];
  // Single-category tab (e.g. Invalid Articles only has "Missing
  // Fields") doesn't need an interactive chip strip — the user has
  // no real choice to make. Fall back to a static informational
  // label below so the surface still shows what's being shown +
  // the count, without pretending to offer filtering.
  const isSingleCategory = filterDefs.length <= 1;
  const hasFilters = filterDefs.length > 1;

  const list = useMemo(() => {
    // When the chip strip is suppressed (single-category tab) the
    // URL filter is meaningless — just render the full baseList.
    if (isSingleCategory || filter === "all") return baseList;
    return baseList.filter((e) => e.status === filter);
  }, [baseList, filter, isSingleCategory]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: baseList.length };
    for (const e of baseList) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [baseList]);

  // Edge case: the selected row exists in this type but not in the current
  // filter slice. Surface a small notice so users understand why the row
  // they just opened isn't in the list — without auto-switching the filter.
  const selectedHiddenByFilter =
    hasFilters &&
    activeId !== null &&
    !list.some((e) => e.id === activeId) &&
    baseList.some((e) => e.id === activeId);

  const activeFilterDef = filterDefs?.find((f) => f.key === filter);
  // For single-category tabs the only filter def IS the static label.
  const singleDef = isSingleCategory ? filterDefs[0] : undefined;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Single-category tab — render a static label instead of a
          chip strip. "Showing: <category> · N" + the description
          line keeps the surface informative without offering a
          filter choice that doesn't actually filter anything. */}
      {isSingleCategory && singleDef && (
        <div className="shrink-0 border-b border-border bg-card/40 px-4 py-3 flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            Showing
            <span className="ml-1 normal-case tracking-normal text-foreground">
              {singleDef.label}
            </span>
            <span className="ml-1.5 numeric-tabular tabular-nums text-muted-foreground/80">
              ({baseList.length})
            </span>
          </p>
          {singleDef.description && (
            <p className="text-[11px] text-muted-foreground leading-snug">
              {singleDef.description}
            </p>
          )}
        </div>
      )}

      {hasFilters && filterDefs && (
        // Sticky filter strip — shrink-0 locks it to the top of the
        // sidebar so it never collapses or scrolls away with the
        // list below. h-auto + overflow-visible are the defaults
        // but spelled out here so any future flex/grid parent that
        // tries to constrain the strip's height has to make that
        // override deliberate. Bumping py-3 → py-3.5 gives the
        // wrapped 2nd row enough breathing room to clear the
        // hairline border-b without feeling cramped.
        <div className="shrink-0 h-auto overflow-visible border-b border-border bg-card/40 px-4 py-3.5 flex flex-col gap-2.5">
          {/* Filter chips — flex-wrap with explicit gap-x and
              gap-y so the wrap behaviour can't be confused with a
              clipped row. Each chip carries shrink-0 +
              whitespace-nowrap so labels never break mid-word; the
              row itself uses items-start (rather than items-center)
              because items-start gives consistent baseline
              alignment when wrap drops chips to a new line. */}
          <div className="flex flex-wrap items-start gap-x-2 gap-y-2 h-auto overflow-visible">
            {filterDefs.map((f) => {
              const active = filter === f.key;
              const n = counts[f.key] ?? 0;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={active}
                  className={cn(
                    "shrink-0 whitespace-nowrap inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium leading-none transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? cn("border-transparent shadow-xs", f.activeClass)
                      : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {f.label}
                  <span className="ml-1.5 numeric-tabular tabular-nums opacity-80">
                    ({n})
                  </span>
                </button>
              );
            })}
          </div>
          {activeFilterDef?.description && (
            <p className="text-[11px] text-muted-foreground leading-snug">
              {activeFilterDef.description}
            </p>
          )}
        </div>
      )}

      {selectedHiddenByFilter && (
        <div className="shrink-0 border-b border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          The selected item isn&rsquo;t in the current filter.{" "}
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Show all
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground p-8 text-center">
          {hasFilters && filter !== "all"
            ? `No ${activeFilterDef?.label.toLowerCase()} items.`
            : "No exceptions in this category right now."}
        </div>
      ) : (
        // ScrollArea owns the only scroll surface in the sidebar
        // body — flex-1 + min-h-0 lets it absorb whatever vertical
        // space the filter strip didn't take, so the list never
        // overflows behind the chips.
        <ScrollArea className="flex-1 min-h-0">
          {list.map((e) => {
            const isActive = activeId === e.id;
            // Preserve current query string (?tab=, ?filter=) on the row
            // href so navigating to the detail keeps tab + filter intact.
            const qs = searchParams.toString();
            const href = qs ? `/exceptions/${e.id}?${qs}` : `/exceptions/${e.id}`;
            return (
              <Link
                key={e.id}
                href={href}
                aria-current={isActive ? "page" : undefined}
                // Vertical row layout — title gets a full row to
                // itself, date + status chip share the second line.
                // The horizontal "title left / chip right" layout
                // didn't scale once chips got longer than ~8 chars
                // on a 340px sidebar. Stacking vertically removes
                // the conflict entirely and keeps the chip readable
                // regardless of title length.
                className={cn(
                  "group relative flex flex-col gap-1 pl-4 pr-4 py-3 border-b border-border/70 transition-colors",
                  "hover:bg-accent/60",
                  isActive ? "bg-accent" : "bg-card"
                )}
              >
                {/* Active indicator — absolute, takes no layout space.
                    Sits flush at the row's left edge (panel x=0). The
                    row's content stays anchored at panel x=16 whether
                    this is visible or not, so selecting a row never
                    shifts text horizontally. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r transition-opacity",
                    isActive ? "bg-primary opacity-100" : "opacity-0"
                  )}
                />

                {/* Line 1 — title gets the full row width. truncate
                    + min-w-0 still apply so very long titles ellipsis
                    rather than wrap; the row stays at its natural
                    2-line height regardless of title length. */}
                <div className="text-sm font-medium truncate min-w-0">
                  {titleFor(e, mogs, apls)}
                </div>

                {/* Line 2 — status chip first, date after. The chip
                    leads the eye because status is the primary
                    actionable signal; date is secondary context.
                    Putting the chip on the LEFT also eliminates the
                    right-edge collision the previous "chip pinned
                    right via justify-between" layout had — the
                    pill now sits inside the panel with breathing
                    room rather than against the panel border. */}
                <div className="flex items-center gap-2 min-w-0">
                  <ExceptionStatusPill
                    status={e.status}
                    size="sm"
                    compact
                  />
                  <span className="text-[11px] text-muted-foreground truncate">
                    {formatRelativeDays(e.raisedOn)}
                  </span>
                </div>
              </Link>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );
}

function titleFor(
  e: ExceptionRecord,
  mogs: ReturnType<typeof useMockStore.getState>["mogs"],
  apls: ReturnType<typeof useMockStore.getState>["apls"]
) {
  if (e.type === "mam-a") {
    // mam-a items aren't surfaced in any tab anymore (the
    // Unmapped Articles tab now hosts mam-b items). This branch
    // still runs when a stale URL points to a mam-a record — the
    // detail view continues to render correctly.
    const m = mogs.find((x) => x.id === e.mogId);
    return m ? `${m.name} — no Article in SAP` : "Ingredient with no Article";
  }
  if (e.type === "mam-b") {
    // Article-centric title for the Unmapped Articles tab.
    // "{brand} {generic} · {characteristic}" — drops the brand
    // when it's "UB" (unbranded). The "no Ingredient mapped"
    // status is conveyed by the tab itself + the status pill on
    // the row's meta line, so we don't append it inline.
    const a = apls.find((x) => x.id === e.aplId);
    if (!a) return "Article with no Ingredient mapped";
    const lead = a.brand && a.brand !== "UB" ? `${a.brand} ` : "";
    const tail = a.characteristic ? ` · ${a.characteristic}` : "";
    return `${lead}${a.genericName}${tail}`;
  }
  const a = apls.find((x) => x.id === e.aplId);
  return a ? `${a.genericName} — Missing fields` : "Article with missing fields";
}
