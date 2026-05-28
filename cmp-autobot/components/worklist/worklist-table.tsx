"use client";

import { Fragment, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Check,
  X,
  Plus,
  Send,
  Star,
  SlidersHorizontal,
  Columns3,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Link2Off,
  BookCheck,
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import type { APL, MOG, MappingDecision, Queue } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AddArticlesModal } from "@/components/worklist/add-articles-modal";
import { RowDetailDrawer } from "@/components/worklist/row-detail-drawer";
import { DanglingRow } from "@/components/worklist/dangling-row";
import { HierarchyBreadcrumb } from "@/components/worklist/hierarchy-breadcrumb";
import { cn, aplCode, formatRelativeDays, SECONDARY_BUTTON } from "@/lib/utils";
import { QUEUES } from "@/lib/queue-config";

/* ─────────────────────────────────────────────────────────────────────────
 * WorklistTable — single spreadsheet-style view for the Worklist screen.
 *
 * Replaces the previous left-list + detail-pane composition. Every
 * pending mapping is a row; rows with multiple candidate Articles
 * expand inline to nested article rows so users can confirm / reject
 * without leaving the table. Bulk-select via checkboxes drives a
 * sticky action bar.
 *
 * Columns:
 *   ☐ · ⌃ · Ingredient · Articles · Status · Last updated · Actions
 *
 * Status text labels (no badges, per spec):
 *   amber → "Needs Review"
 *   red   → "Needs Mapping"
 *   green → "Ready to Confirm"
 *   blue  → "Needs Transition"
 * ──────────────────────────────────────────────────────────────────────── */

type StatusTab = "all" | Queue | "mapped" | "dangling" | "unmapped";
type SortKey = "mog" | "status" | "lastUpdated" | "articles";

// Full six-tab navigation. Every workflow stage gets its own tab
// (always visible — even at 0) so users can predict where work
// will land.
//
//   amber → Needs Review            (low confidence, double-check)
//   red   → Needs Mapping           (no candidate, investigate)
//   green → Ready to Confirm        (high confidence, finalize)
//   blue  → Needs Transition     (existing mapping needs change)
//   mapped → fully done — terminal home for confirmed ingredients
//
// State→tab mapping is driven by the decision.queue field for
// pending work, with a status-flip handing the row off to the
// Mapped tab once every candidate APL is accounted for.
const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "green", label: "Matches" },
  { key: "amber", label: "Likely Matches" },
  { key: "unmapped", label: "No Match" },
  { key: "mapped", label: "Mapped" },
];

const STATUS_LABEL: Record<Queue, string> = {
  amber: "Likely Matches",
  red: "No Match",
  green: "Matches",
  blue: "Retired",
};

/** Status pill palette keyed by queue. The amber row matches the
 *  spec's exact hex values (#FEF3C7 / #92400E / #FDE68A + #F59E0B
 *  dot); the other three queues use Tailwind's same-tone tints
 *  (-100 bg, -800 text, -200 border, -500 dot) so the chip family
 *  reads as one system across statuses. */
const STATUS_CHIP: Record<
  Queue,
  { bg: string; text: string; border: string; dot: string }
> = {
  amber: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#92400E]",
    border: "border-[#FDE68A]",
    dot: "bg-[#F59E0B]",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
};

/** Chip palette for the "Mapped" terminal status — used on the
 *  ingredient row when decision.status === "confirmed". Same shape
 *  as STATUS_CHIP entries so the renderer can swap one for the
 *  other without a code branch. */
const MAPPED_CHIP = {
  bg: "bg-purple-100",
  text: "text-purple-800",
  border: "border-purple-200",
  dot: "bg-purple-500",
};

/* True when a decision has at least one candidate APL that
 * isn't rejected. Drives the tab placement rule: 0-article
 * pending decisions always land in Needs Mapping (red); article-
 * bearing pending decisions land in their original queue tab.
 * Mapped APLs still count as articles — only rejected ones drop
 * out of the candidate pool. */
function hasActionable(d: MappingDecision): boolean {
  const rejected = new Set(d.rejectedAplIds ?? []);
  return d.candidateAplIds.some((id) => !rejected.has(id));
}

/* Tab placement key for a decision. Differs from `d.queue` in
 * two cases:
 *   1. amber/green/blue queue with 0 articles  → "red"
 *      (per spec: every 0-article ingredient lands in Needs
 *      Mapping regardless of its original queue tag)
 *   2. red queue that gained articles (e.g. via Add Article)
 *      → "amber" (it now has something to review)
 * Used by both the filter step and the tab badge counts so the
 * two stay in sync. */
function effectiveQueue(d: MappingDecision): Queue {
  if (!hasActionable(d)) return "red";
  if (d.queue === "red") return "amber";
  return d.queue;
}

export function WorklistTable() {
  const decisions = useMockStore((s) => s.decisions);
  const mogs = useMockStore((s) => s.mogs);
  const apls = useMockStore((s) => s.apls);
  const sites = useMockStore((s) => s.sites);
  const exceptions = useMockStore((s) => s.exceptions);
  const siteFilter = useMockStore((s) => s.siteFilter);
  const confirmDecision = useMockStore((s) => s.confirmDecision);
  const undoConfirmApl = useMockStore((s) => s.undoConfirmApl);
  const rejectAplMatch = useMockStore((s) => s.rejectAplMatch);
  const addAplToDecision = useMockStore((s) => s.addAplToDecision);
  const toggleDecisionDefault = useMockStore((s) => s.toggleDecisionDefault);
  const markCookbookEntered = useMockStore((s) => s.markCookbookEntered);
  // Tab-badge counts. Derived locally (not from the
  // pendingDecisionCounts selector) so they go through the same
  // effectiveQueue mapping as the filter — guarantees the badge
  // matches the row count the user actually sees in each tab.
  const counts = useMemo(() => {
    const out: Record<Queue, number> = { amber: 0, red: 0, green: 0, blue: 0 };
    for (const d of decisions) {
      if (d.status !== "pending") continue;
      out[effectiveQueue(d)] += 1;
    }
    return out;
  }, [decisions]);

  const searchParams = useSearchParams();
  const VALID_TABS = new Set<StatusTab>(["all", "green", "amber", "red", "blue", "mapped", "unmapped", "dangling"]);
  const VALID_QUEUES = new Set<Queue>(["amber", "red", "green", "blue"]);
  const queueParam = searchParams.get("queue") as StatusTab | null;
  const statusParam = searchParams.get("status") as Queue | null;
  // ?status= forces the All tab with a pre-applied Status filter.
  // ?queue= activates that queue's own tab directly.
  const initialTab: StatusTab = statusParam
    ? "all"
    : queueParam && VALID_TABS.has(queueParam)
    ? queueParam
    : "all";
  const [tab, setTab] = useState<StatusTab>(initialTab);
  // Auto-show Status column on "All" tab (useful for mixed-queue scanning),
  // auto-hide on focused tabs where status is redundant (all rows share one queue).
  // User can still override manually via the column picker after tab switch.
  useEffect(() => {
    setColumnVisibility((prev) => ({ ...prev, status: tab === "all" }));
  }, [tab]);
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const [search, setSearch] = useState("");
  // Set of mogIds whose expansion is currently open. Multi-row
  // expansion lets users compare alternates across ingredients
  // without losing their place — "Expand All" relies on this.
  const [expandedMogIds, setExpandedMogIds] = useState<Set<string>>(
    () => new Set()
  );
  // Selection now tracks ARTICLE ids (was decision ids). Per the
  // table-logic spec, decisions happen at the Article level only —
  // ingredient rows are pure groupers, no checkbox.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Decision currently targeted by the add-Articles modal. Single
  // string since only one modal can be open at a time. The earlier
  // inline-add row approach was replaced with this modal flow per
  // spec — keeps the table layout uncluttered while the user is
  // searching the Article master.
  const [addingDecisionId, setAddingDecisionId] = useState<string | null>(
    null
  );
  // Set of article ids the user has marked as "default". Multi-
  // select, independent from the row-selection checkbox set above.
  // Persisted in component state only — flagging an article as
  // default is a UI affordance for now (no store action yet).
  const [defaultSet, setDefaultSet] = useState<Set<string>>(new Set());
  // Article ids confirmed during THIS browser session — drives the
  // "New" tag that sits next to the "Mapped" badge on freshly
  // mapped articles + ingredients. Persists across re-renders but
  // resets on full page reload, matching the spec's "newly mapped
  // in this session" semantics.
  const [newlyMapped, setNewlyMapped] = useState<Set<string>>(new Set());
  // Decisions the user has escalated to Procurement during the
  // current session. Local-only — no store wiring yet — so the
  // status flip is purely UI feedback. Resets on page reload,
  // mirroring `newlyMapped` semantics.
  const [escalatedSet, setEscalatedSet] = useState<Set<string>>(new Set());
  // Column-visibility toggles. Default = the three optional
  // columns (Category Path / Status / Last updated) are HIDDEN
  // so the default view stays minimal: Ingredient + Articles +
  // Actions. Users opt back in via the Columns dropdown above
  // the table. Ingredient / Articles / Actions are always shown
  // since hiding them would break the table's primary read.
  type ColumnKey = "categoryPath" | "reasons" | "status" | "lastUpdated";
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >({ categoryPath: false, reasons: false, status: true, lastUpdated: false });
  // Filters layered on top of the existing tab + site + search
  // chain. Empty defaults preserve the pre-feature view.
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  // Status multi-select filter — empty set = no restriction (show all).
  // Seeded from ?status= URL param when landing from a dashboard card.
  const [filterStatus, setFilterStatus] = useState<Set<Queue>>(
    () => statusParam && VALID_QUEUES.has(statusParam) ? new Set([statusParam]) : new Set()
  );
  const toggleFilterStatus = (q: Queue) =>
    setFilterStatus((prev) => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q);
      else next.add(q);
      return next;
    });
  // Bulk-confirm preview dialog — surfaced when the user clicks
  // "Confirm Mapping" in the selection bar so they can scan the
  // full list of MOG → APL pairings before committing. Final
  // confirmation in the dialog calls bulkConfirm.
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  // Bulk-reject preview + reason dialog. Same preview list as the
  // confirm dialog, plus a required reason chip group + optional
  // free-form note that's stamped on every rejection.
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [bulkRejectNote, setBulkRejectNote] = useState("");
  const [bulkRejectError, setBulkRejectError] = useState(false);
  // Once-per-session flag for seeding defaultSet with a realistic
  // demo distribution (1 default / multi default / no default).
  // Without this the table opens with every Default cell empty,
  // which doesn't demonstrate the parent-row summary feature.
  const [defaultsSeeded, setDefaultsSeeded] = useState(false);
  // Row-detail drawer — tracks which ingredient (mogId) and
  // which specific article (aplId) is open in the slide-in
  // panel. Both null = drawer closed. Drawer opens via article
  // clicks inside the Articles cell; the user-facing layout is
  // article-focused (single APL view) per the latest UX spec.
  // mogId is kept around so the drawer can resolve sibling
  // candidates / mapping context for the focused article.
  const [detailMogId, setDetailMogId] = useState<string | null>(null);
  const [detailAplId, setDetailAplId] = useState<string | null>(null);
  // Transient success toast — surfaces an "X articles mapped
  // successfully" banner for ~3s after a confirm action. The
  // `key` field forces a re-mount when the same count fires
  // back-to-back (e.g. user confirms 1 article, then another 1)
  // so the auto-dismiss timer resets cleanly instead of holding
  // a stale toast on screen.
  const [toast, setToast] = useState<{ message: string; key: number } | null>(
    null
  );
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);
  const fireToast = (message: string) => {
    setToast({ message, key: Date.now() });
  };

  // Locally rejected articles: aplId → rejection reason.
  // Map so we can store the required reason alongside the id.
  // Soft-rejection keeps the row visible with strikethrough + Undo;
  // no store mutation until the reason modal is confirmed.
  const [locallyRejectedIds, setLocallyRejectedIds] = useState<Map<string, string>>(
    new Map()
  );

  // Articles added via "+ Add Article" during this session.
  // Shows a "New" pill next to the article name; clears when the
  // article is confirmed, rejected, or the page is reloaded.
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());

  // Independent reason tags — aplId → reason label.
  // Completely separate from Confirm/Reject state.
  const [aplReasons, setAplReasons] = useState<Map<string, string>>(new Map());
  // Parent-row reason tags — decisionId → reason label.
  const [rowReasons, setRowReasons] = useState<Map<string, string>>(new Map());

  const [rejectModalTarget, setRejectModalTarget] = useState<{
    aplId: string;
    label: string;
    decisionId?: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState(false);

  // Parent-row action state — tracks visual-only confirm/reject per
  // decision. Lifted here so any Dialog renders outside the <table> DOM.
  const [parentActions, setParentActions] = useState<Map<string, "confirmed" | "rejected">>(new Map());
  const [parentRejectTarget, setParentRejectTarget] = useState<string | null>(null);
  // Unlink CookBook confirmation — tracks which decision's retired APL is
  // pending the destructive confirmation. Null = dialog closed.
  const [unlinkConfirmDecisionId, setUnlinkConfirmDecisionId] = useState<string | null>(null);
  // Link CookBook confirmation — tracks which mapped decision is being
  // linked to CookBook. Null = dialog closed.
  const [linkCookbookDecisionId, setLinkCookbookDecisionId] = useState<string | null>(null);
  const [parentRejectReason, setParentRejectReason] = useState("");
  const [parentRejectNote, setParentRejectNote] = useState("");
  const [parentRejectError, setParentRejectError] = useState(false);

  /* Filter the decisions list once per render. Pending +
   * confirmed (Mapped) decisions both stay in the Worklist —
   * they just live in different tabs so the queue tabs stay
   * focused on actionable work.
   *
   * Tab routing:
   *   all    → every decision (pending + confirmed)
   *   mapped → confirmed only — terminal state
   *   queue  → PENDING decisions whose effectiveQueue matches
   *            the tab. effectiveQueue (defined at module scope)
   *            shifts 0-article decisions to "red" regardless of
   *            their original queue tag, and shifts red-tagged
   *            decisions that gained articles back to "amber" —
   *            so Needs Review / Needs Mapping always reflect
   *            "has articles" / "no articles" cleanly. */
  // Partial-mapping rule: a decision counts as "mapped" the moment any
  // single APL on it has been confirmed — even while the rest of its
  // candidates stay in the Worklist queue. Mirrors the same predicate
  // used by the standalone Mapped Items page (see mapped-list.tsx).
  const isMappedView = (d: MappingDecision) =>
    d.status === "confirmed" ||
    d.status === "entered" ||
    (d.mappedAplIds?.length ?? 0) > 0;

  // Sorted union of every MOG category currently in play. Drives
  // the Filter dropdown's Category options so the list always
  // matches what the user could actually reach via the data.
  // Effective column count for dynamic colSpan on full-width
  // rows (Add Article footer, dangling section header, empty
  // state). 5 fixed cols (checkbox, chevron, ingredient,
  // articles, actions) + however many of the 3 toggleable are
  // currently shown.
  const visibleColumnCount =
    5 + Object.values(columnVisibility).filter(Boolean).length;

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(mogs.map((m) => m.category)))
        .filter(Boolean)
        .sort(),
    [mogs]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTs = filterDateFrom ? new Date(filterDateFrom).getTime() : null;
    // Date-to inclusive of the picked day → push to end-of-day.
    const toTs = filterDateTo
      ? new Date(filterDateTo).getTime() + 24 * 60 * 60 * 1000 - 1
      : null;
    return decisions
      .filter((d) => d.status === "pending" || d.status === "confirmed")
      .filter((d) => {
        if (tab === "all") return (d.candidateAplIds?.length ?? 0) > 0;
        if (tab === "mapped") return isMappedView(d) && (d.candidateAplIds?.length ?? 0) > 0;
        if (tab === "unmapped") return effectiveQueue(d) === "red" && d.status === "pending";
        // "Likely Matches" tab absorbs blue (Retiring) rows too
        if (tab === "amber") return (effectiveQueue(d) === "amber" || effectiveQueue(d) === "blue") && d.status === "pending";
        return effectiveQueue(d) === tab && d.status === "pending";
      })
      .filter((d) => siteFilter === "all" || d.siteId === siteFilter)
      .filter((d) => {
        if (filterStatus.size === 0) return true;
        // Mapped decisions shown in "All" tab — treat as their own
        // category. If the user is filtering by queue statuses only,
        // mapped rows are excluded (they have no queue to match).
        if (isMappedView(d) && !d.retiredAplId) return false;
        // Decisions with a retiring APL always surface under "Retired"
        // regardless of their queue field — mirrors the parent-row chip.
        const displayQueue: Queue = d.retiredAplId ? "blue" : effectiveQueue(d);
        return filterStatus.has(displayQueue);
      })
      .filter((d) => {
        if (filterCategory === "all") return true;
        const mog = mogs.find((m) => m.id === d.mogId);
        return mog?.category === filterCategory;
      })
      .filter((d) => {
        if (!fromTs && !toTs) return true;
        const ts = new Date(d.generatedAt).getTime();
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;
        return true;
      })
      .filter((d) => {
        if (!q) return true;
        const mog = mogs.find((m) => m.id === d.mogId);
        const candidateApls = d.candidateAplIds
          .map((id) => apls.find((a) => a.id === id))
          .filter(Boolean) as APL[];
        const retiredApl = d.retiredAplId
          ? apls.find((a) => a.id === d.retiredAplId)
          : undefined;
        return (
          mog?.name.toLowerCase().includes(q) ||
          mog?.genericIngredient.toLowerCase().includes(q) ||
          candidateApls.some(
            (a) =>
              a.genericName.toLowerCase().includes(q) ||
              a.brand.toLowerCase().includes(q) ||
              aplCode(a).toLowerCase().includes(q)
          ) ||
          (retiredApl != null &&
            (retiredApl.genericName.toLowerCase().includes(q) ||
              retiredApl.brand.toLowerCase().includes(q) ||
              aplCode(retiredApl).toLowerCase().includes(q) ||
              (retiredApl.characteristic || "").toLowerCase().includes(q) ||
              "retired".includes(q)))
        );
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "mog") {
          const ma = mogs.find((m) => m.id === a.mogId)?.name ?? "";
          const mb = mogs.find((m) => m.id === b.mogId)?.name ?? "";
          return ma.localeCompare(mb) * dir;
        }
        if (sortKey === "lastUpdated") {
          return (a.generatedAt < b.generatedAt ? 1 : -1) * dir;
        }
        if (sortKey === "articles") {
          return (a.candidateAplIds.length - b.candidateAplIds.length) * dir;
        }
        // default: status (queue priority)
        const order: Record<Queue, number> = { amber: 0, red: 1, blue: 2, green: 3 };
        const qd = (order[a.queue] - order[b.queue]) * dir;
        if (qd !== 0) return qd;
        return a.generatedAt < b.generatedAt ? 1 : -1;
      });
  }, [
    decisions,
    tab,
    siteFilter,
    search,
    mogs,
    apls,
    filterCategory,
    filterDateFrom,
    filterDateTo,
    filterStatus,
    sortKey,
    sortDir,
  ]);

  /* Dangling APLs — MAM-B exceptions (orphan APL = APL with no
   * Ingredient mapping). Surfaced inline in the Worklist so users
   * can resolve them without context-switching to the Exceptions
   * page. Includes "open" (actionable) + "pending-*" (awaiting
   * culinary/procurement) so users see the full pipeline; "linked"
   * and "resolved" exceptions drop off (no longer dangling). */
  const visibleDanglings = useMemo(() => {
    if (tab !== "all" && tab !== "dangling" && tab !== "unmapped") return [];
    const q = search.trim().toLowerCase();
    return exceptions
      .filter(
        (e) =>
          e.type === "mam-b" &&
          e.status !== "linked" &&
          e.status !== "resolved" &&
          // Procurement is no longer a user-facing flow on this
          // tab (only Map Ingredient / Send to Culinary remain),
          // so any pending-procurement leftovers from older
          // escalations are filtered out — the user shouldn't
          // see a status they can't act on.
          e.status !== "pending-procurement" &&
          // Only show exceptions whose APL is resolvable in the
          // store — unresolvable ones would display "Unmapped Article"
          // as a fallback name, which provides no actionable context.
          apls.some((a) => a.id === e.aplId)
      )
      .filter((e) => siteFilter === "all" || e.siteId === siteFilter)
      .filter((e) => {
        if (!q) return true;
        const apl = apls.find((a) => a.id === e.aplId);
        if (!apl) return e.details.toLowerCase().includes(q);
        return (
          apl.genericName.toLowerCase().includes(q) ||
          apl.brand.toLowerCase().includes(q) ||
          aplCode(apl).toLowerCase().includes(q) ||
          (apl.characteristic || "").toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Open first (actionable), then pending-* in raised-on order.
        if (a.status === "open" && b.status !== "open") return -1;
        if (b.status === "open" && a.status !== "open") return 1;
        return a.raisedOn < b.raisedOn ? 1 : -1;
      });
  }, [exceptions, tab, siteFilter, search, apls]);

  /* Total dangling count for the tab badge — independent of search
   * + tab filter so users can see the workload at all times. */
  const danglingCount = useMemo(
    () =>
      exceptions.filter(
        (e) =>
          e.type === "mam-b" &&
          e.status !== "linked" &&
          e.status !== "resolved" &&
          (siteFilter === "all" || e.siteId === siteFilter) &&
          apls.some((a) => a.id === e.aplId)
      ).length,
    [exceptions, siteFilter, apls]
  );

  /* Map of articleId → decisionId for bulk-action lookups. Built
   * from the visible set so we don't pay an O(N×M) cost per click;
   * also lets the visibility-clean-up effect prune selections that
   * have left the visible candidate pool (filter change, parent
   * decision confirmed, article rejected, etc.). Rejected articles
   * are excluded so a stale id doesn't survive a reject action. */
  const articleToDecision = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of visible) {
      const rejected = new Set(d.rejectedAplIds ?? []);
      for (const aplId of d.candidateAplIds) {
        if (rejected.has(aplId)) continue;
        map.set(aplId, d.id);
      }
    }
    return map;
  }, [visible]);

  /* Group visible decisions by mogId so each ingredient renders
   * exactly once. The underlying data model stores one
   * MappingDecision per (mog, site) pair, which can surface as
   * apparent duplicates when the user is on "All sites" — same
   * MOG name showing up multiple times because it exists at
   * Mumbai, Bangalore, etc. simultaneously.
   *
   * Each group resolves to:
   *   primary  → the highest-priority decision in the group
   *              (already-sorted, so [0]). Used for queue, status,
   *              generatedAt, defaultAplId, siteId, mogId, id.
   *   merged   → a synthesised MappingDecision that proxies the
   *              primary's fields but unions
   *              candidateAplIds / mappedAplIds / rejectedAplIds
   *              across every underlying decision. RowGroup reads
   *              from this so the Articles cell, progress count,
   *              expansion contents, etc. all reflect the
   *              ingredient's full APL set.
   *   group    → the underlying decisions, kept around so bulk
   *              actions (Confirm All / Reject All) can dispatch
   *              the per-decision store calls correctly.
   *
   * articleToDecision (above) keeps mapping each aplId to its
   * actual originating decisionId — that's still per-decision,
   * not per-group, so single-row Confirm/Reject + the bulk-bar
   * routing all stay correct. */
  const groupedVisible = useMemo(() => {
    const buckets = new Map<string, MappingDecision[]>();
    const order: string[] = [];
    for (const d of visible) {
      if (!buckets.has(d.mogId)) {
        buckets.set(d.mogId, []);
        order.push(d.mogId);
      }
      buckets.get(d.mogId)!.push(d);
    }
    return order.map((mogId) => {
      const group = buckets.get(mogId)!;
      const primary = group[0];
      const merged: MappingDecision = {
        ...primary,
        candidateAplIds: Array.from(
          new Set(group.flatMap((d) => d.candidateAplIds))
        ),
        mappedAplIds: Array.from(
          new Set(group.flatMap((d) => d.mappedAplIds ?? []))
        ),
        rejectedAplIds: Array.from(
          new Set(group.flatMap((d) => d.rejectedAplIds ?? []))
        ),
      };
      return { merged, group };
    });
  }, [visible]);

