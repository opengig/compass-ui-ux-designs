"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  History,
  X,
} from "lucide-react";
import Link from "next/link";
import type { APL, MappingDecision, MOG } from "@/lib/types";
import { useMockStore } from "@/lib/mock-store";
import { AuditLogDrawer } from "@/components/shared/audit-log-drawer";
import { aplCode, cn, mogCode } from "@/lib/utils";

// ── Dummy-article fallback ───────────────────────────────────────────────
// When a Mapped Items decision has no resolvable articles in the store
// (legacy data, partial fixture, race), we synthesise a small
// deterministic set so the table never appears empty. Seeds come from
// the decision id + index, so the same Ingredient renders the same
// dummies across reloads and across users.

const DUMMY_VARIANT_QUALIFIERS = [
  "Premium", "Standard", "Economy Pack", "Organic",
  "Family Pack", "Bulk Pack", "Restaurant Pack", "Catering Tin",
];
const DUMMY_BRAND_POOL = [
  "Tata Sampann", "Aashirvaad", "MDH", "Everest", "MTR", "Patanjali",
  "BB Royal", "Catch", "Britannia", "Mother Dairy",
];
const DUMMY_PACK_VARIANTS = [
  "1x500 g", "1x1 kg", "1x2 kg", "1x250 g", "1x100 g",
  "1x5 kg", "2x500 g", "1x200 g",
];

function dummyHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Returns 3..6 deterministic APL records keyed off the decision id.
 * Each record is shaped exactly like a real APL so it flows through
 * buildAplLines + aplCode + the row renderer with no special-casing.
 * The first row is the canonical (no qualifier) variant — used as
 * the default selection.
 */
export function getDummyArticles(
  decision: MappingDecision,
  mog: MOG | undefined
): APL[] {
  const baseSeed = dummyHash(decision.id);
  const count = 3 + (baseSeed % 4); // 3..6
  const generic = mog?.genericIngredient ?? mog?.name ?? "Article";
  const out: APL[] = [];
  for (let i = 0; i < count; i++) {
    const seed = dummyHash(`${decision.id}|dummy|${i}`);
    // i=0 stays plain so the leading article reads as the canonical
    // variant; the remaining rows pick a qualifier from the pool.
    const qualifier = i === 0
      ? null
      : DUMMY_VARIANT_QUALIFIERS[seed % DUMMY_VARIANT_QUALIFIERS.length];
    const characteristic = qualifier
      ? `${generic} ${qualifier}`
      : generic;
    out.push({
      id: `dummy-${decision.id}-${i}`,
      genericName: generic,
      characteristic,
      brand: DUMMY_BRAND_POOL[seed % DUMMY_BRAND_POOL.length],
      packSize: DUMMY_PACK_VARIANTS[(seed >> 5) % DUMMY_PACK_VARIANTS.length],
      costPerUnit: 100 + ((seed >> 3) % 900),
      currency: "INR",
      siteId: decision.siteId,
      status: "active",
      lastModified: new Date(0).toISOString(),
      dataQuality: { complete: true, missingFields: [] },
    });
  }
  return out;
}

