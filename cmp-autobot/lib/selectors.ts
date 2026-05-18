// Pure selectors. Never inline these calculations in components.
// This file is the only place that does the Original-vs-Incremental math.

import type { MockState, ProgressTarget, Queue } from "./types";

/**
 * Returns the target date that applies for a given site filter.
 * - "all" or undefined → global targetDate
 * - specific site id with an override → the override
 * - specific site id without override → global targetDate
 */
export function effectiveTargetDate(target: ProgressTarget, siteFilter?: string): string {
  if (siteFilter && siteFilter !== "all" && target.siteTargetDates?.[siteFilter]) {
    return target.siteTargetDates[siteFilter];
  }
  return target.targetDate;
}

export interface WorkloadCounts {
  total: number;
  mapped: number;
  amber: number;
  red: number;
  blueWatch: number;
  unmapped: number;
  percentComplete: number;
}

const CONFIRMED_STATUSES = new Set(["confirmed", "corrected"]);

function isMapped(status: string) {
  return CONFIRMED_STATUSES.has(status);
}

export function workloadFor(
  state: Pick<MockState, "decisions" | "mogs">,
  scope: "original" | "incremental" | "all"
): WorkloadCounts {
  const mogIds = new Set(
    state.mogs.filter((m) => scope === "all" || m.scopeOrigin === scope).map((m) => m.id)
  );

  // Per MOG: if any decision for it is confirmed/corrected → Mapped.
  // The PRD defines mapping as boolean per MOG, regardless of how many APLs are linked.
  const decisionsByMog = new Map<string, typeof state.decisions>();
  for (const d of state.decisions) {
    if (!mogIds.has(d.mogId)) continue;
    const list = decisionsByMog.get(d.mogId) ?? [];
    list.push(d);
    decisionsByMog.set(d.mogId, list);
  }

  let mapped = 0;
  let amber = 0;
  let red = 0;
  let blueWatch = 0;

  for (const id of mogIds) {
    const decisions = decisionsByMog.get(id) ?? [];
    if (decisions.length === 0) continue;

    const hasMapped = decisions.some((d) => isMapped(d.status));
    if (hasMapped) {
      mapped += 1;
      // Blue counts as Mapped but is also surfaced separately.
      if (decisions.some((d) => d.queue === "blue" && !isMapped(d.status))) {
        blueWatch += 1;
      }
    } else {
      // Pick the most "actionable" pending queue: Amber > Red > Blue
      const pending = decisions.filter((d) => d.status === "pending" || d.status === "planned");
      const queues = new Set(pending.map((d) => d.queue));
      if (queues.has("amber")) amber += 1;
      else if (queues.has("red")) red += 1;
      else if (queues.has("blue")) blueWatch += 1;
    }
  }

  // Blue mapped MOGs (existing valid mapping where APL retired). Per PRD, counted as Mapped
  // but surfaced separately on the dashboard.
  for (const id of mogIds) {
    const decisions = decisionsByMog.get(id) ?? [];
    if (
      !decisions.some((d) => isMapped(d.status)) &&
      decisions.some((d) => d.queue === "blue")
    ) {
      // already counted above
    }
  }

  const total = mogIds.size;
  const unmapped = total - mapped;
  const percentComplete = total === 0 ? 0 : Math.round((mapped / total) * 100);
  return { total, mapped, amber, red, blueWatch, unmapped, percentComplete };
}

export function pendingDecisionCounts(state: Pick<MockState, "decisions">) {
  const counts: Record<Queue, number> = { green: 0, amber: 0, red: 0, blue: 0 };
  for (const d of state.decisions) {
    if (d.status === "pending") counts[d.queue] += 1;
  }
  return counts;
}

export function daysToTarget(targetDateIso: string, today: Date = new Date()) {
  const t = new Date(targetDateIso + "T23:59:59").getTime();
  const n = today.getTime();
  return Math.max(0, Math.ceil((t - n) / (1000 * 60 * 60 * 24)));
}

export function trendData(state: Pick<MockState, "audit">) {
  // Synthesise a 7-day trend from audit history (deterministic, no randomness).
  const buckets: Record<string, number> = {};
  for (const a of state.audit) {
    if (a.action === "decision.confirmed" || a.action === "decision.corrected") {
      const day = a.timestamp.slice(0, 10);
      buckets[day] = (buckets[day] ?? 0) + 1;
    }
  }
  const today = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: buckets[key] ?? Math.max(0, 6 - i) * 3 });
  }
  return days;
}

