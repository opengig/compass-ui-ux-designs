"use client";

import { Suspense } from "react";
import { WorklistPane } from "./worklist-pane";

interface WorklistDetailShellProps {
  children: React.ReactNode;
  /**
   * Optional right-side aux panel. When defined (including null),
   * the shell renders a fixed ~320px column on the right.
   * Omit the prop entirely for a 2-column layout (left + center).
   */
  rightPanel?: React.ReactNode;
}

export function WorklistDetailShell({ children, rightPanel }: WorklistDetailShellProps) {
  const hasRightPanel = rightPanel !== undefined;

  return (
    // Bounded viewport-height layout — page (body) never scrolls.
    // TopBar (h-14, sticky) above consumes 3.5rem; we fill the rest.
    // Each pane handles its own internal scroll where applicable.
    <div className="flex h-[calc(100vh-3.5rem)] min-w-0 overflow-hidden">
      {/* Left: queue list — fixed width, no aside-level scroll
          (WorklistPane uses its own ScrollArea for the row list). */}
      <aside className="w-[420px] shrink-0 border-r border-border min-w-0 overflow-hidden">
        <Suspense fallback={null}>
          <WorklistPane />
        </Suspense>
      </aside>

      {/* Center: caller controls header + body. Bounded; no scroll on the
          section itself — children declare which inner region scrolls. */}
      <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-background overflow-hidden">
        {children}
      </section>

      {/* Right: aux panel — fixed width, internal scroll if present. */}
      {hasRightPanel && (
        <aside className="w-80 shrink-0 border-l border-border min-h-0 overflow-y-auto bg-card/20">
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
