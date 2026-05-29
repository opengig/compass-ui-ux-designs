// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { C } from "../data/tokens";
import { ARTS, APPR } from "../data/mockData";
import { useNutritionist } from "../NutritionistContext";

/**
 * Dashboard screen — CMP Autobot-style work view (29 May review).
 *
 * ROW 1  Work Progress (all-time gauge) + 4 metric cards
 *        (Pending / Approved / Reviewed / Retired APL).
 * ROW 2  Per-queue progress rows — brand-coloured only.
 *
 * Full-bleed width (no max-width gutter). Per-queue daily flow numbers are
 * demo data (the mock ARTS feed has no per-day movement); the metric cards
 * stay tied to live ARTS counts.
 */

const BRAND = { accent: C.pr, text: C.am, soft: "#FEF3E0", border: C.amBdr };

/* Semi-circle gauge — brand fill. */
function SemiCircleGauge({ pct, size = 120, stroke = 12 }) {
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = radius + stroke / 2;
  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;
  const arcLength = Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * arcLength;
  const svgHeight = radius + stroke;
  return (
    <svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`} role="img" aria-label={`Work progress: ${Math.round(pct)} percent`}>
      <path d={arcPath} fill="none" stroke={C.border} strokeWidth={stroke} strokeLinecap="round" />
      <path d={arcPath} fill="none" stroke={C.gr} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${dash} ${arcLength}`} style={{ transition: "stroke-dasharray 500ms ease" }} />
    </svg>
  );
}

/* Metric card — previous style: uppercase label, big number, sub-line, accent edge. */
function MetricCard({ label, val, sub, accent }) {
  return (
    <div style={{
      backgroundColor: C.card, borderRadius: 8, padding: "16px 14px",
      border: `1px solid ${C.border}`, borderLeft: `3px solid ${accent}`,
      boxShadow: "0 1px 2px rgba(26,26,26,0.05)",
    }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: C.mutedFg, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: C.fg, lineHeight: 1.1, letterSpacing: "-0.02em", fontFeatureSettings: '"tnum"', marginBottom: 4 }}>{val}</p>
      <p style={{ fontSize: 11, color: C.mutedFg }}>{sub}</p>
    </div>
  );
}

/* ActivityRow — one queue. Brand-coloured throughout. */
function ActivityRow({ label, helper, cell, onClick }) {
  const { completedToday, remainingOld, newToday } = cell;
  const total = completedToday + remainingOld + newToday;
  const progressPct = total > 0 ? Math.max(0, Math.min(100, Math.round((completedToday / total) * 100))) : 0;
  const open = remainingOld + newToday;
  return (
    <button
      onClick={onClick}
      data-flat
      className="text-left"
      style={{
        backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: "14px 20px", cursor: "pointer", boxShadow: "0 1px 2px rgba(26,26,26,0.05)",
        display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", columnGap: 24, alignItems: "stretch",
      }}
    >
      {/* LEFT */}
      <div className="min-w-0 flex flex-col" style={{ gap: 9 }}>
        <div className="flex flex-col" style={{ gap: 4 }}>
          <span style={{
            alignSelf: "flex-start", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
            color: BRAND.text, backgroundColor: BRAND.soft, border: `1px solid ${BRAND.border}`,
            borderRadius: 6, padding: "3px 8px",
          }}>
            {label}
          </span>
          <p style={{ fontSize: 12, color: C.mutedFg, lineHeight: 1.4 }}>{helper}</p>
        </div>
        <div className="flex flex-wrap items-center" style={{ gap: 16, fontSize: 11.5, fontFeatureSettings: '"tnum"' }}>
          <span style={{ color: C.ink2, fontWeight: 500 }}>Remaining: <span style={{ color: C.fg }}>{remainingOld}</span></span>
          <span style={{ color: C.ink2, fontWeight: 500 }}>New today: <span style={{ color: C.fg }}>+{newToday}</span></span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col items-end justify-between" style={{ gap: 8, minWidth: 120 }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.fg, lineHeight: 1, fontFeatureSettings: '"tnum"' }}>Open: {open}</p>
        </div>
        <span className="dash-cta" style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 11.5, fontWeight: 700, color: "#fff", backgroundColor: C.pr, border: `1px solid ${C.pr}`,
          borderRadius: 7, padding: "6px 12px", whiteSpace: "nowrap",
          boxShadow: "0 1px 2px rgba(198,138,30,0.25)",
        }}>
          View tasks <ArrowRight size={12} color="#fff" />
        </span>
      </div>
    </button>
  );
}

