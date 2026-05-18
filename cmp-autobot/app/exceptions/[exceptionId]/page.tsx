"use client";

import { use, Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { ExceptionDetailTable } from "@/components/exceptions/exception-detail-table";
import { ExceptionsDetailShell } from "@/components/exceptions/exceptions-detail-shell";

/**
 * Exception detail route — full-width table-style detail panel,
 * matching the table-first pattern of /exceptions. The previous
 * master-detail sidebar (left list of exceptions for hopping
 * between cases) is gone; users get back to the queue via the
 * "Back to all exceptions" link in the header.
 */
export default function ExceptionDetailPage({
  params,
}: {
  params: Promise<{ exceptionId: string }>;
}) {
  const { exceptionId } = use(params);
  return (
    <ExceptionsDetailShell>
      <Suspense fallback={null}>
        <Inner exceptionId={exceptionId} />
      </Suspense>
    </ExceptionsDetailShell>
  );
}

function Inner({ exceptionId }: { exceptionId: string }) {
  const exception = useMockStore((s) =>
    s.exceptions.find((e) => e.id === exceptionId)
  );
  if (!exception) return notFound();

  return (
    <div className="flex h-full flex-col">
      {/* Top breadcrumb-style nav back to the table view. Compact
          row, never sticky — the ExceptionDetailTable below has
          its own sticky header for the exception's status + meta. */}
      <div className="shrink-0 border-b border-border bg-card/30 px-6 py-2.5">
        <Link
          href="/exceptions"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to all exceptions
        </Link>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto bg-background">
        <ExceptionDetailTable exception={exception} />
      </div>
    </div>
  );
}
