"use client";

import { cn } from "@/lib/utils";

/* Breadcrumb-style renderer for hierarchy / category-path cells.
 * Used by both the Worklist table and the Exceptions table so the
 * two surfaces read alike — single source of truth for the chip
 * styling + tier contrast.
 *
 * Sizing / layout:
 *   - 13px text + leading-normal (1.5) for relaxed readability
 *   - inline-block + max-w-full so the chip hugs content width
 *     up to the parent cell, then wraps naturally if a path is
 *     long. No truncation / ellipsis — every segment renders in
 *     full so users never lose taxonomy context.
 *   - subtle bg-foreground/[0.03] wash + rounded corners +
 *     px-1.5/py-0.5 padding gives the cell its own soft "tag"
 *     identity without competing with row background tints.
 *
 * Tier contrast:
 *   - first segment       → text-foreground/65 (muted top-level)
 *   - middle segments     → text-foreground/80
 *   - last visible segment → text-foreground + font-medium
 *     (final classification reads heaviest)
 *
 * Overflow:
 *   - Path longer than MAX_VISIBLE_HIERARCHY_PARTS collapses the
 *     extras into a "+N" suffix at the end. Trim at segment
 *     boundaries — the visible portion always reads as a clean
 *     classification, never mid-word. With current data capped
 *     at 3 segments this stays dormant. */
const MAX_VISIBLE_HIERARCHY_PARTS = 3;

export function HierarchyBreadcrumb({
  parts,
  className,
}: {
  parts: string[];
  className?: string;
}) {
  if (parts.length === 0) {
    return (
      <span
        className={cn(
          "inline-block text-[13px] text-muted-foreground/60",
          className
        )}
      >
        —
      </span>
    );
  }
  const visibleParts = parts.slice(0, MAX_VISIBLE_HIERARCHY_PARTS);
  const hiddenCount = Math.max(
    0,
    parts.length - MAX_VISIBLE_HIERARCHY_PARTS
  );

  return (
    <span
      className={cn(
        "inline-flex items-center max-w-full text-[11.5px] leading-normal whitespace-nowrap",
        className
      )}
    >
      {visibleParts.map((part, i) => {
        const isFirst = i === 0;
        const isLastVisible = i === visibleParts.length - 1;
        const tone = isLastVisible
          ? "text-foreground/85"
          : isFirst
          ? "text-foreground/65"
          : "text-foreground/75";
        return (
          <span key={i}>
            <span className={tone}>{part}</span>
            {!isLastVisible && (
              <span
                aria-hidden="true"
                className="mx-1 text-foreground/55"
              >
                ›
              </span>
            )}
          </span>
        );
      })}
      {hiddenCount > 0 && (
        <span className="ml-1 text-foreground/55 font-medium">
          +{hiddenCount}
        </span>
      )}
    </span>
  );
}
