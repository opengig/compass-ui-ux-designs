"use client";

import { Wrench, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMockStore } from "@/lib/mock-store";

interface RetireAplDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exceptionId: string;
  aplLabel: string;
}

export function RetireAplDialog({ open, onOpenChange, exceptionId, aplLabel }: RetireAplDialogProps) {
  const retireOrphanApl = useMockStore((s) => s.retireOrphanApl);

  const submit = () => {
    retireOrphanApl(exceptionId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-amber-queue" />
            Request Procurement to retire this Article
          </DialogTitle>
          <DialogDescription>
            This sends a request to Procurement to retire the Article in SAP. The Autobot does not modify
            SAP directly — Procurement owns the actual delete.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Article to retire
          </div>
          <div className="text-sm font-medium mt-0.5">{aplLabel}</div>
        </div>

        <div className="rounded-lg border border-amber-queue/40 bg-amber-queue-soft px-3 py-2.5 flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 text-amber-queue mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed">
            <div className="font-medium text-foreground">Confirm this Article is not in use anywhere</div>
            <div className="text-muted-foreground mt-0.5">
              Retiring an actively-used Article would break procurement for the kitchen. If unsure, cancel
              and check with the chef.
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Send retire request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
