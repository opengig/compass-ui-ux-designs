"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  PackageX,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import type { ExceptionRecord } from "@/lib/types";
import { useMockStore } from "@/lib/mock-store";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aplCode, cn, formatCurrencyINR } from "@/lib/utils";
import { ExceptionStatusPill } from "./exception-status-pill";
import { OrphanResolutionPanel } from "./orphan-resolution-panel";

type ToastState = {
  id: number;
  message: string;
  action?: { label: string; href: string };
} | null;

export function ExceptionDetail({ exception }: { exception: ExceptionRecord }) {
  const router = useRouter();
  const mogs = useMockStore((s) => s.mogs);
  const apls = useMockStore((s) => s.apls);
  const allExceptions = useMockStore((s) => s.exceptions);
  const resolve = useMockStore((s) => s.resolveException);
  const markExceptionLinked = useMockStore((s) => s.markExceptionLinked);
  const markExceptionEscalated = useMockStore((s) => s.markExceptionEscalated);
  const notifyExceptionSAP = useMockStore((s) => s.notifyExceptionSAP);
  const remindExceptionSAP = useMockStore((s) => s.remindExceptionSAP);

  const mog = exception.mogId ? mogs.find((m) => m.id === exception.mogId) : null;
  const apl = exception.aplId ? apls.find((a) => a.id === exception.aplId) : null;

  const isTypeB = exception.type === "mam-b";
  const isOpen = exception.status === "open";

  // Open exceptions in the same type — used for progress + auto-advance.
  const sameTypeOpen = useMemo(
    () => allExceptions.filter((e) => e.type === exception.type && e.status === "open"),
    [allExceptions, exception.type]
  );
  const positionInList = useMemo(() => {
    const idx = sameTypeOpen.findIndex((e) => e.id === exception.id);
    return idx >= 0 ? idx + 1 : sameTypeOpen.length + 1;
  }, [sameTypeOpen, exception.id]);

  // Local UI state
  const [toast, setToast] = useState<ToastState>(null);
  const [confirmResolveOpen, setConfirmResolveOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setToast(null);
    setConfirmResolveOpen(false);
    setEscalateOpen(false);
  }, [exception.id]);

  // After any state-changing action, advance to the next OPEN exception of
  // the same type. If none remain, route to the type's empty state.
  const advanceToNext = (toastMessage: string) => {
    const next = sameTypeOpen.find((e) => e.id !== exception.id);
    setToast({ id: Date.now(), message: toastMessage });
    window.setTimeout(() => {
      router.push(
        next
          ? `/exceptions/${next.id}?tab=${exception.type}`
          : `/exceptions?tab=${exception.type}`
      );
    }, 250);
  };

  // Distinct outcomes — each writes a different status + audit entry.
  const handleLinkApl = () => {
    markExceptionLinked(exception.id);
    advanceToNext("Article linked successfully. Moved to Green Queue");
  };
  const handleEscalateSubmit = () => {
    markExceptionEscalated(exception.id);
    setEscalateOpen(false);
    advanceToNext("Request raised to Procurement");
  };
  // mam-a (no Article in SAP) — primary action is to ask Procurement
  // to create the missing Article. Same backing store action as the
  // Escalate path (both hand off to Procurement) but the toast copy
  // differentiates the user intent.
  const handleRequestNewArticle = () => {
    markExceptionEscalated(exception.id);
    advanceToNext("New Article request sent to Procurement");
  };
  const handleMarkResolved = () => {
    resolve(exception.id);
    setConfirmResolveOpen(false);
    advanceToNext("Exception marked as resolved");
  };

  return (
    <>
      {/* ─── 1. STICKY HEADER ─── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-8 py-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {labelType(exception.type)}
              </span>
              <ExceptionStatusPill status={exception.status} size="sm" />
            </div>
            <h2 className="font-display text-xl tracking-tight mt-1">
              {mog?.name ?? apl?.genericName ?? "Exception"}
            </h2>
            {/* Meta line — site/city dropped per cleanup pass; only
                the raised-date and the position-in-list remain. No
                orphan separator. */}
            <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span>
                {new Date(exception.raisedOn).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="opacity-50">·</span>
              <span className="numeric-tabular font-medium text-foreground/80">
                {positionInList} of {sameTypeOpen.length || 1} exception
                {(sameTypeOpen.length || 1) === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          {!isTypeB && (
            <Button
              variant="outline"
              onClick={() => setConfirmResolveOpen(true)}
              disabled={!isOpen}
              className="shrink-0"
            >
              {isOpen ? "Mark resolved" : "Resolved"}
            </Button>
          )}
        </div>
      </div>

      {/* ─── 2-5. BODY ─── */}
      {/* Full-width panel — content stretches to fill the detail
          column. Per spec: the panel is not centered/constrained;
          long-form prose can carry its own readability cap inline
          (max-w-prose) where it appears. Padding follows the
          spec's 24px / 32px (py-6 px-8). */}
      <div className="px-8 py-6 space-y-4">
        {/* 2. Compact problem summary (alert strip, not a big card) */}
        <CompactProblemAlert exception={exception} />

        {/* 3. ACTION PANEL — mam-a is "no Article in SAP", which is
            an upstream-data problem, not a search-and-link problem.
            The previous PrimaryLinkAplPanel shipped a search box +
            results list which was misleading: there's nothing to
            search for because the Article doesn't exist yet. Show a
            clear message + the two valid handoffs (Request new
            Article, Escalate) instead. mam-b and quarantine flows
            are unchanged. */}
        {exception.type === "mam-a" && (
          <MissingArticleActionPanel
            disabled={!isOpen}
            onRequestNew={handleRequestNewArticle}
            onEscalate={() => setEscalateOpen(true)}
          />
        )}
        {exception.type === "mam-b" && <OrphanResolutionPanel exception={exception} />}
        {exception.type === "quarantine" && (
          <QuarantineActions
            exception={exception}
            missingFields={apl?.dataQuality?.missingFields ?? []}
            // Notify writes notifiedAt on the exception so the panel
            // can flip in-place to a "Notified Xh ago" state — we
            // STAY on this exception (instead of auto-advancing)
            // so the user sees the new state. Toast still fires.
            onNotify={() => {
              notifyExceptionSAP(exception.id);
              setToast({
                id: Date.now(),
                message: "SAP team notified",
              });
            }}
            onRemind={() => {
              remindExceptionSAP(exception.id);
              setToast({
                id: Date.now(),
                message: "Reminder sent to SAP team",
              });
            }}
          />
        )}

        {/* 5. Collapsible details — long-form prose carries its own
            readability cap (max-w-prose ≈ 65ch) so wide viewports
            don't produce uncomfortably long lines, while the rest of
            the panel (forms, action cards, tables) stretches. */}
        <Collapsible title="Details" defaultOpen={false}>
          <p className="text-sm leading-relaxed text-foreground/85 max-w-prose">
            {exception.details}
          </p>
        </Collapsible>

        {mog && (
          <Collapsible title="Ingredient record" defaultOpen={false}>
            <div className="text-sm font-medium">{mog.name}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {mog.type === "elementary" ? "Elementary Ingredient" : "Composite Ingredient"} ·{" "}
              {mog.genericIngredient}
            </div>
          </Collapsible>
        )}

        {apl && (
          <Collapsible title="Article record" defaultOpen={false}>
            <div className="text-sm font-medium">
              {apl.brand !== "UB" ? `${apl.brand} ` : ""}
              {apl.genericName}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground numeric-tabular">
              {aplCode(apl)} · {apl.characteristic} · {apl.packSize} ·{" "}
              {formatCurrencyINR(apl.costPerUnit)}
            </div>
          </Collapsible>
        )}
      </div>

      {/* Confirmation modal — Mark Resolved */}
      <Dialog open={confirmResolveOpen} onOpenChange={setConfirmResolveOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Mark this exception as resolved?</DialogTitle>
            <DialogDescription>
              Use this only if the issue is handled outside the link / escalate
              flows. Most cases should be Linked or Escalated instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleMarkResolved}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate modal */}
      <EscalateDialog
        open={escalateOpen}
        onOpenChange={setEscalateOpen}
        onSubmit={handleEscalateSubmit}
      />

      {/* Toast */}
      <ExceptionToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Compact problem summary — alert strip (replaces the big blue card)
 * ──────────────────────────────────────────────────────────────────────── */

function CompactProblemAlert({ exception }: { exception: ExceptionRecord }) {
  const config = (() => {
    switch (exception.type) {
      case "mam-a":
        return {
          icon: AlertTriangle,
          message:
            "No Article exists for this Ingredient in SAP. Request a new one or escalate.",
          accent: "text-amber-queue",
          border: "border-amber-queue/30",
          bg: "bg-amber-queue-soft/30",
        };
      case "mam-b":
        return {
          icon: PackageX,
          message: "This Article is not mapped to any Ingredient.",
          accent: "text-amber-queue",
          border: "border-amber-queue/30",
          bg: "bg-amber-queue-soft/30",
        };
      case "quarantine":
      default:
        // Resolved quarantine flips to a green tone — the SAP record is now
        // valid, so the "mapping disabled" copy would be misleading.
        if (exception.status === "resolved") {
          return {
            icon: ShieldCheck,
            message:
              "Missing fields were filled in at source. This Article is now valid and can be mapped.",
            accent: "text-green-queue",
            border: "border-green-queue/30",
            bg: "bg-green-queue-soft/30",
          };
        }
        return {
          icon: ShieldAlert,
          message:
            "Some required fields are missing. Mapping is disabled until this is fixed in SAP.",
          accent: "text-red-queue",
          border: "border-red-queue/30",
          bg: "bg-red-queue-soft/30",
        };
    }
  })();
  const Icon = config.icon;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm",
        config.border,
        config.bg
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", config.accent)} />
      <span className="text-foreground/90">{config.message}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * mam-a action — "No Article in SAP" panel
 * Replaces the old PrimaryLinkAplPanel + SecondaryEscalatePanel pair.
 * mam-a means there is no Article record at all for this Ingredient,
 * so a search-and-link UI was misleading (nothing to search for).
 * The panel surfaces the two valid handoffs: ask Procurement to
 * create a new Article, or escalate the broader gap.
 * ──────────────────────────────────────────────────────────────────────── */

function MissingArticleActionPanel({
  disabled,
  onRequestNew,
  onEscalate,
}: {
  disabled: boolean;
  onRequestNew: () => void;
  onEscalate: () => void;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border-2 border-primary/20 bg-card p-5",
        "ring-1 ring-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-queue-soft text-amber-queue">
          <PackageX className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">
            No Article exists for this Ingredient in SAP
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This Ingredient is in active recipe use but no Article record exists in SAP yet. Coordinate with Procurement to create one, or escalate if it is blocking a kitchen.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          disabled={disabled}
          onClick={onEscalate}
          className="text-red-queue border-red-queue/40 hover:bg-red-queue/10"
        >
          <Send className="h-4 w-4" />
          Escalate
        </Button>
        <Button disabled={disabled} onClick={onRequestNew}>
          <Plus className="h-4 w-4" />
          Request new Article
        </Button>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * QuarantineActions — Quarantine-specific right panel.
 * Distinct from MAM-B: no Link/Create MOG affordances, since the APL can't
 * be mapped at all until SAP fixes the underlying data. Surfaces the
 * missing fields explicitly so the user knows what SAP needs to correct.
 *
 * State-aware:
 *   • open      → red card, "Waiting for SAP data correction" + Notify CTA
 *   • resolved  → green card, "SAP corrected this record" + audit line.
 *                 Lists previously-missing fields so the user can see what
 *                 was fixed at source.
 * ──────────────────────────────────────────────────────────────────────── */

function QuarantineActions({
  exception,
  missingFields,
  onNotify,
  onRemind,
}: {
  exception: ExceptionRecord;
  missingFields: string[];
  onNotify: () => void;
  onRemind: () => void;
}) {
  const isResolved = exception.status === "resolved";
  const isNotified = Boolean(exception.notifiedAt);

  if (isResolved) {
    return (
      <section
        className={cn(
          "rounded-xl border-2 border-green-queue/20 bg-card p-5",
          "ring-1 ring-green-queue/5"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-queue text-white">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold">
              SAP data corrected
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              The SAP master-data team backfilled the missing fields at source.
              This Article is now valid and is back in the regular mapping flow —
              no further action needed here.
            </p>
          </div>
        </div>

        {/* Show what was fixed — strike-through to convey "previously missing" */}
        {missingFields.length > 0 && (
          <div className="mt-4 rounded-md border border-border bg-background px-4 py-3">
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              Fields corrected by SAP
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {missingFields.map((f) => (
                <li
                  key={f}
                  className="inline-flex items-center gap-1 rounded-md bg-green-queue-soft px-1.5 py-0.5 text-[11px] font-medium text-green-queue"
                >
                  <Check className="h-3 w-3" strokeWidth={2.75} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Audit line — who corrected and when */}
        {(exception.resolvedBy || exception.resolvedAt) && (
          <p className="mt-4 text-xs text-muted-foreground">
            Resolved by{" "}
            <span className="text-foreground font-medium">
              {exception.resolvedBy ?? "SAP Master Data"}
            </span>
            {exception.resolvedAt && (
              <>
                {" "}·{" "}
                <span className="numeric-tabular">
                  {prettyDateTime(exception.resolvedAt)}
                </span>
              </>
            )}
          </p>
        )}
      </section>
    );
  }

  // Open state — original card
  return (
    <section
      className={cn(
        "rounded-xl border-2 border-red-queue/20 bg-card p-5",
        "ring-1 ring-red-queue/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-queue text-white">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold">
              Invalid Article data (Missing fields)
            </h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            This Article arrived from SAP with missing or invalid fields, so it
            can&rsquo;t be mapped to an Ingredient yet. The SAP master-data team needs
            to correct the record at source.
          </p>
        </div>
      </div>

      {/* Missing fields list (only when present) */}
      {missingFields.length > 0 && (
        <div className="mt-4 rounded-md border border-border bg-background px-4 py-3">
          <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            Missing fields
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {missingFields.map((f) => (
              <li
                key={f}
                className="inline-flex items-center rounded-md bg-red-queue-soft px-1.5 py-0.5 text-[11px] font-medium text-red-queue"
              >
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Status / action footer — flips between two compositions:
          • Untouched: "Waiting for SAP correction" cue + Notify CTA.
          • Notified:   "Notified Xh ago" cue + "Remind SAP" CTA +
                        optional reminder timestamp underneath.
          The status pill itself swaps from amber (passive wait) to
          blue (we've actively poked SAP) so the visual state
          mirrors the user's last action. */}
      {/* Status pill — flips between "Waiting for SAP correction"
          (untouched) and "Notified Xh ago" (after the user clicked
          Notify). When the user has also sent a reminder, an
          "· reminded …" tail is appended to the same pill so both
          timestamps live in one chip rather than competing for
          attention. */}
      <div className="mt-4">
        {isNotified ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-queue-soft px-2 py-1 text-[11px] font-medium text-blue-queue">
            <Send className="h-3 w-3" />
            Notified {prettyRelative(exception.notifiedAt!)}
            {exception.notifiedRemindedAt && (
              <span className="opacity-70">
                {" "}· reminded {prettyRelative(exception.notifiedRemindedAt)}
              </span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-queue-soft px-2 py-1 text-[11px] font-medium text-amber-queue">
            <Wrench className="h-3 w-3" />
            Waiting for SAP correction
          </span>
        )}
      </div>

      {/* Action area — Notify (untouched) or Remind (already
          notified). Notify button is disabled after click via
          isNotified so repeated clicks can't double-notify. */}
      <div className="mt-4">
        {isNotified ? (
          <Button
            variant="outline"
            onClick={onRemind}
            className="text-blue-queue border-blue-queue/40 hover:bg-blue-queue/10"
          >
            <Send className="h-4 w-4" />
            Remind SAP
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={onNotify}
            className="text-red-queue border-red-queue/40 hover:bg-red-queue/10"
          >
            <Send className="h-4 w-4" />
            Notify SAP team
          </Button>
        )}
      </div>
    </section>
  );
}

/** Compact relative-time formatter used by the Notify state pill.
 *  "Just now" for <1m, then minutes/hours/days. Avoids pulling in
 *  date-fns since this is the only place in the file that needs it. */
function prettyRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  if (diffMs < 60_000) return "just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function prettyDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) +
    " IST"
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Collapsible — minimal native <details> wrapper styled to fit the card UI
 * ──────────────────────────────────────────────────────────────────────── */

function Collapsible({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-border bg-card open:bg-card"
    >
      <summary
        className={cn(
          "flex items-center justify-between gap-2 px-4 py-3 cursor-pointer select-none list-none",
          "text-sm font-medium",
          "[&::-webkit-details-marker]:hidden",
          "hover:bg-accent/40 rounded-lg group-open:rounded-b-none"
        )}
      >
        <span>{title}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 pt-1 border-t border-border">{children}</div>
    </details>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * EscalateDialog — reason + optional notes
 * ──────────────────────────────────────────────────────────────────────── */

function EscalateDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSubmit: () => void;
}) {
  const [reason, setReason] = useState<string>("missing-apl");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("missing-apl");
      setNotes("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Escalate to Procurement</DialogTitle>
          <DialogDescription>
            Procurement will be notified to create the missing Article in SAP.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="missing-apl">Missing Article in SAP</SelectItem>
                <SelectItem value="incorrect-mapping">Incorrect mapping in SAP</SelectItem>
                <SelectItem value="vendor-not-onboarded">Vendor not onboarded</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add any context for Procurement…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={onSubmit}>Submit request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * ExceptionToast — bottom-right transient feedback
 * ──────────────────────────────────────────────────────────────────────── */

function ExceptionToast({
  toast,
  onDismiss,
}: {
  toast: ToastState;
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

function labelType(t: ExceptionRecord["type"]) {
  // User-friendly short labels used as the type sub-label above the
  // exception title. Internal MAM/Type-A/Type-B nomenclature is not
  // surfaced here — those are backend categorisations, not user
  // language. mam-a stays as "No match found" to match how the Red
  // queue describes the same problem on the Worklist side.
  // mam-a = "Ingredient without Article in SAP" (an upstream-data gap).
  // mam-b = "Article exists but no Ingredient links to it".
  // quarantine = "Article record has invalid or missing fields".
  // Labels match the panel/alert copy below so left list, eyebrow,
  // and the action panel all use the same words.
  if (t === "mam-a") return "No Article in SAP";
  if (t === "mam-b") return "Unused Article";
  return "Invalid Data";
}