/* Every actionable APL across all currently-visible decisions —
   * powers the table-header "Select all" checkbox. "Actionable" =
   * not already mapped, not rejected, since those rows render
   * without their own checkbox and shouldn't accumulate as ghost
   * ids in the selection set. Re-derived per render is fine: this
   * is the same shape of work the per-row groupCheckboxState does
   * locally, just hoisted to the table level. */
  const allVisibleActionableIds = useMemo(() => {
    const ids: string[] = [];
    for (const d of visible) {
      const rejected = new Set(d.rejectedAplIds ?? []);
      const mapped = new Set(d.mappedAplIds ?? []);
      for (const aplId of d.candidateAplIds) {
        if (rejected.has(aplId)) continue;
        // In mapped tab, mapped APLs are selectable for reject; elsewhere skip them
        if (tab !== "mapped" && mapped.has(aplId)) continue;
        ids.push(aplId);
      }
    }
    return ids;
  }, [visible, tab]);

  const headerCheckboxState: boolean | "indeterminate" = useMemo(() => {
    if (allVisibleActionableIds.length === 0) return false;
    const allChecked = allVisibleActionableIds.every((id) => selected.has(id));
    if (allChecked) return true;
    const someChecked = allVisibleActionableIds.some((id) => selected.has(id));
    return someChecked ? "indeterminate" : false;
  }, [allVisibleActionableIds, selected]);

  const toggleSelectAllVisible = () => {
    if (allVisibleActionableIds.length === 0) return;
    setSelected((prev) => {
      const allChecked = allVisibleActionableIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allChecked) {
        allVisibleActionableIds.forEach((id) => next.delete(id));
      } else {
        allVisibleActionableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  useEffect(() => {
    setSelected((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (articleToDecision.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [articleToDecision]);

  /* Seed the local defaultSet from store-side defaultAplIds on
   * mount + ensure every ingredient with mapped articles has at
   * least one default. Two passes:
   *   1. Mirror — pull every defaultAplId from pending decisions
   *      into the local set so the star UI starts filled where
   *      the store already says it should be.
   *   2. Backfill — for any ingredient whose mapped articles have
   *      zero defaults across ALL their decisions, promote the
   *      first mapped APL to default via the store action. This
   *      satisfies "≥1 default per ingredient" for legacy fixture
   *      rows that pre-date the auto-seed in confirmDecision /
   *      addAplToDecision. */
  useEffect(() => {
    setDefaultSet((prev) => {
      const next = new Set(prev);
      let changed = false;
      const rejectedByMog = new Map<string, Set<string>>();
      for (const d of decisions) {
        // Walk every decision regardless of status — Mapped (terminal
        // confirmed) rows still surface their defaults in the
        // expanded view, so skipping them here would leave stars
        // empty for already-mapped articles.
        let rj = rejectedByMog.get(d.mogId);
        if (!rj) {
          rj = new Set<string>();
          rejectedByMog.set(d.mogId, rj);
        }
        (d.rejectedAplIds ?? []).forEach((id) => rj!.add(id));
        for (const id of d.defaultAplIds ?? []) {
          if (rj.has(id)) continue;
          if (!d.candidateAplIds.includes(id)) continue;
          if (!next.has(id)) {
            next.add(id);
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
    if (!defaultsSeeded) setDefaultsSeeded(true);
  }, [decisions, defaultsSeeded]);

  /* One-shot backfill — runs once after mount. Groups decisions by
   * mogId; if an ingredient has mapped articles but zero defaults
   * across every decision, promote the first mapped APL on its
   * primary decision to default. Idempotent — second pass finds
   * the seeded default and bails out. */
  const [backfilledDefaults, setBackfilledDefaults] = useState(false);
  useEffect(() => {
    if (backfilledDefaults) return;
    const byMog = new Map<string, MappingDecision[]>();
    for (const d of decisions) {
      const arr = byMog.get(d.mogId) ?? [];
      arr.push(d);
      byMog.set(d.mogId, arr);
    }
    for (const [, group] of byMog) {
      const totalDefaults = group.reduce(
        (n, d) => n + (d.defaultAplIds?.length ?? 0),
        0
      );
      if (totalDefaults > 0) continue;
      // Find first mapped APL on any decision in the group.
      const seedDecision = group.find(
        (d) => (d.mappedAplIds?.length ?? 0) > 0
      );
      const seedAplId = seedDecision?.mappedAplIds?.[0];
      if (seedDecision && seedAplId) {
        toggleDecisionDefault(seedDecision.id, seedAplId);
      }
    }
    setBackfilledDefaults(true);
  }, [decisions, backfilledDefaults, toggleDecisionDefault]);

  const toggleArticle = (aplId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(aplId)) next.delete(aplId);
      else next.add(aplId);
      return next;
    });

  /* Select / deselect every actionable article under one
   * ingredient. "Actionable" = not already mapped, not rejected —
   * those rows render without checkboxes, so including them in
   * selection would silently park ids that the user can't toggle.
   * Drives the parent-row checkbox + the Select All checkbox in
   * the expanded sub-header.
   *
   * Takes a decision-shaped object (works for both raw
   * MappingDecisions and the synthesised "merged" decisions
   * produced by the groupedVisible derivation). Operating on
   * candidateAplIds directly means a merged ingredient row
   * correctly toggles every APL across every underlying site. */
  const selectAllInGroup = (dec: {
    candidateAplIds: string[];
    mappedAplIds?: string[];
    rejectedAplIds?: string[];
  }) => {
    const rejected = new Set(dec.rejectedAplIds ?? []);
    const mapped = new Set(dec.mappedAplIds ?? []);
    const groupIds = dec.candidateAplIds.filter(
      (id) => !rejected.has(id) && !mapped.has(id)
    );
    if (groupIds.length === 0) return;
    setSelected((prev) => {
      const allChecked = groupIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allChecked) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleExpand = (id: string) =>
    setExpandedMogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /* Bulk actions — confirm/reject every SELECTED article via its
   * parent decision. confirmDecision(decisionId, [aplId]) marks the
   * article as mapped without touching the decision's other
   * candidates; rejectAplMatch removes it from the candidate pool.
   * Session counters increment by 1 per article actioned so the
   * bulk bar's running totals stay accurate. Newly mapped article
   * ids land in newlyMapped so the row + bulk-bar UI can flag them
   * with a "New" tag for the rest of the session. */
  const bulkConfirm = () => {
    let actioned = 0;
    const fresh: string[] = [];
    selected.forEach((aplId) => {
      const decisionId = articleToDecision.get(aplId);
      if (!decisionId) return;
      confirmDecision(decisionId, [aplId]);
      actioned += 1;
      fresh.push(aplId);
    });
    if (actioned > 0) {
      setNewlyMapped((prev) => {
        const next = new Set(prev);
        fresh.forEach((id) => next.add(id));
        return next;
      });
      setNewlyAddedIds((prev) => {
        const toRemove = fresh.filter((id) => prev.has(id));
        if (toRemove.length === 0) return prev;
        const next = new Set(prev);
        toRemove.forEach((id) => next.delete(id));
        return next;
      });
      if (actioned === 1) {
        const apl = apls.find((a) => a.id === fresh[0]);
        const name = apl
          ? [apl.characteristic, apl.packSize].filter(Boolean).join(" · ") ||
            apl.genericName
          : "Article";
        fireToast(`${name} mapped successfully`);
      } else {
        fireToast(`${actioned} articles mapped successfully`);
      }
    }
    setSelected(new Set());
  };
  const commitBulkReject = () => {
    if (!bulkRejectReason) {
      setBulkRejectError(true);
      return;
    }
    const note = bulkRejectNote.trim();
    const reasonText = note ? `${bulkRejectReason} — ${note}` : bulkRejectReason;
    selected.forEach((aplId) => {
      const decisionId = articleToDecision.get(aplId);
      if (!decisionId) return;
      rejectAplMatch(decisionId, aplId, reasonText);
    });
    setSelected(new Set());
    setBulkRejectOpen(false);
    setBulkRejectReason("");
    setBulkRejectNote("");
    setBulkRejectError(false);
  };

  /* Single-article action wrappers — used by the Case A inline
   * buttons on single-article ingredient rows and the per-row
   * buttons on expanded article rows. */
  const handleConfirmOne = (decisionId: string, aplId: string) => {
    confirmDecision(decisionId, [aplId]);
    const apl = apls.find((a) => a.id === aplId);
    const name = apl
      ? [apl.characteristic, apl.packSize].filter(Boolean).join(" · ") ||
        apl.genericName
      : "Article";
    fireToast(`${name} mapped successfully`);
    setNewlyMapped((prev) => {
      const next = new Set(prev);
      next.add(aplId);
      return next;
    });
    setNewlyAddedIds((prev) => {
      if (!prev.has(aplId)) return prev;
      const next = new Set(prev);
      next.delete(aplId);
      return next;
    });
  };

  const handleUndoMapped = (aplId: string) => {
    const decisionId = articleToDecision.get(aplId);
    if (decisionId) undoConfirmApl(decisionId, aplId);
    // Also clean local session tracking
    setNewlyMapped((prev) => {
      if (!prev.has(aplId)) return prev;
      const next = new Set(prev);
      next.delete(aplId);
      return next;
    });
  };
  // Open the reject-reason modal. Label is resolved here so the
  // modal can display a human-readable name without extra prop threading.
  const handleRejectOne = (aplId: string) => {
    const apl = apls.find((a) => a.id === aplId);
    const label = apl
      ? [apl.characteristic, apl.packSize].filter(Boolean).join(" · ") ||
        apl.genericName
      : aplId;
    const decisionId = articleToDecision.get(aplId);
    setRejectReason("");
    setRejectNote("");
    setRejectReasonError(false);
    setRejectModalTarget({ aplId, label, decisionId });
  };
  // Called when the user submits the modal. Requires a selected reason.
  const commitReject = () => {
    if (!rejectReason) {
      setRejectReasonError(true);
      return;
    }
    if (!rejectModalTarget) return;
    const { aplId, decisionId } = rejectModalTarget;
    const reason = rejectNote.trim()
      ? `${rejectReason.trim()} — ${rejectNote.trim()}`
      : rejectReason.trim();
    // If APL is in a mapped decision, call store to unmap + reject
    if (decisionId) {
      const dec = decisions.find((d) => d.id === decisionId);
      if (dec && (dec.mappedAplIds ?? []).includes(aplId)) {
        undoConfirmApl(decisionId, aplId);
        rejectAplMatch(decisionId, aplId, reason);
      } else {
        rejectAplMatch(decisionId, aplId, reason);
      }
    }
    setLocallyRejectedIds((prev) => {
      const next = new Map(prev);
      next.set(aplId, reason);
      return next;
    });
    setNewlyAddedIds((prev) => {
      if (!prev.has(aplId)) return prev;
      const next = new Set(prev);
      next.delete(aplId);
      return next;
    });
    setRejectModalTarget(null);
    setRejectReason("");
    setRejectNote("");
    setRejectReasonError(false);
  };
  // Undo: remove from local map → row restores to normal.
  const handleUndoReject = (aplId: string) => {
    setLocallyRejectedIds((prev) => {
      const next = new Map(prev);
      next.delete(aplId);
      return next;
    });
  };

  // Parent-row action handlers (visual-only, no store call).
  const handleParentConfirm = (decisionId: string, articleName: string) => {
    setParentActions((prev) => new Map(prev).set(decisionId, "confirmed"));
    fireToast(`${articleName} mapped successfully`);
  };
  const openParentRejectModal = (decisionId: string) => {
    setParentRejectTarget(decisionId);
    setParentRejectReason("");
    setParentRejectNote("");
    setParentRejectError(false);
  };
  const commitParentReject = () => {
    if (!parentRejectReason) { setParentRejectError(true); return; }
    if (parentRejectTarget) {
      setParentActions((prev) => new Map(prev).set(parentRejectTarget, "rejected"));
    }
    setParentRejectTarget(null);
    setParentRejectReason("");
    setParentRejectNote("");
    setParentRejectError(false);
  };
  const handleParentUndo = (decisionId: string) => {
    setParentActions((prev) => { const n = new Map(prev); n.delete(decisionId); return n; });
  };

  /* Modal-driven add-Article handlers. openAddModal sets the
   * target decision id; the modal renders bound to it and calls
   * onAddSelected with the picked aplIds when the user commits.
   * closeAddModal clears the target. */
  const openAddModal = (decisionId: string) =>
    setAddingDecisionId(decisionId);
  const closeAddModal = () => setAddingDecisionId(null);

  /* Escalate an empty (Needs Mapping / red queue) ingredient to
   * Procurement. Stub for now — logs the decision payload so the
   * surface is visible in console while the real escalation flow
   * (store action, audit entry, exception record) is being
   * defined. The button only renders on Case 0 red rows, so the
   * caller can assume an actionable empty-state decision here. */
  const handleEscalateToProcurement = (decision: MappingDecision) => {
    // eslint-disable-next-line no-console
    console.log("[Escalate to Procurement]", decision);
    setEscalatedSet((prev) => {
      if (prev.has(decision.id)) return prev;
      const next = new Set(prev);
      next.add(decision.id);
      return next;
    });
  };

  /** Toggle an article's default flag for its ingredient.
   *  Multi-select semantics — one or more defaults per
   *  ingredient. Two layers of write:
   *    1. Local `defaultSet` flips immediately so the star fills
   *       on click (instant UI, no store-roundtrip jank).
   *    2. Store `toggleDecisionDefault` persists the change so it
   *       survives tab switches + drives the row drawer's
   *       default-aware copy.
   *  At-least-one guard: if unmarking would zero out the
   *  ingredient's defaults across ALL its decisions (multi-site
   *  ingredients can have several), the click is a no-op. */
  const setDefaultForIngredient = (_mogId: string, aplId: string) => {
    // Star toggle is a free action — the previous "≥1 default per
    // ingredient" guard silently blocked clicks on single-candidate
    // rows, which read as a broken button. The user can always
    // re-star via the same control if they accidentally clear the
    // default.
    setDefaultSet((prev) => {
      const next = new Set(prev);
      if (next.has(aplId)) next.delete(aplId);
      else next.add(aplId);
      return next;
    });
    const decisionId = articleToDecision.get(aplId);
    if (decisionId) toggleDecisionDefault(decisionId, aplId);
  };

  // Count of decisions visible in the "Mapped" tab — uses the same
  // partial-mapping predicate as the visible filter so the badge
  // matches the row count one-to-one.
  const mappedCount = useMemo(
    () =>
      decisions.filter(
        (d) =>
          d.status === "confirmed" ||
          d.status === "entered" ||
          (d.mappedAplIds?.length ?? 0) > 0
      ).length,
    [decisions]
  );

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col w-full">
      {/* ─── Top bar — status tabs + search ───────────────────────
          Outer is `flex-wrap` so the toolbar (Collapse / Search /
          Columns / Filter) drops to its own row when the viewport
          can't fit it next to the tablist. The tablist itself has
          `min-w-0 overflow-x-auto` so tabs scroll *inside* their
          own band rather than pushing the outer container wider
          than the viewport. The whole header sits in a `w-full
          max-w-full overflow-x-hidden` shell so any stray child
          can't bleed horizontally; only the table body below
          permits horizontal scrolling. */}
      <div className="shrink-0 w-full max-w-full border-b border-border bg-card/40 px-6 pt-2 pb-0 flex items-end justify-between gap-3 flex-wrap">
        <div
          role="tablist"
          aria-label="Status filter"
          className="inline-flex items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-100/80 p-0.5 self-start mb-2"
        >
          {STATUS_TABS.map((t) => {
            const active = tab === t.key;
            // Tab counts mirror the filter's visibility rules so
            // the badge matches the row count the user sees.
            const n =
              t.key === "all"
                ? counts.amber +
                  counts.red +
                  counts.green +
                  counts.blue +
                  danglingCount +
                  mappedCount
                : t.key === "mapped"
                ? mappedCount
                : t.key === "unmapped"
                ? counts.red + danglingCount
                : t.key === "amber"
                ? counts.amber + counts.blue
                : counts[t.key as Queue];
            const dotClass: Record<StatusTab, string | null> = {
              all: null,
              amber: "bg-[#F8B80C]",
              red: "bg-red-500",
              green: "bg-green-500",
              blue: "bg-[#F8B80C]",
              dangling: "bg-red-500",
              unmapped: "bg-red-500",
              mapped: "bg-purple-500",
            };
            const dot = dotClass[t.key];
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-1 text-[12px] transition-all outline-none focus:outline-none focus-visible:outline-none",
                  active
                    ? "bg-white text-zinc-900 font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-zinc-200"
                    : "text-zinc-500 font-normal hover:text-zinc-900 hover:bg-white/60"
                )}
              >
                {dot && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                      dot
                    )}
                  />
                )}
                <span>{t.label}</span>
                <span
                  className={cn(
                    "numeric-tabular tabular-nums inline-flex items-center justify-center rounded-sm px-1.5 text-[10px] min-w-[18px] h-[16px] font-semibold",
                    active
                      ? "bg-zinc-100 text-zinc-700"
                      : "bg-zinc-200/70 text-zinc-600"
                  )}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>
        {/* Right cluster — Expand/Collapse All toggle + search.
            pb-2.5 matches the tab buttons' pb so both controls
            sit on the same baseline as the tabs' active underline.
            h-8 matches the TopBar controls (Site filter, Export
            Excel) for consistency across all header chrome. */}
        <div className="flex items-center gap-1.5 pb-3 flex-wrap justify-end">
          {(() => {
            // Pull every multi-Article ingredient out of the
            // current visible set — single-Article rows have no
            // expansion, so they're skipped. The toggle reads
            // "Collapse All" when at least one of them is
            // already open, else "Expand All".
            const expandableMogIds = groupedVisible
              .filter((g) => g.merged.candidateAplIds.length > 1)
              .map((g) => g.merged.mogId);
            const someOpen = expandableMogIds.some((id) =>
              expandedMogIds.has(id)
            );
            const handleToggleAll = () => {
              if (someOpen) {
                setExpandedMogIds(new Set());
              } else {
                setExpandedMogIds(new Set(expandableMogIds));
              }
            };
            return (
              <button
                type="button"
                onClick={handleToggleAll}
                disabled={expandableMogIds.length === 0}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[11.5px] font-medium text-foreground/80 transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {someOpen ? (
                  <ChevronsDownUp
                    className="h-3.5 w-3.5"
                    strokeWidth={2}
                  />
                ) : (
                  <ChevronsUpDown
                    className="h-3.5 w-3.5"
                    strokeWidth={2}
                  />
                )}
                {someOpen ? "Collapse All" : "Expand All"}
              </button>
            );
          })()}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredient or article…"
              className="pl-8 h-8 text-[12px]"
            />
          </div>
          {/* Columns dropdown — toggles visibility of the three
              optional columns (Category Path / Status / Last
              updated). Default = all on, matching the legacy view. */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[11.5px] font-medium text-foreground/80 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Columns3 className="h-3.5 w-3.5" strokeWidth={2} />
                Columns
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              collisionPadding={12}
              className="w-52 p-2"
            >
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-1.5">
                Toggle columns
              </div>
              {(
                [
                  { key: "reasons" as const, label: "Reasons" },
                  { key: "status" as const, label: "Status" },
                  { key: "lastUpdated" as const, label: "Last updated" },
                ]
              ).map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-2 py-1.5 text-[13px] rounded hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={columnVisibility[col.key]}
                    onCheckedChange={(v) =>
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [col.key]: Boolean(v),
                      }))
                    }
                  />
                  {col.label}
                </label>
              ))}
            </PopoverContent>
          </Popover>
          {/* Filter dropdown — Status (multi-select), Category
              (single), Last updated (date range). Filter chain
              applies on top of the existing tab + site + search
              filters in the visible useMemo. */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[11.5px] font-medium text-foreground/80 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
                Filter
                {(filterCategory !== "all" ||
                  filterDateFrom ||
                  filterDateTo ||
                  filterStatus.size > 0) && (
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                    {(filterCategory !== "all" ? 1 : 0) +
                      (filterDateFrom || filterDateTo ? 1 : 0) +
                      (filterStatus.size > 0 ? 1 : 0)}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              collisionPadding={12}
              className="w-[280px] p-3 space-y-3"
            >
              {/* Status multi-select — complements the tab strip for
                  cross-tab searches (e.g. "show only amber + red across
                  all sites"). Empty = no restriction. */}
              <div className="space-y-1.5">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Status
                </div>
                <div className="flex flex-col gap-1">
                  {(["green", "amber", "red", "blue"] as Queue[]).map((q) => {
                    const cfg = QUEUES[q];
                    const Icon = cfg.icon;
                    const checked = filterStatus.has(q);
                    return (
                      <label
                        key={q}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer select-none transition-colors",
                          checked ? cfg.bgSoftClass : "hover:bg-accent/50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFilterStatus(q)}
                          className="h-3.5 w-3.5 rounded accent-current cursor-pointer shrink-0"
                        />
                        <Icon className={cn("h-3 w-3 shrink-0", cfg.textClass)} />
                        <span className={cn("text-[12px] font-medium", checked ? cfg.textClass : "text-foreground/80")}>
                          {STATUS_LABEL[q]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Category
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="block w-full h-8 rounded-md border border-border bg-background px-2 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">All categories</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Last updated
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="min-w-0 h-8 w-full rounded-md border border-border bg-background px-2 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="text-[11px] text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="min-w-0 h-8 w-full rounded-md border border-border bg-background px-2 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterCategory("all");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                  setFilterStatus(new Set());
                }}
                className="block w-full h-8 rounded-md border border-border bg-background text-[12px] font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                Clear filters
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ─── Bulk action bar — only renders when the user has an
          active selection. Post-action feedback now flows through the
          floating success toast at the bottom-right; the persistent
          "X mapped • Y rejected" running totals were removed because
          they made the stripe linger after the user was done. */}
      {selected.size > 0 && (
        <div className="shrink-0 border-b border-border bg-zinc-50/90 px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FDE7A4] text-[#7a5a04] border border-[#F8B80C]/40 px-1.5 text-[10.5px] font-semibold numeric-tabular">
              {selected.size}
            </span>
            <span className="text-[12.5px] font-medium text-foreground/85">
              {selected.size === 1 ? "Article selected" : "Articles selected"}
            </span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-[11.5px] text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkRejectOpen(true)}
              className="h-7 px-2.5 text-[11px] shadow-none [&_svg]:size-3"
            >
              <X />
              Reject selected
            </Button>
            <Button
              size="sm"
              onClick={() => setBulkConfirmOpen(true)}
              className="h-7 px-2.5 text-[11px] shadow-none bg-brand-soft text-brand border border-brand/30 font-semibold hover:bg-brand-soft/70 hover:text-brand [&_svg]:size-3"
            >
              <Check />
              Confirm Mapping
            </Button>
          </div>
        </div>
      )}

      {/* ─── Table body ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {groupedVisible.length === 0 && visibleDanglings.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center px-8 py-16">
            <div>
              {/* Tab-specific empty state — gives the user a
                  more actionable cue than a generic "no rows"
                  message, especially on Needs Review / Needs
                  Mapping where the spec calls out copy. */}
              <div className="text-base font-medium">
                {tab === "amber"
                  ? "No items to review"
                  : tab === "unmapped"
                  ? "Nothing unmapped"
                  : tab === "green"
                  ? "Nothing ready to confirm"
                  : tab === "blue"
                  ? "No transitions pending"
                  : tab === "mapped"
                  ? "Nothing mapped yet"
                  : "All clear"}
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                {tab === "amber"
                  ? "Ingredients with articles to review will appear here. Try Needs Mapping for items missing articles."
                  : tab === "unmapped"
                  ? "No unmatched MOGs or orphan articles. Use Link APL to attach articles to MOGs."
                  : "Nothing matches the current filter. Tomorrow's ODS refresh will queue more work."}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm table-fixed">
            {/* Sticky header — barely-tinted #F8F9FA wash + a
                near-invisible bottom hairline so the header sits
                a touch above the row stack visually. shadow-sm
                appears once the table scrolls so the depth cue
                shows up exactly when the header would otherwise
                start to blur into the rows below it. */}
            <thead className="sticky top-0 z-10 bg-zinc-50 backdrop-blur border-b border-black/[0.06] shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <tr className="text-left text-[10px] uppercase tracking-[0.07em] text-zinc-500">
                {/* Column 1 — table-level Select All. Toggles every
                    actionable APL across every currently-visible
                    decision in or out of the selection set. State
                    resolves to checked / indeterminate / unchecked
                    based on how many of those APLs are already in
                    selected. Disabled when nothing in view is
                    actionable (empty filter, or every visible
                    decision is fully mapped). */}
                <th className="px-4 py-2 font-medium w-[40px]">
                  <Checkbox
                    checked={headerCheckboxState}
                    onCheckedChange={toggleSelectAllVisible}
                    disabled={allVisibleActionableIds.length === 0}
                    aria-label="Select all visible articles"
                  />
                </th>
                {/* Column 2 — chevron toggle for multi-Article rows */}
                <th className="px-3 py-2 font-medium w-[40px]" />
                {/* Subtle right-borders on Ingredient / Articles /
                    Hierarchy create gentle column-alignment
                    cues without turning the table into a full
                    grid. The black/[0.06] alpha is intentionally
                    near-invisible — present enough to anchor the
                    eye, faint enough to disappear when the table
                    is in motion. */}
                <th className="px-3 py-2 font-medium w-[260px] border-r border-r-black/[0.03]">
                  <SortHeader label="MOG" sortKey="mog" active={sortKey} dir={sortDir} onSort={toggleSort} />
                </th>
                <th className="px-3 py-2 font-medium w-[280px] max-w-[280px] border-r border-r-black/[0.03]">
                  <SortHeader label="Articles" sortKey="articles" active={sortKey} dir={sortDir} onSort={toggleSort} />
                </th>
                {columnVisibility.categoryPath && (
                  <th className="px-3 py-2 font-medium w-[280px] border-r border-r-black/[0.03]">
                    Hierarchy Path
                  </th>
                )}
                {columnVisibility.reasons && (
                  <th className="px-3 py-2 font-medium w-[200px]">Reason</th>
                )}
                {columnVisibility.status && (
                  <th className="px-3 py-2 font-medium w-[160px] border-r border-r-black/[0.03]">
                    <SortHeader label="Status" sortKey="status" active={sortKey} dir={sortDir} onSort={toggleSort} />
                  </th>
                )}
                {columnVisibility.lastUpdated && (
                  <th className="px-3 py-2 font-medium w-[110px] whitespace-nowrap">
                    <SortHeader label="Last updated" sortKey="lastUpdated" active={sortKey} dir={sortDir} onSort={toggleSort} />
                  </th>
                )}
                {/* Sized for Link CookBook + Reject + Link APL triplet. */}
                <th className="px-3 py-2 font-medium w-[280px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedVisible.map(({ merged }) => (
                <RowGroup
                  // Key by mogId — the merged row's identity is
                  // the ingredient, not any individual decision.
                  key={merged.mogId}
                  decision={merged}
                  apls={apls}
                  mogs={mogs}
                  expanded={expandedMogIds.has(merged.mogId)}
                  selectedArticleIds={selected}
                  defaultArticleIds={defaultSet}
                  newlyMappedIds={newlyMapped}
                  newlyAddedIds={newlyAddedIds}
                  onToggleArticleSelect={toggleArticle}
                  onToggleDefault={(aplId) =>
                    setDefaultForIngredient(merged.mogId, aplId)
                  }
                  onSelectAllInGroup={() => selectAllInGroup(merged)}
                  onToggleExpand={() => toggleExpand(merged.mogId)}
                  // New articles attach to the primary decision;
                  // for a multi-site ingredient that's the
                  // highest-priority decision (queue order). The
                  // per-site nuance is preserved in store data.
                  onAddArticle={() => openAddModal(merged.id)}
                  onEscalateToProcurement={() =>
                    handleEscalateToProcurement(merged)
                  }
                  isEscalated={escalatedSet.has(merged.id)}
                  columnVisibility={columnVisibility}
                  visibleColumnCount={visibleColumnCount}
                  // Per-APL actions route via articleToDecision so
                  // we hit the correct underlying decision even
                  // when the row aggregates across multiple sites.
                  onConfirmOne={(aplId) =>
                    handleConfirmOne(
                      articleToDecision.get(aplId) ?? merged.id,
                      aplId
                    )
                  }
                  onRejectOne={handleRejectOne}
                  onUndoReject={handleUndoReject}
                  onUndoMapped={handleUndoMapped}
                  locallyRejectedIds={locallyRejectedIds}
                  aplReasons={aplReasons}
                  rowReason={rowReasons.get(merged.id)}
                  onSetAplReason={(aplId, r) =>
                    setAplReasons((prev) => {
                      const next = new Map(prev);
                      if (r) next.set(aplId, r); else next.delete(aplId);
                      return next;
                    })
                  }
                  onSetRowReason={(r) =>
                    setRowReasons((prev) => {
                      const next = new Map(prev);
                      if (r) next.set(merged.id, r); else next.delete(merged.id);
                      return next;
                    })
                  }
                  onOpenDetail={() => setDetailMogId(merged.mogId)}
                  onOpenArticleDetail={(aplId) => {
                    setDetailAplId(aplId);
                    setDetailMogId(merged.mogId);
                  }}
                  tab={tab}
                  parentAction={parentActions.get(merged.id) ?? "none"}
                  onParentConfirm={(name) => handleParentConfirm(merged.id, name)}
                  onParentReject={() => openParentRejectModal(merged.id)}
                  onParentUndo={() => handleParentUndo(merged.id)}
                  onUnlinkCookbook={() => setUnlinkConfirmDecisionId(merged.id)}
                  onLinkCookbook={() => setLinkCookbookDecisionId(merged.id)}
                />
              ))}

              {/* Dangling APLs section — surfaced in "All" + "Dangling
                  Articles" tabs. Rendered as a contiguous block at the
                  bottom of the table with its own section header so
                  users can scan the orphan list independently of the
                  Ingredient-centric rows above. */}
              {visibleDanglings.length > 0 && (
                <>
                  {visibleDanglings.map((exc) => (
                    <DanglingRow
                      key={exc.id}
                      exception={exc}
                      apl={
                        exc.aplId ? apls.find((a) => a.id === exc.aplId) : undefined
                      }
                      site={
                        exc.siteId ? sites.find((s) => s.id === exc.siteId) : undefined
                      }
                      columnVisibility={columnVisibility}
                    />
                  ))}
                </>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count — counts ingredients (groups), not raw
          decisions, so the number matches what the user sees in
          the table. The denominator counts unique pending MOGs
          for the same reason: an ingredient with pending work at
          two sites still reads as one open mapping. */}
      <div className="shrink-0 border-t border-border bg-card/40 px-6 py-2 text-[11px] text-muted-foreground">
        Showing{" "}
        <span className="numeric-tabular text-foreground font-medium">
          {groupedVisible.length}
        </span>{" "}
        of{" "}
        <span className="numeric-tabular text-foreground font-medium">
          {
            new Set(
              decisions
                .filter((d) => d.status === "pending")
                .map((d) => d.mogId)
            ).size
          }
        </span>{" "}
        open mappings
      </div>

      {/* Success toast — pops a transient confirmation after every
          confirm action (single or bulk) so the user gets explicit
          feedback even when the row has already graduated to the
          Mapped tab and is no longer visible. Auto-dismisses after
          3s; mounted as a fixed-position element so it floats above
          the table without affecting layout. The keyed wrapper +
          short fade animation make consecutive toasts feel
          re-mounted instead of stuck. */}
      {toast && (
        <div
          key={toast.key}
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3.5 py-2.5 shadow-lg shadow-green-900/5 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span className="text-[13px] font-medium text-green-800">
            {toast.message}
          </span>
        </div>
      )}

      {/* Add-Articles modal — multi-select picker. Mounted at the
          table level so it can read the full apls list once + emit
          a single batch addAplToDecision per pick. The modal manages
          its own search / selection state and unmounts when
          addingDecisionId resets to null. */}
      <AddArticlesModal
        open={addingDecisionId !== null}
        onOpenChange={(open) => {
          if (!open) closeAddModal();
        }}
        decision={
          addingDecisionId
            ? decisions.find((d) => d.id === addingDecisionId) ?? null
            : null
        }
        mog={
          addingDecisionId
            ? mogs.find(
                (m) =>
                  m.id ===
                  decisions.find((d) => d.id === addingDecisionId)?.mogId
              )
            : undefined
        }
        apls={apls}
        buildHierarchy={buildHierarchy}
        onAddSelected={(aplIds) => {
          if (!addingDecisionId) return;
          aplIds.forEach((aplId) =>
            addAplToDecision(addingDecisionId, aplId, { manuallyAdded: true })
          );
          setNewlyAddedIds((prev) => {
            const next = new Set(prev);
            aplIds.forEach((id) => next.add(id));
            return next;
          });
          // Auto-expand the row so newly-added articles are immediately
          // visible in the expansion — user doesn't need to click chevron.
          const dec = decisions.find((d) => d.id === addingDecisionId);
          if (dec) {
            setExpandedMogIds((prev) => {
              const next = new Set(prev);
              next.add(dec.mogId);
              return next;
            });
          }
        }}
      />

      {/* Row-detail drawer — slide-in panel with full mapping
          context for one ingredient. Mounted at the table level
          so it can read the merged decision + its candidates
          from the same data the rows are rendering, keeping the
          drawer's content perfectly in sync with what the user
          clicked. */}
      <RowDetailDrawer
        open={detailMogId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailMogId(null);
            setDetailAplId(null);
          }
        }}
        focusedAplId={detailAplId}
        decision={
          detailMogId
            ? groupedVisible.find((g) => g.merged.mogId === detailMogId)
                ?.merged ?? null
            : null
        }
        mog={
          detailMogId
            ? mogs.find((m) => m.id === detailMogId)
            : undefined
        }
        candidateApls={
          detailMogId
            ? (groupedVisible
                .find((g) => g.merged.mogId === detailMogId)
                ?.merged.candidateAplIds.map((id) =>
                  apls.find((a) => a.id === id)
                )
                .filter(Boolean) as APL[]) ?? []
            : []
        }
        defaultArticleIds={defaultSet}
        mappedArticleIds={
          detailMogId
            ? new Set(
                groupedVisible.find((g) => g.merged.mogId === detailMogId)
                  ?.merged.mappedAplIds ?? []
              )
            : new Set<string>()
        }
        onConfirm={(aplId) => {
          const decisionId = articleToDecision.get(aplId);
          if (!decisionId) return;
          handleConfirmOne(decisionId, aplId);
        }}
        onReject={(aplId) => {
          handleRejectOne(aplId);
        }}
        onChangeDefault={(aplId) => {
          if (!detailMogId) return;
          setDefaultForIngredient(detailMogId, aplId);
        }}
        onFlagForInvestigation={() => {
          // Prototype stub — backend wiring deferred. Flashes a
          // confirmation + closes the drawer so the user gets
          // visible feedback that the action registered.
          if (typeof window !== "undefined") {
            window.alert(
              "Flagged for Investigation.\n\n(Prototype stub — internal-review queue not wired up.)"
            );
          }
          setDetailMogId(null);
        }}
        onRaiseProcurementException={() => {
          // Prototype stub — backend wiring deferred. The case
          // will eventually drop into the Procurement workflow
          // (Exceptions screen) once the route is built.
          if (typeof window !== "undefined") {
            window.alert(
              "Procurement Exception raised.\n\n(Prototype stub — Procurement workflow handoff not wired up.)"
            );
          }
          setDetailMogId(null);
        }}
        onDelinkRetired={() => {
          // Prototype stub — backend wiring deferred. The
          // store doesn't currently expose a "delink APL from
          // ingredient" action; once added, this will sever
          // the mapping so the ingredient flips back to Needs
          // Review (or Needs Mapping if no replacement).
          if (typeof window !== "undefined") {
            window.alert(
              "Retired APL delinked.\n\n(Prototype stub — store action not wired up.)"
            );
          }
          setDetailMogId(null);
        }}
      />

      {/* ── Unlink CookBook confirmation ─────────────────────────────────
          Lifted outside the table DOM so it avoids invalid HTML nesting.
          Triggered from the "Unlink CookBook" button on retired-APL rows. */}
      {(() => {
        const unlinkDecision = unlinkConfirmDecisionId
          ? decisions.find((d) => d.id === unlinkConfirmDecisionId)
          : null;
        const retiredApl = unlinkDecision?.retiredAplId
          ? apls.find((a) => a.id === unlinkDecision.retiredAplId)
          : null;
        return (
          <Dialog
            open={unlinkConfirmDecisionId !== null}
            onOpenChange={(open) => {
              if (!open) setUnlinkConfirmDecisionId(null);
            }}
          >
            <DialogContent className="max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Unlink from CookBook</DialogTitle>
                <DialogDescription>
                  This will remove the link between the retired APL and the
                  ingredient in CookBook. The ingredient will move to Needs
                  Mapping for re-assignment.
                </DialogDescription>
              </DialogHeader>
              {retiredApl && (
                <div className="rounded-md border border-red-200 bg-red-50/60 px-3 py-2.5 text-[13px]">
                  <div className="font-medium text-foreground/90">
                    {retiredApl.brand && retiredApl.brand !== "UB"
                      ? `${retiredApl.brand} ${retiredApl.genericName}`
                      : retiredApl.genericName}
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground numeric-tabular tabular-nums">
                    {aplCode(retiredApl)} · Inactive
                  </div>
                </div>
              )}
              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setUnlinkConfirmDecisionId(null)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-[13px] font-medium text-foreground/80 hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUnlinkConfirmDecisionId(null);
                    // Prototype stub — backend wiring deferred.
                    // When the store exposes a delinkRetiredApl action,
                    // call it here with unlinkConfirmDecisionId.
                  }}
                  className="inline-flex h-9 items-center gap-1.5 justify-center rounded-md bg-red-600 px-4 text-[13px] font-medium text-white hover:bg-red-700 transition-colors"
                >
                  <Link2Off className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Unlink
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ── Link CookBook confirmation ───────────────────────────────────
          Triggered from the "Link CookBook" button on mapped rows.
          Confirms before marking the decision as entered in CookBook. */}
      {(() => {
        const linkDecision = linkCookbookDecisionId
          ? decisions.find((d) => d.id === linkCookbookDecisionId)
          : null;
        const linkMog = linkDecision
          ? mogs.find((m) => m.id === linkDecision.mogId)
          : null;
        const mappedAplList = (linkDecision?.mappedAplIds ?? linkDecision?.candidateAplIds ?? [])
          .map((id) => apls.find((a) => a.id === id))
          .filter((a): a is APL => Boolean(a));
        return (
          <Dialog
            open={linkCookbookDecisionId !== null}
            onOpenChange={(open) => {
              if (!open) setLinkCookbookDecisionId(null);
            }}
          >
            <DialogContent className="max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Link to CookBook</DialogTitle>
                <DialogDescription>
                  This will mark the ingredient as entered in CookBook,
                  confirming the APL mapping is live.
                </DialogDescription>
              </DialogHeader>
              {linkMog && (
                <div className="rounded-md border border-green-200 bg-green-50/60 px-3 py-2.5 text-[13px]">
                  <div className="font-medium text-foreground/90">{linkMog.name}</div>
                  {mappedAplList.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {mappedAplList.slice(0, 3).map((a) => (
                        <div key={a.id} className="text-[12px] text-muted-foreground numeric-tabular tabular-nums">
                          {aplCode(a)} · {[a.characteristic, a.packSize].filter(Boolean).join(" · ") || a.genericName}
                        </div>
                      ))}
                      {mappedAplList.length > 3 && (
                        <div className="text-[11px] text-muted-foreground">
                          +{mappedAplList.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setLinkCookbookDecisionId(null)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-[13px] font-medium text-foreground/80 hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (linkCookbookDecisionId) {
                      markCookbookEntered(linkCookbookDecisionId);
                    }
                    setLinkCookbookDecisionId(null);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 justify-center rounded-md bg-[#1F7A4D] px-4 text-[13px] font-medium text-white hover:bg-[#185f3c] transition-colors"
                >
                  <BookCheck className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Link CookBook
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ── Bulk-confirm preview ─────────────────────────────────────────
          Opens before committing a multi-select mapping confirm. Lists
          every (MOG → Article) pair the user is about to map so they
          can scan + cancel safely. Final Confirm fires the existing
          bulkConfirm flow. */}
      <Dialog
        open={bulkConfirmOpen}
        onOpenChange={(open) => {
          if (!open) setBulkConfirmOpen(false);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Check className="h-3.5 w-3.5 text-amber-700" strokeWidth={2.5} />
              </span>
              Confirm mapping
              <span className="ml-auto numeric-tabular text-[12px] font-medium text-muted-foreground">
                {selected.size} {selected.size === 1 ? "article" : "articles"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              Review the MOG → Article pairings below. This action maps each
              selected article to its parent ingredient.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] overflow-y-auto rounded-md border border-border">
            <table className="w-full text-[12.5px]">
              <thead className="sticky top-0 bg-muted/60 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">MOG</th>
                  <th className="px-3 py-2 text-left font-medium">Article</th>
                  <th className="px-3 py-2 text-right font-medium numeric-tabular">Code</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {Array.from(selected).map((aplId) => {
                  const decisionId = articleToDecision.get(aplId);
                  const decision = decisions.find((d) => d.id === decisionId);
                  const mog = decision
                    ? mogs.find((m) => m.id === decision.mogId)
                    : undefined;
                  const apl = apls.find((a) => a.id === aplId);
                  const articleLabel = apl
                    ? [apl.characteristic, apl.packSize, apl.brand && apl.brand !== "UB" ? apl.brand : null]
                        .filter(Boolean)
                        .join(" · ") || apl.genericName
                    : aplId;
                  return (
                    <tr
                      key={aplId}
                      className="group/row border-t border-border/60 hover:bg-accent/40"
                    >
                      <td className="px-3 py-2 align-middle">
                        <span className="text-foreground/90 font-[500]">
                          {mog?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span className="text-foreground/90">
                          {articleLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle text-right numeric-tabular text-muted-foreground">
                        {apl ? aplCode(apl) : "—"}
                      </td>
                      <td className="px-3 py-2 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Set(selected);
                            next.delete(aplId);
                            setSelected(next);
                            if (next.size === 0) setBulkConfirmOpen(false);
                          }}
                          className="opacity-0 group-hover/row:opacity-100 transition-opacity inline-flex h-5 w-5 items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                          aria-label="Remove from selection"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkConfirmOpen(false)}
              className="h-8 shadow-none"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                bulkConfirm();
                setBulkConfirmOpen(false);
              }}
              className="h-8 shadow-none bg-[#F8B80C] text-[#3d2d00] border border-[#d59f0a] font-medium hover:bg-[#e6a90b] hover:text-[#3d2d00]"
            >
              <Check className="h-3.5 w-3.5" />
              Confirm {selected.size} {selected.size === 1 ? "mapping" : "mappings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk-reject preview + reason ─────────────────────────────────
          Same MOG → Article preview as the bulk-confirm dialog plus a
          required reason chip group and optional note. The reason +
          trimmed note are concatenated and stamped on every rejected
          APL via rejectAplMatch. */}
      <Dialog
        open={bulkRejectOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBulkRejectOpen(false);
            setBulkRejectReason("");
            setBulkRejectNote("");
            setBulkRejectError(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              </span>
              Reject articles
              <span className="ml-auto numeric-tabular text-[12px] font-medium text-muted-foreground">
                {selected.size} {selected.size === 1 ? "article" : "articles"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              Review the rejections below, then pick a reason. The reason
              applies to every selected article.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[35vh] overflow-y-auto rounded-md border border-border">
            <table className="w-full text-[12.5px]">
              <thead className="sticky top-0 bg-muted/60 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">MOG</th>
                  <th className="px-3 py-2 text-left font-medium">Article</th>
                  <th className="px-3 py-2 text-right font-medium numeric-tabular">Code</th>
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {Array.from(selected).map((aplId) => {
                  const decisionId = articleToDecision.get(aplId);
                  const decision = decisions.find((d) => d.id === decisionId);
                  const mog = decision
                    ? mogs.find((m) => m.id === decision.mogId)
                    : undefined;
                  const apl = apls.find((a) => a.id === aplId);
                  const articleLabel = apl
                    ? [apl.characteristic, apl.packSize, apl.brand && apl.brand !== "UB" ? apl.brand : null]
                        .filter(Boolean)
                        .join(" · ") || apl.genericName
                    : aplId;
                  return (
                    <tr
                      key={aplId}
                      className="group/row border-t border-border/60 hover:bg-accent/40"
                    >
                      <td className="px-3 py-2 align-middle">
                        <span className="text-foreground/90 font-[500]">
                          {mog?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span className="text-foreground/90">
                          {articleLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle text-right numeric-tabular text-muted-foreground">
                        {apl ? aplCode(apl) : "—"}
                      </td>
                      <td className="px-3 py-2 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Set(selected);
                            next.delete(aplId);
                            setSelected(next);
                            if (next.size === 0) {
                              setBulkRejectOpen(false);
                              setBulkRejectReason("");
                              setBulkRejectNote("");
                              setBulkRejectError(false);
                            }
                          }}
                          className="opacity-0 group-hover/row:opacity-100 transition-opacity inline-flex h-5 w-5 items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                          aria-label="Remove from selection"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Reason <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REJECT_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setBulkRejectReason(r);
                      setBulkRejectError(false);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-[12.5px] font-medium text-left transition-all",
                      bulkRejectReason === r
                        ? "bg-red-50 border-red-300 text-red-700 ring-1 ring-red-200"
                        : "bg-muted/30 border-border text-muted-foreground hover:bg-accent hover:text-foreground hover:border-foreground/20"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {bulkRejectError && (
                <p className="text-[12px] text-red-600 font-medium flex items-center gap-1">
                  <X className="h-3 w-3" /> Select a reason to continue.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Additional notes <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={bulkRejectNote}
                onChange={(e) => setBulkRejectNote(e.target.value)}
                placeholder="Add more context if needed…"
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBulkRejectOpen(false);
                setBulkRejectReason("");
                setBulkRejectNote("");
                setBulkRejectError(false);
              }}
              className="h-8 shadow-none"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={commitBulkReject}
              className="h-8 shadow-none bg-red-600 hover:bg-red-700 text-white border-0"
            >
              <X className="h-3.5 w-3.5" />
              Reject {selected.size} {selected.size === 1 ? "article" : "articles"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject-reason modal ──────────────────────────────────────────
          Opens when user clicks any Reject button. Reason is required —
          validation fires inline so the user can fix without re-opening.
          Submission adds the aplId+reason to locallyRejectedIds (Map),
          triggering the strikethrough + Undo row in the table. */}
      <Dialog
        open={rejectModalTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectModalTarget(null);
            setRejectReason("");
            setRejectReasonError(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              </span>
              Reject Article
            </DialogTitle>
            <DialogDescription className="text-[13px] pt-0.5">
              Rejecting{" "}
              <span className="font-medium text-foreground">
                {rejectModalTarget?.label}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Reason chips */}
            <div className="space-y-2">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Reason <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REJECT_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRejectReason(r); setRejectReasonError(false); }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-[12.5px] font-medium text-left transition-all",
                      rejectReason === r
                        ? "bg-red-50 border-red-300 text-red-700 ring-1 ring-red-200"
                        : "bg-muted/30 border-border text-muted-foreground hover:bg-accent hover:text-foreground hover:border-foreground/20"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {rejectReasonError && (
                <p className="text-[12px] text-red-600 font-medium flex items-center gap-1">
                  <X className="h-3 w-3" /> Select a reason to continue.
                </p>
              )}
            </div>

            {/* Optional note */}
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Additional notes <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Add more context if needed…"
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 flex-row justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectModalTarget(null);
                setRejectReason("");
                setRejectNote("");
                setRejectReasonError(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={commitReject}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Parent-row reject modal ─────────────────────────────── */}
      <Dialog
        open={parentRejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setParentRejectTarget(null);
            setParentRejectReason("");
            setParentRejectError(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              </span>
              Reject Article
            </DialogTitle>
            <DialogDescription className="text-[13px] pt-0.5">
              Select a reason for rejecting this article.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Reason <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REJECT_REASONS.map((r) => (
                  <button key={r} type="button"
                    onClick={() => { setParentRejectReason(r); setParentRejectError(false); }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-[12.5px] font-medium text-left transition-all",
                      parentRejectReason === r
                        ? "bg-red-50 border-red-300 text-red-700 ring-1 ring-red-200"
                        : "bg-muted/30 border-border text-muted-foreground hover:bg-accent hover:text-foreground hover:border-foreground/20"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {parentRejectError && (
                <p className="text-[12px] text-red-600 font-medium flex items-center gap-1">
                  <X className="h-3 w-3" /> Select a reason to continue.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Additional notes <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <textarea rows={2} value={parentRejectNote}
                onChange={(e) => setParentRejectNote(e.target.value)}
                placeholder="Add more context if needed…"
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-row justify-end pt-1">
            <Button variant="outline" size="sm"
              onClick={() => { setParentRejectTarget(null); setParentRejectReason(""); setParentRejectNote(""); setParentRejectError(false); }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={commitParentReject}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Reason column — full pool. Two labels picked per-row using a stable
// hash of the row ID so each row gets a unique combination that never
// re-randomises across renders or navigations.
const ALL_REASON_ITEMS: { word: string; icon: "check" | "x" }[] = [
  { word: "Price",        icon: "check" },
  { word: "Pack size",    icon: "x"     },
  { word: "Category",     icon: "check" },
  { word: "Duplicate",    icon: "x"     },
  { word: "Availability", icon: "check" },
  { word: "Quality",      icon: "check" },
];

/** Pick 2 distinct items from ALL_REASON_ITEMS, deterministically from `seed`. */
function pickReasons(seed: string): { word: string; icon: "check" | "x" }[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  const abs = Math.abs(h);
  const n = ALL_REASON_ITEMS.length;
  const i1 = abs % n;
  const i2 = ((abs >> 3) + 1) % n;
  const j2 = i2 === i1 ? (i2 + 1) % n : i2;
  return [ALL_REASON_ITEMS[i1], ALL_REASON_ITEMS[j2]];
}

const REJECT_REASONS = [
  "Price too high",
  "Wrong pack size",
  "Incorrect category",
  "Duplicate article",
  "Not available at site",
  "Quality concerns",
];

const CONFIRM_REASONS = [
  "Price match",
  "Pack size",
  "Category",
  "Quality",
  "Availability",
  "Exact match",
];

// 1-word label for rejection reason shown in Reasons column
const SHORT_REASON: Record<string, string> = {
  "Price too high": "Price",
  "Wrong pack size": "Pack size",
  "Incorrect category": "Category",
  "Duplicate article": "Duplicate",
  "Not available at site": "Availability",
  "Quality concerns": "Quality",
};

// 1-word label for confirm reason shown in Reasons column
const SHORT_CONFIRM_REASON: Record<string, string> = {
  "Price match": "Price",
  "Pack size": "Pack size",
  "Category": "Category",
  "Quality": "Quality",
  "Availability": "Availability",
  "Exact match": "Match",
};

/* ─────────────────────────────────────────────────────────────────────────
 * RowGroup — one ingredient (decision) + its expanded article rows.
 * Renders 1..N <tr> elements depending on candidate count + expansion.
 * ──────────────────────────────────────────────────────────────────────── */

function RowGroup({
  decision,
  apls,
  mogs,
  expanded,
  selectedArticleIds,
  defaultArticleIds,
  newlyMappedIds,
  newlyAddedIds,
  locallyRejectedIds,
  onToggleArticleSelect,
  onToggleDefault,
  onSelectAllInGroup,
  onToggleExpand,
  onAddArticle,
  onEscalateToProcurement,
  isEscalated,
  columnVisibility,
  visibleColumnCount,
  onConfirmOne,
  onRejectOne,
  onUndoReject,
  onUndoMapped,
  onOpenDetail,
  onOpenArticleDetail,
  tab,
  parentAction,
  aplReasons,
  rowReason,
  onSetAplReason,
  onSetRowReason,
  onParentConfirm,
  onParentReject,
  onParentUndo,
  onUnlinkCookbook,
  onLinkCookbook,
}: {
  decision: MappingDecision;
  apls: APL[];
  mogs: ReturnType<typeof useMockStore.getState>["mogs"];
  expanded: boolean;
  /** Active status tab. When "mapped", the expanded view hides
   *  any candidate APLs that aren't yet mapped — the Mapped tab
   *  is a terminal-state view, so showing pending Confirm/Reject
   *  rows there contradicts the tab's promise. */
  tab: StatusTab;
  /** Set of currently-selected article ids — passed down so each
   *  expanded article row can read its own checked state without
   *  duplicating selection state. */
  selectedArticleIds: Set<string>;
  /** Article ids the user has flagged as "default". One per
   *  ingredient — drives the blue chip in the Articles column +
   *  the "Default" pill on the corresponding article row inside
   *  an expansion + the candidate sort priority. */
  defaultArticleIds: Set<string>;
  /** Article ids confirmed in the current session — used to flag
   *  "New" badges on freshly mapped rows + ingredients. */
  newlyMappedIds: Set<string>;
  /** Article ids added via "+ Add Article" in this session.
   *  Shows a "New" pill next to the article name until confirmed
   *  or rejected (or page reload). */
  newlyAddedIds: Set<string>;
  /** Soft-rejected articles: aplId → rejection reason.
   *  Rows stay visible with a strikethrough + Undo. */
  locallyRejectedIds: Map<string, string>;
  onToggleArticleSelect: (aplId: string) => void;
  /** Switch the ingredient's default APL to the given aplId.
   *  No-op when called with the current default (can't unset). */
  onToggleDefault: (aplId: string) => void;
  onSelectAllInGroup: () => void;
  onToggleExpand: () => void;
  onAddArticle: () => void;
  /** Stub action: surface an empty (Needs Mapping) ingredient to
   *  the procurement team. Renders alongside Add Article only on
   *  Case 0 red-queue rows. */
  onEscalateToProcurement: () => void;
  /** True once the user has escalated this row's ingredient.
   *  Drives the status-chip swap (Needs Mapping → Escalated) and
   *  hides the Escalate button so the action stays one-click. */
  isEscalated: boolean;
  /** Per-column visibility flags (Category Path / Status / Last
   *  updated). Drives conditional `<td>` render so the row stays
   *  aligned with the header when columns are toggled off. */
  columnVisibility: {
    categoryPath: boolean;
    reasons: boolean;
    status: boolean;
    lastUpdated: boolean;
  };
  /** Total visible column count — used for full-width footer rows
   *  (Add Article) so colSpan tracks the toggled state. */
  visibleColumnCount: number;
  onConfirmOne: (aplId: string) => void;
  /** Soft-reject: adds to local set, keeps row visible with strikethrough. */
  onRejectOne: (aplId: string) => void;
  /** Undo a soft-reject: removes from local set, restoring the row. */
  onUndoReject: (aplId: string) => void;
  /** Undo a confirmed mapping: removes APL from mappedAplIds in store. */
  onUndoMapped: (aplId: string) => void;
  /** Legacy ingredient-level open. Kept as a prop for parity but
   *  no longer fired by row clicks — drawer opens from article
   *  clicks via onOpenArticleDetail instead. */
  onOpenDetail: () => void;
  /** Open the drawer focused on a specific article. Fired when
   *  the user clicks an article in the Articles cell or inside
   *  the expansion. */
  onOpenArticleDetail: (aplId: string) => void;
  /** Visual-only parent-row action state. */
  parentAction: "none" | "confirmed" | "rejected";
  /** Independent reason tags — aplId → 1-2 word label. Not connected to confirm/reject. */
  aplReasons: Map<string, string>;
  /** Independent reason tag for this parent row. */
  rowReason?: string;
  onSetAplReason: (aplId: string, reason: string) => void;
  onSetRowReason: (reason: string) => void;
  /** Called with the article's display name so WorklistTable can show
   *  a contextual toast ("[name] mapped successfully"). */
  onParentConfirm: (articleName: string) => void;
  onParentReject: () => void;
  onParentUndo: () => void;
  /** Fires when the user clicks "Unlink CookBook" on a retired-APL row.
   *  Lifts the confirmation dialog to WorklistTable so it renders
   *  outside the table DOM (avoids invalid nesting). */
  onUnlinkCookbook: () => void;
  /** Fires when the user clicks "Link CookBook" on a mapped (non-retired)
   *  row. Lifts the confirmation dialog to WorklistTable. */
  onLinkCookbook: () => void;
}) {
  const mog = mogs.find((m) => m.id === decision.mogId);
  const rejected = new Set(decision.rejectedAplIds ?? []);

  // Local confirmed set — mirrors store mappedAplIds but updates instantly
  // on click so the button disabled state changes without waiting for store
  // re-render propagation.
  const [locallyConfirmedIds, setLocallyConfirmedIds] = useState<Set<string>>(new Set());

  // parentAction is lifted to WorklistTable so the reject Dialog
  // renders outside the table DOM (browser strips non-<tr> siblings
  // of <tbody> rows, killing the modal before it can fire).
  const isParentActioned = parentAction !== "none";
  // isParentConfirmedVisual depends on isDecisionMapped — declared below.
  // Set of mapped article ids — used to (a) drive the
  // "unmapped first, mapped sinks to bottom" candidate sort just
  // below, and (b) swap each per-article row into its terminal
  // "Mapped" badge state further down. Defined here (not lower)
  // so the sort can read it without re-walking decision arrays.
  const mappedSet = useMemo(
    () => new Set(decision.mappedAplIds ?? []),
    [decision.mappedAplIds]
  );
  const candidates = decision.candidateAplIds
    .map((id) => apls.find((a) => a.id === id))
    .filter((a): a is APL => Boolean(a))
    .filter((a) => !rejected.has(a.id))
    // Mapped tab is a terminal-state view — hide any APL that
    // isn't yet mapped so the user never sees Confirm/Reject
    // actions inside a tab that should only contain done work.
    .filter((a) => tab !== "mapped" || mappedSet.has(a.id))
    .sort((a, b) => {
      // Sort priorities (top → bottom in the expanded list):
      //   1. Newly-added (pending) articles FIRST — the user just
      //      attached them and needs to action them immediately.
      //      Only pending ones bubble up; if somehow a newly-added
      //      article was also confirmed, it falls to the mapped tier.
      //   2. Mapped/confirmed articles second — done work floats
      //      high so it's immediately visible without scrolling.
      //   3. Within each tier, starred default before non-default.
      //   4. Lowest cost first within same tier + default status.
      const aMapped = mappedSet.has(a.id);
      const bMapped = mappedSet.has(b.id);
      const aNew = newlyAddedIds.has(a.id) && !aMapped;
      const bNew = newlyAddedIds.has(b.id) && !bMapped;
      if (aNew !== bNew) return aNew ? -1 : 1;
      if (aMapped !== bMapped) return aMapped ? -1 : 1;
      const aDefault = defaultArticleIds.has(a.id);
      const bDefault = defaultArticleIds.has(b.id);
      if (aDefault !== bDefault) return aDefault ? -1 : 1;
      return a.costPerUnit - b.costPerUnit;
    });
  // Stable candidates: non-newly-added articles only.
  // Newly-added articles are NEVER eligible for the parent row —
  // they belong exclusively in the expansion list.
  const stableCandidates = candidates.filter((a) => !newlyAddedIds.has(a.id));

  // def is chosen from STABLE candidates only.
  //   1. Starred default that is still actionable (not yet mapped)
  //   2. Any non-mapped stable candidate (keeps parent row actionable)
  //   3. Starred default even if mapped (fallback — shows done state)
  //   4. First stable candidate
  //   → undefined when all candidates are newly-added (empty parent)
  const def =
    stableCandidates.find((a) => defaultArticleIds.has(a.id) && !mappedSet.has(a.id)) ??
    stableCandidates.find((a) => !mappedSet.has(a.id)) ??
    stableCandidates.find((a) => defaultArticleIds.has(a.id)) ??
    stableCandidates[0];

  // Expansion = everything except def. Newly-added articles always
  // land here since they're excluded from stable candidates above.
  // Retired APLs are intentionally NOT included — the parent row
  // already renders them inline (`retired → planned`) with the
  // Retiring chip, so listing them again as a child row would
  // duplicate the same article on screen.
  const expansionCandidates = def
    ? candidates.filter((a) => a.id !== def.id)
    : candidates;

  // Parent row state derives from STABLE candidates only.
  // isEmpty = no stable articles (even if newly-added ones exist —
  //   the parent row shows Case 0 until the user confirms one).
  // isMulti = there's anything to expand (stable alternatives OR
  //   newly-added articles alongside the stable parent).
  // single = exactly one stable candidate with nothing to expand.
  const isEmpty = stableCandidates.length === 0;
  const isMulti = expansionCandidates.length > 0;
  const single = !isMulti && stableCandidates.length === 1 ? stableCandidates[0] : null;

  // Decision-level mapped state. True when the decision is fully
  // confirmed/entered, OR the user is viewing the Mapped tab and at
  // least one APL has been mapped — the latter case lets a partially-
  // mapped MOG render in its terminal "Mapped" treatment inside the
  // Mapped tab (status chip swaps to green, action buttons hidden,
  // expanded list already trims to mapped APLs only).
  const isDecisionMapped =
    decision.status === "confirmed" ||
    decision.status === "entered" ||
    (tab === "mapped" && (decision.mappedAplIds?.length ?? 0) > 0);
  // Row gets green when locally confirmed OR store-confirmed.
  const isParentConfirmedVisual = parentAction === "confirmed" || isDecisionMapped;
  // "New" tag — true when at least one of this decision's
  // candidate articles was confirmed during the current session.
  const isDecisionNew =
    isDecisionMapped &&
    decision.candidateAplIds.some((id) => newlyMappedIds.has(id));
  // Status chip (palette + label) swap when mapped. Reads
  // effectiveQueue (not raw decision.queue) so the pill matches
  // the tab the row was filtered into — e.g. an amber-tagged
  // decision with no actionable APLs lands in Needs Mapping
  // and renders the red "Needs Mapping" pill, not the stale
  // "Needs Review" amber chip from its underlying queue field.
  const decisionQueue = effectiveQueue(decision);
  const isRetiredTransition = decisionQueue === "blue" && Boolean(decision.retiredAplId);
  const statusChip = isRetiredTransition
    ? STATUS_CHIP["blue"]
    : isDecisionMapped
    ? MAPPED_CHIP
    : STATUS_CHIP[decisionQueue];
  const statusLabel = isRetiredTransition
    ? "Retired"
    : isDecisionMapped
    ? "Mapped"
    : STATUS_LABEL[decisionQueue];

  // Real-time per-ingredient progress derived directly from store
  // state (mappedAplIds + rejectedAplIds), so it updates without
  // any extra wiring as the user confirms / rejects articles.

  /* Build a unique, human-readable description for one APL given
   * its sibling candidates. Strategy:
   *   1. base = characteristic · packSize
   *   2. if base is unique within the group → return base
   *   3. else append brand (skipping the "UB" placeholder for
   *      unbranded SKUs) if that disambiguates
   *   4. if brand collides too, append the last 4 of the APL code
   * Keeps the typography clean: a single muted dot-separated
   * string, no chips, no extra rows. Pure derivation — no random
   * labels are introduced. */
  /* Char-level cap for the visible Article description. SAP
   * fields run wider than the column can show at most viewport
   * widths, so we hard-cap at 58 chars + ellipsis as a data
   * constraint (mirrors the SAP master-data limit). The CSS
   * `truncate` class still handles edge cases where the string is
   * within the cap but the column is narrow. Full string sits in
   * the title attribute for a hover tooltip. */
  const MAX_DESC_LEN = 58;
  const truncateDesc = (s: string) =>
    s.length > MAX_DESC_LEN ? `${s.slice(0, MAX_DESC_LEN - 1)}…` : s;

  // Full article display name: characteristic · packSize · Brand
  // (brand always included when not "UB"). Used for parent row
  // display + toast message so both surfaces say the same thing.
  const fullAplName = (a: APL): string => {
    const parts = [a.characteristic, a.packSize].filter(Boolean);
    if (a.brand && a.brand !== "UB") parts.push(a.brand);
    return parts.join(" · ") || a.genericName || "—";
  };

  const describeApl = (a: APL): string => {
    const baseFor = (c: APL) =>
      [c.characteristic, c.packSize].filter(Boolean).join(" · ");
    const base = baseFor(a) || "—";
    const sameBase = candidates.filter((c) => baseFor(c) === base);
    if (sameBase.length <= 1) return base;
    const brandUseful = a.brand && a.brand !== "UB";
    const sameBrand = sameBase.filter((c) => c.brand === a.brand);
    if (brandUseful && sameBrand.length === 1) return `${base} · ${a.brand}`;
    const last4 = aplCode(a).slice(-4);
    return brandUseful
      ? `${base} · ${a.brand} · ${last4}`
      : `${base} · ${last4}`;
  };

  // Select-All checkbox state for this ingredient's group. Counts
  // only actionable (non-confirmed, non-locally-rejected) articles since
  // confirmed rows render without a checkbox and locally-rejected rows
  // render with an Undo state instead.
  const actionableIds = isDecisionMapped
    ? (decision.mappedAplIds ?? []).filter((id) => !locallyRejectedIds.has(id))
    : candidates
        .filter((a) => !mappedSet.has(a.id) && !locallyRejectedIds.has(a.id))
        .map((a) => a.id);
  const allActionableChecked =
    actionableIds.length > 0 &&
    actionableIds.every((id) => selectedArticleIds.has(id));
  const someActionableChecked =
    actionableIds.some((id) => selectedArticleIds.has(id)) &&
    !allActionableChecked;
  const groupCheckboxState: boolean | "indeterminate" = allActionableChecked
    ? true
    : someActionableChecked
    ? "indeterminate"
    : false;

  // True when at least one actionable article in this group is
  // currently selected. Drives the parent-row highlight so the
  // ingredient + its children read as one selected block.
  const isParentSelected = actionableIds.some((id) =>
    selectedArticleIds.has(id)
  );

  // Parent-row Confirm/Reject acts on the displayed (default) article
  // only — not all candidates. Per-article actions in the expansion
  // Parent Confirm/Reject delegate to WorklistTable handlers (lifted
  // so the reject Dialog renders safely outside the table DOM).
  const handleConfirmDef = () => onParentConfirm(def ? fullAplName(def) : "Article");
  const handleRejectDef  = onParentReject;

  return (
    <>
      {/* Main ingredient row — now carries its own checkbox so
          users can bulk-select the whole ingredient (and its
          actionable APLs) in one click. Three-state visual
          hierarchy mirrors the article rows below:
            mapped    → soft green tint + green stripe (terminal)
            selected  → soft blue tint + blue stripe (in-progress)
            default   → standard hover wash
          The parent always carries its bottom border now — the
          expansion below sits in its own visually distinct
          container with a top spacer + left accent ribbon, so
          we don't need the old border-collapse trick to make the
          two read as related. */}
      <tr
        // Row-level click is intentionally NOT wired anymore —
        // the drawer now opens from article-level clicks inside
        // the Articles cell instead. Reduces accidental opens on
        // checkbox / chevron / actions clicks and keeps the row
        // a passive container.
        className={cn(
          // `group` enables hover-revealed actions on this row
          // (Case A Confirm/Reject buttons fade in on hover).
          //
          // Hybrid status indication: every row carries a 2px
          // left stripe whose colour matches the row's queue.
          // Pairs with the chip-on-action-states-only rule
          // (chip dropped for Mapped) to stay scannable without
          // doubling the visual signal on the same row. Stripe
          // colours mirror STATUS_CHIP.dot tokens so border +
          // chip stay tonally aligned.
          // Plain white background on every row. The queue stripe
          // is rendered as a ::before pseudo on the first td with
          // 4px vertical inset, so adjacent same-colour stripes
          // read as discrete segments instead of merging into a
          // single continuous bar while scrolling.
          "group border-b border-border/40 transition-colors bg-white hover:bg-zinc-50"
        )}
      >
        {/* Column 1 — ingredient-level checkbox. Toggles every
            actionable (non-mapped, non-rejected) article under
            this row in or out of the selection set. Hidden when
            there's nothing actionable left (mapped ingredient or
            empty row) so the column stays clean. */}
        <td className="px-4 py-1.5 align-middle">
          {actionableIds.length > 0 ? (
            <Checkbox
              checked={groupCheckboxState}
              onCheckedChange={onSelectAllInGroup}
              aria-label={`Select all articles in ${
                mog?.name ?? "this ingredient"
              }`}
            />
          ) : isRetiredTransition ? (
            <Checkbox
              checked={false}
              disabled
              aria-label="Selection not available for retired articles"
            />
          ) : (
            <span className="inline-block h-4 w-4" aria-hidden="true" />
          )}
        </td>
        {/* Column 2 — expand chevron, only for multi-Article rows.
            Single ChevronRight that rotates 90° on expansion via
            transition-transform — gives a smooth open/close motion
            instead of swapping icons abruptly. */}
        <td className="px-3 py-1.5 align-middle">
          {isMulti ? (
            <button
              type="button"
              onClick={onToggleExpand}
              aria-label={expanded ? "Collapse articles" : "Expand articles"}
              aria-expanded={expanded}
              className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  expanded && "rotate-90"
                )}
              />
            </button>
          ) : (
            <span className="inline-block h-5 w-5" aria-hidden="true" />
          )}
        </td>
        {/* Ingredient — name only. Subtitle (genericIngredient)
            dropped per the latest UX spec to reduce visual
            density; the same context surfaces in the Category
            column anyway. */}
        <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]">
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <span className="text-[13px] font-[500] text-foreground/90 whitespace-nowrap truncate min-w-0">
              {mog?.name ?? decision.mogId}
            </span>
            {decision.candidateAplIds.length > 1 && (
              <span className="shrink-0 text-[11px] text-muted-foreground/45 numeric-tabular">
                +{decision.candidateAplIds.length - 1}
              </span>
            )}
          </div>
        </td>
        {/* Articles cell — same shape across all queues.
            Blue (Transition) override: parent row shows only the
            retired APL. The replacement renders as a separate <tr>
            directly below, always visible — same pattern as
            green/amber expansion rows. */}
        <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03] max-w-0 overflow-hidden">
          <div className="min-w-0">
            {decisionQueue === "blue" && decision.retiredAplId ? (
              (() => {
                const currentApl = decision.retiredAplId
                  ? apls.find((a) => a.id === decision.retiredAplId)
                  : undefined;
                const fmt = (a: APL) =>
                  `${a.brand && a.brand !== "UB" ? `${a.brand} ` : ""}${a.genericName}`;
                const desc = (a: APL) =>
                  [a.characteristic, a.packSize].filter(Boolean).join(" · ");
                const retiredHierarchy = currentApl
                  ? buildHierarchyParts(mog, currentApl)
                  : [];
                return (
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => decision.retiredAplId && onOpenArticleDetail(decision.retiredAplId)}
                        className="group/article flex items-center gap-2 min-w-0 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      >
                        <span
                          className="text-[13px] font-[500] text-foreground/90 truncate min-w-0 group-hover/article:underline decoration-border"
                          title={currentApl ? (desc(currentApl) || fmt(currentApl)) : "Current article unavailable"}
                        >
                          {currentApl ? (desc(currentApl) || fmt(currentApl)) : "Current article"}
                        </span>
                      </button>
                      {currentApl && (
                        <span className="shrink-0 numeric-tabular text-[10.5px] text-muted-foreground/45">
                          {aplCode(currentApl)}
                        </span>
                      )}
                      <span className="shrink-0 inline-flex items-center rounded border border-blue-500/30 bg-blue-500/10 px-1 py-px text-[9.5px] font-medium text-blue-500">
                        Retired
                      </span>
                    </div>
                    {retiredHierarchy.length > 0 && (
                      <div className="mt-0.5 text-[10.5px] text-muted-foreground/65 truncate">
                        {retiredHierarchy.join(" › ")}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : isEmpty ? (
              <span className="text-[12px] italic text-muted-foreground">
                No Articles
              </span>
            ) : (
              (() => {
                if (!def) return null;
                // fullAplName = characteristic · packSize · Brand (always
                // includes brand when not "UB") — matches what the toast
                // shows so both surfaces say the same thing. describeApl
                // is kept for expansion rows where disambiguation by code
                // is still needed for same-spec siblings.
                const desc = fullAplName(def);
                const hierarchyParts = buildHierarchyParts(mog, def);
                return (
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenArticleDetail(def.id)}
                        className="group/article flex items-center gap-2 min-w-0 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      >
                        <span
                          className="text-[13px] font-[500] text-foreground/90 truncate group-hover/article:underline decoration-border"
                          title={desc}
                        >
                          {truncateDesc(desc) || "—"}
                        </span>
                        <span className="shrink-0 numeric-tabular text-[10.5px] text-muted-foreground/45">
                          {aplCode(def)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleDefault(def.id)}
                        aria-label={defaultArticleIds.has(def.id) ? `${def.genericName} is the default` : `Set ${def.genericName} as default`}
                        className={cn(
                          "ml-auto inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
                          defaultArticleIds.has(def.id)
                            ? "text-amber-300"
                            : "text-muted-foreground/40 hover:text-amber-200"
                        )}
                      >
                        <Star
                          className="h-3.5 w-3.5"
                          strokeWidth={2}
                          fill={defaultArticleIds.has(def.id) ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
                    {hierarchyParts.length > 0 && (
                      <div className="mt-0.5 text-[10.5px] text-muted-foreground/65 truncate">
                        {hierarchyParts.join(" › ")}
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </td>
        {/* Hierarchy — sits BEFORE Default per the visual-priority
            spec ("Hierarchy is read first, Default is secondary").
            Now always derived from the default article so the
            row's Hierarchy column lines up with the recommended
            APL shown in the Articles column. Picks the candidate
            flagged in defaultArticleIds (single-default invariant
            guarantees there's at most one), falls back to the
            first candidate if seeding hasn't run yet, or to "—"
            for empty-row Case 0. The path itself reads as a
            breadcrumb via HierarchyBreadcrumb. */}
        {columnVisibility.categoryPath && (
          <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]">
            <HierarchyBreadcrumb
              parts={def ? buildHierarchyParts(mog, def) : []}
            />
          </td>
        )}
        {/* Reasons — static label pair, not interactive */}
        {columnVisibility.reasons && (
          <td className="px-3 py-1.5 align-middle">
            <div className="flex items-center gap-1.5">
              {pickReasons(decision.id).map((item) => (
                <span
                  key={item.word}
                  className="inline-flex items-center gap-1 whitespace-nowrap"
                >
                  {item.icon === "check" ? (
                    <Check className="h-3 w-3 shrink-0" style={{ color: "#34C759" }} strokeWidth={2.5} />
                  ) : (
                    <X className="h-3 w-3 shrink-0" style={{ color: "#FF3B30" }} strokeWidth={2.5} />
                  )}
                  <span className="text-[10.5px] text-muted-foreground/65">{item.word}</span>
                </span>
              ))}
            </div>
          </td>
        )}
        {/* Status — pill chip with leading colour dot. */}
        {columnVisibility.status && (
        <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]">
          {/* Hybrid rule: Mapped rows rely on the green left
              stripe alone — the chip would double the signal and
              add chrome to a terminal state. Action states keep
              their chip so the row's call to action stays
              unmistakable. Escalated rows override the queue chip
              with a neutral purple "Escalated" badge so the
              handoff to procurement reads at a glance.
              Multi-article (isMulti) rows defer the status to
              each child article row so per-article state
              (Mapped / Needs Review etc.) reads at the level the
              user actions on. The aggregate parent stays clean —
              its left stripe still carries the queue colour. */}
          {isDecisionMapped && !isRetiredTransition
            ? null
            : isEscalated
            ? (
              <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-[11px] font-medium bg-purple-50 text-purple-700 border-purple-200">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full shrink-0 bg-purple-500"
                />
                Escalated
              </span>
            )
            : (() => {
                const chip = (
                  <span
                    className={cn(
                      "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-[11px] font-medium",
                      statusChip.bg,
                      statusChip.text,
                      statusChip.border,
                      decisionQueue === "blue" && "cursor-help"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        statusChip.dot
                      )}
                    />
                    {statusLabel}
                    {isDecisionNew && (
                      <span className="opacity-70 font-normal">• New</span>
                    )}
                  </span>
                );
                if (decisionQueue === "blue") {
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>{chip}</TooltipTrigger>
                      <TooltipContent>
                        A replacement is planned but not yet executed
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return chip;
              })()}
        </td>
        )}
        {/* Last updated */}
        {columnVisibility.lastUpdated && (
          <td className="px-3 py-1.5 align-middle">
            <span className="text-[12px] text-muted-foreground">
              {formatRelativeDays(decision.generatedAt)}
            </span>
          </td>
        )}
        {/* Actions — case-dependent.
              mapped ingredient → green "Confirmed" pill (terminal;
                                  replaces action buttons so the
                                  row communicates its done-state
                                  both via the green left stripe and
                                  an explicit confirmed indicator)
              empty (Case 0)    → "Add Article" button
              single (Case A)   → Confirm / Reject / Add New
              multi  (Case B)   → Confirm / Reject / Add New on
                                  the default APL; when some but not
                                  all APLs are mapped a small "N
                                  confirmed" counter appears below
                                  the buttons so progress is visible
                                  without expanding */}
        <td className="px-3 py-1.5 align-middle text-right">
          {isDecisionMapped ? (
            <div className="inline-flex items-center justify-end gap-1.5 w-full">
              {isRetiredTransition ? (
                <button
                  type="button"
                  onClick={onUnlinkCookbook}
                  className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-medium bg-[#FDECEC] text-[#B42318] border-[#F5C2C0] hover:bg-[#F8DCDC] transition-colors"
                >
                  <Link2Off className="h-3 w-3" strokeWidth={2.25} />
                  Unlink CookBook
                </button>
              ) : (
                // Mapped (non-retired) — Link CookBook + Reject + Link APL.
                <>
                  <button
                    type="button"
                    onClick={onLinkCookbook}
                    className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-medium bg-green-50/70 text-green-600 border-green-200/60 hover:bg-green-100/80 transition-colors"
                  >
                    Link CookBook
                  </button>
                  <button
                    type="button"
                    onClick={onParentReject}
                    className="inline-flex h-6 items-center whitespace-nowrap rounded-md border px-2.5 text-[11px] font-medium bg-red-50/70 text-red-500 border-red-200/60 hover:bg-red-100/80 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled
                    className={cn(SECONDARY_BUTTON, "opacity-35 cursor-not-allowed")}
                  >
                    <Plus className="h-3 w-3" strokeWidth={2.5} />
                    Link APL
                  </button>
                </>
              )}
            </div>
          ) : isEmpty ? (
            // Case 0 — Needs Mapping. Disabled Confirm + Reject + Link APL.
            <div className="inline-flex items-center justify-end gap-1.5">
              <button
                type="button"
                disabled
                className="inline-flex h-6 items-center whitespace-nowrap rounded-md border px-2.5 text-[11px] font-medium bg-green-50/50 text-green-600 border-green-200/50 opacity-35 cursor-not-allowed"
              >
                Confirm
              </button>
              <button
                type="button"
                disabled
                className="inline-flex h-6 items-center whitespace-nowrap rounded-md border px-2.5 text-[11px] font-medium bg-red-50/50 text-red-400 border-red-200/50 opacity-35 cursor-not-allowed"
              >
                Reject
              </button>
              <button type="button" onClick={onAddArticle} className={SECONDARY_BUTTON}>
                <Plus className="h-3 w-3" strokeWidth={2.5} />
                Link APL
              </button>
            </div>
          ) : single ? (
            // Case A — single stable article. Confirm + Reject both
            // visual-only on the parent row. Add New stays active.
            <InlineActions
              onConfirm={() => onParentConfirm(fullAplName(single))}
              onReject={onParentReject}
              onAddNew={onAddArticle}
              confirmDisabled={parentAction === "confirmed" || isRetiredTransition}
              rejectDisabled={parentAction === "rejected"}
            />
          ) : (
            // Case B — multi-article. Parent Confirm + Reject both
            // visual-only. Add New stays active.
            <InlineActions
              onConfirm={handleConfirmDef}
              onReject={handleRejectDef}
              onAddNew={onAddArticle}
              confirmDisabled={parentAction === "confirmed" || isRetiredTransition}
              rejectDisabled={parentAction === "rejected"}
            />
          )}
        </td>
      </tr>

      {/* Blue replacement row — always-visible sub-row for the
          proposed replacement APL. Follows the same expansion-row
          pattern (bg-white + ::before ribbon) as green/amber.
          Rendered for both pending and mapped blue decisions. */}
      {decisionQueue === "blue" && decision.retiredAplId && (() => {
        // Replacement must be a different APL from the retiring one.
        // If the only candidate IS the retiring APL (no replacement
        // chosen yet), don't render the row at all — avoids blank whitespace.
        const plannedApl = candidates.find((a) => a.id !== decision.retiredAplId);
        if (!plannedApl) return null;
        const fmt = (a: APL) =>
          `${a.brand && a.brand !== "UB" ? `${a.brand} ` : ""}${a.genericName}`;
        const desc = (a: APL) =>
          [a.characteristic, a.packSize].filter(Boolean).join(" · ");
        const plannedHierarchy = plannedApl ? buildHierarchyParts(mog, plannedApl) : [];
        return (
          <tr
            className={cn(
              "border-b border-border/40 bg-white"
            )}
          >
            <td className="px-4 py-1.5 align-middle" aria-hidden="true" />
            <td className="px-3 py-1.5 align-middle" aria-hidden="true" />
            <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]" aria-hidden="true" />
            <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]">
              {plannedApl ? (
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenArticleDetail(plannedApl.id)}
                      className="group/article flex items-center gap-2 min-w-0 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    >
                      <span
                        className="text-[13px] font-[500] text-foreground/90 truncate group-hover/article:underline decoration-border"
                        title={desc(plannedApl) || fmt(plannedApl)}
                      >
                        {desc(plannedApl) || fmt(plannedApl)}
                      </span>
                    </button>
                    <span className="shrink-0 numeric-tabular text-[10.5px] text-muted-foreground/45">
                      {aplCode(plannedApl)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleDefault(plannedApl.id)}
                      aria-label={defaultArticleIds.has(plannedApl.id) ? `${plannedApl.genericName} is the default` : `Set ${plannedApl.genericName} as default`}
                      className={cn(
                        "ml-auto inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
                        defaultArticleIds.has(plannedApl.id)
                          ? "text-amber-300"
                          : "text-muted-foreground/40 hover:text-amber-200"
                      )}
                    >
                      <Star
                        className="h-3.5 w-3.5"
                        strokeWidth={2}
                        fill={defaultArticleIds.has(plannedApl.id) ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  {plannedHierarchy.length > 0 && (
                    <div className="mt-0.5 text-[10.5px] text-muted-foreground/65 truncate">
                      {plannedHierarchy.join(" › ")}
                    </div>
                  )}
                </div>
              ) : (
                <></>
              )}
            </td>
            {columnVisibility.categoryPath && (
              <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]" aria-hidden="true" />
            )}
            {columnVisibility.reasons && (
              <td className="px-3 py-1.5 align-middle" aria-hidden="true" />
            )}
            {columnVisibility.status && (
              <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]" aria-hidden="true" />
            )}
            {columnVisibility.lastUpdated && (
              <td className="px-3 py-1.5 align-middle" aria-hidden="true" />
            )}
            <td className="px-3 py-1.5 align-middle text-right">
              {plannedApl && (
                <InlineActions
                  onConfirm={() => onConfirmOne(plannedApl.id)}
                  onReject={() => onOpenArticleDetail(plannedApl.id)}
                  confirmDisabled={mappedSet.has(plannedApl.id) || locallyConfirmedIds.has(plannedApl.id)}
                  rejectDisabled={false}
                />
              )}
            </td>
          </tr>
        );
      })()}

      {/* ───── Expansion container ──────────────────────────────
          When a multi-Article row is expanded, the rows below
          form a visually grouped sub-section: top + bottom
          spacer rows create air around it, every row inside
          shares a `bg-[#FAFBFC]` wash (sub-header is one shade
          darker), and a 3px blue ribbon along the left edge
          of every expansion row reads as a continuous container
          border. The parent ingredient row keeps its own border
          + styling, so the two read as related-but-distinct. */}

      {/* Expanded article rows — render only when the user has
          explicitly expanded the row. Confirmed articles (in
          mappedSet) render with a green tint + "Mapped" badge
          instead of the Confirm/Reject buttons.

          Mapped articles sort first (see candidates sort above) so
          confirmed work is immediately visible. No divider needed —
          the green row styling already distinguishes mapped rows. */}
      {isMulti &&
        expanded &&
        expansionCandidates.map((a, idx) => {
          const isChecked = selectedArticleIds.has(a.id);
          const isConfirmed = mappedSet.has(a.id) || locallyConfirmedIds.has(a.id);
          const isLocallyRejected = locallyRejectedIds.has(a.id);
          return (
            <Fragment key={a.id}>
              <tr
                className={cn(
                  // `group` enables hover-revealed Confirm/Reject
                  // on this article row — keeps the table light
                  // when nothing's hovered and surfaces actions
                  // exactly when the user reaches for them.
                  "group border-b border-border/40 transition-colors",
                  // Continuous 3px ribbon on every expansion row
                  // — colour shifts with state but the ribbon
                  // itself is always present so the container
                  // edge reads cleanly all the way down.
                  "bg-white"
                )}
              >
              {/* col 1 — selection checkbox / mapped / rejected indicator */}
              <td className="px-4 py-1.5 align-middle">
                {isConfirmed && tab !== "mapped" ? (
                  <Check
                    className="h-4 w-4 text-green-700"
                    aria-label="Mapped"
                  />
                ) : isLocallyRejected ? (
                  <X className="h-4 w-4 text-red-400" aria-label="Rejected" />
                ) : (
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => onToggleArticleSelect(a.id)}
                    aria-label={`Select article ${a.genericName}`}
                  />
                )}
              </td>
              {/* col 2 — chevron col, empty on child */}
              <td className="px-3 py-1.5 align-middle" aria-hidden="true" />
              {/* col 3 — Ingredient col, empty on child so the
                  Article cell aligns directly under the parent's
                  Articles column instead of crashing into the
                  Ingredient column. */}
              <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]" aria-hidden="true" />
              {/* col 4 — Article cell. Locally-rejected rows render
                  description with a strikethrough to signal the
                  dismissal visually while keeping the row in place
                  so the user can Undo without searching for it. */}
              <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => !isLocallyRejected && onOpenArticleDetail(a.id)}
                      className={cn(
                        "group/article flex items-center gap-2 min-w-0 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isLocallyRejected ? "cursor-default" : "cursor-pointer"
                      )}
                    >
                      {(() => {
                        const d = describeApl(a);
                        return (
                          <span
                            title={d}
                            className={cn(
                              "text-[13px] font-[500] truncate",
                              isLocallyRejected
                                ? "line-through text-muted-foreground"
                                : defaultArticleIds.has(a.id)
                                ? "text-blue-900 group-hover/article:underline"
                                : isConfirmed
                                ? "text-green-900 group-hover/article:underline"
                                : "text-foreground group-hover/article:underline"
                            )}
                          >
                            {truncateDesc(d)}
                          </span>
                        );
                      })()}
                    </button>
                    {newlyAddedIds.has(a.id) && !isConfirmed && !isLocallyRejected && (
                      <span className="shrink-0 inline-flex items-center rounded-full bg-sky-50 border border-sky-200 px-1.5 py-px text-[10px] font-semibold text-sky-600">
                        New
                      </span>
                    )}
                    <span className={cn(
                      "shrink-0 numeric-tabular text-[10.5px] text-muted-foreground/45",
                      isLocallyRejected && "opacity-40"
                    )}>
                      {aplCode(a)}
                    </span>
                    {/* Star default toggle — hidden on locally-rejected rows */}
                    {!isLocallyRejected && (
                      <button
                        type="button"
                        onClick={() => onToggleDefault(a.id)}
                        aria-label={
                          defaultArticleIds.has(a.id)
                            ? `${a.genericName} is the default`
                            : `Set ${a.genericName} as default`
                        }
                        className={cn(
                          "ml-auto inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
                          defaultArticleIds.has(a.id)
                            ? "text-amber-300"
                            : "text-muted-foreground/40 hover:text-amber-200"
                        )}
                      >
                        <Star
                          className="h-3.5 w-3.5"
                          strokeWidth={2}
                          fill={defaultArticleIds.has(a.id) ? "currentColor" : "none"}
                        />
                      </button>
                    )}
                  </div>
                  {(() => {
                    const parts = buildHierarchyParts(mog, a);
                    return parts.length > 0 ? (
                      <div className="mt-0.5 text-[10.5px] text-muted-foreground/65 truncate">
                        {parts.join(" › ")}
                      </div>
                    ) : null;
                  })()}
                </div>
              </td>
              {/* col 5 — Hierarchy */}
              {columnVisibility.categoryPath && (
                <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]">
                  <HierarchyBreadcrumb parts={buildHierarchyParts(mog, a)} />
                </td>
              )}
              {/* col 5b — Reasons static label pair, not interactive */}
              {columnVisibility.reasons && (
                <td className="px-3 py-1.5 align-middle">
                  <div className="flex items-center gap-1.5">
                    {pickReasons(a.id).map((item) => (
                      <span key={item.word} className="inline-flex items-center gap-1 whitespace-nowrap">
                        {item.icon === "check" ? (
                          <Check className="h-3 w-3 shrink-0" style={{ color: "#34C759" }} strokeWidth={2.5} />
                        ) : (
                          <X className="h-3 w-3 shrink-0" style={{ color: "#FF3B30" }} strokeWidth={2.5} />
                        )}
                        <span className="text-[10.5px] text-muted-foreground/65">{item.word}</span>
                      </span>
                    ))}
                  </div>
                </td>
              )}
              {/* col 6 — Status. Per-article chip:
                    locally-rejected → muted "Rejected" label
                    mapped APL → green "Mapped" pill
                    unmapped → queue chip (Needs Review / etc.) */}
              {columnVisibility.status && (
              <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]">
                {isLocallyRejected ? (
                  <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-[11px] font-medium bg-red-50 text-red-600 border-red-200">
                    <X className="h-3 w-3 shrink-0" aria-hidden="true" />
                    Rejected
                  </span>
                ) : isConfirmed ? (
                  <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-[11px] font-medium bg-purple-50 text-purple-700 border-purple-200">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full shrink-0 bg-purple-500"
                    />
                    Mapped
                    {newlyMappedIds.has(a.id) && (
                      <span className="opacity-70 font-normal">• New</span>
                    )}
                  </span>
                ) : statusLabel !== "Retired" ? (
                  <span
                    className={cn(
                      "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-[11px] font-medium",
                      statusChip.bg,
                      statusChip.text,
                      statusChip.border
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        statusChip.dot
                      )}
                    />
                    {statusLabel}
                  </span>
                ) : null}
              </td>
              )}
              {/* col 7 — Last updated (parent only). Empty on
                  child rows; only the parent renders a value. */}
              {columnVisibility.lastUpdated && (
                <td className="px-3 py-1.5 align-middle" aria-hidden="true" />
              )}
              {/* col 8 — Actions.
                    locally-rejected → buttons disabled
                    mapped           → buttons disabled (terminal)
                    unmapped         → Confirm / Reject active */}
              <td className="px-3 py-1.5 align-middle text-right">
                <InlineActions
                  onConfirm={() => onConfirmOne(a.id)}
                  onReject={() => onRejectOne(a.id)}
                  onAddNew={onAddArticle}
                  confirmDisabled={!isLocallyRejected && isConfirmed}
                  rejectDisabled={isLocallyRejected}
                />
              </td>
              </tr>
            </Fragment>
          );
        })}

      {/* Final row of expansion — used to host a "+ Link APL"
          button, dropped because the parent row already exposes
          the same action and the duplicate read as clutter inside
          the expansion. */}

    </>
  );
}

/* Build the L3 › L4 › L5 hierarchy path:
 *   L3 = MOG category        (e.g., "Bakery")
 *   L4 = MOG genericIngredient (e.g., "Yeast")
 *   L5 = APL characteristic  (only when an APL is provided)
 * Trailing token is suppressed when it appears verbatim in the
 * Article's full name to avoid the "Active Dry / Active Dry Yeast"
 * echo. Returns "" when no levels resolve so the caller can fall
 * back to a dash. */
function buildHierarchyParts(mog: MOG | undefined, apl?: APL): string[] {
  const parts: string[] = [];
  if (mog?.category) parts.push(mog.category);
  if (mog?.genericIngredient) parts.push(mog.genericIngredient);
  if (apl?.characteristic) parts.push(apl.characteristic);
  if (apl && parts.length > 1) {
    const fullName = `${apl.brand && apl.brand !== "UB" ? `${apl.brand} ` : ""}${apl.genericName}`.toLowerCase();
    const last = parts[parts.length - 1].toLowerCase();
    if (fullName.includes(last)) parts.pop();
  }
  return parts;
}

function buildHierarchy(mog: MOG | undefined, apl?: APL): string {
  return buildHierarchyParts(mog, apl).join(" › ");
}

/* HierarchyBreadcrumb extracted to ./hierarchy-breadcrumb.tsx
 * so the Exceptions table can reuse the exact same component
 * (single source of truth for chip styling + tier contrast). */

/* Confirm / Reject text-button pair used by single-article rows
 * + the expanded article rows. Text labels (not icons) per spec —
 * keeps actions explicit + scannable in a dense table. Hex colours
 * lifted directly from the spec rather than mapped to project
 * tokens, since the spec was prescriptive about exact values.
 *   Confirm  bg #E6F6EC  text #1F7A4D  border #B7E4C7
 *            hover bg #D4ECDB  (slightly darker green wash)
 *   Reject   bg #FDECEC  text #B42318  border #F5C2C0
 *            hover bg #F8DCDC  (slightly darker red wash)
 * h-7 + px-2.5 matches the small-button rhythm of the rest of the
 * row; rounded-md (6px) hits the spec's 6–8px target. */
function InlineActions({
  onConfirm,
  onReject,
  onAddNew,
  confirmLabel = "Confirm",
  rejectLabel = "Reject",
  disabled = false,
  confirmDisabled,
  rejectDisabled,
}: {
  onConfirm: () => void;
  onReject: () => void;
  onAddNew?: () => void;
  confirmLabel?: string;
  rejectLabel?: string;
  /** Disables both buttons when true. */
  disabled?: boolean;
  /** Independently disable just Confirm. */
  confirmDisabled?: boolean;
  /** Independently disable just Reject. */
  rejectDisabled?: boolean;
}) {
  const isConfirmDisabled = disabled || (confirmDisabled ?? false);
  const isRejectDisabled  = disabled || (rejectDisabled  ?? false);
  return (
    <div className="flex flex-nowrap items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={isConfirmDisabled ? undefined : onConfirm}
        disabled={isConfirmDisabled}
        className={cn(
          "inline-flex h-6 items-center whitespace-nowrap rounded-md border px-2.5 text-[11px] font-medium transition-colors",
          isConfirmDisabled
            ? "opacity-35 cursor-not-allowed bg-green-50/50 text-green-600 border-green-200/50"
            : "bg-green-50/70 text-green-600 border-green-200/60 hover:bg-green-100/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-300"
        )}
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={isRejectDisabled ? undefined : onReject}
        disabled={isRejectDisabled}
        className={cn(
          "inline-flex h-6 items-center whitespace-nowrap rounded-md border px-2.5 text-[11px] font-medium transition-colors",
          isRejectDisabled
            ? "opacity-35 cursor-not-allowed bg-red-50/50 text-red-400 border-red-200/50"
            : "bg-red-50/70 text-red-500 border-red-200/60 hover:bg-red-100/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-300"
        )}
      >
        {rejectLabel}
      </button>
      {/* Link APL — always visible when provided, even when
          Confirm/Reject are disabled. Lets users attach a new
          article without having to undo the parent action first. */}
      {onAddNew ? (
        <button
          type="button"
          onClick={onAddNew}
          className={SECONDARY_BUTTON}
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          Link APL
        </button>
      ) : (
        /* Invisible clone of Link APL button — exact-width spacer so child
           Confirm/Reject columns land directly below parent Confirm/Reject. */
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          className={cn(SECONDARY_BUTTON, "opacity-0 pointer-events-none select-none")}
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          Link APL
        </button>
      )}
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  active,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const isActive = active === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 group/sort focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
    >
      <span className={isActive ? "text-foreground" : ""}>{label}</span>
      {isActive ? (
        dir === "asc" ? (
          <ArrowUp className="h-3 w-3 text-foreground/60" />
        ) : (
          <ArrowDown className="h-3 w-3 text-foreground/60" />
        )
      ) : (
        <ChevronsUpDown className="h-3 w-3 text-muted-foreground/40 group-hover/sort:text-muted-foreground/70 transition-colors" />
      )}
    </button>
  );
}
