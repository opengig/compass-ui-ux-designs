"use client";

import { useState } from "react";
import { Plus, SearchX, Layers } from "lucide-react";
import { QUEUES } from "@/lib/queue-config";
import type { APL, AplMatch, MappingDecision } from "@/lib/types";
import { useMockStore } from "@/lib/mock-store";
import { AplCard } from "./apl-card";
import { QueueBadge } from "@/components/worklist/queue-chip";
import { AddAplDialog } from "./add-apl-dialog";
import { RejectAplDialog } from "./reject-apl-dialog";
import { cn } from "@/lib/utils";

interface AplEvidenceProps {
  decision: MappingDecision;
}

export function AplEvidence({ decision }: AplEvidenceProps) {
  const apls = useMockStore((s) => s.apls);
  const candidates = decision.candidateAplIds
    .map((id) => apls.find((a) => a.id === id))
    .filter((a): a is APL => Boolean(a));
  const retired = decision.retiredAplId ? apls.find((a) => a.id === decision.retiredAplId) : null;

  const [addOpen, setAddOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<APL | null>(null);

  const allowAdd = decision.queue === "green" || decision.queue === "amber";
  const allowReject = decision.queue === "amber" && decision.status === "pending";

  return (
    <section>
      <header className="flex items-center gap-3 mb-3">
        <h3 className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Article evidence</h3>
        <span className="h-px flex-1 bg-border" />
        {(decision.queue === "green" || decision.queue === "amber") && candidates.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Layers className="h-3 w-3" />
            {candidates.length} Article{candidates.length === 1 ? "" : "s"} for this Ingredient
            {candidates.length > 1 && " · 1 default"}
          </span>
        )}
      </header>

      {decision.queue === "green" && (
        <MatchedSection
          candidates={candidates}
          decision={decision}
          mode="green"
          onReject={null}
        />
      )}
      {decision.queue === "amber" && (
        <MatchedSection
          candidates={candidates}
          decision={decision}
          mode="amber"
          onReject={allowReject ? (apl) => setRejectTarget(apl) : null}
        />
      )}
      {decision.queue === "red" && <RedEvidence />}
      {decision.queue === "blue" && (
        <BlueEvidence retired={retired ?? null} candidates={candidates} decision={decision} />
      )}

      {allowAdd && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground/80 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add another Article to this Ingredient
          </button>
        </div>
      )}

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
    </section>
  );
}

function MatchedSection({
  candidates,
  decision,
  mode,
  onReject,
}: {
  candidates: APL[];
  decision: MappingDecision;
  mode: "green" | "amber";
  onReject: ((apl: APL) => void) | null;
}) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-6 text-sm text-muted-foreground">
        No candidate Articles left on this decision.
      </div>
    );
  }

  // Sort by cost ascending so the cheapest sits at the top.
  const sorted = [...candidates].sort((a, b) => a.costPerUnit - b.costPerUnit);
  const defaultId = decision.defaultAplIds?.[0] ?? sorted[0]?.id;
  const defaultApl = sorted.find((a) => a.id === defaultId) ?? sorted[0];
  const defaultByLowestCost = defaultApl ? defaultApl.id === sorted[0].id : false;
  const defaultReason = defaultByLowestCost
    ? "Default · lowest-cost active Article at this site"
    : "Default · culinary override (not lowest cost)";
  const showDefaultTreatment = candidates.length > 1;

  // Split using aplMatches metadata when present.
  const matchById: Map<string, AplMatch> = new Map();
  for (const m of decision.aplMatches ?? []) matchById.set(m.aplId, m);

  const previously: APL[] = [];
  const newly: APL[] = [];
  for (const apl of sorted) {
    const m = matchById.get(apl.id);
    if (m?.status === "previously-mapped") previously.push(apl);
    else newly.push(apl);
  }

  // When we have no aplMatches metadata at all, treat all candidates as "new" and
  // skip the two-section split (this is the prototype's long-tail fallback).
  const hasMatchData = (decision.aplMatches?.length ?? 0) > 0;

  function renderCard(apl: APL) {
    const m = matchById.get(apl.id);
    const isDefault = apl.id === defaultId;
    const delta =
      !defaultApl || isDefault || defaultApl.costPerUnit === 0
        ? undefined
        : ((apl.costPerUnit - defaultApl.costPerUnit) / defaultApl.costPerUnit) * 100;
    const isPreviously = m?.status === "previously-mapped";
    return (
      <AplCard
        key={apl.id}
        apl={apl}
        variant={isDefault ? "default" : "candidate"}
        isDefault={isDefault && showDefaultTreatment}
        defaultReason={isDefault && showDefaultTreatment ? defaultReason : undefined}
        costDeltaPct={delta}
        confidence={m?.confidence}
        matchedAt={m?.matchedAt}
        matchStatus={m?.status}
        reasoning={m?.reasoning}
        onReject={onReject && !isPreviously ? () => onReject(apl) : undefined}
      />
    );
  }

  if (!hasMatchData) {
    return (
      <div className="space-y-3">
        <CardGrid count={sorted.length}>{sorted.map(renderCard)}</CardGrid>
        <SectionFooter mode={mode} count={candidates.length} />
      </div>
    );
  }

  // Always render both sub-sections so the analyst can immediately compare
  // "what's live now" vs "what tonight's sync proposed".
  return (
    <div className="space-y-5">
      <SubSection
        title="Current Articles for this Ingredient"
        subtitle="Already mapped from prior syncs · live in CookBook"
        count={previously.length}
      >
        {previously.length === 0 ? (
          <EmptySection
            text="No current mapping yet — this is a net-new Ingredient-site combination."
            tone="neutral"
          />
        ) : (
          <CardGrid count={previously.length}>{previously.map(renderCard)}</CardGrid>
        )}
      </SubSection>

      <SubSection
        title="New matches found"
        subtitle="Bot-suggested in tonight's sync — review, confirm or reject"
        count={newly.length}
      >
        {newly.length === 0 ? (
          <EmptySection
            text={
              previously.length > 0
                ? "All new candidates rejected — existing mapping is preserved as-is."
                : "No new Article candidates from tonight's feed."
            }
            tone={previously.length > 0 ? "muted" : "warning"}
          />
        ) : (
          <CardGrid count={newly.length}>{newly.map(renderCard)}</CardGrid>
        )}
      </SubSection>

      {(previously.length > 0 || newly.length > 0) && (
        <SectionFooter mode={mode} count={newly.length} previouslyCount={previously.length} />
      )}
    </div>
  );
}