export function MappedDetail({ decision }: { decision: MappingDecision }) {
  const mogs = useMockStore((s) => s.mogs);
  const apls = useMockStore((s) => s.apls);
  const toggleDecisionDefault = useMockStore((s) => s.toggleDecisionDefault);

  const mog = mogs.find((m) => m.id === decision.mogId);

  // The set of APLs that were actually mapped during confirm. When the
  // decision was confirmed via the partial-mapping flow this is a real
  // subset; when missing (legacy auto-confirm, bulk green) we fall back
  // to "every candidate is mapped" so the page never renders an empty
  // mapped section. Rejected ids are excluded from the fallback so
  // they consistently land in "Other suggestions".
  const mappedSet = useMemo<Set<string>>(() => {
    if (decision.mappedAplIds && decision.mappedAplIds.length > 0) {
      return new Set(decision.mappedAplIds);
    }
    const rejected = new Set(decision.rejectedAplIds ?? []);
    return new Set(decision.candidateAplIds.filter((id) => !rejected.has(id)));
  }, [decision.mappedAplIds, decision.candidateAplIds, decision.rejectedAplIds]);

  // Defaults are now multi-select — track every checked APL. The first
  // entry (if any) gets the "primary" treatment for sort order so the
  // canonical default still leads the list.
  const defaultIds = decision.defaultAplIds ?? [];
  const primaryDefaultId = defaultIds[0];

  // Candidates — primary default first, rest by cost ascending. Mirrors the
  // Worklist's lowest-cost-default ordering for non-default rows.
  const candidates = useMemo<APL[]>(
    () =>
      decision.candidateAplIds
        .map((id) => apls.find((a) => a.id === id))
        .filter((a): a is APL => Boolean(a))
        .sort((a, b) => {
          if (a.id === primaryDefaultId) return -1;
          if (b.id === primaryDefaultId) return 1;
          return a.costPerUnit - b.costPerUnit;
        }),
    [decision, apls, primaryDefaultId]
  );

  // Two-section split — see comment on `mappedSet` above for the
  // fallback semantics. Mapped retains the cost-ascending sort with
  // default first; "Other suggestions" follows the same rule for any
  // residual ordering needs.
  //
  // Final dummy fallback: if neither the explicit mappedAplIds nor
  // the candidate list yields a single resolvable APL, we synthesise
  // a deterministic 3..6 article set so the table never renders
  // empty in demo. The dummies are stable per decision.id so reloads
  // and shared links show the same content.
  const mappedApls = useMemo(() => {
    const real = candidates.filter((a) => mappedSet.has(a.id));
    if (real.length > 0) return real;
    return getDummyArticles(decision, mog);
  }, [candidates, mappedSet, decision, mog]);
  const otherSuggestions = useMemo(
    () => candidates.filter((a) => !mappedSet.has(a.id)),
    [candidates, mappedSet]
  );

  // Other suggestions section is collapsed by default — read-only context,
  // low priority. Stays collapsed across decision navigation so the page
  // reads consistently for every MOG.
  const [showOthers, setShowOthers] = useState(false);
  useEffect(() => {
    setShowOthers(false);
  }, [decision.id]);

  // Dummy fallback rows aren't in `candidateAplIds`, so the store's
  // `toggleDecisionDefault` rejects them. Detect that mode and manage
  // the default selection locally so the checkbox stays interactive.
  const isDummyMode = useMemo(
    () => mappedApls.length > 0 && mappedApls.every((a) => a.id.startsWith("dummy-")),
    [mappedApls]
  );

  const [localDummyDefaults, setLocalDummyDefaults] = useState<Set<string>>(
    () => new Set()
  );

  // Reset local dummy defaults whenever the decision changes — seed
  // with the first dummy so the DEFAULT badge still renders by default.
  useEffect(() => {
    if (!isDummyMode) {
      setLocalDummyDefaults(new Set());
      return;
    }
    const seeded = defaultIds.filter((id) => mappedApls.some((a) => a.id === id));
    if (seeded.length > 0) {
      setLocalDummyDefaults(new Set(seeded));
    } else if (mappedApls[0]) {
      setLocalDummyDefaults(new Set([mappedApls[0].id]));
    } else {
      setLocalDummyDefaults(new Set());
    }
    // Intentionally only re-seed on decision change; mappedApls is
    // deterministic per decision.id via getDummyArticles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision.id, isDummyMode]);

  // Effective default set — usually `decision.defaultAplIds`, but when
  // the mappedApls list falls back to dummies we use the local set
  // instead so toggling actually mutates something visible.
  const currentDefaultSet = useMemo<Set<string>>(() => {
    if (isDummyMode) return localDummyDefaults;
    const real = new Set(
      defaultIds.filter((id) => mappedApls.some((a) => a.id === id))
    );
    if (real.size > 0) return real;
    if (mappedApls[0]) return new Set([mappedApls[0].id]);
    return new Set();
  }, [isDummyMode, localDummyDefaults, mappedApls, defaultIds]);

  // Right-side Audit Log drawer.
  const [auditOpen, setAuditOpen] = useState(false);
  useEffect(() => {
    setAuditOpen(false);
  }, [decision.id]);

  // Toast — auto-dismiss.
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleDefaultToggle = (aplId: string) => {
    if (isDummyMode) {
      setLocalDummyDefaults((prev) => {
        const next = new Set(prev);
        if (next.has(aplId)) next.delete(aplId);
        else next.add(aplId);
        return next;
      });
    } else {
      toggleDecisionDefault(decision.id, aplId);
    }
    setToast("Default Articles updated");
  };

  // Partial = decision is still pending (work continues in Worklist) but
  // some APLs have already been mapped — surfaces in BOTH places.
  const isPartial =
    decision.status === "pending" && (decision.mappedAplIds?.length ?? 0) > 0;
  // Counts always reflect what's actually rendered in the table
  // below — using mappedApls.length means the subtext stays in
  // sync with the dummy-fallback path. totalCount likewise widens
  // to the rendered set so partial-progress percentages stay sane
  // when the underlying decision had no candidates wired up.
  const renderedCount = mappedApls.length;
  const totalCount = Math.max(decision.candidateAplIds.length, renderedCount);
  const mappedCount = decision.mappedAplIds?.length ?? renderedCount;
  const remainingCount = Math.max(
    0,
    totalCount - mappedCount - (decision.rejectedAplIds?.length ?? 0)
  );

  // Subtext used both in the spec ("Mapped · X APLs") and for the
  // partial state where we surface progress as "X / Y APLs".
  const subtext = isPartial
    ? `Mapped · ${mappedCount} / ${totalCount} Articles`
    : `Mapped · ${mappedApls.length} Article${mappedApls.length === 1 ? "" : "s"}`;

  // Helper that turns an APL into the description + hierarchy lines.
  // Defined inline so both the Mapped table and the Other APLs panel
  // can reuse the exact same derivation logic without copying it.
  const buildAplLines = (apl: APL) => {
    const fullName = `${apl.brand !== "UB" ? `${apl.brand} ` : ""}${apl.genericName}`;
    const descParts: string[] = [];
    if (apl.characteristic) descParts.push(apl.characteristic);
    if (apl.brand && apl.brand !== "UB") descParts.push(apl.brand);
    if (apl.packSize) descParts.push(apl.packSize);
    const description = descParts.join(" · ");
    // Hierarchy breadcrumb (L3 › L4 › L5) — same shape as Worklist:
    // capped at L5, with the trailing token suppressed if it already
    // appears in the product name.
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
    return { fullName, description, hierarchy: rawHierarchy.join(" › ") };
  };

  return (
    // Full-width detail panel — no centered/max-width wrapper. Padding
    // matches Worklist (px-8 py-6) so the two pages frame the same.
    <div className="px-8 py-6">
      {/* ─── Page header (flat, no container) ──────────────────────
          Mirrors Worklist CenterHeader exactly: full-width row, no
          background, no border, no padding of its own. Just the
          title + status pills on the left, the Audit Log button on
          the right, and a small subtext underneath. Spacing comes
          from the page padding (px-8 py-6 above) and the mt-4 gap
          before the table card — never from a wrapping box. */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Title — same h1 typography as the Worklist
                CenterHeader so the two screens read identical:
                text-xl font-semibold tracking-tight, sans. */}
            <h1
              className="text-xl font-semibold tracking-tight leading-tight"
              title={mog ? mogCode(mog) : undefined}
            >
              {mog?.name ?? decision.mogId}
            </h1>
            {/* Cookbook state — single status indicator on the
                Mapped Items header, per spec. The queue chip
                (NEEDS REVIEW / GREEN / etc.) was an intermediate
                state and doesn't belong on a screen that represents
                the final-mapped view; it's been removed.
                Partial-mapping progress is still surfaced via the
                "Mapped · X / Y Articles" subtext below + the
                "Continue in Worklist" link, so the chip itself can
                stay a single canonical "Added to Cookbook" pill. */}
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-queue-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-green-queue">
              <Check className="h-3 w-3" strokeWidth={2.75} />
              Added to Cookbook
            </span>
          </div>
          {/* Subtext — small metadata line, mt-1 to keep the header
              compact. "Mapped · X APLs" per spec; partial form is
              "Mapped · X / Y APLs" so progress is visible without an
              extra chip. */}
          <div className="mt-1 text-sm text-muted-foreground numeric-tabular tabular-nums">
            {subtext}
          </div>
          {isPartial && remainingCount > 0 && (
            <Link
              href={`/worklist/${decision.id}`}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-queue hover:underline"
            >
              Continue in Worklist
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        {/* Audit Log — items-start on the parent keeps the button
            aligned to the title row's top edge, matching Worklist's
            right-side button slot. */}
        <button
          type="button"
          onClick={() => setAuditOpen(true)}
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground/85",
            "transition-colors hover:bg-accent hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          )}
        >
          <History className="h-4 w-4" />
          Audit Log
        </button>
      </div>

      {/* ─── Table Card ────────────────────────────────────────────
          The table keeps its own bordered white surface; the flat
          header above is separated by an mt-4 (16px) gap — inside
          the spec's 16-20px range. Border + radius are the only
          chrome; column header + rows + footer toggle live inside. */}
      <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
        {/* Column header — flush with the top edge of the card, no
            extra spacing per spec. 3-cell grid that mirrors the row
            grid below (same template + gap) so headers line up
            pixel-perfect with the cell content. Default column uses
            72px (vs Worklist's 120px for confirm + ✕) because the
            single radio doesn't need that much room. */}
        <div className="grid grid-cols-[2fr_1fr_72px] items-center gap-4 border-b border-border px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="font-medium">Article</div>
          <div className="font-medium">Description</div>
          <div className="font-medium text-center">Default</div>
        </div>

        {/* Article rows — every confirmed Ingredient ships with a
            populated mapped set (3..10 articles via the seed
            generator + the buildAplLines helper) so this branch
            always renders rows. The previous "No Articles were
            selected" empty state was removed because every Mapped
            Items decision now has explicit mappedAplIds. */}
        <div role="rowgroup">
          {mappedApls.map((apl) => {
              const isDefault = currentDefaultSet.has(apl.id);
              const { fullName, description, hierarchy } = buildAplLines(apl);
              return (
                <div
                  key={apl.id}
                  role="row"
                  className={cn(
                    // Same row template + py-2.5 compact padding as
                    // the Worklist APL row.
                    "grid grid-cols-[2fr_1fr_72px] items-center gap-4 border-b border-border px-4 py-2.5 transition-colors duration-200 last:border-b-0",
                    // Selected row → subtle green wash. The radio +
                    // DEFAULT badge already signal selection, so the
                    // tint stays light (~40% green-soft).
                    isDefault && "bg-green-queue-soft/40",
                    !isDefault && "hover:bg-accent/30"
                  )}
                >
                  {/* ─── COL 1 (2fr): APL name + code + DEFAULT ────
                      Single-line cell mirroring Worklist COL 1.
                      Name + code share an eye-line; DEFAULT badge
                      sits inline at the end so default rows are
                      identifiable without leaving the APL column. */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-sm font-semibold leading-tight truncate"
                      title={fullName}
                    >
                      {fullName}
                    </span>
                    <span
                      className="shrink-0 text-[11px] text-muted-foreground numeric-tabular tabular-nums"
                      title={aplCode(apl)}
                    >
                      {aplCode(apl)}
                    </span>
                    {isDefault && (
                      <span
                        className="shrink-0 inline-flex items-center rounded-md bg-green-queue px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                        aria-label="Default Article for costing"
                      >
                        Default
                      </span>
                    )}
                  </div>

                  {/* ─── COL 2 (1fr): Description + Hierarchy ──────
                      Two-line cell, identical to the Worklist's COL
                      2: line 1 = description (variant · brand ·
                      pack), line 2 = hierarchy breadcrumb. Both
                      truncate independently with their own tooltips
                      so the row stays capped at two lines. */}
                  <div className="min-w-0 flex flex-col gap-px">
                    <div
                      className="text-xs leading-snug text-muted-foreground truncate"
                      title={description}
                    >
                      {description || (
                        <span className="italic text-muted-foreground/60">
                          —
                        </span>
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

                  {/* ─── COL 3 (72px): Default checkbox ────────────
                      Multi-select; toggling marks/unmarks this APL
                      as a costing default and fires a toast. Zero
                      defaults is allowed. */}
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={() => handleDefaultToggle(apl.id)}
                      aria-label={`Toggle ${apl.genericName} as default`}
                      className="h-[18px] w-[18px] accent-green-queue cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer toggle — "View other APLs" lives inside the table
            card as a faint footer band, so the toggle reads as part
            of the table's chrome rather than a free-floating link.
            Hidden when there are no others to reveal. */}
        {otherSuggestions.length > 0 && (
          <div className="flex items-center justify-end border-t border-border bg-card/40 px-4 py-2.5">
            <button
              type="button"
              onClick={() => setShowOthers((v) => !v)}
              aria-expanded={showOthers}
              aria-controls={`other-apls-${decision.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  showOthers && "rotate-180"
                )}
                aria-hidden="true"
              />
              {showOthers ? "Hide other Articles" : "View other Articles"}
              <span className="numeric-tabular tabular-nums text-muted-foreground/70">
                ({otherSuggestions.length})
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Other APLs (passed-over, read-only) ─────────
          Lives below the main card as a separate, visually
          de-emphasised block. Same row template as above so the
          two sections feel like one system, just dimmer. */}
      {otherSuggestions.length > 0 && showOthers && (
        <section
          id={`other-apls-${decision.id}`}
          className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <h3 className="text-[11px] uppercase tracking-[0.16em] font-semibold text-muted-foreground mb-2">
            Other Articles
            <span className="numeric-tabular text-foreground/60">
              {" "}
              · {otherSuggestions.length}
            </span>
          </h3>
          {/* Same 3-col grid as the Mapped table above so column
              widths line up if both panels are visible at once. The
              Default column slot stays empty (these APLs weren't
              selected) but the cell is reserved so the rows don't
              shift horizontally vs the Mapped table. */}
          <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
            <div role="rowgroup">
              {otherSuggestions.map((apl) => {
                const { fullName, description, hierarchy } = buildAplLines(apl);
                return (
                  <div
                    key={apl.id}
                    role="row"
                    className="grid grid-cols-[2fr_1fr_72px] items-center gap-4 border-b border-border/60 px-4 py-2.5 last:border-b-0 opacity-70"
                  >
                    {/* COL 1 — name + code (no DEFAULT badge here) */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-sm font-medium text-muted-foreground leading-tight truncate"
                        title={fullName}
                      >
                        {fullName}
                      </span>
                      <span
                        className="shrink-0 text-[11px] text-muted-foreground/80 numeric-tabular tabular-nums"
                        title={aplCode(apl)}
                      >
                        {aplCode(apl)}
                      </span>
                    </div>
                    {/* COL 2 — description + hierarchy */}
                    <div className="min-w-0 flex flex-col gap-px">
                      <div
                        className="text-xs leading-snug text-muted-foreground/80 truncate"
                        title={description}
                      >
                        {description || (
                          <span className="italic text-muted-foreground/60">
                            —
                          </span>
                        )}
                      </div>
                      {hierarchy && (
                        <div
                          className="text-[11.5px] leading-tight text-muted-foreground/55 truncate"
                          title={hierarchy}
                        >
                          {hierarchy}
                        </div>
                      )}
                    </div>
                    {/* COL 3 — empty placeholder; reserves the radio
                        slot so column widths match the Mapped table. */}
                    <div aria-hidden="true" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Toast */}
      {toast && (
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
          <p className="text-sm text-foreground leading-snug flex-1">{toast}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Audit Log drawer — right-side slide-in, scoped to this MOG */}
      <AuditLogDrawer
        open={auditOpen}
        onOpenChange={setAuditOpen}
        decisionId={decision.id}
        mogId={mog?.id}
        mogName={mog?.name}
      />
    </div>
  );
}
