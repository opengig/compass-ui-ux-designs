"use client";

import {
  Package,
  Tag,
  IndianRupee,
  Calendar,
  Star,
  ArrowDown,
  ArrowUp,
  X as XIcon,
} from "lucide-react";
import type { APL, AplMatchStatus } from "@/lib/types";
import { cn, formatCurrencyINR, aplCode } from "@/lib/utils";

interface AplCardProps {
  apl: APL;
  variant?: "default" | "retired" | "candidate" | "default-flag";
  badge?: React.ReactNode;
  isDefault?: boolean;
  defaultReason?: string; // e.g. "Lowest cost at this site"
  costDeltaPct?: number; // % vs default; positive means more expensive than default
  className?: string;
  /** Suppress the redundant "APL" header label when the surrounding section already establishes context. */
  hideLabel?: boolean;
  /** Bot's confidence score 0–100 — rendered as a colored chip. */
  confidence?: number;
  /** ISO timestamp of when the APL was matched/linked to the MOG. */
  matchedAt?: string;
  /** Match status — used to colour confidence + drive copy. */
  matchStatus?: AplMatchStatus;
  /** Per-APL reasoning blurb shown below the title. */
  reasoning?: string;
  /** Reject handler — when supplied, renders a "Reject" inline button. */
  onReject?: () => void;
}

export function AplCard({
  apl,
  variant = "default",
  badge,
  isDefault,
  defaultReason,
  costDeltaPct,
  className,
  hideLabel,
  confidence,
  matchedAt,
  matchStatus,
  reasoning,
  onReject,
}: AplCardProps) {
  const isRetired = variant === "retired" || apl.status === "inactive";
  const isPreviouslyMapped = matchStatus === "previously-mapped";

  return (
    <div
      className={cn(
        "rounded-xl border bg-background p-4 lg:p-5 transition-colors flex flex-col h-full",
        isRetired
          ? "border-blue-queue/40 bg-blue-queue-soft/40 opacity-95"
          : isPreviouslyMapped
          ? "border-foreground/15 bg-foreground/[0.02]"
          : isDefault
          ? "border-foreground/30 ring-1 ring-foreground/15"
          : variant === "candidate"
          ? "border-foreground/10"
          : "border-border",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {!hideLabel && (
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {variant === "candidate" && !isDefault
                ? "Additional Article"
                : isRetired
                ? "Retired Article"
                : "Article"}
            </span>
          )}
          <span className="numeric-tabular rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-[10.5px] font-medium tracking-wider text-muted-foreground">
            {aplCode(apl)}
          </span>
          {isDefault && (
            <span className="inline-flex items-center gap-1 rounded-md bg-foreground text-background px-1.5 py-0.5 text-[10px] font-medium">
              <Star className="h-2.5 w-2.5" />
              Default
            </span>
          )}
          {isPreviouslyMapped && (
            <span className="inline-flex items-center gap-1 rounded-md bg-foreground/10 text-foreground/80 px-1.5 py-0.5 text-[10px] font-medium">
              Currently mapped
            </span>
          )}
          {badge}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {typeof confidence === "number" && (
            <ConfidencePill score={confidence} kind={matchStatus ?? "new-candidate"} />
          )}
          <div className="text-right">
            <div className="numeric-tabular text-base font-medium tracking-tight inline-flex items-center gap-0.5">
              <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
              {formatCurrencyINR(apl.costPerUnit).replace("₹", "")}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">per pack</div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 font-medium tracking-tight text-[15px]">
        {apl.genericName}
        {apl.characteristic && <span className="text-muted-foreground">, {apl.characteristic}</span>}
      </div>

      {reasoning && (
        <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">{reasoning}</p>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12.5px]">
        <Field icon={<Tag className="h-3.5 w-3.5" />} label="Brand" value={apl.brand || "Unbranded"} />
        <Field icon={<Package className="h-3.5 w-3.5" />} label="Pack size" value={apl.packSize || "—"} />
        <Field
          icon={<Calendar className="h-3.5 w-3.5" />}
          label={
            isRetired
              ? "Inactive since"
              : matchedAt
              ? isPreviouslyMapped
                ? "Mapped on"
                : "Matched on"
              : "Last refresh"
          }
          value={new Date(matchedAt ?? apl.inactiveSince ?? apl.lastModified).toLocaleDateString(
            "en-GB",
            { day: "2-digit", month: "short", year: "numeric" }
          )}
        />
        <Field
          icon={
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                isRetired ? "bg-blue-queue" : "bg-green-queue"
              )}
            />
          }
          label="Status"
          value={isRetired ? "Inactive in ODS" : "Active in ODS"}
        />
      </dl>

      {((isDefault && defaultReason) || typeof costDeltaPct === "number" || onReject) && (
        <div className="mt-auto pt-3 border-t border-border/70 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            {isDefault && defaultReason && (
              <div className="flex items-center gap-1.5 text-[11.5px] text-foreground/80">
                <Star className="h-3 w-3 text-foreground/70" />
                <span>{defaultReason}</span>
              </div>
            )}
            {typeof costDeltaPct === "number" && (
              <div
                className={cn(
                  "flex items-center gap-1.5 text-[11.5px]",
                  costDeltaPct > 0 ? "text-amber-queue" : "text-green-queue"
                )}
              >
                {costDeltaPct > 0 ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                <span className="numeric-tabular">
                  {costDeltaPct > 0 ? "+" : ""}
                  {costDeltaPct.toFixed(1)}% vs default
                </span>
              </div>
            )}
          </div>
          {onReject && (
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center gap-1 rounded-md border border-red-queue/30 bg-background px-2.5 py-1 text-[11.5px] font-medium text-red-queue hover:bg-red-queue-soft transition-colors"
            >
              <XIcon className="h-3 w-3" />
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ConfidencePill({ score, kind }: { score: number; kind: AplMatchStatus }) {
  const tone =
    score >= 90 ? "green" : score >= 70 ? "amber" : "red";
  const toneClass =
    tone === "green"
      ? "bg-green-queue-soft text-green-queue border-green-queue/30"
      : tone === "amber"
      ? "bg-amber-queue-soft text-amber-queue border-amber-queue/30"
      : "bg-red-queue-soft text-red-queue border-red-queue/30";
  const label =
    kind === "previously-mapped"
      ? "Mapped"
      : score >= 90
      ? "Sure match"
      : score >= 70
      ? "Likely match"
      : "Low confidence";
  return (
    <div className={cn("flex flex-col items-end gap-0.5")}>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold numeric-tabular",
          toneClass
        )}
      >
        {score}
        <span className="text-[9.5px] font-medium opacity-70">/100</span>
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 font-medium text-foreground/90">{value}</div>
    </div>
  );
}
