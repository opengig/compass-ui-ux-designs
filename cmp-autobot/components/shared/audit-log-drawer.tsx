"use client";

import { useEffect, useMemo } from "react";
import { History, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMockStore } from "@/lib/mock-store";
import { cn } from "@/lib/utils";
import type { AuditEntry } from "@/lib/types";

interface AuditLogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionId: string;
  mogId?: string;
  mogName?: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * AuditLogDrawer — right-side slide-in panel showing the audit history for
 * a single MOG (or single decision). Background stays visible behind a
 * translucent overlay; ESC + outside click + the X button all close it.
 *
 * Built on Radix Dialog primitives (already installed) so we get focus
 * trap, ESC handling, body-scroll lock and a11y attributes for free.
 * ──────────────────────────────────────────────────────────────────────── */

export function AuditLogDrawer({
  open,
  onOpenChange,
  decisionId,
  mogId,
  mogName,
}: AuditLogDrawerProps) {
  const audit = useMockStore((s) => s.audit);
  const decisions = useMockStore((s) => s.decisions);

  // Scope: this decision + any other decision for the same MOG (so the user
  // sees the full lifecycle across sites).
  const entries: AuditEntry[] = useMemo(() => {
    const decisionIds = new Set(
      mogId
        ? decisions.filter((d) => d.mogId === mogId).map((d) => d.id)
        : [decisionId]
    );
    return audit.filter(
      (a) =>
        a.entityId === decisionId ||
        (a.entityType === "decision" && decisionIds.has(a.entityId))
    );
  }, [audit, decisions, decisionId, mogId]);

  // Sort newest-first; the timeline list still reads top-down chronologically
  // because each entry already carries a precise timestamp.
  const ordered = useMemo(
    () =>
      [...entries].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [entries]
  );

  // Close on ESC is built into Radix Dialog. We rely on it.
  useEffect(() => {
    // Re-focus is also handled by Radix.
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Translucent overlay — background stays visible per spec. Outside
            click on the overlay closes the drawer (Radix default). */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "duration-200"
          )}
        />
        {/* Right-side drawer */}
        <DialogPrimitive.Content
          className={cn(
            "fixed right-0 top-0 z-50 h-full w-full sm:w-[420px] flex flex-col",
            "border-l border-border bg-card shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
            "duration-200"
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Audit log{mogName ? ` for ${mogName}` : ""}
          </DialogPrimitive.Title>

          {/* Header */}
          <div className="shrink-0 flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                Audit log
              </div>
              {mogName && (
                <div className="mt-0.5 text-base font-semibold tracking-tight truncate">
                  {mogName}
                </div>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Body — scrollable timeline */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-5 py-5">
            {ordered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No audit entries yet for this Ingredient.
              </p>
            ) : (
              <ol className="relative border-l border-border pl-4 flex flex-col gap-4">
                {ordered.map((a) => (
                  <li key={a.id} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                        dotColor(a.action)
                      )}
                    />
                    <div className="text-sm leading-snug">
                      <span className="font-medium text-foreground">
                        {humanAction(a.action, a.actor)}
                      </span>
                    </div>
                    {a.explanation && (
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {a.explanation}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{prettyDate(a.timestamp)}</span>
                      {a.before && a.after && (
                        <>
                          <span className="opacity-50">·</span>
                          <span className="numeric-tabular">
                            {a.before} → {a.after}
                          </span>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* Human-readable action labels — hides the action.enum noise. */
function humanAction(action: string, actor: string) {
  const who = actor === "autobot" ? "Autobot" : actor;
  switch (action) {
    case "queue.assigned":
      return `Created and queued by ${who}`;
    case "decision.confirmed":
      return `${who} confirmed the mapping`;
    case "decision.corrected":
      return `${who} corrected the mapping`;
    case "decision.investigated":
      return `${who} marked investigated`;
    case "decision.planned":
      return `${who} planned the transition`;
    case "decision.escalated":
      return `${who} escalated to Procurement`;
    case "decision.cookbook-entered":
      return `${who} entered the mapping in CookBook`;
    case "decision.apl-rejected":
      return `${who} rejected an Article`;
    case "decision.apl-added":
      return `${who} added an Article`;
    case "exception.raised":
      return `Exception raised`;
    case "exception.linked-to-mog":
      return `${who} linked the Article to this Ingredient`;
    case "exception.new-mog-requested":
      return `${who} requested a new Ingredient`;
    case "exception.retire-requested":
      return `${who} requested to retire the Article`;
    case "scope.incremental.detected":
      return `New incremental items detected`;
    case "ods.refresh.completed":
      return `ODS refresh completed`;
    default:
      return action;
  }
}

function dotColor(action: string) {
  if (action.startsWith("decision.confirmed") || action === "decision.cookbook-entered") {
    return "bg-green-queue";
  }
  if (action === "decision.escalated" || action.includes("rejected")) {
    return "bg-red-queue";
  }
  if (action === "queue.assigned" || action.includes("apl-added")) {
    return "bg-blue-queue";
  }
  return "bg-foreground/60";
}

function prettyDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} · ${d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  })} IST`;
}