// ─── Per-decision confidence ───
// Roll up the bot's per-APL confidence into a single score for the MOG.

export interface DecisionConfidence {
  /** 0-100 overall, or null when there is no candidate to score (e.g. red). */
  score: number | null;
  tone: "green" | "amber" | "red" | "blue" | "neutral";
  label: string;
  detail: string;
}

export function decisionConfidence(decision: MockState["decisions"][number]): DecisionConfidence {
  if (decision.queue === "red") {
    return {
      score: null,
      tone: "red",
      label: "No match",
      detail: "Bot found no credible APL — investigate or escalate.",
    };
  }
  if (decision.queue === "blue") {
    return {
      score: 80,
      tone: "blue",
      label: "Transition",
      detail: "Existing mapping preserved; replacement APL pending review.",
    };
  }
  const matches = decision.aplMatches ?? [];
  const newMatches = matches.filter((m) => m.status === "new-candidate");
  if (newMatches.length > 0) {
    const top = Math.max(...newMatches.map((m) => m.confidence));
    const avg = Math.round(
      newMatches.reduce((a, b) => a + b.confidence, 0) / newMatches.length
    );
    const tone: DecisionConfidence["tone"] =
      top >= 90 ? "green" : top >= 70 ? "amber" : "red";
    const label = top >= 90 ? "Sure match" : top >= 70 ? "Likely match" : "Low confidence";
    const detail =
      newMatches.length > 1
        ? `Top candidate ${top}/100 · ${newMatches.length} candidates · avg ${avg}.`
        : `Single candidate scored ${top}/100 by the bot.`;
    return { score: top, tone, label, detail };
  }
  // No new candidates — fall back to a queue-derived heuristic so the badge always renders.
  if (decision.queue === "green") {
    return {
      score: 92,
      tone: "green",
      label: "Sure match",
      detail: "All checks passed — bot's confidence in this mapping is high.",
    };
  }
  return {
    score: 75,
    tone: "amber",
    label: "Likely match",
    detail: "Bot suggests this match — confirm before entry.",
  };
}

// ─── Story selectors ───
// Used by the narrative dashboard layout — keep prose generation in the
// selector so the component just renders the result.

import type { Queue as QueueType } from "./types";

export interface PaceVerdict {
  ratePerDay: number;
  remaining: number;
  projectedDaysToFinish: number;
  daysToTarget: number;
  buffer: number;
  status: "stalled" | "late" | "tight" | "on-track";
  oneLine: string;
}

export function paceVerdict(
  state: Pick<MockState, "decisions" | "mogs" | "audit" | "target" | "siteFilter">,
  today: Date = new Date()
): PaceVerdict {
  const original = workloadFor({ decisions: state.decisions, mogs: state.mogs }, "original");
  const incremental = workloadFor({ decisions: state.decisions, mogs: state.mogs }, "incremental");
  const trend = trendData({ audit: state.audit });
  const ratePerDay = trend.reduce((a, b) => a + b.count, 0) / 7;
  const remaining = original.unmapped + incremental.unmapped;
  const target = effectiveTargetDate(state.target, state.siteFilter);
  const daysToTargetVal = daysToTarget(target, today);
  const projected = ratePerDay > 0 ? Math.ceil(remaining / ratePerDay) : Infinity;
  const buffer = daysToTargetVal - projected;
  const targetLabel = new Date(target).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  let status: PaceVerdict["status"];
  let oneLine: string;
  if (!isFinite(projected)) {
    status = "stalled";
    oneLine = `No mappings confirmed in the last 7 days. ${remaining} MOGs still pending.`;
  } else if (buffer < 0) {
    status = "late";
    const lateBy = Math.abs(buffer);
    oneLine = `At ${ratePerDay.toFixed(1)}/day you'll finish ${lateBy} day${lateBy === 1 ? "" : "s"} past the ${targetLabel} target — pick up pace or escalate scope.`;
  } else if (buffer < 5) {
    status = "tight";
    oneLine = `At ${ratePerDay.toFixed(1)}/day you'll finish right around the ${targetLabel} target — keep moving.`;
  } else {
    status = "on-track";
    oneLine = `At ${ratePerDay.toFixed(1)}/day you'll finish in ${projected} day${projected === 1 ? "" : "s"} — ${buffer} days ahead of the ${targetLabel} target.`;
  }

  return {
    ratePerDay,
    remaining,
    projectedDaysToFinish: isFinite(projected) ? projected : 0,
    daysToTarget: daysToTargetVal,
    buffer,
    status,
    oneLine,
  };
}

