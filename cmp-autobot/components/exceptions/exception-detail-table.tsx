"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  Check,
  Link2,
  Plus,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import type { ExceptionRecord, ExceptionType } from "@/lib/types";
import { useMockStore } from "@/lib/mock-store";
import { Input } from "@/components/ui/input";
import { aplCode, cn, mogCode } from "@/lib/utils";
import { ExceptionStatusPill } from "./exception-status-pill";

/* Owner type — drives the primary action + the contextual
 * banner copy. Derived from explicit pendingOwner first
 * (set by the store after escalation), then falls back to a
 * type-based default:
 *   mam-a       → procurement   (no Article in SAP — sourcing)
 *   mam-b       → culinary      (orphan Article — recipe fit)
 *   quarantine  → procurement   (data-quality / missing fields) */
type OwnerType = "procurement" | "culinary";
function ownerOf(exception: ExceptionRecord): OwnerType {
  if (exception.pendingOwner === "culinary") return "culinary";
  if (exception.pendingOwner === "procurement") return "procurement";
  if (exception.type === "mam-b") return "culinary";
  return "procurement";
}

/* ─────────────────────────────────────────────────────────────────────────
 * ExceptionDetailTable — structured table-format right panel for the
 * Exceptions screen. Replaces the form-heavy ExceptionDetail when an
 * exception is selected.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ Sticky header (status + meta)                               │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │ Issue description card                                      │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │ Subject row table — Article | Type | Suggested | Status |   │
 *   │   Actions (Link / Resolve / Reject)                         │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │ Suggested matches table (Type B only) — multiple candidate  │
 *   │   MOGs as rows, each with its own Link action               │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * For Type B (orphan article) exceptions we surface up to N MOG
 * candidates derived from genericIngredient overlap so the user can
 * link inline without opening another picker. Type A and quarantine
 * exceptions don't have ingredient suggestions, so the secondary
 * table is omitted for those.
 * ──────────────────────────────────────────────────────────────────── */

const TYPE_TONE: Record<
  ExceptionType,
  { label: string; bg: string; text: string; border: string }
> = {
  "mam-a": {
    label: "Missing Article",
    bg: "bg-amber-queue-soft",
    text: "text-amber-queue",
    border: "border-amber-queue/30",
  },
  "mam-b": {
    label: "Unmapped Article",
    bg: "bg-blue-queue-soft",
    text: "text-blue-queue",
    border: "border-blue-queue/30",
  },
  quarantine: {
    label: "Invalid · Missing Fields",
    bg: "bg-red-queue-soft",
    text: "text-red-queue",
    border: "border-red-queue/30",
  },
};

type ToastState = {
  id: number;
  message: string;
} | null;

