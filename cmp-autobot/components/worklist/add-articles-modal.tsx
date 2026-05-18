"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aplCode, cn } from "@/lib/utils";
import type { APL, MOG, MappingDecision } from "@/lib/types";

interface AddArticlesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: MappingDecision | null;
  mog: MOG | undefined;
  apls: APL[];
  buildHierarchy: (mog: MOG | undefined, apl?: APL) => string;
  onAddSelected: (aplIds: string[]) => void;
}

export function AddArticlesModal({
  open,
  onOpenChange,
  decision,
  mog,
  apls,
  buildHierarchy,
  onAddSelected,
}: AddArticlesModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setSelected(new Set());
      setShowPreview(false);
    }
  }, [open, decision?.id]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 150);
    return () => window.clearTimeout(t);
  }, [query]);

  const alreadyOnDecision = useMemo(() => {
    if (!decision) return new Set<string>();
    return new Set([
      ...decision.candidateAplIds,
      ...(decision.rejectedAplIds ?? []),
    ]);
  }, [decision]);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) {
      return apls
        .filter((a) => !alreadyOnDecision.has(a.id))
        .filter((a) => decision && a.siteId === decision.siteId)
        .slice(0, 30);
    }
    return apls
      .filter((a) => !alreadyOnDecision.has(a.id))
      .filter((a) => {
        return (
          a.genericName.toLowerCase().includes(q) ||
          a.brand.toLowerCase().includes(q) ||
          a.characteristic.toLowerCase().includes(q) ||
          aplCode(a).toLowerCase().includes(q)
        );
      })
      .slice(0, 50);
  }, [apls, debouncedQuery, alreadyOnDecision, decision]);

  const allChecked =
    results.length > 0 && results.every((r) => selected.has(r.id));
  const someChecked =
    results.some((r) => selected.has(r.id)) && !allChecked;

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        results.forEach((r) => next.delete(r.id));
      } else {
        results.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  // Step 1: open preview instead of committing directly
  const requestPreview = () => {
    if (selected.size === 0) return;
    setShowPreview(true);
  };

  // Step 2: actually commit from preview
  const confirmAdd = () => {
    onAddSelected(Array.from(selected));
    setShowPreview(false);
    onOpenChange(false);
  };

  // Articles selected, resolved to full APL objects for preview
  const selectedApls = useMemo(
    () => apls.filter((a) => selected.has(a.id)),
    [apls, selected]
  );

  return (
    <>
      {/* ── Main search + select modal ─────────────────────────── */}
      <Dialog open={open && !showPreview} onOpenChange={onOpenChange}>
        <DialogContent className="w-[90vw] sm:max-w-[1000px] p-0 gap-0 max-h-[85vh] flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
            <DialogTitle>
              Link APL to{" "}
              <span className="font-semibold">
                {mog?.name ?? "this MOG"}
              </span>
            </DialogTitle>
            <DialogDescription>
              Search the Article master and pick one or more Articles to attach.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-3 border-b border-border bg-background shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search article by name, code or characteristic…"
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden px-6">
            <div className="h-full rounded-md border border-border overflow-hidden">
              <ScrollArea className="h-full">
                {results.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {debouncedQuery.trim()
                      ? `No Articles match "${debouncedQuery}".`
                      : "No Articles found at this site. Try searching by name or code."}
                  </div>
                ) : (
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col style={{ width: "40px" }} />
                      {/* Description takes the primary slot — no Article Name column */}
                      <col style={{ width: "320px" }} />
                      <col style={{ width: "120px" }} />
                      <col />
                    </colgroup>
                    <thead className="bg-muted/40 border-b border-border sticky top-0 z-10">
                      <tr className="text-left text-[10.5px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-3 py-2.5 font-medium">
                          <Checkbox
                            checked={
                              allChecked
                                ? true
                                : someChecked
                                ? "indeterminate"
                                : false
                            }
                            onCheckedChange={toggleAll}
                            aria-label="Select all visible Articles"
                          />
                        </th>
                        <th className="px-3 py-2.5 font-medium">Description</th>
                        <th className="px-3 py-2.5 font-medium">Code</th>
                        <th className="px-3 py-2.5 font-medium">Hierarchy Path</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((a) => {
                        const isChecked = selected.has(a.id);
                        const desc = [a.characteristic, a.packSize]
                          .filter(Boolean)
                          .join(" · ");
                        const displayName = desc ||
                          `${a.brand && a.brand !== "UB" ? `${a.brand} ` : ""}${a.genericName}`;
                        const hierarchy = buildHierarchy(mog, a);
                        return (
                          <tr
                            key={a.id}
                            className={cn(
                              "h-11 border-b border-border/40 transition-colors cursor-pointer",
                              isChecked
                                ? "bg-accent/40"
                                : "hover:bg-accent/30"
                            )}
                            onClick={() => toggleRow(a.id)}
                          >
                            <td
                              className="px-3 align-middle"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleRow(a.id)}
                                aria-label={`Select ${displayName}`}
                              />
                            </td>
                            {/* Description is now the primary column — same
                                font weight / size as Article Name was */}
                            <td className="px-3 align-middle">
                              <span
                                className="block text-[13px] font-medium truncate"
                                title={displayName}
                              >
                                {displayName || "—"}
                              </span>
                            </td>
                            <td className="px-3 align-middle">
                              <span
                                className="block text-[11.5px] text-muted-foreground numeric-tabular tabular-nums truncate"
                                title={aplCode(a)}
                              >
                                {aplCode(a)}
                              </span>
                            </td>
                            <td className="px-3 align-middle">
                              <span
                                className="block text-[11.5px] text-muted-foreground/80 truncate"
                                title={hierarchy}
                              >
                                {hierarchy || "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between gap-2 items-center px-6 py-4 border-t border-border shrink-0">
            <span className="text-[12px] text-muted-foreground">
              {selected.size === 0
                ? "Select one or more Articles to add."
                : `${selected.size} Article${selected.size === 1 ? "" : "s"} selected`}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={requestPreview} disabled={selected.size === 0}>
                <Plus className="h-4 w-4" />
                {selected.size === 0
                  ? "Link APL"
                  : `Link ${selected.size}`}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Preview modal — confirm before adding ──────────────── */}
      <Dialog open={showPreview} onOpenChange={(o) => { if (!o) setShowPreview(false); }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              Preview — Linking {selectedApls.length} Article{selectedApls.length === 1 ? "" : "s"}
            </DialogTitle>
            <DialogDescription>
              These articles will be linked to{" "}
              <span className="font-medium text-foreground">{mog?.name ?? "this MOG"}</span>.
              Confirm to proceed.
            </DialogDescription>
          </DialogHeader>

          <div className="py-1 max-h-[320px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background border-b border-border">
                <tr className="text-left text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium w-[110px]">Code</th>
                  <th className="pb-2 font-medium">Hierarchy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {selectedApls.map((a) => {
                  const desc = [a.characteristic, a.packSize].filter(Boolean).join(" · ");
                  const displayName = desc ||
                    `${a.brand && a.brand !== "UB" ? `${a.brand} ` : ""}${a.genericName}`;
                  const hierarchy = buildHierarchy(mog, a);
                  return (
                    <tr key={a.id} className="h-10">
                      <td className="py-2 pr-3">
                        <span className="text-[13px] font-medium block truncate" title={displayName}>
                          {displayName || "—"}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="text-[11.5px] text-muted-foreground numeric-tabular">
                          {aplCode(a)}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className="text-[11.5px] text-muted-foreground block truncate" title={hierarchy}>
                          {hierarchy || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <DialogFooter className="gap-2 flex-row justify-end pt-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Back
            </Button>
            <Button onClick={confirmAdd}>
              Confirm — Link {selectedApls.length}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
