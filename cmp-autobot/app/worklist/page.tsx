"use client";

import { Suspense } from "react";
import { WorklistTable } from "@/components/worklist/worklist-table";

/**
 * Worklist screen — single spreadsheet-style table.
 *
 * Replaced the previous left-list + detail-pane composition with a
 * unified WorklistTable. Every pending mapping is a row; multi-
 * Article rows expand inline; bulk-select drives a sticky action bar.
 * Direct URLs to /worklist/[decisionId] still work for sharing /
 * audit links, but the default flow lives entirely on this page.
 */
export default function WorklistPage() {
  return (
    <Suspense fallback={null}>
      <WorklistTable />
    </Suspense>
  );
}