export function ExceptionDetailTable({
  exception,
}: {
  exception: ExceptionRecord;
}) {
  const router = useRouter();
  const mogs = useMockStore((s) => s.mogs);
  const apls = useMockStore((s) => s.apls);
  const allExceptions = useMockStore((s) => s.exceptions);
  const resolve = useMockStore((s) => s.resolveException);
  const markExceptionLinked = useMockStore((s) => s.markExceptionLinked);
  const markExceptionEscalated = useMockStore(
    (s) => s.markExceptionEscalated
  );

  const mog = exception.mogId
    ? mogs.find((m) => m.id === exception.mogId)
    : null;
  const apl = exception.aplId
    ? apls.find((a) => a.id === exception.aplId)
    : null;

  const isOpen = exception.status === "open";
  const tone = TYPE_TONE[exception.type];
  const subjectName = mog?.name ?? apl?.genericName ?? "Exception";

  // Owner-driven flow: Procurement vs Culinary. Primary action,
  // helper text, and banner all switch on this.
  const owner = ownerOf(exception);
  const ownerCopy =
    owner === "culinary"
      ? {
          label: "Culinary issue",
          helper: "For recipe and preparation accuracy",
          icon: ChefHat,
          accentBg: "bg-violet-50",
          accentBorder: "border-violet-200",
          accentText: "text-violet-800",
          accentMuted: "text-violet-700/80",
        }
      : {
          label: "Procurement issue",
          helper: "For sourcing and inventory mapping",
          icon: ShoppingCart,
          accentBg: "bg-amber-50",
          accentBorder: "border-amber-200",
          accentText: "text-amber-900",
          accentMuted: "text-amber-800/80",
        };
  const OwnerIcon = ownerCopy.icon;

  // Same-type open exceptions — used for advance-to-next routing
  // on action so the user can keep working through the queue
  // without bouncing back to the empty state.
  const sameTypeOpen = useMemo(
    () =>
      allExceptions.filter(
        (e) => e.type === exception.type && e.status === "open"
      ),
    [allExceptions, exception.type]
  );
  const positionInList = useMemo(() => {
    const idx = sameTypeOpen.findIndex((e) => e.id === exception.id);
    return idx >= 0 ? idx + 1 : sameTypeOpen.length + 1;
  }, [sameTypeOpen, exception.id]);

  // Suggested matches — only meaningful for Type B (orphan articles).
  // Heuristic: MOGs whose genericIngredient or name shares a token
  // with the article's generic name. Capped at 5 candidates so the
  // table stays scannable.
  const [search, setSearch] = useState("");
  const suggestedMogs = useMemo(() => {
    if (exception.type !== "mam-b" || !apl) return [];
    const aplTokens = apl.genericName
      .toLowerCase()
      .split(/[\s,/-]+/)
      .filter(Boolean);
    const q = search.trim().toLowerCase();
    return mogs
      .filter((m) => {
        if (q) {
          return (
            m.name.toLowerCase().includes(q) ||
            m.genericIngredient.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q)
          );
        }
        return aplTokens.some(
          (t) =>
            m.genericIngredient.toLowerCase().includes(t) ||
            m.name.toLowerCase().includes(t)
        );
      })
      .slice(0, 5);
  }, [exception.type, apl, mogs, search]);

  const [toast, setToast] = useState<ToastState>(null);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    setToast(null);
  }, [exception.id]);

  const advanceToNext = (msg: string) => {
    const next = sameTypeOpen.find((e) => e.id !== exception.id);
    setToast({ id: Date.now(), message: msg });
    window.setTimeout(() => {
      router.push(
        next
          ? `/exceptions/${next.id}?tab=${exception.type}`
          : `/exceptions?tab=${exception.type}`
      );
    }, 250);
  };

  const handleLink = () => {
    markExceptionLinked(exception.id);
    advanceToNext("Linked to existing ingredient.");
  };
  const handleCreateNew = () => {
    // Wired to the existing escalation handler — for the
    // prototype both "Create new MOG" requests flow through the
    // same Procurement / Culinary handoff endpoint. Toast copy
    // differentiates the user's intent.
    markExceptionEscalated(exception.id);
    advanceToNext(
      owner === "culinary"
        ? "New ingredient request sent to Culinary."
        : "New ingredient request sent to Procurement."
    );
  };
  const handleResolve = () => {
    resolve(exception.id);
    advanceToNext("Marked as resolved.");
  };
  const handleReject = () => {
    markExceptionEscalated(exception.id);
    advanceToNext("Sent to Procurement.");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sticky header — type chip + status pill + position-in-list */}
      <div className="sticky top-0 z-20 shrink-0 border-b border-border bg-background/95 backdrop-blur px-6 py-4">
        <div className="flex items-center gap-2 flex-wrap text-[12px]">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 font-semibold",
              tone.bg,
              tone.text,
              tone.border
            )}
          >
            {tone.label}
          </span>
          <ExceptionStatusPill status={exception.status} size="sm" />
          <span className="text-muted-foreground numeric-tabular tabular-nums">
            {positionInList} of {sameTypeOpen.length || 1}
          </span>
        </div>
        <h2 className="font-display text-lg tracking-tight mt-1.5 truncate">
          {subjectName}
        </h2>
      </div>

      {/* Body — owner banner + issue description + structured table(s) */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Owner banner — sets context before the user picks an
            action. Procurement issues lean toward "Link to
            existing" (sourcing accuracy); Culinary issues lean
            toward "Create new" (recipe variation matters). The
            banner stays visible at the top of the body so the
            user can see the framing while reading the issue + the
            subject row below. */}
        <div
          className={cn(
            "flex items-start gap-3 rounded-md border px-3.5 py-2.5",
            ownerCopy.accentBg,
            ownerCopy.accentBorder
          )}
        >
          <span
            className={cn(
              "shrink-0 flex h-7 w-7 items-center justify-center rounded-md",
              ownerCopy.accentBg,
              "ring-1",
              ownerCopy.accentBorder
            )}
          >
            <OwnerIcon
              className={cn("h-4 w-4", ownerCopy.accentText)}
              strokeWidth={2}
            />
          </span>
          <div className="min-w-0">
            <div
              className={cn("text-[12.5px] font-semibold", ownerCopy.accentText)}
            >
              {ownerCopy.label}
            </div>
            <div className={cn("text-[11.5px]", ownerCopy.accentMuted)}>
              {ownerCopy.helper}
            </div>
          </div>
        </div>

        {/* Issue description card */}
        <div className="rounded-md border border-border bg-card/30 p-4">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
            Issue
          </div>
          <p className="text-[13px] leading-relaxed text-foreground/90">
            {exception.details}
          </p>
        </div>

        {/* ─── Subject row table ──────────────────────────────── */}
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            Subject
          </div>
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FA] border-b border-black/[0.06]">
                <tr className="text-left text-[10.5px] uppercase tracking-wider text-foreground/70">
                  <th className="px-3 py-2 font-semibold border-r border-r-black/[0.06]">
                    Article
                  </th>
                  <th className="px-3 py-2 font-semibold border-r border-r-black/[0.06] w-[140px]">
                    Issue Type
                  </th>
                  <th className="px-3 py-2 font-semibold border-r border-r-black/[0.06]">
                    Suggested Ingredient
                  </th>
                  <th className="px-3 py-2 font-semibold w-[120px] border-r border-r-black/[0.06]">
                    Status
                  </th>
                  {/* Actions column needs room for 4 buttons —
                      Link existing / Create new / Resolve / Reject —
                      so 380px keeps every label on a single line
                      without ellipsis or stacking. */}
                  <th className="px-3 py-2 font-semibold w-[380px] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-background">
                  <td className="px-3 py-3 align-middle border-r border-r-black/[0.06]">
                    <div className="text-[13px] font-medium tracking-tight">
                      {apl ? apl.genericName : mog?.name ?? "—"}
                    </div>
                    {apl && (
                      <div className="text-[11px] text-muted-foreground numeric-tabular tabular-nums mt-0.5">
                        {aplCode(apl)}
                        {apl.brand && apl.brand !== "UB" && (
                          <span className="ml-1.5 not-italic text-foreground/70">
                            · {apl.brand}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 align-middle border-r border-r-black/[0.06]">
                    <span
                      className={cn(
                        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
                        tone.bg,
                        tone.text
                      )}
                    >
                      {tone.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-middle border-r border-r-black/[0.06]">
                    {mog ? (
                      <div>
                        <div className="text-[12.5px] font-medium">
                          {mog.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground numeric-tabular tabular-nums mt-0.5">
                          {mogCode(mog)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">
                        — pick from suggestions below
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-middle border-r border-r-black/[0.06]">
                    <ExceptionStatusPill
                      status={exception.status}
                      size="sm"
                    />
                  </td>
                  <td className="px-3 py-3 align-middle text-right">
                    <ActionCluster
                      disabled={!isOpen}
                      owner={owner}
                      onLink={handleLink}
                      onCreateNew={handleCreateNew}
                      onResolve={handleResolve}
                      onReject={handleReject}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Suggested matches table (Type B only) ──────────── */}
        {exception.type === "mam-b" && apl && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Suggested Ingredients ({suggestedMogs.length})
              </div>
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ingredients…"
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-[#F8F9FA] border-b border-black/[0.06]">
                  <tr className="text-left text-[10.5px] uppercase tracking-wider text-foreground/70">
                    <th className="px-3 py-2 font-semibold border-r border-r-black/[0.06]">
                      Ingredient
                    </th>
                    <th className="px-3 py-2 font-semibold border-r border-r-black/[0.06]">
                      Generic
                    </th>
                    <th className="px-3 py-2 font-semibold border-r border-r-black/[0.06] w-[100px]">
                      Type
                    </th>
                    <th className="px-3 py-2 font-semibold w-[120px] text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {suggestedMogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-[12px] text-muted-foreground"
                      >
                        {search
                          ? `No ingredients match "${search}".`
                          : "No automatic suggestions — try searching."}
                      </td>
                    </tr>
                  ) : (
                    suggestedMogs.map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-border/40 hover:bg-accent/30 transition-colors last:border-b-0"
                      >
                        <td className="px-3 py-2.5 align-middle border-r border-r-black/[0.06]">
                          <div className="text-[13px] font-medium">
                            {m.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground numeric-tabular tabular-nums mt-0.5">
                            {mogCode(m)}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-middle border-r border-r-black/[0.06]">
                          <span className="text-[12px] text-foreground/80">
                            {m.genericIngredient}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 align-middle border-r border-r-black/[0.06]">
                          <span className="text-[11px] text-muted-foreground capitalize">
                            {m.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 align-middle text-right">
                          <button
                            type="button"
                            disabled={!isOpen}
                            onClick={handleLink}
                            className="inline-flex h-7 items-center gap-1 rounded-md border bg-[#E6F6EC] text-[#1F7A4D] border-[#B7E4C7] hover:bg-[#D4ECDB] px-2.5 text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Link2 className="h-3 w-3" strokeWidth={2.5} />
                            Link
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Toast — fixed bottom-right confirmation */}
      {toast && (
        <div
          key={toast.id}
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
    </div>
  );
}

/* Action cluster — surfaces the spec's 4-way decision matrix on
 * every open exception:
 *   Link to existing  → primary for Procurement (sourcing fit)
 *   Create new        → primary for Culinary (recipe variation)
 *   Resolve           → neutral terminal
 *   Reject            → escalate / discard
 *
 * The primary action is decided by `owner`: it gets the solid
 * green pill (high contrast) while the other becomes a paler
 * outline button. The user can still pick the secondary path —
 * the smart default just biases the visual emphasis. */
function ActionCluster({
  disabled,
  owner,
  onLink,
  onCreateNew,
  onResolve,
  onReject,
}: {
  disabled: boolean;
  owner: OwnerType;
  onLink: () => void;
  onCreateNew: () => void;
  onResolve: () => void;
  onReject: () => void;
}) {
  const linkPrimary = owner === "procurement";
  const linkBtn = (
    <button
      type="button"
      disabled={disabled}
      onClick={onLink}
      title="Link to existing ingredient"
      className={cn(
        "inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        linkPrimary
          ? "bg-[#E6F6EC] text-[#1F7A4D] border-[#B7E4C7] hover:bg-[#D4ECDB]"
          : "border-border bg-background text-foreground/80 hover:bg-accent"
      )}
    >
      <Link2 className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      Link existing
    </button>
  );
  const createBtn = (
    <button
      type="button"
      disabled={disabled}
      onClick={onCreateNew}
      title="Create new ingredient"
      className={cn(
        "inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        !linkPrimary
          ? "bg-violet-50 text-violet-800 border-violet-200 hover:bg-violet-100"
          : "border-border bg-background text-foreground/80 hover:bg-accent"
      )}
    >
      <Plus className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      Create new
    </button>
  );

  return (
    // flex-nowrap + whitespace-nowrap on each button keep the
    // four-action cluster on a single line. justify-end pins
    // them to the right edge of the (right-aligned) cell.
    <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
      {/* Render the owner's primary first so it sits leftmost
          (most natural reading position) regardless of label. */}
      {linkPrimary ? linkBtn : createBtn}
      {linkPrimary ? createBtn : linkBtn}
      <button
        type="button"
        disabled={disabled}
        onClick={onResolve}
        title="Mark resolved"
        className="inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-md border border-border bg-background text-foreground/80 hover:bg-accent px-2.5 text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} />
        Resolve
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onReject}
        aria-label="Reject"
        title="Reject"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-[#FDECEC] text-[#B42318] border-[#F5C2C0] hover:bg-[#F8DCDC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