function CardGrid({ count, children }: { count: number; children: React.ReactNode }) {
  // Single column when there's only one card; 2-column on lg+ when there are multiple,
  // so wider screens use the available horizontal space instead of stacking deep.
  return (
    <div
      className={cn(
        "grid gap-3",
        count > 1 && "lg:grid-cols-2"
      )}
    >
      {children}
    </div>
  );
}

function SubSection({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-2">
          <div className="text-[12.5px] font-semibold tracking-tight">{title}</div>
          {typeof count === "number" && (
            <span className="numeric-tabular text-[11px] text-muted-foreground">({count})</span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground text-right">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function EmptySection({
  text,
  tone,
}: {
  text: string;
  tone: "neutral" | "muted" | "warning";
}) {
  const cls =
    tone === "warning"
      ? "border-amber-queue/30 bg-amber-queue-soft/40 text-amber-queue"
      : tone === "muted"
      ? "border-border bg-muted/30 text-muted-foreground"
      : "border-dashed border-border bg-muted/20 text-muted-foreground";
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-[12.5px] leading-relaxed", cls)}>
      {text}
    </div>
  );
}

function SectionFooter({
  mode,
  count,
  previouslyCount,
}: {
  mode: "green" | "amber";
  count: number;
  previouslyCount?: number;
}) {
  const cfg = mode === "green" ? QUEUES.green : QUEUES.amber;
  return (
    <div className={cn("text-xs flex items-center gap-2", cfg.textClass)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.stripeClass)} />
      {mode === "green"
        ? count === 1
          ? "Confirmed match · entry-ready"
          : `${count} Articles mapped · default sets recipe cost`
        : count === 0
        ? previouslyCount && previouslyCount > 0
          ? "All new candidates rejected · existing mapping preserved"
          : "All candidates rejected — Add an Article or escalate"
        : count === 1
        ? "Likely match · confirm before entry"
        : `${count} candidate variants · confirm together or reject individually`}
    </div>
  );
}

function RedEvidence() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-queue-soft text-red-queue">
        <SearchX className="h-5 w-5" />
      </div>
      <div className="mt-3 text-sm font-medium">No candidate Article found</div>
      <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
        The Autobot exhausted its matching rules without finding a credible Article.
        Add an Article manually if you know one exists, or escalate to a MAM Exception if it doesn&apos;t.
      </p>
    </div>
  );
}

function BlueEvidence({
  retired,
  candidates,
  decision,
}: {
  retired: APL | null;
  candidates: APL[];
  decision: MappingDecision;
}) {
  const replacement = candidates[0];
  return (
    <div className="space-y-5">
      <SubSection
        title="Retired Article"
        subtitle="Phased out in ODS · mapping will lapse when stock is exhausted"
      >
        {retired ? (
          <CardGrid count={1}>
            <AplCard apl={retired} variant="retired" />
          </CardGrid>
        ) : (
          <EmptySection
            text="Retired Article not available in this feed."
            tone="muted"
          />
        )}
      </SubSection>

      <SubSection
        title="Proposed Replacement"
        subtitle="Bot-suggested successor · confirm before CookBook entry"
      >
        {replacement ? (
          <CardGrid count={1}>
            <AplCard
              apl={replacement}
              variant="candidate"
              badge={<QueueBadge queue={replacementQueue(decision)} className="ml-1" />}
              isDefault
              defaultReason="Default · proposed replacement for retired Article"
            />
          </CardGrid>
        ) : (
          <EmptySection
            text="No replacement candidate yet — coordinate with Procurement to identify a replacement supplier."
            tone="warning"
          />
        )}
      </SubSection>
    </div>
  );
}

function replacementQueue(d: MappingDecision) {
  if (d.blueSubCase === "case2-green") return "green" as const;
  if (d.blueSubCase === "case2-amber") return "amber" as const;
  if (d.blueSubCase === "case2-red") return "red" as const;
  return "green" as const;
}
