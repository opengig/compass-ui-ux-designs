"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, Check, Flag, Link2Off, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMockStore } from "@/lib/mock-store";
import { aplCode, cn, formatCurrencyINR } from "@/lib/utils";
import type { APL, MOG, MappingDecision, Queue } from "@/lib/types";

/* ─────────────────────────────────────────────────────────────────────────
 * RowDetailDrawer — slide-in panel triggered by clicking a Worklist row
 * (anywhere outside its checkboxes / buttons). Renders the row's full
 * mapping context — MOG + Article + Hierarchy + Autobot Reasoning —
 * without losing the table's scroll position behind it.
 *
 * Built on Radix Dialog primitives directly so we can right-anchor the
 * panel + slide it in from the edge. The portaled overlay covers the rest
 * of the page; clicking it (or the X / pressing Esc) closes the drawer.
 *
 * The panel itself is a fixed-height flex column:
 *   ┌─────────────────────────────┐
 *   │ Header (fixed)              │  name + queue chip + MOG code
 *   ├─────────────────────────────┤
 *   │ Body (flex-1, scrollable)   │  4 sections of details
 *   │   MOG Details               │
 *   │   Article Details           │
 *   │   Hierarchy                 │
 *   │   Autobot Reasoning         │
 *   ├─────────────────────────────┤
 *   │ Footer (sticky)             │  primary CTA + quick actions
 *   └─────────────────────────────┘
 * ──────────────────────────────────────────────────────────────────────── */

const QUEUE_PILL: Record<
  Queue,
  { bg: string; text: string; border: string; label: string }
> = {
  amber: {
    bg: "bg-[#FEF3C7]",
    text: "text-[#92400E]",
    border: "border-[#FDE68A]",
    label: "Likely Matches",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    label: "No Match",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    label: "Matches",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    label: "Retired",
  },
};

const MAPPED_PILL = {
  bg: "bg-green-100",
  text: "text-green-800",
  border: "border-green-200",
  label: "Mapped",
};

interface RowDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: MappingDecision | null;
  mog: MOG | undefined;
  /** Resolved candidate APLs for this ingredient — already filtered
   *  for visibility by the parent. The first one matching the
   *  ingredient's chosen default is shown in the Article Details
   *  section; the rest surface in the "Other articles" sub-list so
   *  users can pivot without closing the drawer. */
  candidateApls: APL[];
  /** Article ids the user has flagged as default. Used to find which
   *  of the candidates is the current default for this ingredient. */
  defaultArticleIds: Set<string>;
  /** Article ids already mapped (terminal state). The detail panel
   *  hides Confirm/Reject quick actions for mapped articles since
   *  there's nothing left to action. */
  mappedArticleIds: Set<string>;
  /** Quick-action handlers — confirm / reject the currently-shown
   *  default article. Pass-through to the existing store actions so
   *  the drawer stays in sync with the rest of the worklist. */
  onConfirm: (aplId: string) => void;
  onReject: (aplId: string) => void;
  /** Switch the focused article — rebinds the Article Details
   *  section + repaints the default chip in the parent table. */
  onChangeDefault: (aplId: string) => void;
  /** Needs Mapping pathway — fires when the user clicks "Flag
   *  for Investigation" in the footer. Used only when there's
   *  no candidate APL (i.e. nothing to map automatically). */
  onFlagForInvestigation?: () => void;
  /** Needs Mapping pathway — fires when the user clicks "Raise
   *  Procurement Exception" in the footer. Used only when there's
   *  no candidate APL. */
  onRaiseProcurementException?: () => void;
  /** Needs Transition pathway — fires when the user clicks
   *  "Delink Retired APL" in the footer. Used only when the
   *  ingredient's queue is "blue" (the bot flagged the mapped
   *  APL for retirement). */
  onDelinkRetired?: () => void;
  /** Article-focused mode — when set, the drawer renders a
   *  slim view scoped to a single APL (the one the user
   *  clicked) instead of the full ingredient breakdown. */
  focusedAplId?: string | null;
}

