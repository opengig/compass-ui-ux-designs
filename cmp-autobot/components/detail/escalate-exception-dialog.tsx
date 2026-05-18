"use client";

import { TriangleAlert } from "lucide-react";
import type { MOG } from "@/lib/types";
import { useMockStore } from "@/lib/mock-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EscalateExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionId: string;
  mog: MOG;
}

export function EscalateExceptionDialog({
  open,
  onOpenChange,
  decisionId,
  mog,
}: EscalateExceptionDialogProps) {
  const escalate = useMockStore((s) => s.escalateToException);

  function handleConfirm() {
    escalate(decisionId);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-amber-queue" />
            Move to MAM Exception
          </DialogTitle>
          <DialogDescription>
            Raises a <span className="font-medium text-foreground">Type A — Procurement gap</span>{" "}
            against{" "}
            <span className="font-medium text-foreground">{mog.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-queue/30 bg-amber-queue-soft/40 px-4 py-3 text-[13px] leading-relaxed">
          <span className="font-medium text-foreground">Chef confirms this Ingredient is in use,</span>{" "}
          but SAP has no Article for it. Procurement will be asked to bring it under formal Article coverage.
        </div>

        <ul className="text-[12px] text-muted-foreground space-y-1">
          <li>· The decision is removed from the Red queue.</li>
          <li>· A new Type A exception appears on the Exceptions screen.</li>
          <li>· Audit trail records the escalation under your name.</li>
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-amber-queue text-white hover:bg-amber-queue/90">
            <TriangleAlert className="h-4 w-4" />
            Confirm escalation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
