"use client";

import { useMemo } from "react";
import { History } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuditEntry, MOG } from "@/lib/types";

interface AuditLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionId: string;
  mog: MOG;
}

export function AuditLogDialog({ open, onOpenChange, decisionId, mog }: AuditLogDialogProps) {
  const audit = useMockStore((s) => s.audit);
  const decisions = useMockStore((s) => s.decisions);

  // Audit entries scoped to this decision OR any decision for the same MOG.
  const entries: AuditEntry[] = useMemo(() => {
    const decisionIdsForMog = new Set(
      decisions.filter((d) => d.mogId === mog.id).map((d) => d.id)
    );
    return audit.filter(
      (a) =>
        a.entityId === decisionId ||
        (a.entityType === "decision" && decisionIdsForMog.has(a.entityId))
    );
  }, [audit, decisions, decisionId, mog.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Audit log — {mog.name}
          </DialogTitle>
          <DialogDescription>
            Every action recorded for this Ingredient across sites, with actor + timestamp.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[420px] -mx-1 px-1">
          {entries.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No audit entries yet for this Ingredient.
            </p>
          ) : (
            <ol className="space-y-3 border-l border-border pl-4">
              {entries.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-foreground" />
                  <div className="text-sm">
                    <span className="font-medium">{a.actor}</span>
                    <span className="text-muted-foreground"> · {prettyDate(a.timestamp)}</span>
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                    <span className="text-foreground/80">{prettyAction(a.action)}</span>
                    {a.before && a.after && (
                      <span className="ml-1 text-muted-foreground/80">
                        · {a.before} → {a.after}
                      </span>
                    )}
                  </div>
                  {a.explanation && (
                    <div className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
                      {a.explanation}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function prettyDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })} · ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })} IST`;
}

function prettyAction(action: string) {
  switch (action) {
    case "decision.confirmed":
      return "Decision confirmed";
    case "decision.corrected":
      return "Decision corrected";
    case "decision.investigated":
      return "Marked investigated";
    case "decision.planned":
      return "Transition planned";
    case "decision.escalated":
      return "Escalated to exception";
    case "decision.cookbook-entered":
      return "Entered in CookBook";
    case "decision.apl-rejected":
      return "Article rejected";
    case "decision.apl-added":
      return "Article added to mapping";
    case "queue.assigned":
      return "Queue assigned by Autobot";
    default:
      return action;
  }
}