export interface NextActionSignal {
  queue: QueueType;
  count: number;
  /** Rough estimate in minutes for clearing the queue at typical speed. */
  estimatedMinutes: number;
  headline: string;
  reason: string;
  ctaLabel: string;
  href: string;
}

const SECONDS_PER_REVIEW: Record<QueueType, number> = {
  green: 15, // perfect match — quick confirm
  amber: 25, // needs review
  red: 60, // needs investigation / escalation
  blue: 30, // transition planning
};

export function nextBestAction(
  state: Pick<MockState, "decisions" | "siteFilter">
): NextActionSignal | null {
  const inSite = (id: string) => state.siteFilter === "all" || id === state.siteFilter;
  const counts = state.decisions
    .filter((d) => d.status === "pending" && inSite(d.siteId))
    .reduce(
      (acc, d) => {
        acc[d.queue] = (acc[d.queue] ?? 0) + 1;
        return acc;
      },
      {} as Record<QueueType, number>
    );

  // Priority: Amber → Red → Green → Blue (mirrors the worklist's queue ordering).
  const priority: QueueType[] = ["amber", "red", "green", "blue"];
  const queue = priority.find((q) => (counts[q] ?? 0) > 0);
  if (!queue) return null;

  const count = counts[queue];
  const estimatedMinutes = Math.max(1, Math.round((count * SECONDS_PER_REVIEW[queue]) / 60));

  const lib: Record<QueueType, { headline: string; reason: string; cta: string }> = {
    amber: {
      headline: `Clear ${count} amber match${count === 1 ? "" : "es"}`,
      reason: `Bot is fairly confident — quick review needed before each goes to CookBook entry.`,
      cta: "Start with Amber",
    },
    red: {
      headline: `Resolve ${count} red gap${count === 1 ? "" : "s"}`,
      reason: `No APL match found. Add an APL manually or escalate to a MAM Type A exception.`,
      cta: "Open Red queue",
    },
    green: {
      headline: `Confirm ${count} green match${count === 1 ? "" : "es"}`,
      reason: `Perfect matches — confirm and they'll line up for CookBook entry.`,
      cta: "Confirm greens",
    },
    blue: {
      headline: `Plan ${count} transition${count === 1 ? "" : "s"}`,
      reason: `APLs retired in SAP — pick the replacement and queue the cutover.`,
      cta: "Open Blue queue",
    },
  };

  const copy = lib[queue];
  return {
    queue,
    count,
    estimatedMinutes,
    headline: copy.headline,
    reason: copy.reason,
    ctaLabel: copy.cta,
    href: `/worklist?queue=${queue}`,
  };
}

// ─── Proactive dashboard alerts ───
// Surface 3 actionable signals at a glance: pace forecast, stale work, quality.

export type AlertSeverity = "critical" | "warning" | "info" | "success";

export interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  subtitle: string;
  href?: string;
  cta?: string;
}

const STALE_DAYS = 5;
const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  success: 3,
};

