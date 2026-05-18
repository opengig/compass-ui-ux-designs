"use client";

import { useState } from "react";
import { Building2, Check, History, Plus, TriangleAlert } from "lucide-react";
import { QUEUES } from "@/lib/queue-config";
import type { MOG, MappingDecision, Site } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { QueueBadge } from "@/components/worklist/queue-chip";
import { useMockStore } from "@/lib/mock-store";
import { decisionConfidence } from "@/lib/selectors";
import { cn, mogCode } from "@/lib/utils";
import { CorrectionDialog } from "./correction-dialog";
import { AddAplDialog } from "./add-apl-dialog";
import { AuditLogDialog } from "./audit-log-dialog";
import { EscalateExceptionDialog } from "./escalate-exception-dialog";
import { MatchConfidence } from "./match-confidence";

interface DetailHeaderProps {
  decision: MappingDecision;
  mog: MOG;
  site: Site;
}

export function DetailHeader({ decision, mog, site }: DetailHeaderProps) {
  const cfg = QUEUES[decision.queue];
  const confirmDecision = useMockStore((s) => s.confirmDecision);
  const markInvestigated = useMockStore((s) => s.markInvestigated);
  const markPlanned = useMockStore((s) => s.markPlanned);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);

  const isDone = decision.status !== "pending";
  const candidateCount = decision.candidateAplIds.length;
  const mappedCount = decision.mappedAplIds?.length ?? 0;
  const rejectedCount = decision.rejectedAplIds?.length ?? 0;
  const remainingCount = Math.max(0, candidateCount - mappedCount - rejectedCount);
  const isRed = decision.queue === "red";
  const isAmber = decision.queue === "amber";
  const isGreen = decision.queue === "green";
  const isBlue = decision.queue === "blue";

  const handlePrimary = () => {
    if (isGreen || isAmber) confirmDecision(decision.id);
    else if (isBlue) markPlanned(decision.id);
    else if (isRed) markInvestigated(decision.id);
  };

  const primaryLabel = blueLabelOverride(decision) ?? cfg.primaryActionLabel;
  // Header confirm now bulk-confirms only the *remaining* (un-mapped,
  // un-rejected) candidates. Inline per-row Confirm handles single
  // APLs, so this button is purely a "do all the rest at once" shortcut.
  const confirmCopy =
    remainingCount === 0
      ? "All Articles mapped"
      : remainingCount === 1
      ? "Confirm remaining match"
      : `Confirm remaining ${remainingCount} matches`;
  const confirmDisabled = isDone || remainingCount === 0;

  return (
    <div className="px-6 lg:px-8 pt-5 pb-4 border-b border-border bg-card/30">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <QueueBadge queue={decision.queue} />
            {decision.blueSubCase && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Case · {blueCaseLabel(decision.blueSubCase)}
              </span>
            )}
            {mog.scopeOrigin === "incremental" && (
              <span className="text-[11px] uppercase tracking-wider text-amber-queue">
                Incremental scope
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            {/* MOG code chip removed from the headline — kept on the
                title tooltip so the value is still discoverable
                without sitting next to the name as visual noise. */}
            <h2
              className="font-display text-[26px] tracking-tight leading-tight"
              title={mogCode(mog)}
            >
              {mog.name}
            </h2>
          </div>
          <div className="mt-1.5 flex items-center gap-2.5 flex-wrap text-[12.5px] text-muted-foreground">
            <span className="capitalize">{mog.type} Ingredient</span>
            <span className="opacity-50">·</span>
            <span>{mog.genericIngredient}</span>
            <span className="opacity-50">·</span>
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {site.name}, {site.city} · {site.code}
            </span>
          </div>
          {/* Overall match confidence — embedded in header so the user sees the verdict immediately. */}
          <div className="mt-3 max-w-[440px]">
            <MatchConfidence confidence={decisionConfidence(decision)} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Audit log on amber + green */}
          {(isAmber || isGreen) && !isDone && (
            <Button
              variant="outline"
              onClick={() => setAuditOpen(true)}
              aria-label="View audit log"
            >
              <History className="h-4 w-4" />
              Audit log
            </Button>
          )}

          {/* Add APL — primary on Red, secondary on Green/Amber. Add now
              instant-maps the picked APL (any queue), so the Red copy no
              longer needs to call out "& confirm" — the act of adding is
              the confirmation. */}
          {(isRed || isAmber || isGreen) && !isDone && (
            <Button
              variant={isRed ? "default" : "outline"}
              onClick={() => setAddOpen(true)}
              className={isRed ? "min-w-[180px]" : undefined}
            >
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          )}

          {/* Amber fallback — pick different APL when all candidates rejected */}
          {isAmber && !isDone && candidateCount === 0 && (
            <Button variant="outline" onClick={() => setCorrectOpen(true)}>
              Pick different Article
            </Button>
          )}

          {/* Confirm — Green/Amber primary CTA. Visually distinguished as the
              positive forward-progress action. */}
          {(isGreen || isAmber) && !isDone && (
            <Button
              onClick={handlePrimary}
              disabled={confirmDisabled}
              size="lg"
              className={cn(
                "min-w-[230px] h-11 px-5 text-[14px] font-semibold shadow-sm",
                "bg-green-queue text-white hover:bg-green-queue/90",
                "focus-visible:ring-green-queue/40",
                confirmDisabled && "bg-muted text-muted-foreground hover:bg-muted shadow-none"
              )}
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              {confirmCopy}
            </Button>
          )}

          {/* Blue: plan transition (uses the standard primary styling) */}
          {isBlue && !isDone && (
            <Button onClick={handlePrimary} className="min-w-[230px]">
              {primaryLabel}
            </Button>
          )}

          {/* Red: Move to exception (escalation) */}
          {isRed && !isDone && (
            <Button
              variant="outline"
              onClick={() => setEscalateOpen(true)}
              className="min-w-[180px]"
            >
              <TriangleAlert className="h-4 w-4 text-amber-queue" />
              Move to exception
            </Button>
          )}

          {/* Done state pill */}
          {isDone && (
            <Button disabled className="min-w-[230px] bg-muted text-muted-foreground">
              {doneLabel(decision)}
            </Button>
          )}
        </div>
      </div>

      <CorrectionDialog
        open={correctOpen}
        onOpenChange={setCorrectOpen}
        decisionId={decision.id}
      />
      <AddAplDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        decisionId={decision.id}
      />
      <AuditLogDialog
        open={auditOpen}
        onOpenChange={setAuditOpen}
        decisionId={decision.id}
        mog={mog}
      />
      <EscalateExceptionDialog
        open={escalateOpen}
        onOpenChange={setEscalateOpen}
        decisionId={decision.id}
        mog={mog}
      />
    </div>
  );
}

function blueLabelOverride(d: MappingDecision) {
  if (d.queue !== "blue") return null;
  if (d.blueSubCase === "case2-green" || d.blueSubCase === "case2-amber") {
    return "Confirm transition · delink old + link new";
  }
  return null;
}

function blueCaseLabel(sub: NonNullable<MappingDecision["blueSubCase"]>) {
  switch (sub) {
    case "case1":
      return "1 · No replacement yet";
    case "case2-green":
      return "2 · Green replacement";
    case "case2-amber":
      return "2 · Amber replacement";
    case "case2-red":
      return "2 · Red — no credible replacement";
    case "case3":
      return "3 · Additive enrichment";
  }
}

function doneLabel(d: MappingDecision) {
  switch (d.status) {
    case "confirmed":
      return "Confirmed · awaiting CookBook entry";
    case "corrected":
      return "Corrected · awaiting CookBook entry";
    case "investigated":
      return "Marked investigated";
    case "planned":
      return "Transition planned";
    case "escalated":
      return "Escalated to exception";
    case "entered":
      return "Entered in CookBook";
    default:
      return "Done";
  }
}
