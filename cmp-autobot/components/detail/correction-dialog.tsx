"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMockStore } from "@/lib/mock-store";

interface CorrectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionId: string;
}

export function CorrectionDialog({ open, onOpenChange, decisionId }: CorrectionDialogProps) {
  const [notes, setNotes] = useState("");
  const correctDecision = useMockStore((s) => s.correctDecision);

  function submit() {
    if (!notes.trim()) return;
    correctDecision(decisionId, notes.trim());
    setNotes("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Correct the mapping</DialogTitle>
          <DialogDescription>
            Note what changed before confirming entry into CookBook. The Autobot will learn from this
            on the next training cycle.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="notes">Correction notes</Label>
          <Input
            id="notes"
            value={notes}
            placeholder="e.g. switched default to Everest 200g for cost"
            onChange={(e) => setNotes(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!notes.trim()}>
            Save and confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
