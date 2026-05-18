"use client";

import { useMemo } from "react";
import { Bell, Clock, Snowflake, Tag, TriangleAlert } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import type { APL, ExceptionRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ExceptionStatusPill } from "./exception-status-pill";
import { HierarchyBreadcrumb } from "@/components/worklist/hierarchy-breadcrumb";
import { cn, aplCode } from "@/lib/utils";

/* The Exceptions tab focuses purely on Article data-quality cases.
 * Mam-A (Ingredient without Article) and Mam-B (Unmapped Article)
 * route through the Worklist — this surface is for quarantine rows
 * whose APL records arrived from SAP missing fields. The user's
 * only action here is to notify SAP, who fix the underlying record
 * at source.
 *
 * Issue Type derives from the APL's `dataQuality.missingFields`:
 *   categoryName       → Missing Category
 *   shelfLifeCategory  → Missing Shelf Type
 *   anything else      → Missing Fields */

type IssueKind = "missing-category" | "missing-shelf-type" | "missing-fields";

interface IssueTypeMeta {
  label: string;
  /* Pill bg + border. Text colour drives icon + label. */
  bg: string;
  text: string;
  icon: typeof Tag;
}

const ISSUE_META: Record<IssueKind, IssueTypeMeta> = {
  "missing-category": {
    label: "Missing Category",
    bg: "bg-amber-queue-soft border-amber-queue/30",
    text: "text-amber-queue",
    icon: Tag,
  },
  "missing-shelf-type": {
    label: "Missing Shelf Type",
    bg: "bg-amber-queue-soft border-amber-queue/30",
    text: "text-amber-queue",
    icon: Snowflake,
  },
  "missing-fields": {
    label: "Missing Fields",
    bg: "bg-red-queue-soft border-red-queue/30",
    text: "text-red-queue",
    icon: TriangleAlert,
  },
};

function classifyIssue(apl: APL | undefined): IssueKind {
  const missing = apl?.dataQuality.missingFields ?? [];
  if (missing.includes("categoryName")) return "missing-category";
  if (missing.includes("shelfLifeCategory")) return "missing-shelf-type";
  return "missing-fields";
}

export function ExceptionsTable() {
  const exceptions = useMockStore((s) => s.exceptions);
  const apls = useMockStore((s) => s.apls);
  const siteFilter = useMockStore((s) => s.siteFilter);

  // Surface only quarantine cases here. Mam-A / Mam-B route
  // through Worklist. Apply the global site filter from TopBar.
  const visible = useMemo(
    () =>
      exceptions
        .filter((e) => e.type === "quarantine")
        .filter((e) => siteFilter === "all" || e.siteId === siteFilter)
        .sort((a, b) => (a.raisedOn < b.raisedOn ? 1 : -1)),
    [exceptions, siteFilter]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-card/30">
        <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
          Articles needing attention
        </p>
        <h2 className="font-display text-xl tracking-tight mt-0.5">Exceptions queue</h2>
      </div>

      <div className="flex-1 overflow-auto">
        {visible.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center px-8 py-16">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <TriangleAlert className="h-5 w-5" />
              </div>
              <div className="mt-3 text-base font-medium">No exceptions</div>
              <p className="text-sm text-muted-foreground mt-1.5">
                All Articles have complete master-data records.
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
              <tr className="text-left text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium w-[180px]">Issue</th>
                <th className="px-3 py-2.5 font-medium">Article</th>
                <th className="px-3 py-2.5 font-medium">Hierarchy Path</th>
                <th className="px-3 py-2.5 font-medium w-[180px] text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <Row
                  key={e.id}
                  exception={e}
                  apl={e.aplId ? apls.find((a) => a.id === e.aplId) : undefined}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-border bg-card/40 px-6 py-2 text-[11px] text-muted-foreground">
        Showing <span className="numeric-tabular text-foreground font-medium">{visible.length}</span>{" "}
        of <span className="numeric-tabular text-foreground font-medium">{visible.length}</span>{" "}
        exceptions
      </div>
    </div>
  );
}

function Row({
  exception,
  apl,
}: {
  exception: ExceptionRecord;
  apl: APL | undefined;
}) {
  const notifyExceptionSAP = useMockStore((s) => s.notifyExceptionSAP);

  const issue = classifyIssue(apl);
  const meta = ISSUE_META[issue];
  const Icon = meta.icon;

  const isOpen = exception.status === "open";
  // `notifiedAt` is the single source of truth for the button
  // swap — once stamped, the row stays in "Awaiting SAP" until
  // the SAP team fixes the record at source and the row's
  // status flips to resolved on the next ODS refresh.
  const notified = Boolean(exception.notifiedAt);

  // Article column matches the Worklist's Articles column: lead
  // with the SAP description (characteristic · packSize · Brand)
  // — that's how users recognise an APL on the floor — and drop
  // the genericName tier. The genericName still surfaces inside
  // Notify SAP context downstream.
  const articleDescription = apl
    ? [
        apl.characteristic,
        apl.packSize,
        apl.brand && apl.brand !== "UB" ? apl.brand : null,
      ]
        .filter((p): p is string => Boolean(p && p.trim()))
        .join(" · ") || apl.genericName
    : "Unknown Article";

  // Reuse the Worklist's HierarchyBreadcrumb so the chip reads
  // identically across surfaces. When the row's specific quarantine
  // is the missing categoryName, the chip degrades naturally to a
  // single-segment breadcrumb (just the characteristic).
  const categoryParts = [apl?.categoryName, apl?.characteristic].filter(
    (p): p is string => Boolean(p && p.trim())
  );

  return (
    <tr
      className={cn(
        "border-b border-border/70 transition-colors bg-white hover:bg-accent/20",
        isOpen && "border-l-2 border-l-[#F8B80C]"
      )}
    >
      {/* Issue */}
      <td className="px-4 py-3 align-middle">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
            meta.bg,
            meta.text
          )}
        >
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
      </td>

      {/* Article */}
      <td className="px-3 py-3 align-middle border-r border-r-black/[0.06]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-[13px] font-[500] text-foreground/90 truncate"
              title={articleDescription}
            >
              {articleDescription}
            </span>
            {apl && (
              <span className="shrink-0 numeric-tabular text-[10.5px] text-muted-foreground/45">
                {aplCode(apl)}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Category Path */}
      <td className="px-3 py-3 align-middle border-r border-r-black/[0.06]">
        <HierarchyBreadcrumb parts={categoryParts} />
      </td>

      {/* Action — single Notify SAP button per row. After click,
          the button swaps to a disabled "Awaiting SAP" state with
          a clock icon. Resolved rows fall back to their lifecycle
          pill so the user can see SAP closed the loop. */}
      <td className="px-3 py-3 align-middle text-right">
        {!isOpen ? (
          <ExceptionStatusPill status={exception.status} compact />
        ) : notified ? (
          <Button
            size="sm"
            variant="outline"
            disabled
            className="h-6 px-2.5 text-[11px] shadow-none disabled:opacity-100 disabled:cursor-default [&_svg]:size-3"
          >
            <Clock />
            Awaiting SAP
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => notifyExceptionSAP(exception.id)}
            className="h-6 px-2.5 text-[11px] shadow-none bg-[#1F7A4D] text-white border-[#1F7A4D] hover:bg-[#185f3c] [&_svg]:size-3"
          >
            <Bell />
            Notify SAP
          </Button>
        )}
      </td>
    </tr>
  );
}
