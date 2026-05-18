"use client";

import { useMemo, useState } from "react";
import { Search, Soup } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMockStore } from "@/lib/mock-store";
import { cn } from "@/lib/utils";

interface MogPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exceptionId: string;
}

export function MogPickerDialog({ open, onOpenChange, exceptionId }: MogPickerDialogProps) {
  const mogs = useMockStore((s) => s.mogs);
  const linkOrphanToMog = useMockStore((s) => s.linkOrphanToMog);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return mogs.slice(0, 30);
    return mogs.filter(
      (m) =>
        m.name.toLowerCase().includes(s) ||
        m.genericIngredient.toLowerCase().includes(s) ||
        m.category.toLowerCase().includes(s)
    );
  }, [mogs, search]);

  const submit = () => {
    if (!selectedId) return;
    linkOrphanToMog(exceptionId, selectedId);
    setSearch("");
    setSelectedId(null);
    onOpenChange(false);
  };

  const close = (next: boolean) => {
    if (!next) {
      setSearch("");
      setSelectedId(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Link MOG</DialogTitle>
          <DialogDescription>
            Search and select a MOG to link this article to.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search MOG name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="pl-8"
          />
        </div>

        <ScrollArea className="h-72 rounded-md border border-border">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center px-6 py-12">
              <Soup className="h-7 w-7 text-muted-foreground/70" />
              <p className="text-sm font-medium mt-3">No matching Ingredient</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                If no Ingredient fits, close this dialog and choose <span className="font-medium">Request new Ingredient</span> instead.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {results.map((m) => {
                const isSelected = selectedId === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-3",
                      isSelected ? "bg-accent" : "hover:bg-accent/50"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] uppercase tracking-wider text-foreground">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!selectedId}>
            Confirm link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