export function RowDetailDrawer({
  open,
  onOpenChange,
  decision,
  mog,
  candidateApls,
  defaultArticleIds,
  mappedArticleIds,
  onConfirm,
  onReject,
  onChangeDefault,
  onFlagForInvestigation,
  onRaiseProcurementException,
  onDelinkRetired,
  focusedAplId,
}: RowDetailDrawerProps) {
  const sites = useMockStore((s) => s.sites);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);

  if (!decision || !mog) return null;

  const site = sites.find((s) => s.id === decision.siteId);
  const isMapped = decision.status === "confirmed";
  // Needs Mapping pathway — no candidate APLs at all means
  // the bot couldn't find a match. Switches the reasoning
  // section + footer to escalation actions.
  const isNeedsMapping = candidateApls.length === 0;
  // Needs Transition pathway — the ingredient's mapped APL
  // is flagged for retirement (queue "blue"). Switches the
  // Article section to a "RETIRED APL" red card, the reasoning
  // copy to the retirement narrative, and the footer to a
  // single "Delink Retired APL" CTA.
  const isTransitionRequired = decision.queue === "blue";
  // Article-focused mode — the user clicked a specific article
  // in the table and wants ONLY that article's details. Resolves
  // the focused APL via focusedAplId, falling back to the
  // ingredient's default if the id doesn't match (defensive).
  const isArticleFocus =
    focusedAplId !== undefined && focusedAplId !== null;
  const focusedApl = isArticleFocus
    ? candidateApls.find((a) => a.id === focusedAplId) ??
      candidateApls.find((a) => defaultArticleIds.has(a.id)) ??
      candidateApls[0] ??
      null
    : candidateApls.find((a) => defaultArticleIds.has(a.id)) ??
      candidateApls[0] ??
      null;
  const focusedIsMapped = focusedApl
    ? mappedArticleIds.has(focusedApl.id)
    : false;
  const otherApls = candidateApls.filter(
    (a) => a.id !== focusedApl?.id
  );

  // Best-match indicator — derived from the bot's per-APL
  // confidence scores when available. Highlights the highest-
  // confidence article inside the Other Articles list so users
  // see the recommendation at a glance. Falls back to null when
  // the decision doesn't carry aplMatches metadata, which keeps
  // the badge dormant for older / minimal data fixtures.
  const bestMatchAplId = (() => {
    if (!decision.aplMatches || decision.aplMatches.length === 0) return null;
    const best = decision.aplMatches.reduce((acc, m) =>
      m.confidence > acc.confidence ? m : acc
    );
    return best.aplId;
  })();

  const queuePill = isMapped ? MAPPED_PILL : QUEUE_PILL[decision.queue];

  // Hierarchy levels — current data fixture exposes 3 (category /
  // generic ingredient / characteristic). L6 + Merchant Category
  // aren't in the schema yet so they render with placeholders.
  const hierarchy = {
    L3: mog.category || "—",
    L4: mog.genericIngredient || "—",
    L5: focusedApl?.characteristic || "—",
    L6: "—",
    Category: mog.category || "—",
    "Merchant Category": "—",
  };

  // Article-focused layout — slim view scoped to a single APL.
  // Short-circuits the full ingredient breakdown when the user
  // clicked a specific article in the table.
  if (isArticleFocus && focusedApl) {
    const focusedFullName = `${
      focusedApl.brand && focusedApl.brand !== "UB"
        ? `${focusedApl.brand} `
        : ""
    }${focusedApl.genericName}`;
    const focusedDesc = [
      focusedApl.characteristic,
      focusedApl.packSize,
    ]
      .filter(Boolean)
      .join(" · ");
    const focusedHierarchy = [
      mog.category,
      mog.genericIngredient,
      focusedApl.characteristic,
    ]
      .filter(Boolean)
      .join(" › ");
    const focusedStatusPill = focusedIsMapped
      ? MAPPED_PILL
      : queuePill;
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-200" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              "fixed inset-y-0 right-0 z-50 flex h-screen w-[440px] max-w-[90vw] flex-col bg-background shadow-2xl",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
              "duration-200"
            )}
          >
            {/* Header — article name + status pill + APL code */}
            <div className="shrink-0 border-b border-border px-6 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <DialogPrimitive.Title className="text-base font-semibold tracking-tight truncate">
                  {focusedFullName}
                </DialogPrimitive.Title>
                <div className="mt-1.5 flex items-center gap-2 text-[12px]">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium",
                      focusedStatusPill.bg,
                      focusedStatusPill.text,
                      focusedStatusPill.border
                    )}
                  >
                    {focusedStatusPill.label}
                  </span>
                  <span className="text-muted-foreground numeric-tabular tabular-nums">
                    {aplCode(focusedApl)}
                  </span>
                </div>
              </div>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogPrimitive.Close>
            </div>

            {/* Body — article-only fields */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <Section title="Article">
                <Field
                  label="Article ID"
                  value={aplCode(focusedApl)}
                  valueClass="numeric-tabular tabular-nums"
                />
                <Field label="Name" value={focusedFullName} />
                <Field
                  label="Description"
                  value={focusedDesc || "—"}
                />
                <Field
                  label="Status"
                  value={
                    focusedApl.status === "active" ? "Active" : "Inactive"
                  }
                />
              </Section>

              {/* Category section — three rows of classification
                  data, in priority order:
                    1. Hierarchy (primary, font-medium foreground)
                    2. Category Name (normal text)
                    3. Shelf Type (subtle muted-tone badge,
                       Perishables/Non-Perishables) */}
              <Section title="Category">
                <Field
                  label="Hierarchy"
                  value={focusedHierarchy || "—"}
                  valueClass="font-medium text-foreground"
                />
                <Field
                  label="Category Name"
                  value={focusedApl.categoryName || "—"}
                />
                {/* Shelf Type renders as a muted badge in its own
                    cell. Field's value is text-only, so we use a
                    fragment with the label cell + a custom value
                    cell instead. */}
                <div className="text-[11.5px] text-muted-foreground self-center">
                  Shelf Type
                </div>
                <div>
                  {focusedApl.shelfLifeCategory ? (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {focusedApl.shelfLifeCategory}
                    </span>
                  ) : (
                    <span className="text-[13px] font-medium text-foreground/40">
                      —
                    </span>
                  )}
                </div>
              </Section>

              <Section title="Mapping">
                <Field label="Ingredient" value={mog.name} />
                <Field
                  label="MOG Code"
                  value={mog.id}
                  valueClass="numeric-tabular tabular-nums"
                />
                <Field
                  label="Mapping Status"
                  value={focusedStatusPill.label}
                />
                <Field
                  label="Default APL"
                  value={
                    defaultArticleIds.has(focusedApl.id) ? "Yes" : "No"
                  }
                />
              </Section>

              {/* Reasons — autobot explanation + signal bullets.
                  Mirrors the same block in the ingredient view so
                  users see AI reasoning regardless of which flow
                  opened the drawer. */}
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Reasons
                </h3>
                {decision.explanation || (decision.signals && decision.signals.length > 0) ? (
                  <div className="rounded-md border border-blue-200/80 bg-blue-50/60 p-3.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" strokeWidth={2} />
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-blue-800/85">
                        AI Reasoning
                      </span>
                    </div>
                    {decision.explanation && (
                      <p className="text-[13px] leading-relaxed text-foreground/90">
                        {decision.explanation}
                      </p>
                    )}
                    {decision.signals && decision.signals.length > 0 && (
                      <ul className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-foreground/75">
                        {decision.signals.map((s, i) => (
                          <li key={i} className="flex gap-2">
                            <span aria-hidden="true" className="text-blue-500 shrink-0">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">No reasoning recorded.</p>
                )}
              </div>
            </div>

            {/* Footer — Confirm/Reject for this article (or
                Mapped badge if already mapped) */}
            <div className="shrink-0 border-t border-border bg-background px-6 py-3">
              {focusedIsMapped ? (
                <div className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2.5 py-1.5 text-[12px] font-medium text-green-700">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                  Mapped
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onConfirm(focusedApl.id)}
                    className="flex-1 inline-flex h-9 items-center justify-center gap-1 rounded-md border bg-[#1F7A4D] text-white border-[#1F7A4D] hover:bg-[#185f3c] shadow-sm text-[13px] font-semibold transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(focusedApl.id)}
                    className="flex-1 inline-flex h-9 items-center justify-center gap-1 rounded-md border bg-[#FDECEC] text-[#B42318] border-[#F5C2C0] hover:bg-[#F8DCDC] text-[13px] font-medium transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <>
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay — soft scrim instead of a full blackout so the
            table remains visible (and identifiable) behind it. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-200" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-screen w-[440px] max-w-[90vw] flex-col bg-background shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
            "duration-200"
          )}
        >
          {/* ─── Header ──────────────────────────────────────── */}
          <div className="shrink-0 border-b border-border px-6 py-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-base font-semibold tracking-tight truncate">
                {mog.name}
              </DialogPrimitive.Title>
              <div className="mt-1.5 flex items-center gap-2 text-[12px]">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium",
                    queuePill.bg,
                    queuePill.text,
                    queuePill.border
                  )}
                >
                  {queuePill.label}
                </span>
                <span className="text-muted-foreground numeric-tabular tabular-nums">
                  {mog.id}
                </span>
              </div>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {/* ─── Scrollable body ─────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <Section title="MOG Details">
              <Field label="MOG Code" value={mog.id} />
              <Field
                label="Type"
                value={
                  mog.type === "elementary"
                    ? "Elementary"
                    : "Composite"
                }
              />
              <Field
                label="Site"
                value={site ? `${site.city} · ${site.name}` : "—"}
              />
              <Field label="UOM" value="—" />
              <Field label="Map Status" value={queuePill.label} />
            </Section>

            {isTransitionRequired && focusedApl ? (
              // Needs Transition — render the focused APL as
              // a "RETIRED APL" red card instead of the standard
              // 2-column field grid. Mirrors the retirement
              // pattern from the screenshot spec.
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  APL / Article
                </h3>
                <div className="rounded-md border border-red-200 bg-red-50/60 p-3.5 space-y-1">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-red-700">
                    Retired APL
                  </div>
                  <div className="text-[12px] text-red-800/85 numeric-tabular tabular-nums">
                    {aplCode(focusedApl)}
                  </div>
                  <div className="text-[14px] font-medium text-foreground/95">
                    {[
                      focusedApl.brand && focusedApl.brand !== "UB"
                        ? `${focusedApl.brand} ${focusedApl.genericName}`
                        : focusedApl.genericName,
                      focusedApl.packSize,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    Inactive — flagged for retirement
                  </div>
                </div>
                {otherApls.length === 0 && (
                  // No replacement candidate available — surface
                  // the warning directly under the retired card
                  // so the user immediately sees that a manual
                  // delink-and-remap is required.
                  <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-[12px] text-amber-900">
                    No replacement APL detected.
                  </div>
                )}
              </div>
            ) : (
              <Section title="Article Details">
                {focusedApl ? (
                  <>
                    <Field
                      label="Article Number"
                      value={aplCode(focusedApl)}
                      valueClass="numeric-tabular tabular-nums"
                    />
                    <Field
                      label="Description"
                      value={[
                        focusedApl.brand && focusedApl.brand !== "UB"
                          ? `${focusedApl.brand} ${focusedApl.genericName}`
                          : focusedApl.genericName,
                        focusedApl.characteristic,
                        focusedApl.packSize,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                    <Field
                      label="Active Status"
                      value={
                        focusedApl.status === "active"
                          ? "Active"
                          : "Inactive"
                      }
                    />
                    <Field
                      label="Cost"
                      value={formatCurrencyINR(focusedApl.costPerUnit)}
                      valueClass="numeric-tabular tabular-nums"
                    />
                  </>
                ) : (
                  <p className="col-span-2 text-sm text-muted-foreground">
                    No article available.
                  </p>
                )}
              </Section>
            )}

            {!isTransitionRequired && otherApls.length > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Other Articles ({otherApls.length})
                </h3>
                <div className="space-y-2">
                  {otherApls.map((a) => {
                    const isAplMapped = mappedArticleIds.has(a.id);
                    const isBestMatch =
                      bestMatchAplId !== null && a.id === bestMatchAplId;
                    const fullName =
                      a.brand && a.brand !== "UB"
                        ? `${a.brand} ${a.genericName}`
                        : a.genericName;
                    const desc = [a.characteristic, a.packSize]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <div
                        key={a.id}
                        className={cn(
                          "rounded-md border bg-background p-3 transition-colors",
                          isBestMatch
                            ? "border-blue-200 bg-blue-50/50"
                            : "border-border hover:bg-accent/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Card body — clicking it makes this
                              article the default for the
                              ingredient. The Confirm / Reject
                              buttons sit outside this button so
                              their clicks don't promote the row
                              first. */}
                          <button
                            type="button"
                            onClick={() => onChangeDefault(a.id)}
                            aria-label={`Set ${fullName} as default`}
                            className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[13px] font-semibold truncate">
                                {fullName}
                              </span>
                              {isBestMatch && (
                                <span className="shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-blue-800 bg-blue-100">
                                  Best
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              <span className="numeric-tabular tabular-nums">
                                {aplCode(a)}
                              </span>
                              {desc && (
                                <>
                                  <span
                                    aria-hidden="true"
                                    className="mx-1 opacity-60"
                                  >
                                    ·
                                  </span>
                                  <span>{desc}</span>
                                </>
                              )}
                              <span
                                aria-hidden="true"
                                className="mx-1 opacity-60"
                              >
                                ·
                              </span>
                              <span className="numeric-tabular tabular-nums">
                                {formatCurrencyINR(a.costPerUnit)}
                              </span>
                            </div>
                          </button>
                          {/* Right-side actions — Mapped badge
                              for terminal state, otherwise the
                              compact Confirm / Reject buttons.
                              Sized smaller than the footer pair
                              so they sit cleanly inside the
                              card without competing with the
                              article name. */}
                          <div className="shrink-0 flex items-center gap-1">
                            {isAplMapped ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700">
                                <Check
                                  className="h-3 w-3"
                                  strokeWidth={2.75}
                                />
                                Mapped
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onConfirm(a.id)}
                                  className="inline-flex h-7 items-center rounded-md border bg-[#1F7A4D] text-white border-[#1F7A4D] hover:bg-[#185f3c] shadow-sm px-2.5 text-[11px] font-semibold transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onReject(a.id)}
                                  aria-label="Reject article"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-[#FDECEC] text-[#B42318] border-[#F5C2C0] hover:bg-[#F8DCDC] transition-colors"
                                >
                                  <X
                                    className="h-3.5 w-3.5"
                                    strokeWidth={2.5}
                                  />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Section title="Hierarchy">
              {Object.entries(hierarchy).map(([k, v]) => (
                <Field key={k} label={k} value={v} />
              ))}
            </Section>

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                Reasons
              </h3>
              {isNeedsMapping ? (
                // No candidate APL — the bot has nothing to
                // recommend. Replace the AI-reasoning narrative
                // (and any signal bullets) with a clear
                // unmappable message + amber warning visual so
                // the user knows manual intervention is needed.
                <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle
                      className="h-3.5 w-3.5 text-amber-700"
                      strokeWidth={2}
                    />
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-amber-800">
                      No Match Found
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-amber-900/90">
                    No suitable APL/article found for this
                    ingredient. Requires manual mapping or
                    escalation.
                  </p>
                </div>
              ) : isTransitionRequired ? (
                // Needs Transition — neutral grey card with
                // the retirement narrative. No icon header (the
                // RETIRED APL card above already carries the
                // visual weight), just the explanation copy so
                // users understand why the row is in this tab.
                <div className="rounded-md border border-border bg-muted/40 p-3.5">
                  <p className="text-[13px] leading-relaxed text-foreground/90">
                    Mapped APL is flagged for retirement in next
                    ODS cycle. Transition required before
                    retirement date.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-blue-200/80 bg-blue-50/60 p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles
                      className="h-3.5 w-3.5 text-blue-600"
                      strokeWidth={2}
                    />
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-blue-800/85">
                      AI Reasoning
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-foreground/90">
                    {decision.explanation || "No reasoning recorded."}
                  </p>
                  {decision.signals && decision.signals.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-foreground/75">
                      {decision.signals.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span
                            aria-hidden="true"
                            className="text-blue-500 shrink-0"
                          >
                            •
                          </span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─── Sticky footer — primary CTA + quick actions ──
              Needs Mapping ingredients swap the Confirm / Reject /
              Link-to-CookBook stack for an escalation pair so the
              user has clear, action-oriented choices when there's
              no APL to confirm against. */}
          <div className="shrink-0 border-t border-border bg-background px-6 py-3 space-y-2">
            {isNeedsMapping ? (
              // Stacked vertically (not side-by-side) — "Raise
              // Procurement Exception" is too long to share a
              // 440px-wide row's footer with another button
              // without wrapping. Primary destructive action sits
              // on top so it's the most prominent in the user's
              // reading flow; secondary outline below it.
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onRaiseProcurementException}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-red-600 text-white hover:bg-red-700 text-[13px] font-medium transition-colors shadow-sm"
                >
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Raise Procurement Exception
                </button>
                <button
                  type="button"
                  onClick={onFlagForInvestigation}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-background text-foreground/80 hover:bg-accent text-[13px] font-medium transition-colors"
                >
                  <Flag className="h-3.5 w-3.5" strokeWidth={2} />
                  Flag for Investigation
                </button>
              </div>
            ) : isTransitionRequired ? (
              <button
                type="button"
                onClick={() => setUnlinkConfirmOpen(true)}
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-md border bg-[#FDECEC] text-[#B42318] border-[#F5C2C0] hover:bg-[#F8DCDC] text-[13px] font-medium transition-colors"
              >
                <Link2Off className="h-3.5 w-3.5" strokeWidth={2.25} />
                Unlink from CookBook
              </button>
            ) : (
              <>
                {focusedApl && !focusedIsMapped && (
                  // Confirm = primary (solid green, semibold,
                  // shadow). Reject keeps its light-red secondary
                  // pill so the two siblings sit at clearly
                  // different tiers — same hierarchy as the
                  // worklist row's InlineActions cluster.
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onConfirm(focusedApl.id)}
                      className="flex-1 inline-flex h-8 items-center justify-center gap-1 rounded-md border bg-[#1F7A4D] text-white border-[#1F7A4D] hover:bg-[#185f3c] shadow-sm text-[12px] font-semibold transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => onReject(focusedApl.id)}
                      className="flex-1 inline-flex h-8 items-center justify-center gap-1 rounded-md border bg-[#FDECEC] text-[#B42318] border-[#F5C2C0] hover:bg-[#F8DCDC] text-[12px] font-medium transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                )}
                <Button className="w-full">Link APL to CookBook</Button>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>

    {/* Unlink confirmation dialog — rendered as a sibling so it
        layers above the drawer without Radix nesting issues. */}
    <Dialog open={unlinkConfirmOpen} onOpenChange={setUnlinkConfirmOpen}>
      <DialogContent className="max-w-[400px]" aria-describedby="unlink-confirm-desc">
        <DialogHeader>
          <DialogTitle>Unlink from CookBook</DialogTitle>
          <DialogDescription id="unlink-confirm-desc">
            This will remove the link between the retired APL and the
            ingredient in CookBook. The ingredient will move to Needs
            Mapping for re-assignment.
          </DialogDescription>
        </DialogHeader>

        {focusedApl && (
          <div className="rounded-md border border-red-200 bg-red-50/60 px-3 py-2.5 text-[13px]">
            <div className="font-medium text-foreground/90">
              {focusedApl.brand && focusedApl.brand !== "UB"
                ? `${focusedApl.brand} ${focusedApl.genericName}`
                : focusedApl.genericName}
            </div>
            <div className="mt-0.5 text-[12px] text-muted-foreground numeric-tabular tabular-nums">
              {aplCode(focusedApl)} · Inactive
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setUnlinkConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setUnlinkConfirmOpen(false);
              onDelinkRetired?.();
            }}
          >
            <Link2Off className="h-3.5 w-3.5 mr-1.5" strokeWidth={2.25} />
            Unlink
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}

/* Section heading + 2-column field grid. Each Field renders as
 * two grid cells (label, value) so they line up across rows. */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
        {title}
      </h3>
      <div className="grid grid-cols-[112px_1fr] gap-y-2 gap-x-4">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <>
      <div className="text-[11.5px] text-muted-foreground self-center">
        {label}
      </div>
      <div
        className={cn(
          "text-[13px] font-medium text-foreground/90 break-words",
          valueClass
        )}
      >
        {value}
      </div>
    </>
  );
}
