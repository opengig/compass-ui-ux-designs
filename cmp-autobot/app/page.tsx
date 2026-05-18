"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { daysToTarget, effectiveTargetDate } from "@/lib/selectors";
import type { Queue } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const decisions = useMockStore((s) => s.decisions);
  const mogs = useMockStore((s) => s.mogs);
  const apls = useMockStore((s) => s.apls);
  const target = useMockStore((s) => s.target);
  const siteFilter = useMockStore((s) => s.siteFilter);

  const incrementalAdds = useMemo(() => {
    const inc = mogs.filter(
      (m): m is typeof m & { scopeAddedOn: string } =>
        m.scopeOrigin === "incremental" && Boolean(m.scopeAddedOn)
    );
    if (inc.length === 0) return null;
    const latest = inc.reduce(
      (max, m) => (m.scopeAddedOn > max ? m.scopeAddedOn : max),
      inc[0].scopeAddedOn
    );
    const count = inc.filter((m) => m.scopeAddedOn === latest).length;
    return { date: latest, count };
  }, [mogs]);

  const targetIso = useMemo(
    () => effectiveTargetDate(target, siteFilter),
    [target, siteFilter]
  );
  const daysLeft = useMemo(() => daysToTarget(targetIso), [targetIso]);
  const targetLabel = useMemo(
    () =>
      new Date(targetIso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [targetIso]
  );
  const incrementalMogsCount = useMemo(
    () => mogs.filter((m) => m.scopeOrigin === "incremental").length,
    [mogs]
  );

  // APL totals — derived from the global APL catalog + the cumulative
  // mappedAplIds across every decision (regardless of status, since
  // partial confirms also write mappedAplIds).
  const aplTotals = useMemo(() => {
    const total = apls.length;
    const mappedSet = new Set<string>();
    for (const d of decisions) {
      for (const id of d.mappedAplIds ?? []) mappedSet.add(id);
    }
    return { total, mapped: mappedSet.size };
  }, [apls, decisions]);

  // ─── DEMO DATA ──────────────────────────────────────────────────
  // The fixtures predate "today" so the live derivation (commented
  // out below) would return zeros across the board. For a clean
  // visual demo we hardcode realistic per-category daily flow plus
  // an aggregate target. Swap to the live derivation when real
  // today-dated data starts flowing through the store.
  //
  // Per-category shape: { completedToday, newToday, remainingOld }.
  //   total bar width = completedToday + newToday + remainingOld.
  type Cell = {
    completedToday: number;
    remainingOld: number;
    newToday: number;
  };
  const movement: Record<Queue, Cell> = {
    // Needs review:    total 30, added 8, completed 5  → remainingOld 17
    amber: { completedToday: 5, newToday: 8, remainingOld: 17 },
    // No match found:  total 16, added 4, completed 2  → remainingOld 10
    red: { completedToday: 2, newToday: 4, remainingOld: 10 },
    // Needs transition: total 3, added 1, completed 0  → remainingOld 2
    blue: { completedToday: 0, newToday: 1, remainingOld: 2 },
    // Matches:         total 14, added 3, completed 6  → remainingOld 5
    green: { completedToday: 6, newToday: 3, remainingOld: 5 },
  };

  // Aggregate Today's Progress card — independent of the per-row
  // sums so the headline numbers can be spec-perfect.
  const clearedToday = 5;
  const addedToday = 12;
  const dailyTarget = 20;
  const todayPct = Math.min(
    100,
    Math.round((clearedToday / dailyTarget) * 100)
  );
  const blueQueueTotal =
    movement.blue.completedToday + movement.blue.newToday + movement.blue.remainingOld;


  /* — Live derivation (in git history before the demo override) —
  // movement + clearedToday + addedToday were previously summed
  // from today-dated decisions/exceptions; dailyTarget came from
  // ceil(remainingToMap / daysLeft). Restore from before the
  // hardcoded-demo commit when real today-dated data starts
  // flowing through the store. */

  return (
    <div className="min-h-[calc(100vh-3rem)]">
      {/* Layout grows naturally; the sticky sidebar + sticky top-bar in
          app/layout.tsx remain visible while the body scrolls. */}
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8 py-4 lg:py-5 flex flex-col gap-4">
        {/* ─── ROW 1 — Today's Progress (left) + Alerts (right) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 items-stretch">
          {/* Today's progress — simplified hierarchy:
                PRIMARY    big "5 / 20"
                SECONDARY  plain "new today"
                ACTIONS    clear transition-first CTA + generic CTA
                TERTIARY   compact target context
              Keeps one obvious next step for blue workers. */}
          <Panel className="p-3.5">
            <Eyebrow>Today&rsquo;s progress</Eyebrow>
            <div className="mt-2 flex items-center gap-5">
              {/* LEFT — gauge with center % digit. */}
              <div className="shrink-0 relative" style={{ width: 150 }}>
                <SemiCircleGauge pct={todayPct} size={150} stroke={14} />
                <div className="absolute inset-x-0 bottom-0.5 flex flex-col items-center">
                  <span className="text-[22px] font-semibold leading-none text-foreground numeric-tabular">
                    {todayPct}%
                  </span>
                </div>
              </div>

              {/* RIGHT — vertically stacked content. */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                {/* PRIMARY — bold "5 / 20" with the "completed
                    today" label inline (regular muted) so the
                    metric reads as a single sentence. baseline
                    alignment keeps the small label sitting on the
                    big numbers' baseline. */}
                <div className="text-[26px] font-semibold leading-none tracking-tight text-foreground numeric-tabular tabular-nums">
                  {clearedToday}
                  <span className="text-muted-foreground/70 mx-1"> / </span>
                  {dailyTarget}
                  <span className="text-sm font-normal text-muted-foreground ml-2 align-baseline">
                    MOGs completed today
                  </span>
                </div>

                {/* SECONDARY — neutral "new today" so blue color is
                    reserved for actual blue-queue meaning.
                    Tight gap (gap-0.5 above) keeps the two lines
                    visually grouped. */}
                <div className="mt-1 text-sm font-medium text-foreground/80">
                  +{addedToday} new today
                </div>

                {/* PRIMARY ACTION — keep one clear path to reduce
                    decision overhead in the top card. */}
                <Link
                  href="/worklist"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-brand-soft text-brand border border-brand/30 px-3.5 py-1.5 text-xs font-semibold transition-colors hover:bg-brand-soft/70 w-fit"
                >
                  Continue mapping
                  <ArrowRight className="h-3 w-3" />
                </Link>

                {/* TERTIARY — condensed scheduling context only. */}
                <p className="mt-2 text-[11px] text-muted-foreground numeric-tabular tabular-nums">
                  Target:{" "}
                  <span className="text-foreground/85">{targetLabel}</span>
                  {" • "}
                  {daysLeft} day{daysLeft === 1 ? "" : "s"} left
                </p>
              </div>
            </div>
          </Panel>

          {/* Alerts — two clear cards: immediate amber decisions and
              blue transition workload. */}
          <div className="flex flex-col gap-3">
            <AlertCard
              accentVar="--brand"
              softVar="--brand-soft"
              title="Needs Attention"
              message={`${movement.amber.completedToday + movement.amber.newToday + movement.amber.remainingOld} MOGs in Likely Matches need a decision.`}
              href="/worklist?queue=amber"
            />
            <AlertCard
              accentVar="--blue-queue"
              softVar="--blue-queue-soft"
              title="Needs transition"
              message={`${blueQueueTotal} MOGs need a replacement APLs.`}
              href="/worklist?queue=blue"
            />
          </div>
        </div>

        {/* ─── ROW 2 — 5 metric cards ─────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard label="Total Original MOGs" value={mogs.length} />
          <MetricCard
            label="Incremental MOGs"
            value={incrementalMogsCount}
            // accentVar="--blue-queue"
          />
          <MetricCard label="Total Articles" value={aplTotals.total} />
          <MetricCard
            label="Mapped MOGs"
            value={aplTotals.mapped}
            // accentVar="--green-queue"
          />
          <MetricCard
            label="Unmapped MOGs"
            value={Math.max(0, aplTotals.total - aplTotals.mapped)}
            // accentVar="--amber-queue"
          />
        </div>

        {/* ─── ROW 3 — Work Progress ──────────────────────────────
            Each queue rendered as its own card with breathing room
            for clearer hierarchy and scannability. */}
        <section className="flex flex-col gap-3">
          <Eyebrow>Work progress</Eyebrow>
          <div className="flex flex-col gap-3">
            <ActivityRow
              label="Matches"
              helperText="High-confidence items, you can map quickly."
              cell={movement.green}
              href="/worklist?queue=green"
              tone="green"
            />
            <ActivityRow
              label="Likely Matches"
              helperText="Low-confidence matches that need quick review."
              cell={movement.amber}
              href="/worklist?queue=amber"
              tone="amber"
            />
            <ActivityRow
              label="No Match"
              helperText="No article mapped yet. Add mapping options."
              cell={movement.red}
              href="/worklist?queue=red"
              tone="red"
            />
            <ActivityRow
              label="Retiring"
              helperText="Mapped article is retiring. Plan the transition."
              cell={movement.blue}
              href="/worklist?queue=blue"
              tone="blue"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Eyebrow — single typographic device for section labels. No box.
 * ──────────────────────────────────────────────────────────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Panel — minimal bordered container for the dashboard cards.
 * Hairline border only, no shadows. Default p-5; callers can pass a
 * className to override (e.g. p-4 for the tighter top-row cards).
 * ──────────────────────────────────────────────────────────────────────── */
function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card/40 p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * SemiCircleGauge — inline SVG half-arc for "today's progress".
 * Top-half gauge that fills clockwise from the left endpoint. Background
 * arc shows the muted track; foreground arc fills proportionally to pct.
 * Center-bottom label slot is left to the parent (rendered absolutely)
 * so the % digit + caption can be styled without coupling to the SVG.
 * ──────────────────────────────────────────────────────────────────────── */
function SemiCircleGauge({
  pct,
  size = 160,
  stroke = 14,
}: {
  pct: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = radius + stroke / 2; // top of arc at y=stroke/2
  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;
  const arcLength = Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * arcLength;
  const svgHeight = radius + stroke; // top of stroke + half stroke at the chord ends

  return (
    <svg
      width={size}
      height={svgHeight}
      viewBox={`0 0 ${size} ${svgHeight}`}
      role="img"
      aria-label={`Today's progress: ${Math.round(pct)} percent`}
    >
      {/* Background half-arc */}
      <path
        d={arcPath}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* Foreground progress arc */}
      <path
        d={arcPath}
        fill="none"
        stroke="var(--green-queue)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${arcLength}`}
        style={{ transition: "stroke-dasharray 500ms ease" }}
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * MetricCard — standalone bordered metric card for Row 2.
 * Big numeric on top, small uppercase label below, optional left accent
 * stripe. Designed to live in a 4-col grid; padding handled internally.
 * ──────────────────────────────────────────────────────────────────────── */
function MetricCard({
  label,
  value,
  accentVar,
}: {
  label: string;
  value: number;
  accentVar?: string;
}) {
  return (
    <div className="relative rounded-lg border border-border/70 bg-card/40 px-3.5 py-2.5 overflow-hidden">
      {accentVar && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: `var(${accentVar})` }}
        />
      )}
      <div
        className="text-[22px] font-semibold leading-none tracking-tight tabular-nums numeric-tabular text-foreground"
        style={accentVar ? { color: `var(${accentVar})` } : undefined}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * AlertCard — small notice card with title + body + CTA link.
 * Soft-tinted left edge mirrors the queue identity. Whole card is a
 * link for easier targeting; the CTA chip on the right is a visual
 * anchor, not a separate hit area.
 * ──────────────────────────────────────────────────────────────────────── */
function AlertCard({
  title,
  message,
  href,
  accentVar,
  softVar,
}: {
  title: string;
  message: string;
  href: string;
  accentVar: string;
  softVar: string;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-lg border border-border/70 px-3.5 py-2.5 flex items-center gap-3 transition-colors hover:bg-accent/30 overflow-hidden"
      style={{ backgroundColor: `var(${softVar})` }}
      aria-label={title}
    >
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: `var(${accentVar})` }}
      />
      <div className="flex-1 min-w-0">
        <div
          className="text-[10.5px] uppercase tracking-[0.14em] font-semibold"
          style={{ color: `var(${accentVar})` }}
        >
          {title}
        </div>
        <p className="mt-1 text-xs text-foreground/85 leading-snug">
          {message}
        </p>
      </div>
      {/* Arrow-only affordance — the entire card is the click
          target (Link wrapper above), so the arrow is purely
          visual. group-hover translates it 2px right to reinforce
          "this is going somewhere". aria-hidden so screen readers
          don't read "arrow"; the Link's aria-label carries intent. */}
      <ArrowRight
        aria-hidden="true"
        className="shrink-0 h-4 w-4 transition-transform group-hover:translate-x-0.5"
        style={{ color: `var(${accentVar})` }}
      />
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * ActivityRow — Work Progress row.
 * Layout (3 visual lines per row):
 *   [label  ←                              total →]   ← top
 *   [████████░░░░░░░░░░░░░░░░░▓▓▓▓░░░░░░░░░░░]      ← chunky bar (h-3.5)
 *   [✔ N done  · +N added]                            ← stacked text
 *
 * Bar segments in spec order: green completed → grey remaining →
 * amber added today. Empty segments are skipped so proportions are
 * exact. Whole row links to the matching list/queue.
 * ──────────────────────────────────────────────────────────────────────── */
function ActivityRow({
  label,
  helperText,
  cell,
  href,
  tone,
}: {
  label: string;
  helperText: string;
  cell: { completedToday: number; remainingOld: number; newToday: number };
  href: string;
  tone: "green" | "amber" | "red" | "blue";
}) {
  const { completedToday, remainingOld, newToday } = cell;
  const newTodayCount = newToday;
  const remaining = remainingOld;
  const total = completedToday + remaining + newTodayCount;
  const progressPct =
    total > 0 ? Math.max(0, Math.min(100, Math.round((completedToday / total) * 100))) : 0;
  const pendingCount = remaining + newTodayCount;

  const toneStyles: Record<
    "green" | "amber" | "red" | "blue",
    {
      text: string;
      softBg: string;
      bar: string;
      badgeBg: string;
      badgeText: string;
      ctaBg: string;
      ctaText: string;
      ctaBorder: string;
    }
  > = {
    green: {
      text: "text-[var(--green-queue)]",
      softBg: "bg-[var(--green-queue-soft)]/80",
      bar: "bg-[var(--green-queue)]",
      badgeBg: "bg-[var(--green-queue-soft)]",
      badgeText: "text-[var(--green-queue)]",
      ctaBg: "bg-[var(--green-queue-soft)]",
      ctaText: "text-[var(--green-queue)]",
      ctaBorder: "border-[var(--green-queue)]/35",
    },
    amber: {
      text: "text-[var(--amber-queue)]",
      softBg: "bg-[var(--amber-queue-soft)]/70",
      bar: "bg-[var(--amber-queue)]",
      badgeBg: "bg-[var(--amber-queue-soft)]",
      badgeText: "text-[var(--amber-queue)]",
      ctaBg: "bg-[var(--amber-queue-soft)]",
      ctaText: "text-[var(--amber-queue)]",
      ctaBorder: "border-[var(--amber-queue)]/35",
    },
    red: {
      text: "text-[var(--red-queue)]",
      softBg: "bg-[var(--red-queue-soft)]/70",
      bar: "bg-[var(--red-queue)]",
      badgeBg: "bg-[var(--red-queue-soft)]",
      badgeText: "text-[var(--red-queue)]",
      ctaBg: "bg-[var(--red-queue-soft)]",
      ctaText: "text-[var(--red-queue)]",
      ctaBorder: "border-[var(--red-queue)]/35",
    },
    blue: {
      text: "text-[var(--blue-queue)]",
      softBg: "bg-[var(--blue-queue-soft)]/70",
      bar: "bg-[var(--blue-queue)]",
      badgeBg: "bg-[var(--blue-queue-soft)]",
      badgeText: "text-[var(--blue-queue)]",
      ctaBg: "bg-[var(--blue-queue-soft)]",
      ctaText: "text-[var(--blue-queue)]",
      ctaBorder: "border-[var(--blue-queue)]/35",
    },
  };
  const toneStyle = toneStyles[tone];

  const tooltipText = `${completedToday} done · ${remaining} remaining · +${newTodayCount} added today · ${total} total`;
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border border-border/70 bg-card/40 px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:bg-accent/20 hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:border-border"
    >
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-3 items-start">
        {/* LEFT — badge, description, progress bar, bottom-left stats. */}
        <div className="min-w-0 flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5">
            <span
              className={cn(
                "inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                toneStyle.badgeBg,
                toneStyle.badgeText
              )}
            >
              {label}
            </span>
            <p className="text-[12.5px] text-muted-foreground leading-snug break-words">
              {helperText}
            </p>
          </div>

          {/* Progress bar — width reduced to ~72% per spec for less
              horizontal density. */}
          <div
            className={cn(
              "h-2 w-[72%] max-w-md rounded-full overflow-hidden cursor-help",
              toneStyle.softBg
            )}
            role="img"
            aria-label={`${label}: ${tooltipText}`}
            title={tooltipText}
          >
            <div
              className={cn("h-full transition-all duration-500", toneStyle.bar)}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="text-[11.5px] numeric-tabular tabular-nums flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-foreground/85 font-medium">
              Remaining: <span className="text-foreground">{remaining}</span>
            </span>
            <span className="text-foreground/80 font-medium">
              New today: <span className="text-foreground">+{newTodayCount}</span>
            </span>
          </div>
        </div>

        {/* RIGHT — open count, ratio, CTA. Right-aligned column. */}
        <div className="shrink-0 flex flex-col items-end gap-2 self-stretch justify-between min-w-[120px]">
          <div className="text-right">
            <p className="numeric-tabular tabular-nums text-[15px] font-semibold text-foreground leading-none">
              Open: {pendingCount}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground numeric-tabular tabular-nums leading-none">
              {completedToday}/{total} done
            </p>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              toneStyle.ctaBg,
              toneStyle.ctaText,
              toneStyle.ctaBorder
            )}
          >
            View tasks
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
