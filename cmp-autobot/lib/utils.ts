import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeDays(from: string | Date, to: string | Date = new Date()) {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  const days = Math.floor((b - a) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export function daysBetween(from: Date | string, to: Date | string) {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
}

// ─── Display codes ───
// Real SAP/ODS records carry alphanumeric article + material codes. The
// prototype's domain ids (e.g. 'mog-paneer') are useful for routing but read
// as engineering noise to a CMP analyst. These helpers derive a stable,
// human-readable code from the id without requiring data migration.

function stableHash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) + input.charCodeAt(i);
    h |= 0; // force 32-bit
  }
  return Math.abs(h);
}

/**
 * MOG material code — format MOG-<3-letter category>-<4-digit suffix>.
 * Example: { id: 'mog-paneer', category: 'Dairy' } → 'MOG-DRY-2008'
 */
export function mogCode(mog: { id: string; category?: string }): string {
  const cat = (mog.category ?? "GEN").replace(/[^A-Za-z]/g, "").toUpperCase();
  const prefix = (cat.slice(0, 3) || "GEN").padEnd(3, "X");
  const suffix = (stableHash(mog.id) % 9000) + 1000;
  return `MOG-${prefix}-${suffix}`;
}

/**
 * APL article code — 6-digit number prefixed with `#` for clear
 * separation from the article description in cells where the two
 * sit side-by-side (e.g. "Active Dry · 1×500 g · Gloripan #561025").
 * Modelled on SAP article numbering. Example:
 *   'apl-paneer-mother-dairy-1kg' → '#220089'
 */
export function aplCode(apl: { id: string }): string {
  return `#${(stableHash(apl.id) % 900000) + 100000}`;
}

/**
 * Canonical secondary action button class. Single source of
 * truth for every "neutral / not-primary / not-destructive"
 * action in the Worklist surface (Add Article, Raise Issue,
 * Add Article, "+ Add Article" footer, dangling-row
 * Raise Issue). h-7 (28px), bg-background border-border, muted
 * text, hover:bg-accent. Confirm stays solid green; Reject
 * stays red-tinted outline; everything else uses this.
 */
export const SECONDARY_BUTTON =
  "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-background px-2 text-[11.5px] font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
