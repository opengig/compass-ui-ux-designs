"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, aplCode } from "@/lib/utils";
import type { APL } from "@/lib/types";

interface AddAplDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionId: string;
}

export function AddAplDialog({ open, onOpenChange, decisionId }: AddAplDialogProps) {
  const apls = useMockStore((s) => s.apls);
  const mogs = useMockStore((s) => s.mogs);
  const decisions = useMockStore((s) => s.decisions);
  const addAplToDecision = useMockStore((s) => s.addAplToDecision);

  const decision = decisions.find((d) => d.id === decisionId);
  const mog = mogs.find((m) => m.id === decision?.mogId);
  const alreadyOnDecision = new Set(decision?.candidateAplIds ?? []);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const matches = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) {
      // Show APLs at the same site by default — most relevant
      return apls
        .filter((a) => a.siteId === decision?.siteId && !alreadyOnDecision.has(a.id))
        .slice(0, 30);
    }
    return apls
      .filter((a) => !alreadyOnDecision.has(a.id))
      .filter((a) =>
        a.genericName.toLowerCase().includes(s) ||
        a.characteristic.toLowerCase().includes(s) ||
        a.brand.toLowerCase().includes(s) ||
        a.id.toLowerCase().includes(s)
      )
      .slice(0, 50);
  }, [search, apls, decision?.siteId, alreadyOnDecision]);

  function handleAdd() {
    if (!selectedId) return;
    addAplToDecision(decisionId, selectedId, { manuallyAdded: true });
    setSelectedId(null);
    setSearch("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add an Article to this Ingredient</DialogTitle>
          <DialogDescription>
            Search the Article master and pick the one to attach. The Article
            is mapped to this Ingredient instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by generic name, brand or characteristic…"
            className="pl-8 h-9 text-sm"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-[340px] -mx-1 px-1">
          {matches.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No matching Articles.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {matches.map((a) => {
                const selected = selectedId === a.id;
                // Secondary-line composite — brand · pack size only.
                // Site and price are deliberately omitted (anyone in
                // this picker is choosing by Article identity, not
                // warehouse or cost).
                const subParts: string[] = [];
                if (a.brand) subParts.push(a.brand);
                if (a.packSize) subParts.push(a.packSize);
                const subline = subParts.join(" · ");
                // Hierarchy breadcrumb (L3 › L4 › L5) — same shape as
                // the Worklist + Mapped Items rows so the same data
                // ladder reads consistently across surfaces. The
                // first two tokens are constant per dialog instance
                // (every candidate is for the same Ingredient) but
                // L5 (apl.characteristic) varies, which is what
                // helps the user compare options. Trailing token is
                // suppressed if it already appears in the article
                // name to avoid the "Active Dry / Active Dry Yeast"
                // echo.
                const fullName = `${a.brand !== "UB" ? `${a.brand} ` : ""}${a.genericName}`;
                const rawHierarchy = [
                  mog?.category,
                  mog?.genericIngredient,
                  a.characteristic || null,
                ].filter((p): p is string => Boolean(p));
                const nameLower = fullName.toLowerCase();
                if (
                  rawHierarchy.length > 1 &&
                  nameLower.includes(
                    rawHierarchy[rawHierarchy.length - 1].toLowerCase()
                  )
                ) {
                  rawHierarchy.pop();
                }
                const hierarchy = rawHierarchy.join(" › ");
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(a.id)}
                      className={cn(
                        "w-full text-left rounded-lg border px-3 py-2.5 transition-colors",
                        selected
                          ? "border-foreground/40 ring-1 ring-foreground/15 bg-accent/40"
                          : "border-border bg-background hover:bg-accent/30"
                      )}
                    >
                      {/* 3-line identity stack — name+code, brand+pack,
                          hierarchy. Each line truncates independently
                          so the row stays compact on any width. */}
                      <div className="min-w-0 flex flex-col gap-0.5">
                        {/* Line 1 — Article name + characteristic + code (bold) */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm font-semibold tracking-tight truncate">
                            {a.genericName}
                            {a.characteristic && (
                              <span className="font-normal text-muted-foreground">
                                , {a.characteristic}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 numeric-tabular rounded border border-border bg-background/60 px-1.5 py-px text-[10px] font-medium tracking-wider text-muted-foreground">
                            {aplCode(a)}
                          </span>
                        </div>
                        {/* Line 2 — Brand · pack size (normal text) */}
                        {subline && (
                          <div className="text-xs leading-snug text-foreground/80 truncate">
                            {subline}
                          </div>
                        )}
                        {/* Line 3 — Hierarchy (smaller + muted) */}
                        {hierarchy && (
                          <div
                            className="text-[11px] leading-tight text-muted-foreground/65 truncate"
                            title={hierarchy}
                          >
                            {hierarchy}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedId}>
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Re-exporting APL type for convenience in callers that import from this file.
export type { APL };
