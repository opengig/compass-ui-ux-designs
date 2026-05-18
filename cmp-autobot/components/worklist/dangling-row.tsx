"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { APL, ExceptionRecord, Site } from "@/lib/types";
import { cn, aplCode, SECONDARY_BUTTON } from "@/lib/utils";
import { MogPickerDialog } from "@/components/exceptions/mog-picker-dialog";

interface DanglingRowProps {
  exception: ExceptionRecord;
  apl: APL | undefined;
  site?: Site | undefined;
  columnVisibility?: {
    categoryPath: boolean;
    reasons: boolean;
    status: boolean;
    lastUpdated: boolean;
  };
}

export function DanglingRow({
  exception,
  apl,
  columnVisibility = { categoryPath: true, reasons: true, status: true, lastUpdated: true },
}: DanglingRowProps) {
  const [linkOpen, setLinkOpen] = useState(false);

  const displayName = apl
    ? [apl.characteristic, apl.packSize].filter(Boolean).join(" · ") ||
      `${apl.brand && apl.brand !== "UB" ? `${apl.brand} ` : ""}${apl.genericName}`
    : "Unmapped Article";
  // Mirror the parent-row hierarchy: APL has no MOG link here, so
  // build a breadcrumb from the APL fields directly.
  const hierarchyParts = apl
    ? [apl.categoryName, apl.genericName, apl.characteristic].filter(
        (p): p is string => Boolean(p && p.trim())
      )
    : [];

  return (
    <>
      <tr
        className={cn(
          "group border-b border-border/40 transition-colors bg-white hover:bg-zinc-50"
        )}
      >
        {/* Col 1 — checkbox slot */}
        <td className="px-4 py-1.5 align-middle" aria-hidden="true" />
        {/* Col 2 — chevron slot */}
        <td className="px-3 py-1.5 align-middle" aria-hidden="true" />
        {/* Col 3 — MOG (no MOG linked) */}
        <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]">
          <span className="text-[13px] font-medium text-muted-foreground/50">No MOG</span>
        </td>
        {/* Col 4 — Article */}
        <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="text-[13px] font-[500] text-foreground/90 truncate"
                title={displayName}
              >
                {displayName}
              </span>
              {apl && (
                <span className="shrink-0 numeric-tabular text-[10.5px] text-muted-foreground/45">
                  {aplCode(apl)}
                </span>
              )}
            </div>
            {hierarchyParts.length > 0 && (
              <div className="mt-0.5 text-[10.5px] text-muted-foreground/65 truncate">
                {hierarchyParts.join(" › ")}
              </div>
            )}
          </div>
        </td>
        {/* Col 5 — Category Path */}
        {columnVisibility.categoryPath && (
          <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]" />
        )}
        {/* Col 6 — Reason (empty for dangling rows) */}
        {columnVisibility.reasons && (
          <td className="px-3 py-1.5 align-middle" />
        )}
        {/* Col 7 — Status */}
        {columnVisibility.status && (
          <td className="px-3 py-1.5 align-middle border-r border-r-black/[0.03]" />
        )}
        {/* Col 8 — Last updated */}
        {columnVisibility.lastUpdated && (
          <td className="px-3 py-1.5 align-middle" />
        )}
        {/* Col 8 — Actions: Confirm (disabled) + Reject (disabled) + Link MOG → Map Ingredient */}
        <td className="px-3 py-1.5 align-middle text-right">
          <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
            <button
              type="button"
              disabled
              className="inline-flex h-6 items-center whitespace-nowrap rounded-md border px-2.5 text-[11px] font-medium bg-green-50/50 text-green-600 border-green-200/50 opacity-35 cursor-not-allowed"
            >
              Confirm
            </button>
            <button
              type="button"
              disabled
              className="inline-flex h-6 items-center whitespace-nowrap rounded-md border px-2.5 text-[11px] font-medium bg-red-50/50 text-red-400 border-red-200/50 opacity-35 cursor-not-allowed"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => setLinkOpen(true)}
              className={SECONDARY_BUTTON}
            >
              <Plus className="h-3 w-3" strokeWidth={2.5} />
              Link MOG
            </button>
          </div>
        </td>
      </tr>

      <MogPickerDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        exceptionId={exception.id}
      />
    </>
  );
}
