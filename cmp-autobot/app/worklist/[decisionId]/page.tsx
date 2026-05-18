"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  Check,
  History,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AuditLogDrawer } from "@/components/shared/audit-log-drawer";
import { WorklistDetailShell } from "@/components/worklist/worklist-detail-shell";
import { QUEUES } from "@/lib/queue-config";
import type { APL, MappingDecision, MOG, Queue } from "@/lib/types";
import { aplCode, cn, formatCurrencyINR, mogCode, SECONDARY_BUTTON } from "@/lib/utils";

export default function DecisionDetailPage({
  params,
}: {
  params: Promise<{ decisionId: string }>;
}) {
  const { decisionId } = use(params);
  const decision = useMockStore((s) => s.decisions.find((d) => d.id === decisionId));
  const mog = useMockStore((s) => s.mogs.find((m) => m.id === decision?.mogId));
  const site = useMockStore((s) => s.sites.find((x) => x.id === decision?.siteId));

  if (!decision || !mog || !site) return notFound();

  return (
    // No rightPanel — DecisionBody owns the full content area and lays out
    // the agent reasoning card alongside the table card (header spans both).
    <WorklistDetailShell>
      <Suspense fallback={null}>
        <DecisionBody decisionId={decision.id} />
      </Suspense>
    </WorklistDetailShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * CENTER — header / scrollable table / sticky bottom bar
 * ──────────────────────────────────────────────────────────────────────── */

function DecisionBody({ decisionId }: { decisionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const decisions = useMockStore((s) => s.decisions);
  const decision = useMockStore((s) => s.decisions.find((d) => d.id === decisionId));
  const mog = useMockStore((s) => s.mogs.find((m) => m.id === decision?.mogId));
  const apls = useMockStore((s) => s.apls);
  const sites = useMockStore((s) => s.sites);
  const confirmDecision = useMockStore((s) => s.confirmDecision);
  const toggleDecisionDefault = useMockStore((s) => s.toggleDecisionDefault);
  const markCookbookEntered = useMockStore((s) => s.markCookbookEntered);
  const recategorizeDecision = useMockStore((s) => s.recategorizeDecision);
  const escalateDecisionToProcurement = useMockStore(
    (s) => s.escalateDecisionToProcurement
  );

  // Per-decision local state — reset on decisionId change.
  // newlyAddedIds: APLs the user attached to THIS decision via the
  // inline Add APL flow. They render in the table alongside the
  // original candidates with a "NEW" pill so the user can recognise
  // their own additions.
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());

  // Rows that have been bulk-processed and should disappear from view.
  // Declared here (before `candidates`) so the memo can reference it.
  const [processedRowIds, setProcessedRowIds] = useState<Set<string>>(new Set());

  // Confidence tier per APL — derived from decision.aplMatches[].confidence.
  // Drives the Strong / Medium / Low badge and (for blue queue) the sort order.
  const confidenceTier = useMemo(() => {
    const map = new Map<string, "strong" | "medium" | "low">();
    if (decision?.aplMatches) {
      for (const m of decision.aplMatches) {
        map.set(
          m.aplId,
          m.confidence >= 90 ? "strong" : m.confidence >= 70 ? "medium" : "low"
        );
      }
    }
    return map;
  }, [decision]);

  // Candidates list. Sort order varies by queue:
  //  - BLUE (transition planning) : confidence DESC, cost ASC tie-breaker
  //  - else                       : cost ASC (PRD default rule)
  //
  // Excludes rows already bulk-processed AND APLs that have already
  // been mapped on this decision (decision.mappedAplIds). Mapped APLs
  // live exclusively in Mapped Items — the Worklist detail only shows
  // pending work, so mapped rows simply disappear from this list. The
  // left-pane row count "X remaining (Y mapped)" still surfaces the
  // progress so the user knows mapping has happened.
  const candidates = useMemo<APL[]>(() => {
    if (!decision) return [];
    const mapped = new Set(decision.mappedAplIds ?? []);
    const allIds = new Set<string>([
      ...decision.candidateAplIds,
      ...Array.from(newlyAddedIds),
    ]);
    const list = Array.from(allIds)
      .filter((id) => !processedRowIds.has(id) && !mapped.has(id))
      .map((id) => apls.find((a) => a.id === id))
      .filter((a): a is APL => Boolean(a));
    if (decision.queue === "blue") {
      const conf = (id: string) =>
        decision.aplMatches?.find((m) => m.aplId === id)?.confidence ?? 0;
      return list.sort((a, b) => {
        const c = conf(b.id) - conf(a.id);
        return c !== 0 ? c : a.costPerUnit - b.costPerUnit;
      });
    }
    return list.sort((a, b) => a.costPerUnit - b.costPerUnit);
  }, [decision, apls, newlyAddedIds, processedRowIds]);

  // Local UI state for the table.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [defaultId, setDefaultId] = useState<string | undefined>(undefined);
  // Per-row mapped marker — local-only. Confirms stay visible (button flips
  // to a "✔ Mapped" pill and the row gets a light green tint). Movement to
  // the Green queue is a separate action when/if needed.
  const [mappedIds, setMappedIds] = useState<Set<string>>(new Set());
  // Per-row rejected marker — "Not a match" applied to a single APL.
  // Rejected rows stay visible (greyed out with a Rejected pill + Undo)
  // so the user can recover from a misclick. Rejected APLs are removed
  // from `selected` and clear the `defaultId` if they were the default —
  // the bottom Confirm Mapping count must reflect ONLY active selections.
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  // True for rows currently being committed via the per-row Confirm
  // button — used to disable the button + show a tiny spinner without
  // freezing the rest of the table.
  const [confirmingRowIds, setConfirmingRowIds] = useState<Set<string>>(
    new Set()
  );

  // After cost-ascending sort, the cheapest APL is index 0. TOP PICK is a
  // visual suggestion only — it does NOT force the default radio.
  const topPickId = candidates[0]?.id;

  // Initial default: the decision's persisted defaultAplId, falling back to
  // the cheapest candidate at first mount. Set ONCE per decision; never
  // auto-updated by candidate list changes or by user actions.
  // BLUE (transition planning) is the exception — no pre-selection, the user
  // explicitly picks the replacement they want to plan a transition to.
  useEffect(() => {
    if (decision?.queue === "blue") {
      setDefaultId(undefined);
    } else {
      setDefaultId(decision?.defaultAplIds?.[0] ?? candidates[0]?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionId]);

  // Reset newly-added APLs when navigating to a different decision.
  useEffect(() => {
    setNewlyAddedIds(new Set());
  }, [decisionId]);

  // Effective queue per PRD: when the user adds an APL to a RED (no-match)
  // decision, the decision becomes a likely-match → AMBER. Queue placement
  // is data/confidence-driven; the user "Mapped" toggle no longer exists.
  const effectiveQueue: Queue =
    decision?.queue === "red" && newlyAddedIds.size > 0
      ? "amber"
      : decision?.queue ?? "amber";

  // BLUE: APL being phased out. Rendered as its own "Retiring" card above
  // the table — never inside the selectable list so it can't be picked.
  const retiredApl = useMemo(() => {
    if (!decision?.retiredAplId) return null;
    return apls.find((a) => a.id === decision.retiredAplId) ?? null;
  }, [decision, apls]);

  // Toast state — single transient message with optional action.
  type ToastState = {
    id: number;
    message: string;
    action?: { label: string; href: string };
  };
  const [toast, setToast] = useState<ToastState | null>(null);
  // Rows currently fading out (visual feedback before store mutation lands).
  const [fadingRowIds, setFadingRowIds] = useState<Set<string>>(new Set());
  // Bulk action in flight — disables interaction + shows "Confirming…" label.
  const [bulkProcessing, setBulkProcessing] = useState(false);
  // Cookbook entry in flight — disables green CTA + shows "Entering…" label.
  const [enteringCookbook, setEnteringCookbook] = useState(false);
  // Procurement-escalation modal (RED queue).
  const [escalateOpen, setEscalateOpen] = useState(false);
  // Right-side Audit Log drawer.
  const [auditOpen, setAuditOpen] = useState(false);

  // Auto-dismiss the toast after 4s.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Reset transient feedback state when the decision changes.
  useEffect(() => {
    setToast(null);
    setFadingRowIds(new Set());
    setProcessedRowIds(new Set());
    setMappedIds(new Set());
    setRejectedIds(new Set());
    setConfirmingRowIds(new Set());
    setBulkProcessing(false);
    setEnteringCookbook(false);
    setEscalateOpen(false);
    setAuditOpen(false);
  }, [decisionId]);

  // markRowMapped — only used by the BLUE "Plan Transition" CTA now.
  // For amber/red, selection happens via per-row checkbox; commit happens
  // via the bottom Confirm Mapping (X) button.
  const markRowMapped = (aplId: string) => {
    if (!decision) return;
    setMappedIds(new Set([aplId]));
  };

  // Bulk confirm — incremental partial-mapping flow.
  //
  // Each click persists the user's selection onto the decision via
  // confirmDecision (which appends to mappedAplIds). The store only
  // flips status → "confirmed" when every candidate is either mapped
  // or rejected. Until then the MOG stays in the Worklist with the
  // mapped rows simply removed from view.
  //
  // Default APL — not asked for in the Worklist UI per spec. We
  // auto-compute it as the lowest-cost APL across the cumulative
  // mapped set (PRD rule: "default = lowest-cost active APL at site").
  // Persisted via setDecisionDefault so Mapped Items shows the right
  // row as Default. The user can change it from Mapped Items.
  //
  // Behaviour split:
  //   • Partial confirm  → stay on page, clear selection, partial toast.
  //                        User can immediately pick another batch.
  //   • Final confirm    → MOG leaves the Worklist; advance to the next
  //                        pending decision in the same queue.
  const confirmBulkWithFeedback = async () => {
    if (!decision || selected.size === 0 || bulkProcessing) return;

    setBulkProcessing(true);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 500));

    const mapped = Array.from(selected);
    const batchSize = mapped.length;

    // Compute default = lowest-cost APL across the cumulative mapped
    // set (existing mappedAplIds ∪ this batch). Cheaper APL in a
    // later batch correctly bumps the default.
    const cumulativeMappedIds = new Set<string>([
      ...(decision.mappedAplIds ?? []),
      ...mapped,
    ]);
    const cheapest = apls
      .filter((a) => cumulativeMappedIds.has(a.id))
      .sort((a, b) => a.costPerUnit - b.costPerUnit)[0];
    if (cheapest && !(decision.defaultAplIds ?? []).includes(cheapest.id)) {
      toggleDecisionDefault(decision.id, cheapest.id);
    }

    // Persist this batch. In a real backend this would be an API call;
    // here it's a Zustand mutation, but the contract is the same — the
    // global state owns the truth and Mapped Items / WorklistRow /
    // MappedDetail are all subscribed to it via useMockStore. They
    // re-render automatically when the store changes, so there is no
    // separate "refetch Mapped Items" step.
    confirmDecision(decision.id, mapped);

    // Re-read the decision to know what just happened. Reading from
    // useMockStore.getState() is safe here — we're outside React's
    // commit phase and the set() in confirmDecision has already run.
    const fresh = useMockStore
      .getState()
      .decisions.find((d) => d.id === decision.id);
    const finishedNow = fresh?.status === "confirmed";

    // End-to-end debug. Two-part log so the user can verify the full
    // flow without cross-referencing surfaces:
    //
    //   1. Mapping saved · the decision shape that landed in the store
    //      (= the "API response" body for prototype purposes).
    //   2. Mapped Items dataset · the LIVE list MappedList consumes,
    //      computed from the same store right now. If `finishedNow` is
    //      true the just-mapped MOG MUST appear here. If it's false
    //      the MOG correctly stays in the Worklist with reduced count.
    if (typeof window !== "undefined" && fresh) {
      const allDecisions = useMockStore.getState().decisions;
      const mappedItemsView = allDecisions
        .filter(
          (d) => d.status === "confirmed" || d.status === "entered"
        )
        .map((d) => ({
          decisionId: d.id,
          mogId: d.mogId,
          status: d.status,
          mappedAplIds: d.mappedAplIds ?? [],
          defaultAplIds: d.defaultAplIds ?? [],
        }));
      const isInMappedItems = mappedItemsView.some(
        (m) => m.decisionId === fresh.id
      );

      // eslint-disable-next-line no-console
      console.groupCollapsed(
        `[CMP] Mapping saved · ${decision.id} (+${batchSize})` +
          ` · finishedNow=${finishedNow}` +
          ` · inMappedItems=${isInMappedItems}`
      );
      // eslint-disable-next-line no-console
      console.log("Persisted decision:", {
        decisionId: fresh.id,
        mogId: fresh.mogId,
        siteId: fresh.siteId,
        status: fresh.status,
        defaultAplIds: fresh.defaultAplIds ?? [],
        mappedAplIds: fresh.mappedAplIds ?? [],
        rejectedAplIds: fresh.rejectedAplIds ?? [],
        candidateAplIds: fresh.candidateAplIds,
      });
      // eslint-disable-next-line no-console
      console.log(
        `Mapped Items dataset (${mappedItemsView.length} MOG${
          mappedItemsView.length === 1 ? "" : "s"
        }):`,
        mappedItemsView
      );
      if (finishedNow && !isInMappedItems) {
        // Sanity invariant: a finalised decision must show up in the
        // dataset Mapped Items reads from. If this ever fires, the
        // Worklist and Mapped Items have drifted apart.
        // eslint-disable-next-line no-console
        console.warn(
          "[CMP] Decision was finalised but is NOT in the Mapped Items dataset — sync broken."
        );
      }
      // eslint-disable-next-line no-console
      console.groupEnd();
    }

    setSelected(new Set());
    setDefaultId(undefined);
    setBulkProcessing(false);

    setToast({
      id: Date.now(),
      message: `${batchSize} Article${batchSize === 1 ? "" : "s"} mapped successfully`,
      action: finishedNow
        ? { label: "View Mapped Items", href: "/mapped" }
        : undefined,
    });

    // Only advance when the MOG has actually left the Worklist.
    // Partial confirms keep the user in place so they can continue
    // mapping the remaining suggestions.
    if (finishedNow) {
      const next = decisions.find(
        (d) =>
          d.id !== decision.id &&
          d.queue === decision.queue &&
          d.status === "pending"
      );
      const qs = searchParams.toString();
      const suffix = qs ? `?${qs}` : "";
      window.setTimeout(() => {
        if (next) {
          router.push(`/worklist/${next.id}${suffix}`);
        } else {
          router.push(`/worklist${suffix}`);
        }
      }, 250);
    }
  };

  // Enter the GREEN decision into the CookBook with visible feedback, then
  // auto-advance to the next pending Green decision (zero-decision flow).
  // If none remain, route back to the worklist root with the Green tab on.
  const enterCookbookWithFeedback = async () => {
    if (!decision || enteringCookbook) return;
    setEnteringCookbook(true);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 600));
    markCookbookEntered(decision.id);
    setToast({
      id: Date.now(),
      message: "Mappings added to CookBook",
    });
    // Find the next pending Green decision (excluding this one).
    const next = decisions.find(
      (d) =>
        d.id !== decision.id &&
        d.queue === "green" &&
        d.status === "pending"
    );
    // Preserve current query string (so ?queue=green stays selected).
    const qs = searchParams.toString();
    const suffix = qs ? `?${qs}` : "";
    if (next) {
      router.push(`/worklist/${next.id}${suffix}`);
    } else {
      router.push(`/worklist${suffix}`);
    }
    // Note: navigation remounts the page → state resets naturally.
  };

  // Inline add — selecting from the autocomplete dropdown calls this.
  // De-dupes against existing newly-added ids; original candidates are
  // already excluded by the search filter (excludedIds prop).
  //
  // Blue queue is single-pick (the replacement radio) — adding an APL
  // manually IS the act of nominating a replacement, so promote it to
  // defaultId immediately. Avoids a "now click the radio" extra step.
  const handleAddApl = (aplId: string) => {
    setNewlyAddedIds((prev) => {
      if (prev.has(aplId)) return prev;
      const next = new Set(prev);
      next.add(aplId);
      return next;
    });
    if (decision?.queue === "blue") {
      setDefaultId(aplId);
    }
  };

  // Undo a newly-added row (only valid for not-yet-mapped newly-added APLs).
  const removeNewlyAdded = (aplId: string) =>
    setNewlyAddedIds((prev) => {
      if (!prev.has(aplId)) return prev;
      const next = new Set(prev);
      next.delete(aplId);
      return next;
    });

  // Per-row reject — wired to the row's ✕ action icon. Marks a single
  // APL as Not a match. Side effects: removes from `selected` (so it
  // doesn't count toward bulk Confirm) and clears `defaultId` if this
  // row was the persisted default. Other rows are untouched.
  const rejectRow = (aplId: string) => {
    setRejectedIds((prev) => {
      if (prev.has(aplId)) return prev;
      const next = new Set(prev);
      next.add(aplId);
      return next;
    });
    setSelected((prev) => {
      if (!prev.has(aplId)) return prev;
      const next = new Set(prev);
      next.delete(aplId);
      return next;
    });
    setDefaultId((d) => (d === aplId ? undefined : d));
  };

  // Undo a per-row reject. Inline button on each rejected row's name
  // area calls this. Does NOT auto-restore selection — the user
  // explicitly opts back in by ticking the checkbox.
  const unrejectRow = (aplId: string) =>
    setRejectedIds((prev) => {
      if (!prev.has(aplId)) return prev;
      const next = new Set(prev);
      next.delete(aplId);
      return next;
    });

  // Reject every currently-selected APL in one shot. The checkbox now
  // doubles as a multi-select "marker" that drives both Confirm Mapping
  // (commit selection) and Reject selected (mark selection as Not a
  // match). After the reject, selection + default are cleared so the
  // user can pick a fresh batch — either to confirm or to reject.
  const rejectSelected = () => {
    if (selected.size === 0) return;
    setRejectedIds((prev) => {
      const next = new Set(prev);
      for (const id of selected) next.add(id);
      return next;
    });
    setSelected(new Set());
    setDefaultId(undefined);
  };

  // Clear all rejections — wired to the empty state's "Search again"
  // CTA so the user can re-evaluate suggestions without losing context.
  const clearRejections = () => setRejectedIds(new Set());

  // Per-row Confirm — commits a single APL without requiring the
  // user to first tick the checkbox. Shares the same persistence path
  // as the bulk Confirm Mapping button (default auto-picked from the
  // cumulative mapped set, decision finalises only when every
  // candidate is mapped/rejected).
  const confirmRow = async (aplId: string) => {
    if (!decision || confirmingRowIds.has(aplId)) return;
    setConfirmingRowIds((prev) => {
      const next = new Set(prev);
      next.add(aplId);
      return next;
    });
    await new Promise<void>((r) => window.setTimeout(r, 300));

    // Default = lowest-cost APL across the cumulative mapped set
    // (existing mappedAplIds ∪ this single APL). Same rule as
    // confirmBulkWithFeedback.
    const cumulative = new Set<string>([
      ...(decision.mappedAplIds ?? []),
      aplId,
    ]);
    const cheapest = apls
      .filter((a) => cumulative.has(a.id))
      .sort((a, b) => a.costPerUnit - b.costPerUnit)[0];
    if (cheapest && !(decision.defaultAplIds ?? []).includes(cheapest.id)) {
      toggleDecisionDefault(decision.id, cheapest.id);
    }

    confirmDecision(decision.id, [aplId]);

    const fresh = useMockStore
      .getState()
      .decisions.find((d) => d.id === decision.id);
    const finishedNow = fresh?.status === "confirmed";

    // If the row was also in `selected`, take it out so the bulk
    // Confirm count doesn't double-claim it.
    setSelected((prev) => {
      if (!prev.has(aplId)) return prev;
      const next = new Set(prev);
      next.delete(aplId);
      return next;
    });
    setConfirmingRowIds((prev) => {
      if (!prev.has(aplId)) return prev;
      const next = new Set(prev);
      next.delete(aplId);
      return next;
    });

    setToast({
      id: Date.now(),
      message: "1 Article mapped successfully",
      action: finishedNow
        ? { label: "View Mapped Items", href: "/mapped" }
        : undefined,
    });

    if (finishedNow) {
      const next = decisions.find(
        (d) =>
          d.id !== decision.id &&
          d.queue === decision.queue &&
          d.status === "pending"
      );
      const qs = searchParams.toString();
      const suffix = qs ? `?${qs}` : "";
      window.setTimeout(() => {
        if (next) {
          router.push(`/worklist/${next.id}${suffix}`);
        } else {
          router.push(`/worklist${suffix}`);
        }
      }, 250);
    }
  };

  if (!decision || !mog) return null;
  const isDone = decision.status !== "pending";

  // Toggle a single APL in/out of the bulk-selection set. The
  // `defaultId` state is touched only for blue's single-pick model
  // (radio in column 1). Non-blue queues no longer surface a Default
  // column — default is computed at confirm time.
  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  // Select-all skips rejected rows — they can't be part of a confirm
  // selection.
  const selectableCandidates = candidates.filter((a) => !rejectedIds.has(a.id));
  const toggleAll = () => {
    if (selected.size === selectableCandidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableCandidates.map((a) => a.id)));
    }
  };

  const allChecked =
    selectableCandidates.length > 0 &&
    selected.size === selectableCandidates.length;
  // Count drives the bottom CTA label + disabled state. Sourced from
  // the APL-level checkboxes (`selected`). Rejected rows can never be
  // in `selected` (rejectRow strips them) so the count is already
  // exclusive of rejections. There is no longer a "default must be
  // selected" gate — the worklist no longer surfaces the Default
  // column; default is computed at confirm time.
  const confirmCount = selected.size;

  // True when the user has rejected every visible (i.e. remaining)
  // candidate. Triggers the "No suitable APL found" empty banner.
  // `candidates` already excludes already-mapped APLs, so this checks
  // the post-mapping state of what's left to do.
  const allRejected =
    candidates.length > 0 &&
    candidates.every((a) => rejectedIds.has(a.id));

  // No more grid columns. The previous Cost + Matched-On columns are
  // dropped per spec — those were data noise that distracted from the
  // selection decision. Each row is now a card-like vertical block:
  // checkbox on the left + content (title, variant, description,
  // reasoning) on the right. Layout is driven by flex per row, so the
  // card width is responsive without horizontal scroll.
  const isBlueLayout = effectiveQueue === "blue";

  // Reasoning lookup + its debug log were removed — the row now
  // shows only APL info + actions. Per-APL reasoning still lives on
  // `decision.aplMatches[].reasoning` for surfaces that need it
  // (Mapped Items detail, audit log) but the worklist row is
  // intentionally minimal.

  // 2-column row: LEFT (2fr) carries selector + APL identity +
  // description; RIGHT (1fr) carries the AI reasoning panel. Both
  // columns top-align so long reasoning text doesn't push the title
  // off centre. min-w-0 on each column lets long strings truncate /
  // wrap instead of forcing horizontal scroll.
  const renderRow = (apl: APL) => {
    const isBlue = effectiveQueue === "blue";
    const checked = selected.has(apl.id);
    const isDefault = defaultId === apl.id;
    const isTopPick = topPickId === apl.id;
    const isNewlyAdded = newlyAddedIds.has(apl.id);
    const isFading = fadingRowIds.has(apl.id);
    const isMapped = mappedIds.has(apl.id);
    const isRejected = rejectedIds.has(apl.id);
    const tier = confidenceTier.get(apl.id);
    const fullName = `${apl.brand !== "UB" ? `${apl.brand} ` : ""}${apl.genericName}`;
    const code = aplCode(apl);
    // Description folds variant + brand + pack into one line. Spec
    // example: "Active Dry · Gloripan · 1x500 g".
    const descParts: string[] = [];
    if (apl.characteristic) descParts.push(apl.characteristic);
    if (apl.brand && apl.brand !== "UB") descParts.push(apl.brand);
    if (apl.packSize) descParts.push(apl.packSize);
    const description = descParts.join(" · ");
    // Hierarchy breadcrumb (L3 › L4 › L5) — derived from the MOG's
    // category/ingredient classification + the APL's variant. We cap
    // at L5 (no L6 brand/pack tier) because vendor identity is
    // already obvious from the description line above and adding it
    // here just doubles the same word. Mapping:
    //   L3 = MOG category        (e.g., "Bakery")
    //   L4 = MOG generic         (e.g., "Yeast")
    //   L5 = APL characteristic  (e.g., "Active Dry")
    // Final cleanup: if L5 already appears verbatim inside the APL's
    // product name (e.g., genericName is "Active Dry Yeast"), drop
    // it — the name + breadcrumb would otherwise repeat the same
    // token twice in the row.
    const rawHierarchy = [
      mog?.category,
      mog?.genericIngredient,
      apl.characteristic || null,
    ].filter((p): p is string => Boolean(p));
    const nameLower = fullName.toLowerCase();
    if (
      rawHierarchy.length > 1 &&
      nameLower.includes(rawHierarchy[rawHierarchy.length - 1].toLowerCase())
    ) {
      rawHierarchy.pop();
    }
    const hierarchy = rawHierarchy.join(" › ");
    const isConfirmingThis = confirmingRowIds.has(apl.id);
    // Per-row Confirm is hidden for rejected/mapped rows (nothing to
    // confirm) and for blue (single-pick replacement uses the bottom
    // Plan Transition CTA).
    const showConfirmAction = !isRejected && !isMapped && !isBlue;

    return (
      <div
        key={apl.id}
        role="row"
        aria-disabled={isRejected || undefined}
        className={cn(
          // Strict 3-column table grid (mirrors the column header
          // above so cells line up exactly).
          //   COL 1 (2fr)   = APL Name + Code (single line)
          //   COL 2 (1fr)   = Description
          //   COL 3 (120px) = Action buttons (Confirm + ✕)
          // Single-line cells + items-center give a table-row look.
          // py-2.5 keeps rows compact even with the second hierarchy
          // line; bumping back up to py-3.5 made the list feel airy
          // and you'd lose one row per viewport.
          "grid grid-cols-[2fr_1fr_120px] items-center gap-4 border-b border-border px-4 py-2.5 transition-colors duration-200 ease-out last:border-b-0",
          // Default hover wash — only when no other state owns the row
          !checked && !isMapped && !isRejected && "hover:bg-accent/30",
          // Selected (deeper than hover so it reads as "picked")
          checked && !isRejected && !isMapped && "bg-accent/50",
          // Newly added still amber-tinted but lighter so selection
          // can stack on top of it visually.
          isNewlyAdded && !isMapped && !isRejected && !checked && "bg-amber-queue-soft/30",
          // Subtle top-pick tint for blue (planning emphasis)
          isBlue && isTopPick && !isMapped && !isRejected && "bg-blue-queue-soft/20",
          // Tint for actioned rows — green for mapped, blue for planned
          isMapped && (isBlue ? "bg-blue-queue-soft/50" : "bg-green-queue-soft/40"),
          // Rejected wins over other tints — flat neutral, dimmed
          isRejected && "bg-muted/30 hover:bg-muted/30",
          isFading && "opacity-40 scale-[0.99]"
        )}
      >
        {/* ─── COL 1 (2fr): selector + Name + Code (single line) ── */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Selector — radio for BLUE, checkbox elsewhere.
              items-center on the row + here means the input sits on
              the row's vertical midline naturally. */}
          <div className="shrink-0 flex items-center">
            {isBlue ? (
              <input
                type="radio"
                name={`select-${decision.id}`}
                checked={isDefault}
                onChange={() => setDefaultId(apl.id)}
                disabled={isRejected || isMapped}
                aria-label={`Select ${apl.genericName} as replacement`}
                className={cn(
                  "h-[18px] w-[18px] accent-blue-queue cursor-pointer",
                  (isRejected || isMapped) && "opacity-40 cursor-not-allowed"
                )}
              />
            ) : (
              <Checkbox
                checked={checked || isMapped}
                onCheckedChange={() =>
                  !isRejected && !isMapped && toggleRow(apl.id)
                }
                disabled={isRejected || isMapped}
                aria-label={`Include ${apl.genericName} in mapping`}
                className={cn(
                  (isRejected || isMapped) && "opacity-50 cursor-not-allowed"
                )}
              />
            )}
          </div>

          {/* Name + Code + badges, all on one line. Name truncates if
              the cell is tight; code and badges are shrink-0 so they
              always render. */}
          <div
            className={cn(
              "flex items-center gap-2 min-w-0 flex-1",
              isRejected && "opacity-60"
            )}
          >
            <span
              className={cn(
                "text-sm font-semibold leading-tight truncate",
                isRejected && "line-through text-muted-foreground"
              )}
              title={fullName}
            >
              {fullName}
            </span>
            <span
              className="shrink-0 text-[11px] text-muted-foreground numeric-tabular tabular-nums"
              title={code}
            >
              {code}
            </span>

            {/* Contextual badges — sit immediately after the code so
                they read as part of the APL identity, not floating
                near the description column. */}
            {isRejected ? (
              <>
                <span className="shrink-0 inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Rejected
                </span>
                <button
                  type="button"
                  onClick={() => unrejectRow(apl.id)}
                  aria-label={`Undo reject for ${apl.genericName}`}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-blue-queue hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  Undo
                </button>
              </>
            ) : (
              <>
                {isTopPick && (
                  <span className="shrink-0 inline-flex items-center rounded-md bg-blue-queue-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-queue">
                    Top Pick
                  </span>
                )}
                {tier && (
                  <span
                    className={cn(
                      "shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      tier === "strong" && "bg-green-queue-soft text-green-queue",
                      tier === "medium" && "bg-amber-queue-soft text-amber-queue",
                      tier === "low" && "bg-muted text-muted-foreground"
                    )}
                    aria-label={`Confidence ${tier}`}
                  >
                    {tier}
                  </span>
                )}
                {isNewlyAdded && (
                  <span className="shrink-0 inline-flex items-center rounded-md bg-amber-queue-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-queue">
                    New
                  </span>
                )}
                {isNewlyAdded && !isBlue && (
                  <button
                    type="button"
                    onClick={() => removeNewlyAdded(apl.id)}
                    aria-label={`Undo add ${apl.genericName}`}
                    title="Undo add"
                    className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                {isMapped && isBlue && (
                  <span
                    aria-label={`${apl.genericName} transition planned`}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md border border-blue-queue/40 bg-blue-queue-soft px-2 py-0.5 text-[11px] font-medium text-blue-queue"
                  >
                    <Check className="h-3 w-3 shrink-0" strokeWidth={2.75} />
                    Transition planned
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* ─── COL 2 (1fr): Description + Hierarchy ────────────────
            Two-line cell: line 1 is the variant · brand · pack
            composite; line 2 is the L3 › L4 › L5 procurement
            hierarchy breadcrumb (capped at L5 — vendor identity is
            already on line 1, no point repeating it). Both lines
            truncate independently so the row never exceeds two
            lines; tight gap-px + leading-snug keep them visually
            grouped without inflating row height. */}
        <div
          className={cn(
            "min-w-0 flex flex-col gap-px",
            isRejected && "opacity-50"
          )}
        >
          <div
            className="text-xs leading-snug text-muted-foreground truncate"
            title={description}
          >
            {description || (
              <span className="italic text-muted-foreground/60">—</span>
            )}
          </div>
          {hierarchy && (
            <div
              className="text-[11.5px] leading-tight text-muted-foreground/65 truncate"
              title={hierarchy}
            >
              {hierarchy}
            </div>
          )}
        </div>

        {/* ─── COL 3 (120px): Actions ──────────────────────────
            Confirm = ghost/outlined button (low emphasis); Reject =
            ✕ icon-only button. Both subtle by default with the
            queue's identity color appearing only on hover.
            Hidden for blue (single-pick uses bottom Plan Transition),
            rejected (Undo lives inline in the title row), and mapped
            (locked). The placeholder span keeps the column reserved
            when actions are hidden so row widths stay consistent. */}
        <div className="flex items-center justify-end gap-1.5">
          {showConfirmAction ? (
            <>
              <button
                type="button"
                onClick={() => confirmRow(apl.id)}
                disabled={isConfirmingThis || bulkProcessing}
                aria-busy={isConfirmingThis}
                aria-label={`Confirm ${apl.genericName}`}
                title="Confirm this Article"
                className={cn(
                  "inline-flex items-center justify-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground/85 transition-colors",
                  "hover:bg-green-queue-soft/40 hover:border-green-queue/40 hover:text-green-queue",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-queue/40",
                  "disabled:opacity-50 disabled:pointer-events-none"
                )}
              >
                {isConfirmingThis ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 rounded-full border-2 border-foreground/30 border-t-foreground/70 animate-spin"
                    />
                    <span>Confirming…</span>
                  </>
                ) : (
                  <span>Confirm</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => rejectRow(apl.id)}
                aria-label={`Reject ${apl.genericName}`}
                title="Not a match"
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
                  "hover:bg-red-queue/10 hover:text-red-queue",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-queue/40"
                )}
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <span aria-hidden="true" className="block" />
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* A. Header — title + metadata + right-aligned actions */}
      <CenterHeader
        mog={mog}
        queue={effectiveQueue}
        onOpenAudit={() => setAuditOpen(true)}
      />

      {/* B. BOUNDED content region — page does NOT scroll.
              Two-column grid stretches both columns to the same height; only
              the table card body scrolls (rows region inside the card). */}
      <div className="flex-1 min-h-0 w-full max-w-full overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden px-4 lg:px-6 py-4 grid grid-cols-[minmax(0,1fr)_300px] gap-3 items-stretch">
          {/* LEFT column — only the candidate-table card now (the
              "Other APLs / Newly Added" summary strip was removed for
              a cleaner, distraction-free interface). Card stretches
              to fill the column height; gap-4 retained in case the
              column gains more children later. */}
          <div className="flex flex-col min-w-0 min-h-0 h-full">
          {/* Card container — fills available column height; rows region
              inside is the only scrollable surface in the layout. */}
          <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
            {/* Column header — 3-cell grid that mirrors the row grid
                exactly (same template + gap) so headers line up
                pixel-perfect with the cell content below.
                Hidden for BLUE: single-pick radio rows don't need a
                bulk select-all and reuse the bottom Plan Transition
                CTA, so a column header would just add noise. */}
            {!isBlueLayout && (
              <div
                className="grid grid-cols-[2fr_1fr_120px] items-center gap-4 border-b border-border bg-card/40 px-4 py-3 text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground"
                role="row"
              >
                {/* HEADER COL 1 — Select-all checkbox + "APL" label */}
                <div className="flex items-center gap-3 min-w-0">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={toggleAll}
                    aria-label="Select all Articles"
                  />
                  <span>Article</span>
                </div>
                {/* HEADER COL 2 — Description */}
                <div>Description</div>
                {/* HEADER COL 3 — Actions, right-aligned to match
                    the button cluster on each row. */}
                <div className="text-right">Actions</div>
              </div>
            )}

            {/* Card scrollable body — flex-1 so it expands to fill the card's
                available vertical space; rows scroll inside this region. */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin"
              role="rowgroup"
            >
              {candidates.length === 0 && effectiveQueue === "blue" && (
                <BlueEmptyState
                  apls={apls}
                  sites={sites}
                  excludedIds={new Set(candidates.map((a) => a.id))}
                  onAdd={handleAddApl}
                  mog={mog}
                />
              )}
              {candidates.length === 0 && effectiveQueue !== "blue" && (
                <NoMatchActionable
                  apls={apls}
                  sites={sites}
                  excludedIds={new Set(candidates.map((a) => a.id))}
                  onAdd={handleAddApl}
                  mog={mog}
                />
              )}

              {/* BLUE-only: "Retiring" card for the APL being phased out.
                  Sits above the planning banner so it's clearly separate
                  from the selectable replacement list below. */}
              {effectiveQueue === "blue" && retiredApl && (
                <RetiringAplCard apl={retiredApl} />
              )}

              {/* BLUE-only planning banner — explains the forward-planning
                  workflow before the user picks a replacement. */}
              {effectiveQueue === "blue" && candidates.length > 0 && (
                <div className="flex flex-col gap-1.5 px-4 py-3 border-b border-border bg-blue-queue-soft/30">
                  <div className="text-sm font-medium text-foreground">
                    Select a replacement to plan transition
                  </div>
                  <div className="text-xs text-muted-foreground">
                    This change will be applied when current stock is exhausted.
                  </div>
                </div>
              )}

              {/* All-rejected banner — surfaces a clear "where to go now"
                  block when every suggestion has been marked Not a match.
                  Banner sits ABOVE the rejected rows (which stay visible
                  in greyed form) so per-row Undo is still reachable. */}
              {!isBlueLayout && allRejected && (
                <div className="px-5 py-5 border-b border-border bg-muted/30 flex flex-col items-center gap-3 text-center">
                  <div className="text-sm font-semibold text-foreground">
                    No suitable Article found
                  </div>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    You&rsquo;ve rejected every suggestion the bot offered.
                    Search again or add an Article manually.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={clearRejections}
                      className="inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/85 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      Search again
                    </button>
                    <AplSearchPopover
                      apls={apls}
                      sites={sites}
                      excludedIds={new Set(candidates.map((a) => a.id))}
                      onAdd={handleAddApl}
                      mog={mog}
                    />
                  </div>
                </div>
              )}

              {/* Flat candidate list — only pending suggestions. Mapped
                  APLs are filtered out at the candidates-memo level and
                  live exclusively under Mapped Items. The Worklist
                  detail stays focused on what's left to do; progress
                  surfaces in the left-pane row text instead
                  ("X remaining · Y mapped"). */}
              {candidates.map(renderRow)}

              {/* BLUE-only secondary CTA — sits directly below the candidate
                  list so the user sees "pick one OR nominate one" as a
                  single decision. Lives inside the same scrollable region
                  rather than the footer (the footer holds Plan Transition
                  for blue, not Add APL). */}
              {effectiveQueue === "blue" && candidates.length > 0 && (
                <div className="px-4 py-3 border-t border-border bg-card/40">
                  <AplSearchPopover
                    apls={apls}
                    sites={sites}
                    excludedIds={new Set(candidates.map((a) => a.id))}
                    onAdd={handleAddApl}
                    mog={mog}
                    label="Add replacement Article manually"
                  />
                </div>
              )}
            </div>

            {/* Sticky footer inside the card.
                Left:  + Add APL manually (hidden for the RED no-candidate state
                       where the inline NoMatchActionable header IS the entry point)
                Right: Reject · Confirm Mapping (N) */}
            <div className="sticky bottom-0 bg-card border-t border-border p-3 flex items-center justify-between gap-3">
              {/* Green is execution-only; Blue is forward-planning — both
                  hide the footer "Add APL manually" link. RED has its own
                  inline search above the table. */}
              {effectiveQueue !== "green" &&
              effectiveQueue !== "blue" &&
              candidates.length > 0 ? (
                <AplSearchPopover
                  apls={apls}
                  sites={sites}
                  excludedIds={new Set(candidates.map((a) => a.id))}
                  onAdd={handleAddApl}
                  mog={mog}
                />
              ) : (
                // Spacer keeps the right group right-aligned via justify-between
                <span aria-hidden="true" />
              )}

              <div className="flex items-center gap-2">
                {effectiveQueue === "green" ? (
                  // GREEN — execution-only flow. Loading state during the
                  // simulated CookBook push; on success we auto-advance to
                  // the next pending Green decision.
                  <button
                    type="button"
                    disabled={isDone || enteringCookbook}
                    onClick={enterCookbookWithFeedback}
                    aria-busy={enteringCookbook}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2 text-sm font-semibold min-w-[200px]",
                      "bg-green-queue text-white shadow-sm transition-colors",
                      "hover:bg-green-queue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-queue/40",
                      "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                    )}
                  >
                    {enteringCookbook && (
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"
                      />
                    )}
                    {enteringCookbook ? "Entering…" : "Enter into CookBook"}
                  </button>
                ) : effectiveQueue === "blue" ? (
                  // BLUE — single forward-planning CTA. Disabled until the
                  // user selects a replacement radio. Marks the selected APL
                  // as "Transition planned" without any queue/store change.
                  <button
                    type="button"
                    disabled={isDone || !defaultId}
                    onClick={() => defaultId && markRowMapped(defaultId)}
                    className={cn(
                      "inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-semibold min-w-[180px]",
                      "bg-blue-queue text-white shadow-sm transition-colors",
                      "hover:bg-blue-queue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-queue/40",
                      "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                    )}
                  >
                    Plan Transition
                  </button>
                ) : (
                  // AMBER / RED-promoted-to-amber — Reject selected +
                  // Confirm Mapping. The same multi-select drives both:
                  //   • Reject selected (n) → mark them Not a match
                  //   • Confirm Mapping (n) → commit them to mappings
                  // Confirm additionally requires a default APL among
                  // the selected ones.
                  <>
                    <button
                      type="button"
                      disabled={isDone || bulkProcessing || selected.size === 0}
                      onClick={rejectSelected}
                      title={
                        selected.size === 0
                          ? "Select at least one Article to reject"
                          : undefined
                      }
                      className={cn(
                        "inline-flex items-center justify-center rounded-md border border-red-queue/40 bg-background px-4 py-2 text-sm font-medium text-red-queue",
                        "transition-colors hover:bg-red-queue/10 hover:border-red-queue/60",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-queue/40",
                        "disabled:opacity-50 disabled:pointer-events-none"
                      )}
                    >
                      Reject selected
                    </button>
                    <button
                      type="button"
                      disabled={
                        isDone || confirmCount === 0 || bulkProcessing
                      }
                      onClick={confirmBulkWithFeedback}
                      aria-busy={bulkProcessing}
                      title={
                        confirmCount === 0
                          ? "Select at least one Article"
                          : undefined
                      }
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2 text-sm font-semibold min-w-[200px]",
                        "bg-green-queue text-white shadow-sm transition-colors",
                        "hover:bg-green-queue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-queue/40",
                        "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                      )}
                    >
                      {bulkProcessing && (
                        <span
                          aria-hidden="true"
                          className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"
                        />
                      )}
                      {bulkProcessing
                        ? "Confirming…"
                        : `Confirm Mapping (${confirmCount})`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          </div>{/* /LEFT column */}

          {/* RIGHT column — uses effectiveQueue so a RED decision that's been
              promoted to AMBER (user added an APL) swaps to the standard
              reasoning panel automatically. */}
          {effectiveQueue === "red" ? (
            <RedReasoningPanel
              decision={decision}
              onEscalate={() => setEscalateOpen(true)}
            />
          ) : (
            <AgentReasoningPanel decision={decision} />
          )}
        </div>
      </div>

      {/* Toast — single transient feedback message anchored bottom-right. */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Audit Log drawer — right-side slide-in, scoped to this MOG */}
      <AuditLogDrawer
        open={auditOpen}
        onOpenChange={setAuditOpen}
        decisionId={decision.id}
        mogId={mog.id}
        mogName={mog.name}
      />

      {/* Procurement-escalation modal — used by RED queue when no APL exists. */}
      <EscalateProcurementDialog
        open={escalateOpen}
        onOpenChange={setEscalateOpen}
        mogName={mog?.name ?? "—"}
        siteLabel={(() => {
          const s = sites.find((x) => x.id === decision.siteId);
          return s
            ? `${s.city}${s.name ? ` · ${s.name}` : ""}`
            : decision.siteId;
        })()}
        onSubmit={() => {
          escalateDecisionToProcurement(decision.id);
          setEscalateOpen(false);
          setToast({
            id: Date.now(),
            message: "Escalated to Procurement",
          });
        }}
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * APL search — shared inline picker primitives.
 * Two surface variants:
 *   - AplSearchPopover  → trigger link + anchored dropdown (footer use)
 *   - AplSearchInline   → always-visible input with dropdown below (RED state)
 * Both share filter logic and the AplResultRow renderer.
 * ──────────────────────────────────────────────────────────────────────── */

function aplMatchesQuery(apl: APL, q: string) {
  if (!q) return true;
  const n = q.toLowerCase();
  return [apl.genericName, apl.brand, apl.characteristic, aplCode(apl)].some(
    (s) => (s ?? "").toLowerCase().includes(n)
  );
}

function AplResultRow({
  apl,
  mog,
  onSelect,
}: {
  apl: APL;
  mog?: MOG;
  onSelect: () => void;
}) {
  const fullName = `${apl.brand !== "UB" ? `${apl.brand} ` : ""}${apl.genericName}`;
  // Line 2 — brand · pack only. Site is intentionally excluded from
  // the dropdown row; all candidates here are already pre-filtered to
  // the active site, so showing it on every row is redundant noise.
  const subParts: string[] = [];
  if (apl.brand && apl.brand !== "UB") subParts.push(apl.brand);
  if (apl.packSize) subParts.push(apl.packSize);
  const subline = subParts.join(" · ");
  // Line 3 — hierarchy breadcrumb (L3 › L4 › L5). Same derivation as
  // the Worklist + Mapped Items + Add Article dialog so the same
  // ladder reads consistently across surfaces. Trailing token is
  // suppressed if it appears in the article name.
  const rawHierarchy = [
    mog?.category,
    mog?.genericIngredient,
    apl.characteristic || null,
  ].filter((p): p is string => Boolean(p));
  const nameLower = fullName.toLowerCase();
  if (
    rawHierarchy.length > 1 &&
    nameLower.includes(rawHierarchy[rawHierarchy.length - 1].toLowerCase())
  ) {
    rawHierarchy.pop();
  }
  const hierarchy = rawHierarchy.join(" › ");
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left flex items-start gap-3 px-3 py-2.5 transition-colors",
        "hover:bg-accent/50 focus-visible:outline-none focus-visible:bg-accent/60"
      )}
    >
      {/* No right-side cell anymore — price + "per pack" were dropped
          per spec. Row is now a pure 3-line identity stack across the
          full width: name+code, brand+pack, hierarchy. */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        {/* Line 1 — Article name (bold) + APL code */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold truncate">{fullName}</span>
          <span className="shrink-0 inline-flex items-center rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground numeric-tabular">
            {aplCode(apl)}
          </span>
        </div>
        {/* Line 2 — Brand · pack size (no site, no price) */}
        {subline && (
          <div className="text-xs leading-snug text-foreground/80 truncate">
            {subline}
          </div>
        )}
        {/* Line 3 — Hierarchy (smaller + muted) */}
        {hierarchy && (
          <div
            className="text-[11px] leading-tight text-muted-foreground/65 truncate"
            title={hierarchy}
          >
            {hierarchy}
          </div>
        )}
      </div>
    </button>
  );
}

interface AplSearchProps {
  apls: APL[];
  sites: { id: string; name: string; city: string }[];
  excludedIds: Set<string>;
  onAdd: (aplId: string) => void;
  /** Active Ingredient — used to derive the hierarchy breadcrumb on
   *  each result row. Optional so existing callers keep compiling. */
  mog?: MOG;
}

function AplSearchPopover({
  apls,
  excludedIds,
  onAdd,
  mog,
  label = "Add Article manually",
}: AplSearchProps & { label?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // siteLabel helper removed — dropdown rows no longer surface site
  // information per the dropdown-cleanup spec.
  const results = useMemo(
    () => apls.filter((a) => !excludedIds.has(a.id) && aplMatchesQuery(a, query)).slice(0, 50),
    [apls, excludedIds, query]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm text-blue-queue hover:underline cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[440px] p-0"
      >
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by generic name, brand or characteristic..."
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {query ? `No Articles match "${query}".` : "Type to search the Article master."}
            </div>
          ) : (
            <ul className="py-1">
              {results.map((apl) => (
                <li key={apl.id}>
                  <AplResultRow
                    apl={apl}
                    mog={mog}
                    onSelect={() => {
                      onAdd(apl.id);
                      setOpen(false);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Center header — title + metadata row only
 * ──────────────────────────────────────────────────────────────────────── */

function CenterHeader({
  mog,
  queue,
  onOpenAudit,
}: {
  mog: MOG;
  queue: Queue;
  onOpenAudit: () => void;
}) {
  // Status chip mirrors the active queue's identity (color + label).
  // For amber decisions it reads "Needs review" in amber-soft; the
  // same chip pattern picks up red/green/blue automatically when
  // the decision sits in those queues.
  const cfg = QUEUES[queue];
  return (
    <div className="shrink-0 border-b border-border bg-card px-5 lg:px-6 py-4 flex items-start justify-between gap-4">
      {/* Left: title + status chip. The MOG code line that used to
          live here was redundant — anyone who needs it can hover the
          title to see it via the title-attribute tooltip; the visible
          slot now stays clean and reserved for the MOG name + queue
          state, which is what the user actually scans for. */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <h1
            className="text-xl font-semibold tracking-tight leading-tight"
            title={mogCode(mog)}
          >
            {mog.name}
          </h1>
          <span
            className={cn(
              "shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
              cfg.bgSoftClass,
              cfg.textClass
            )}
            aria-label={`Status: ${cfg.tabCaption}`}
          >
            {cfg.tabCaption}
          </span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenAudit}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground/85",
            "transition-colors hover:bg-accent hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          )}
        >
          <History className="h-4 w-4" />
          Audit Log
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More actions"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground",
                "transition-colors hover:bg-accent hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem>Move to exception</DropdownMenuItem>
            <DropdownMenuItem>Request new Ingredient</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Copy decision ID</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * NoMatchActionable — replaces the passive "no candidates" empty state.
 * Surfaces a search-and-add affordance for RED-queue decisions where the
 * bot didn't surface any candidates.
 * ──────────────────────────────────────────────────────────────────────── */

function NoMatchActionable({
  apls,
  excludedIds,
  onAdd,
  mog,
}: AplSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  // siteLabel helper removed — dropdown rows no longer surface site
  // information per the dropdown-cleanup spec.
  const results = useMemo(
    () => apls.filter((a) => !excludedIds.has(a.id) && aplMatchesQuery(a, query)).slice(0, 50),
    [apls, excludedIds, query]
  );

  return (
    <div className="px-5 py-6 flex flex-col gap-5">
      {/* Title strip */}
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-queue" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            No match found — needs action
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            No suitable Article found. Search again, add manually, or raise a
            request to Procurement.
          </p>
        </div>
      </div>

      {/* Inline autocomplete — dropdown opens on focus or typing */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Search by generic name, brand or characteristic..."
          className="pl-8"
        />
        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-[320px] overflow-y-auto rounded-md border border-border bg-popover shadow-md scrollbar-thin">
            {/* Empty / "no match" state — only when user has actually typed
                a non-empty query and got zero results. Avoids contradiction
                when the dropdown is opened with no query yet. */}
            {results.length === 0 && query.trim().length > 0 && (
              <div className="px-4 py-6 text-center text-sm">
                <div className="font-medium text-foreground">No match found</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Try a different brand, generic name, or article code.
                </div>
              </div>
            )}
            {results.length === 0 && query.trim().length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Type to search the Article master.
              </div>
            )}
            {results.length > 0 && (
              <ul className="py-1">
                {results.map((apl) => (
                  <li key={apl.id}>
                    <AplResultRow
                      apl={apl}
                      mog={mog}
                      onSelect={() => {
                        onAdd(apl.id);
                        setQuery("");
                        setOpen(false);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Footer guidance — concise, no contradiction with results above. */}
      <p className="text-xs text-muted-foreground">
        Select an Article or escalate if no suitable match is found.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * RetiringAplCard — Blue-queue header card showing the APL being phased
 * out. Always rendered ABOVE the selectable replacement list so it can't
 * be confused with a candidate.
 * ──────────────────────────────────────────────────────────────────────── */

function RetiringAplCard({ apl }: { apl: APL }) {
  const fullName = `${apl.brand !== "UB" ? `${apl.brand} ` : ""}${apl.genericName}`;
  return (
    <div className="border-b border-border bg-muted/20 px-4 py-3 flex items-start gap-3">
      <div className="shrink-0 inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Retiring
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium leading-tight truncate">{fullName}</span>
          <span className="shrink-0 inline-flex items-center rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground numeric-tabular">
            {aplCode(apl)}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground numeric-tabular">
          {apl.characteristic} · {apl.packSize} · {formatCurrencyINR(apl.costPerUnit)} per pack
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * BlueEmptyState — Blue-queue zero-replacement-suggestions UI.
 * Surfaces a single "Add APL manually" entry (the inline autocomplete
 * popover) for users who need to nominate a replacement themselves.
 * ──────────────────────────────────────────────────────────────────────── */

function BlueEmptyState({ apls, sites, excludedIds, onAdd, mog }: AplSearchProps) {
  return (
    <div className="px-5 py-10 flex flex-col items-center text-center gap-3">
      <div className="text-sm font-medium text-foreground">
        No candidate Article found
      </div>
      <p className="text-xs text-muted-foreground max-w-xs">
        The bot couldn&rsquo;t find a credible transition candidate. Nominate
        one manually to plan the change.
      </p>
      <div className="mt-2">
        <AplSearchPopover
          apls={apls}
          sites={sites}
          excludedIds={excludedIds}
          onAdd={onAdd}
          mog={mog}
          label="Add replacement manually"
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * "Matched On" tags — derived per-row badges
 * ──────────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────
 * Toast — minimal transient bottom-right notification.
 * Single-message at a time; dismissed by parent state (auto-cleared on a
 * timer in DecisionBody). Optional `action` renders an inline link.
 * ──────────────────────────────────────────────────────────────────────── */

function Toast({
  toast,
  onDismiss,
}: {
  toast: { id: number; message: string; action?: { label: string; href: string } } | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 right-6 z-50 max-w-sm",
        "flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg",
        "animate-in fade-in slide-in-from-bottom-4 duration-200"
      )}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-queue-soft text-green-queue mt-0.5">
        <Check className="h-4 w-4" strokeWidth={2.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{toast.message}</p>
        {toast.action && (
          <Link
            href={toast.action.href}
            onClick={onDismiss}
            className="mt-1 inline-block text-sm font-medium text-blue-queue hover:underline"
          >
            {toast.action.label} →
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * EscalateProcurementDialog — confirmation modal for the RED queue's
 * "Escalate to Procurement" CTA. Pre-fills the only valid reason and
 * captures optional notes. The submit handler (in DecisionBody) does the
 * actual store mutation + toast + close.
 * ──────────────────────────────────────────────────────────────────────── */

function EscalateProcurementDialog({
  open,
  onOpenChange,
  mogName,
  siteLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  mogName: string;
  siteLabel: string;
  onSubmit: () => void;
}) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) setNotes("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Escalate to Procurement</DialogTitle>
          <div className="mt-2 flex flex-col gap-0.5 text-sm">
            <div>
              <span className="text-muted-foreground">Ingredient:</span>{" "}
              <span className="font-medium text-foreground">{mogName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>{" "}
              <span className="font-medium text-foreground">{siteLabel}</span>
            </div>
          </div>
          <DialogDescription className="mt-3">
            This will raise a request to create a new Article in SAP for this Ingredient.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Reason — only one valid value, so render as a read-only field
              instead of a single-option dropdown. */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Reason</label>
            <div className="h-9 px-3 rounded-md border border-border bg-muted/50 text-sm flex items-center text-foreground">
              Missing Article in SAP
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. preferred brand, pack size, urgency"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-end gap-2">
          <DialogClose asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground/85 transition-colors hover:bg-accent"
            >
              Cancel
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={onSubmit}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold",
              "bg-red-queue text-white shadow-sm transition-colors",
              "hover:bg-red-queue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-queue/40"
            )}
          >
            Raise Request
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


/* ─────────────────────────────────────────────────────────────────────────
 * RIGHT — Agent Reasoning panel
 * Reuses the existing CMP Autobot text (decision.explanation + signals)
 * ──────────────────────────────────────────────────────────────────────── */

type SignalKind = "match" | "warning" | "miss";
function parseSignal(raw: string): { kind: SignalKind; text: string } {
  if (raw.startsWith("⚠")) return { kind: "warning", text: raw.replace(/^⚠\s*/, "") };
  if (raw.startsWith("✗")) return { kind: "miss", text: raw.replace(/^✗\s*/, "") };
  return { kind: "match", text: raw };
}

function AgentReasoningPanel({ decision }: { decision: MappingDecision }) {
  // Split signals so the checklist shows only positive checks; warnings &
  // misses surface in their own callout boxes below.
  const parsed = decision.signals.map(parseSignal);
  const checks = parsed.filter((s) => s.kind === "match");
  const warnings = parsed.filter((s) => s.kind === "warning");
  const misses = parsed.filter((s) => s.kind === "miss");

  return (
    // The card IS the panel. Fills the grid cell (items-stretch on the
    // parent) and never scrolls — only the table card scrolls, per spec.
    // Content stacks via flex-col + gap-4 from the top.
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
          {/* Header: bot identity + timestamp */}
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium leading-tight">CMP AUTOBOT</div>
              <div className="mt-0.5 text-xs text-muted-foreground numeric-tabular">
                {prettyGenerated(decision.generatedAt)}
              </div>
            </div>
          </div>

          {/* Summary section */}
          <section>
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-medium mb-2">
              Summary
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{decision.explanation}</p>
          </section>

          {/* Positive checks */}
          {checks.length > 0 && (
            <ul className="flex flex-col gap-2">
              {checks.map((s, i) => (
                <li
                  key={`check-${i}`}
                  className="flex items-start gap-2 text-sm leading-relaxed text-foreground/85"
                >
                  <Check
                    className="h-4 w-4 mt-0.5 shrink-0 text-green-queue"
                    strokeWidth={2.5}
                  />
                  <span>{s.text}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Warnings — soft amber callout */}
          {warnings.map((w, i) => (
            <div
              key={`warn-${i}`}
              className="flex items-start gap-2 rounded-md bg-amber-queue-soft px-3 py-2 text-sm text-amber-queue"
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{w.text}</span>
            </div>
          ))}

          {/* Misses — red callout */}
          {misses.map((m, i) => (
            <div
              key={`miss-${i}`}
              className="flex items-start gap-2 rounded-md bg-red-queue-soft px-3 py-2 text-sm text-red-queue"
            >
              <X className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{m.text}</span>
            </div>
          ))}

          {/* Bottom CTA — yellow alert.
              Visible only when the match still needs the user's sign-off:
              amber (likely match) or blue (transition watch) AND the decision
              is still pending. Hidden for green (already validated) and red
              (no match — different semantic), and once the decision is done. */}
          {decision.status === "pending" &&
            (decision.queue === "amber" || decision.queue === "blue") && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md bg-amber-queue-soft text-amber-queue px-3 py-2.5 text-sm font-medium"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Likely match — confirm before entry.</span>
              </div>
            )}
    </div>
  );
}

function prettyGenerated(iso: string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  return `Generated ${time} IST · ${date}`;
}

/* ─────────────────────────────────────────────────────────────────────────
 * RedReasoningPanel — RED-state right panel.
 * Two visually separated sections:
 *   1. Reasoning (why no match) + a NO CREDIBLE MATCH alert strip
 *   2. Escalate to Procurement (single CTA — no MAM Type selector)
 * ──────────────────────────────────────────────────────────────────────── */

function RedReasoningPanel({
  decision,
  onEscalate,
}: {
  decision: MappingDecision;
  onEscalate: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card flex flex-col h-full min-h-0 overflow-hidden">
      {/* === Section 1: Autobot reasoning === */}
      <div className="p-4 flex flex-col gap-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
              Autobot Matched
            </div>
            <div className="text-xs text-muted-foreground numeric-tabular">
              {prettyGenerated(decision.generatedAt)}
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90">
          {decision.explanation}
        </p>

        <div
          role="alert"
          className="flex items-center gap-2 rounded-md bg-red-queue-soft text-red-queue px-3 py-2.5 text-xs font-semibold uppercase tracking-wider"
        >
          <X className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          <span>No credible match</span>
        </div>
      </div>

      {/* === Section 2: Escalation status / CTA ===
          When already escalated, replace the CTA with a confirmed-state
          notification so we don't invite a duplicate request. Otherwise
          render the secondary-styled Escalate button (search is the
          primary action — it lives in the center panel). */}
      <div className="p-4 flex flex-col gap-3">
        {decision.status === "escalated" ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-amber-queue/30 bg-amber-queue-soft/40 px-3 py-2.5"
          >
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-amber-queue" strokeWidth={2.75} />
            <div className="text-sm">
              <div className="font-semibold text-amber-queue">
                Escalation in progress
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Procurement has been notified. They&rsquo;ll add the missing
                Article in SAP — this Ingredient stays here until that&rsquo;s done.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="text-sm font-medium text-foreground">
                Not able to find suitable Article?
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Procurement will be asked to add the missing Article in SAP.
              </p>
            </div>
            <button
              type="button"
              onClick={onEscalate}
              className={SECONDARY_BUTTON}
            >
              Escalate to Procurement
            </button>
          </>
        )}
      </div>
    </div>
  );
}
