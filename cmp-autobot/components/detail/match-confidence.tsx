"use client";

import { Gauge } from "lucide-react";
import type { DecisionConfidence } from "@/lib/selectors";
import { cn } from "@/lib/utils";

const TONE: Record<
  DecisionConfidence["tone"],
  { wrap: string; bar: string; text: string; track: string }
> = {
  green: {
    wrap: "border-green-queue/30 bg-green-queue-soft/40",
    bar: "bg-green-queue",
    text: "text-green-queue",
    track: "bg-green-queue/15",
  },
  amber: {
    wrap: "border-amber-queue/30 bg-amber-queue-soft/40",
    bar: "bg-amber-queue",
    text: "text-amber-queue",
    track: "bg-amber-queue/15",
  },
  red: {
    wrap: "border-red-queue/30 bg-red-queue-soft/40",
    bar: "bg-red-queue",
    text: "text-red-queue",
    track: "bg-red-queue/15",
  },
  blue: {
    wrap: "border-blue-queue/30 bg-blue-queue-soft/40",
    bar: "bg-blue-queue",
    text: "text-blue-queue",
    track: "bg-blue-queue/15",
  },
  neutral: {
    wrap: "border-border bg-muted/40",
    bar: "bg-foreground/40",
    text: "text-foreground",
    track: "bg-muted",
  },
};

interface MatchConfidenceProps {
  confidence: DecisionConfidence;
  /** "compact" for inline use, "panel" for headers where it stands alone. */
  variant?: "compact" | "panel";
  className?: string;
}

export function MatchConfidence({
  confidence,
  variant = "panel",
  className,
}: MatchConfidenceProps) {
  const tone = TONE[confidence.tone];
  const score = confidence.score ?? 0;
  const hasScore = confidence.score !== null;

  if (variant === "compact") {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold numeric-tabular",
            tone.wrap,
            tone.text
          )}
        >
          <Gauge className="h-3 w-3" />
          {hasScore ? (
            <>
              {score}
              <span className="text-[9.5px] font-medium opacity-70">/100</span>
            </>
          ) : (
            <>—</>
          )}
        </span>
        <span className={cn("text-[11px] font-medium", tone.text)}>{confidence.label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 flex items-center gap-3",
        tone.wrap,
        className
      )}
    >
      <Gauge className={cn("h-4 w-4 shrink-0", tone.text)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
            Match confidence
          </span>
          <span className={cn("text-[11px] font-semibold", tone.text)}>{confidence.label}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className={cn("flex-1 h-1.5 rounded-full overflow-hidden", tone.track)}>
            {hasScore && (
              <div
                className={cn("h-full transition-all", tone.bar)}
                style={{ width: `${Math.min(100, Math.max(2, score))}%` }}
              />
            )}
          </div>
          <span className={cn("text-[12.5px] font-semibold numeric-tabular", tone.text)}>
            {hasScore ? (
              <>
                {score}
                <span className="text-[9.5px] opacity-70 ml-0.5">/100</span>
              </>
            ) : (
              "—"
            )}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{confidence.detail}</p>
      </div>
    </div>
  );
}
