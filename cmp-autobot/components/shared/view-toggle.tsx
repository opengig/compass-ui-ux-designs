"use client";

import Link from "next/link";
import { LayoutPanelLeft, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  /** Path used when the user picks the detail view. */
  detailHref: string;
  /** Path used when the user picks the table view. */
  tableHref: string;
  /** Currently active mode. */
  mode: "detail" | "table";
  className?: string;
}

export function ViewToggle({ detailHref, tableHref, mode, className }: ViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="View mode"
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card p-0.5 text-[11px] font-medium",
        className
      )}
    >
      <Pill
        href={detailHref}
        active={mode === "detail"}
        icon={<LayoutPanelLeft className="h-3.5 w-3.5" />}
        label="Detail"
      />
      <Pill
        href={tableHref}
        active={mode === "table"}
        icon={<Rows3 className="h-3.5 w-3.5" />}
        label="Table"
      />
    </div>
  );
}

function Pill({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
