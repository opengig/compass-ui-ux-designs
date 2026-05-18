"use client";

import { useEffect, useState } from "react";
import { X as XIcon } from "lucide-react";
import type { APL } from "@/lib/types";
import { useMockStore } from "@/lib/mock-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface RejectAplDialogProps {
  apl: APL | null;
  decisionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REASON_SUGGESTIONS = [
  "Characteristic doesn't match recipe spec",
  "Brand not approved at this site",
  "Pack size doesn't match recipe portioning",
  "Cost outside acceptable variance",
  "Freshness window unsuitable",
];

export function RejectAplDialog({ apl, decisionId, open, onOpenChange }: RejectAplDialogProps) {
  const rejectAplMatch = useMockStore((s) => s.rejectAplMatch);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  function handleReject() {
    if (!apl || !reason.trim()) return;
    rejectAplMatch(decisionId, apl.id, reason.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XIcon className="h-4 w-4 text-red-queue" />
            Reject this Article
          </DialogTitle>
          <DialogDescription>
            {apl ? (
              <>
                <span className="font-medium text-foreground">{apl.genericName}</span>
                {apl.characteristic && <span className="text-foreground/80">, {apl.characteristic}</span>}
                {" — "}
                {apl.brand || "Unbranded"} · {apl.packSize || "—"}
              </>
            ) : (
              "Provide a reason so the audit trail captures why."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Common reasons
          </div>
          <div className="flex flex-wrap gap-1.5">
            {REASON_SUGGESTIONS.map((s) => {
              const active = reason === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReason(s)}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11.5px] transition-colors",
                    active
                      ? "border-foreground/40 bg-accent text-foreground font-medium"
                      : "border-border bg-background text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <div>
            <label
              htmlFor="reject-reason"
              className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1"
            >
              Reason
            </label>
            <Input
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add a short reason for the audit trail…"
              className="text-sm"
            />
          </div>
          <p className="text-[11.5px] text-muted-foreground leading-relaxed">
            Rejection writes an audit entry attributed to you. You can still add another Article
            manually if this Ingredient needs an alternative.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={!reason.trim() || !apl}
            className="bg-red-queue text-white hover:bg-red-queue/90"
          >
            <XIcon className="h-4 w-4" />
            Reject Article
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
