"use client";

import { useMemo, useState } from "react";
import { Bot, Check, Plus, X as XIcon } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import type { APL, AplMatch, AplMatchStatus, MappingDecision, Queue } from "@/lib/types";
import { AddAplDialog } from "./add-apl-dialog";
import { RejectAplDialog } from "./reject-apl-dialog";
import { cn, formatCurrencyINR, aplCode } from "@/lib/utils";

interface DecisionDetailTableProps {
  decision: MappingDecision;
}

interface Row {
  apl: APL;
  match?: AplMatch;
  status: AplMatchStatus;
  isDefault: boolean;
  /** True once this APL has been mapped (inline confirm or bulk). */
  isMapped: boolean;
  /** Display confidence — falls back to a queue-derived value when bot match metadata is missing. */
  confidence: number | null;
  /** Display match date — falls back to the decision's generation timestamp. */
  matchedAt: string;
}

// Long-tail decisions don't carry per-APL aplMatch metadata. Derive a sane
// default from the queue so every row shows a meaningful confidence band.
function fallbackConfidence(queue: Queue): number {
  if (queue === "green") return 92;
  if (queue === "amber") return 75;
  if (queue === "blue") return 80;
  return 0;
}

export function DecisionDetailTable({ decision }: DecisionDetailTableProps) {
  const apls = useMockStore((s) => s.apls);
  const confirmDecision = useMockStore((s) => s.confirmDecision);
  const toggleDecisionDefault = useMockStore((s) => s.toggleDecisionDefault);
  const [addOpen, setAddOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<APL | null>(null);

  const allowAdd =
    decision.queue === "green" ||
    decision.queue === "amber" ||
    decision.queue === "red";
  // Per-APL confirm + reject inline only while the decision is still pending.
  // Green + amber both qualify; previously-mapped rows are excluded at the
  // row level (their confirm is implicit — they were trusted before).
  const allowInline =
    (decision.queue === "green" || decision.queue === "amber") &&
    decision.status === "pending";

  const mappedSet = useMemo(
    () => new Set(decision.mappedAplIds ?? []),
    [decision.mappedAplIds]
  );
  const defaultSet = useMemo(
    () => new Set(decision.defaultAplIds ?? []),
    [decision.defaultAplIds]
  );

  const rows: Row[] = useMemo(() => {
    const matchById = new Map<string, AplMatch>();
    for (const m of decision.aplMatches ?? []) matchById.set(m.aplId, m);

    const candidates = decision.candidateAplIds
      .map((id) => apls.find((a) => a.id === id))
      .filter((a): a is APL => Boolean(a));

    return candidates
      .map((apl): Row => {
        const m = matchById.get(apl.id);
        const status = m?.status ?? "new-candidate";
        // Currently-mapped rows don't get a "fresh match" confidence — they're already trusted.
        const confidence =
          status === "previously-mapped"
            ? null
            : typeof m?.confidence === "number"
            ? m.confidence
            : fallbackConfidence(decision.queue);
        return {
          apl,
          match: m,
          status,
          isDefault: defaultSet.has(apl.id),
          isMapped: mappedSet.has(apl.id) || status === "previously-mapped",
          confidence,
          matchedAt: m?.matchedAt ?? decision.generatedAt,
        };
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "previously-mapped" ? -1 : 1;
        return a.apl.costPerUnit - b.apl.costPerUnit;
      });
  }, [decision, apls, defaultSet, mappedSet]);

  const previouslyCount = rows.filter((r) => r.status === "previously-mapped").length;
  const newRows = rows.filter((r) => r.status === "new-candidate");
  const newlyCount = newRows.length;
  const topConfidence =
    newRows.length === 0
      ? null
      : Math.max(
          ...newRows.map((r) => (typeof r.confidence === "number" ? r.confidence : 0))
        );

  return (
    <div className="px-6 lg:px-8 py-5 max-w-[1180px] w-full space-y-5">
      {/* Bot reasoning band — DetailHeader already carries the headline match confidence,
          so this stays focused on explanation + supporting counts (no duplicate score). */}
      <div className="rounded-2xl border border-border bg-card p-4 lg:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-4.5 w-4.5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs">
              <span className="font-medium">CMP Autobot</span>
              <span className="text-muted-foreground"> · {prettyTime(decision.generatedAt)}</span>
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/90">
              {decision.explanation}
            </p>
            <div className="mt-2.5 flex items-center gap-3 text-[11.5px] text-muted-foreground flex-wrap">
              <span>
                Current Articles:{" "}
                <span className="numeric-tabular text-foreground font-medium">
                  {previouslyCount}
                </span>
              </span>
              <span className="opacity-50">·</span>
              <span>
                New matches:{" "}
                <span className="numeric-tabular text-foreground font-medium">{newlyCount}</span>
              </span>
              {topConfidence !== null && (
                <>
                  <span className="opacity-50">·</span>
                  <span>
                    Top score:{" "}
                    <span className="numeric-tabular text-foreground font-medium">
                      {topConfidence}/100
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* APL table */}
      <section>
        <header className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h3 className="text-[12.5px] font-semibold tracking-tight">
              All Articles for this Ingredient
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {previouslyCount > 0
                ? "Currently mapped above the divider · new matches below"
                : "New matches from tonight's sync"}
            </p>
          </div>
          {allowAdd && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[12px] font-medium text-foreground hover:bg-accent/40"
            >
              <Plus className="h-3.5 w-3.5" />
              Add another Article
            </button>
          )}
        </header>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {rows.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No Articles attached to this decision.
              {decision.queue === "red" && (
                <div className="mt-2 text-[12.5px]">
                  Add an Article or move this Ingredient to a Type A exception.
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card/95 border-b border-border">
                <tr className="text-left text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium w-[60px] text-center">Default</th>
                  <th className="px-3 py-2.5 font-medium w-[140px]">Status</th>
                  <th className="px-3 py-2.5 font-medium">Article</th>
                  <th className="px-3 py-2.5 font-medium w-[100px]">Pack</th>
                  <th className="px-3 py-2.5 font-medium w-[200px]">Match confidence</th>
                  <th className="px-3 py-2.5 font-medium text-right w-[110px]">Cost</th>
                  <th className="px-3 py-2.5 font-medium w-[110px]">Matched on</th>
                  <th className="px-3 py-2.5 font-medium w-[180px]"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const prev = rows[i - 1];
                  const isFirstNew =
                    r.status === "new-candidate" && (!prev || prev.status === "previously-mapped");
                  const canActInline = allowInline && !r.isMapped && r.status === "new-candidate";
                  return (
                    <RowTr
                      key={r.apl.id}
                      row={r}
                      onConfirm={
                        canActInline
                          ? () => confirmDecision(decision.id, [r.apl.id])
                          : null
                      }
                      onReject={canActInline ? () => setRejectTarget(r.apl) : null}
                      onToggleDefault={() =>
                        toggleDecisionDefault(decision.id, r.apl.id)
                      }
                      isDivider={isFirstNew && previouslyCount > 0}
                    />
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <AddAplDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        decisionId={decision.id}
      />
      <RejectAplDialog
        apl={rejectTarget}
        decisionId={decision.id}
        open={Boolean(rejectTarget)}
        onOpenChange={(o) => {
          if (!o) setRejectTarget(null);
        }}
      />
    </div>
  );
}

function RowTr({
  row,
  onConfirm,
  onReject,
  onToggleDefault,
  isDivider,
}: {
  row: Row;
  onConfirm: (() => void) | null;
  onReject: (() => void) | null;
  onToggleDefault: () => void;
  isDivider: boolean;
}) {
  const { apl, match, status, isDefault, isMapped, confidence, matchedAt } = row;
  const isPrev = status === "previously-mapped";
  return (
    <tr
      className={cn(
        "border-b border-border/70 last:border-b-0 transition-colors hover:bg-accent/30",
        isPrev && "bg-foreground/[0.015]",
        isMapped && !isPrev && "bg-green-queue-soft/30",
        isDivider && "border-t-2 border-t-foreground/20"
      )}
    >
      <td className="px-3 py-3 align-middle">
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={onToggleDefault}
            aria-label={`Mark ${apl.genericName} as default`}
            className="h-4 w-4 accent-green-queue cursor-pointer"
          />
        </div>
      </td>
      <td className="px-3 py-3 align-middle">
        <StatusPill status={status} isMapped={isMapped} />
        {isDivider && (
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            ▼ tonight&apos;s sync
          </div>
        )}
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium tracking-tight">
            {apl.brand || "Unbranded"}
          </span>
          <span className="numeric-tabular rounded border border-border bg-background px-1.5 py-px text-[10px] font-medium tracking-wider text-muted-foreground">
            {aplCode(apl)}
          </span>
          {isDefault && (
            <span className="inline-flex items-center rounded-md bg-green-queue px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-white">
              Default
            </span>
          )}
        </div>
        <div className="text-[11.5px] text-muted-foreground mt-0.5">
          {apl.genericName}
          {apl.characteristic && `, ${apl.characteristic}`}
        </div>
        {match?.reasoning && (
          <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed max-w-[420px]">
            {match.reasoning}
          </div>
        )}
      </td>
      <td className="px-3 py-3 align-middle text-[12.5px]">{apl.packSize || "—"}</td>
      <td className="px-3 py-3 align-middle">
        <ConfidenceCell score={confidence} isPrev={isPrev} hadMatchData={Boolean(match)} />
      </td>
      <td className="px-3 py-3 align-middle text-right">
        <span className="text-sm numeric-tabular font-medium">
          {formatCurrencyINR(apl.costPerUnit)}
        </span>
      </td>
      <td className="px-3 py-3 align-middle text-[12px] text-muted-foreground numeric-tabular">
        {new Date(matchedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="flex items-center gap-1.5 justify-end">
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center gap-1 rounded-md bg-green-queue px-2.5 py-1 text-[11.5px] font-semibold text-white shadow-sm hover:bg-green-queue/90 transition-colors"
            >
              <Check className="h-3 w-3" strokeWidth={2.75} />
              Confirm
            </button>
          )}
          {onReject && (
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center gap-1 rounded-md border border-red-queue/30 bg-background px-2 py-1 text-[11.5px] font-medium text-red-queue hover:bg-red-queue-soft transition-colors"
            >
              <XIcon className="h-3 w-3" />
              Reject
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StatusPill({
  status,
  isMapped,
}: {
  status: AplMatchStatus;
  isMapped: boolean;
}) {
  if (status === "previously-mapped") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 text-foreground/80 px-2 py-0.5 text-[11px] font-semibold">
        Currently mapped
      </span>
    );
  }
  if (isMapped) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-queue-soft text-green-queue px-2 py-0.5 text-[11px] font-semibold">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
        Mapped
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-queue-soft text-amber-queue px-2 py-0.5 text-[11px] font-semibold">
      New match
    </span>
  );
}

function ConfidenceCell({
  score,
  isPrev,
  hadMatchData,
}: {
  score: number | null;
  isPrev: boolean;
  hadMatchData: boolean;
}) {
  if (isPrev) {
    return (
      <div className="text-[11px] text-muted-foreground italic">
        Already trusted — confidence not recomputed
      </div>
    );
  }
  if (typeof score !== "number") {
    return <span className="text-[12px] text-muted-foreground">—</span>;
  }
  const tone = score >= 90 ? "green" : score >= 70 ? "amber" : "red";
  const barClass =
    tone === "green" ? "bg-green-queue" : tone === "amber" ? "bg-amber-queue" : "bg-red-queue";
  const trackClass =
    tone === "green"
      ? "bg-green-queue/15"
      : tone === "amber"
      ? "bg-amber-queue/15"
      : "bg-red-queue/15";
  const textClass =
    tone === "green"
      ? "text-green-queue"
      : tone === "amber"
      ? "text-amber-queue"
      : "text-red-queue";
  const label =
    score >= 90 ? "Sure match" : score >= 70 ? "Likely match" : "Low confidence";
  return (
    <div className="flex flex-col gap-1 max-w-[200px]">
      <div className="flex items-center gap-2">
        <div className={cn("flex-1 h-1.5 rounded-full overflow-hidden", trackClass)}>
          <div
            className={cn("h-full transition-all", barClass)}
            style={{ width: `${Math.min(100, Math.max(2, score))}%` }}
          />
        </div>
        <span className={cn("numeric-tabular text-[12px] font-semibold", textClass)}>
          {score}
          <span className="text-[9.5px] opacity-70 ml-0.5">/100</span>
        </span>
      </div>
      <div className="flex items-center justify-between text-[10.5px]">
        <span className={cn("font-medium uppercase tracking-wider", textClass)}>{label}</span>
        {!hadMatchData && (
          <span className="text-muted-foreground italic">heuristic</span>
        )}
      </div>
    </div>
  );
}

function prettyTime(iso: string) {
  const d = new Date(iso);
  return `Generated ${d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} IST · ${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
}
