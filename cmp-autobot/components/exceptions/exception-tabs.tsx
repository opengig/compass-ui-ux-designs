"use client";

import { useMockStore } from "@/lib/mock-store";
import type { ExceptionRecord, ExceptionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Two-tab filter model, problem-type based — Article-centric.
//
//   missing-articles  → mam-b items: an Article exists in SAP but
//                       isn't linked to any Ingredient yet. The
//                       fix is to map it to an existing Ingredient
//                       or create a new one. (Tab key kept as
//                       "missing-articles" for URL backcompat; the
//                       visible label is "Unmapped Articles".)
//   invalid-articles  → quarantine items: an Article record exists
//                       but its data is incomplete/invalid. The
//                       fix is for the SAP master-data team to
//                       backfill the missing fields.
//
// Both tabs filter to actionable statuses only ({open,
// pending-culinary, pending-procurement}) — finalised items
// (linked, resolved) drop off so the tabs always show real work.
//
// mam-a ("Ingredient with no Article in SAP") is no longer surfaced
// as its own tab. Legacy URLs targeting mam-a still resolve via
// readActiveTabFromSearch defaulting to missing-articles, but the
// detail panel for those records uses MissingArticleActionPanel
// (separate from the orphan-Article flow this tab now hosts).

export type ExceptionTypeFilter = "missing-articles" | "invalid-articles";

const TABS: { key: ExceptionTypeFilter; label: string }[] = [
  // Tab key stays "missing-articles" so URLs/audit keep working;
  // visible label is now "Unmapped Articles" since the underlying
  // data is mam-b orphan Articles.
  { key: "missing-articles", label: "Unmapped Articles" },
  { key: "invalid-articles", label: "Invalid Articles" },
];

const ACTIONABLE_STATUSES = new Set<ExceptionStatus>([
  "open",
  "pending-culinary",
  "pending-procurement",
]);

/** Predicates exported so ExceptionList + selection-preservation logic
 *  share one source of truth for what each tab contains. */
export function isMissingArticle(e: ExceptionRecord): boolean {
  // The "Unmapped Articles" tab — Article exists, no Ingredient
  // mapped. Predicate name is kept for backcompat with the rest of
  // the codebase even though the semantic is now Article-centric
  // (the tab/URL key is "missing-articles" → "Unmapped Articles").
  return e.type === "mam-b" && ACTIONABLE_STATUSES.has(e.status);
}
export function isInvalidArticle(e: ExceptionRecord): boolean {
  return e.type === "quarantine" && ACTIONABLE_STATUSES.has(e.status);
}
function predicateFor(tab: ExceptionTypeFilter) {
  return tab === "invalid-articles" ? isInvalidArticle : isMissingArticle;
}

export function ExceptionTabs({ active }: { active: ExceptionTypeFilter }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/exceptions";
  const searchParams = useSearchParams();
  const exceptions = useMockStore((s) => s.exceptions);

  // Live counts shown next to each tab label so users can see how
  // much work each bucket holds before clicking.
  const counts: Record<ExceptionTypeFilter, number> = {
    "missing-articles": exceptions.filter(isMissingArticle).length,
    "invalid-articles": exceptions.filter(isInvalidArticle).length,
  };

  // Switching tabs: if the user is on /exceptions/[id] AND the
  // currently-open exception still matches the new tab's predicate,
  // preserve the selection. Otherwise reset to the empty /exceptions
  // root so the user isn't stranded on a detail view that doesn't
  // belong to the new tab.
  const onChange = (next: ExceptionTypeFilter) => {
    if (next === active) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);

    const detailMatch = pathname.match(/^\/exceptions\/(.+)$/);
    if (detailMatch) {
      const currentId = detailMatch[1];
      const current = exceptions.find((e) => e.id === currentId);
      if (current && predicateFor(next)(current)) {
        router.push(`/exceptions/${currentId}?${params.toString()}`);
        return;
      }
    }
    router.push(`/exceptions?${params.toString()}`);
  };

  return (
    // Underline-only tab strip — no background, no enclosing card,
    // no per-tab borders or shadows. The strip's only chrome is the
    // hairline border-b that doubles as the inactive baseline; the
    // active tab's 2px underline sits on top of it (so the baseline
    // stays continuous and the active marker just looks heavier).
    <div
      role="tablist"
      aria-label="Exception filter"
      className="flex items-center gap-6 border-b border-border"
    >
      {TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={cn(
              // -mb-px pulls each tab down by 1px so its bottom
              // border overlaps the container's hairline — keeps the
              // active underline visually flush instead of stacking
              // above an extra gray line.
              "-mb-px inline-flex items-center gap-2 border-b-2 bg-transparent px-1 pb-2.5 pt-1 text-[13px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t",
              isActive
                ? "border-foreground text-foreground font-medium"
                : "border-transparent text-muted-foreground font-normal hover:text-foreground/80"
            )}
          >
            <span>{t.label}</span>
            <span
              className={cn(
                "numeric-tabular tabular-nums text-[11px] transition-colors",
                isActive ? "text-foreground/70" : "text-muted-foreground/70"
              )}
            >
              {counts[t.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** URL parser. Default lands on "missing-articles". Legacy URL
 *  values (?tab=mam-a / mam-b / quarantine / needs-attention /
 *  unlinked-articles / all) are remapped so older bookmarks and
 *  audit links still resolve to a sensible tab. */
export function readActiveTabFromSearch(
  searchParams: URLSearchParams
): ExceptionTypeFilter {
  const tab = searchParams.get("tab");
  if (tab === "invalid-articles" || tab === "quarantine") {
    return "invalid-articles";
  }
  // missing-articles is the catch-all default — covers explicit
  // "missing-articles", legacy "mam-a", and any unrecognised value
  // (including the previous tab keys "needs-attention" /
  // "unlinked-articles" and the old "all" sentinel).
  return "missing-articles";
}