export function dashboardAlerts(
  state: Pick<MockState, "decisions" | "mogs" | "audit" | "target" | "siteFilter">,
  today: Date = new Date()
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const original = workloadFor({ decisions: state.decisions, mogs: state.mogs }, "original");
  const incremental = workloadFor({ decisions: state.decisions, mogs: state.mogs }, "incremental");
  const days = daysToTarget(effectiveTargetDate(state.target, state.siteFilter), today);

  // ── Pace forecast: project completion at the current rolling rate.
  const trend = trendData({ audit: state.audit });
  const last7Confirmed = trend.reduce((a, b) => a + b.count, 0);
  const ratePerDay = last7Confirmed / 7;
  const remaining = original.unmapped + incremental.unmapped;
  const projectedDaysToFinish = ratePerDay > 0 ? Math.ceil(remaining / ratePerDay) : Infinity;
  const buffer = days - projectedDaysToFinish;

  if (!isFinite(projectedDaysToFinish)) {
    alerts.push({
      id: "pace-stalled",
      severity: "critical",
      title: "Mapping pace has stalled",
      subtitle: `${remaining} MOGs pending and no confirmations in the last 7 days.`,
      href: "/worklist",
      cta: "Open Worklist",
    });
  } else if (buffer < -3) {
    alerts.push({
      id: "pace-late",
      severity: "critical",
      title: `Will miss target by ~${Math.abs(buffer)} days`,
      subtitle: `At ${ratePerDay.toFixed(1)} mappings/day, ${remaining} pending → finish in ${projectedDaysToFinish} days vs ${days} to target.`,
      href: "/worklist",
      cta: "Open Worklist",
    });
  } else if (buffer < 3) {
    alerts.push({
      id: "pace-tight",
      severity: "warning",
      title: `On track but tight · ${buffer === 0 ? "no buffer" : `${buffer}-day buffer`}`,
      subtitle: `At ${ratePerDay.toFixed(1)}/day, you'd finish in ${projectedDaysToFinish} days. Target leaves ${days}.`,
      href: "/worklist",
      cta: "Open Worklist",
    });
  } else {
    alerts.push({
      id: "pace-good",
      severity: "success",
      title: `On track · ${buffer}-day buffer`,
      subtitle: `At ${ratePerDay.toFixed(1)} mappings/day, you'd finish in ${projectedDaysToFinish} days vs ${days} to target.`,
    });
  }

  // ── Stale items: pending decisions older than STALE_DAYS.
  const todayMs = today.getTime();
  const stale = state.decisions.filter(
    (d) =>
      d.status === "pending" &&
      todayMs - new Date(d.generatedAt).getTime() > STALE_DAYS * 24 * 60 * 60 * 1000
  ).length;
  if (stale >= 5) {
    alerts.push({
      id: "stale-items",
      severity: stale >= 20 ? "critical" : "warning",
      title: `${stale} mappings stale (> ${STALE_DAYS} days)`,
      subtitle: `Items queued without action — review or escalate before they age further.`,
      href: "/worklist",
      cta: "Review now",
    });
  }

  // ── Red queue gap: MOGs with no APL match → procurement gap.
  const redCount = state.decisions.filter(
    (d) => d.queue === "red" && d.status === "pending"
  ).length;
  if (redCount >= 5) {
    alerts.push({
      id: "red-gap",
      severity: "warning",
      title: `${redCount} MOGs need procurement coverage`,
      subtitle: `No APL candidates in tonight's feed. Move to MAM Type A exceptions for formal coverage.`,
      href: "/worklist?queue=red",
      cta: "Open Red queue",
    });
  }

  // ── Quality: rejection trend on amber matches.
  const recentAudit = state.audit.slice(0, 200);
  const rejected = recentAudit.filter((a) => a.action === "decision.apl-rejected").length;
  const confirmed = recentAudit.filter((a) => a.action === "decision.confirmed").length;
  const corrected = recentAudit.filter((a) => a.action === "decision.corrected").length;
  const totalReviewed = confirmed + corrected;
  if (rejected > 0 && totalReviewed > 0) {
    const rate = rejected / (rejected + totalReviewed);
    if (rate > 0.25) {
      alerts.push({
        id: "rejection-high",
        severity: "warning",
        title: `${Math.round(rate * 100)}% APL rejection rate this week`,
        subtitle: `Bot suggestions failing review more than usual. May signal APL master data drift.`,
      });
    }
  }
  if (totalReviewed >= 10) {
    const accuracy = confirmed / totalReviewed;
    if (accuracy >= 0.9 && rejected === 0) {
      alerts.push({
        id: "quality-high",
        severity: "success",
        title: `${Math.round(accuracy * 100)}% bot match accuracy`,
        subtitle: `${confirmed} of ${totalReviewed} reviewed mappings confirmed without correction.`,
      });
    }
  }

  // ── Incremental scope impact.
  if (incremental.total > 0 && incremental.unmapped > 0 && ratePerDay > 0) {
    const incrementalDays = Math.ceil(incremental.unmapped / ratePerDay);
    if (incrementalDays >= 3) {
      alerts.push({
        id: "incremental-impact",
        severity: "info",
        title: `Incremental scope adds ~${incrementalDays} days`,
        subtitle: `${incremental.unmapped} of ${incremental.total} mid-exercise MOGs still pending — ${incrementalDays} days at current pace.`,
        href: "/worklist?scope=incremental",
        cta: "Open incremental",
      });
    }
  }

  // Top 3 by severity, with a deterministic tiebreak on insertion order.
  return alerts
    .map((a, i) => ({ a, i }))
    .sort((x, y) => SEVERITY_ORDER[x.a.severity] - SEVERITY_ORDER[y.a.severity] || x.i - y.i)
    .slice(0, 3)
    .map((p) => p.a);
}
