"use client";

import { Suspense } from "react";
import { ExceptionsDetailShell } from "@/components/exceptions/exceptions-detail-shell";
import { ExceptionsTable } from "@/components/exceptions/exceptions-table";

/**
 * Exceptions screen — single spreadsheet-style table, matching the
 * Worklist's table-first pattern. The previous master-detail layout
 * (left list + right detail empty state) was retired so the screen
 * reads as one consistent enterprise data table.
 *
 * Each row routes to /exceptions/[id] for the full ExceptionDetailTable
 * view (link rendered inside ExceptionsTable's Row component).
 */
export default function ExceptionsPage() {
  return (
    <Suspense fallback={null}>
      <ExceptionsDetailShell>
        <ExceptionsTable />
      </ExceptionsDetailShell>
    </Suspense>
  );
}
