"use client";

interface ExceptionsDetailShellProps {
  children: React.ReactNode;
}

export function ExceptionsDetailShell({ children }: ExceptionsDetailShellProps) {
  return (
    // Bounded viewport-height container; no top toggle (Detail/Table view
    // toggle is irrelevant for the Exceptions screen).
    <div className="flex h-[calc(100vh-3.5rem)] min-w-0 flex-col">
      <div className="flex-1 min-h-0 min-w-0">{children}</div>
    </div>
  );
}