export function DashboardScreen() {
  const navigate = useNavigate();
  const { selectedSites, setQueueTab } = useNutritionist();
  const goApp = (s) => navigate(`/nutritionist/${s}`);
  const goQueue = (tab) => { setQueueTab(tab); goApp("queue"); };

  // ── Live counts for the metric cards ──
  const siteArts = ARTS.filter((a) => selectedSites.includes(a.site));
  const pendingReview = siteArts.filter((a) => a.status === "amber" || a.status === "red").length;
  const approvedArticles = [...new Set(APPR.map((a) => a.artId))]
    .map((id) => ARTS.find((a) => a.id === id))
    .filter((a) => a && selectedSites.includes(a.site)).length;
  const reviewedArticles = siteArts.length;
  const retiredApl = siteArts.filter((a) => a.retired).length;

  // ── Per-queue flow (demo) ──
  const movement = {
    green: { completedToday: 6, newToday: 3, remainingOld: 5 },
    amber: { completedToday: 5, newToday: 8, remainingOld: 17 },
    red:   { completedToday: 2, newToday: 4, remainingOld: 10 },
    sme:   { completedToday: 0, newToday: 1, remainingOld: 2 },
  };

  // ── All-time work progress (overall, not "today") ──
  const completedAll = Object.values(movement).reduce((s, m) => s + m.completedToday, 0);
  const totalAll = Object.values(movement).reduce((s, m) => s + m.completedToday + m.newToday + m.remainingOld, 0);
  const progressPct = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: C.page }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 flex items-center justify-between" style={{ height: 56, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-baseline" style={{ gap: 10 }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: C.ink2, letterSpacing: "-0.01em" }}>Welcome back, Priya</h1>
          <span style={{ fontSize: 11, color: C.mutedFg }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
      </div>

      {/* Body — full width */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex flex-col" style={{ gap: 18 }}>

          {/* ── ROW 1 — Work Progress gauge + 4 metric cards ── */}
          <div className="grid" style={{ gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr", gap: 12, alignItems: "stretch" }}>
            {/* Work Progress (all-time) */}
            <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: C.mutedFg }}>Work Progress</p>
              <div className="flex items-center" style={{ gap: 16, marginTop: 8 }}>
                <div style={{ position: "relative", width: 120, flexShrink: 0 }}>
                  <SemiCircleGauge pct={progressPct} size={120} stroke={12} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 2, textAlign: "center" }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: C.fg, fontFeatureSettings: '"tnum"' }}>{progressPct}%</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 4 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.fg, lineHeight: 1.05, letterSpacing: "-0.02em", fontFeatureSettings: '"tnum"' }}>
                    {completedAll}
                    <span style={{ color: C.ink4, margin: "0 4px" }}>/</span>
                    {totalAll}
                    <span style={{ fontSize: 12.5, fontWeight: 400, color: C.mutedFg, marginLeft: 8 }}>reviewed</span>
                  </div>
                  <button
                    onClick={() => goQueue("all")}
                    style={{
                      marginTop: 6, alignSelf: "flex-start",
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontSize: 12, fontWeight: 700, color: "#fff", backgroundColor: C.pr, border: `1px solid ${C.pr}`,
                      borderRadius: 7, padding: "6px 12px", cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(198,138,30,0.25)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.prHov; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.pr; }}>
                    Continue review <ArrowRight size={12} color="#fff" />
                  </button>
                </div>
              </div>
            </div>

            <MetricCard label="Pending Reviews" val={pendingReview}    sub="Awaiting your review"     accent={C.pr} />
            <MetricCard label="Approved Items"  val={approvedArticles} sub="Ready to Cookbook"        accent={C.gr} />
            <MetricCard label="Reviewed Items"  val={reviewedArticles} sub="Total profiles reviewed"  accent={C.info} />
            <MetricCard label="Retired APL"     val={retiredApl}       sub="Mapped article retired"   accent={C.mutedFg} />
          </div>

          {/* ── ROW 2 — Per-queue progress (no section title) ── */}
          <div className="flex flex-col" style={{ gap: 12 }}>
            <ActivityRow
              label="Ready to Cookbook Articles"
              helper="High-confidence items, you can map quickly."
              cell={movement.green}
              onClick={() => goQueue("green")}
            />
            <ActivityRow
              label="Need To Review Articles"
              helper="Low-confidence articles that need quick review."
              cell={movement.amber}
              onClick={() => goQueue("amber")}
            />
            <ActivityRow
              label="Need To Fix Articles"
              helper="Low-confidence articles that need to be fixed."
              cell={movement.red}
              onClick={() => goQueue("red")}
            />
            <ActivityRow
              label="Article SME Updated Articles"
              helper="Updated by the Article SME."
              cell={movement.sme}
              onClick={() => goQueue("sme")}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
