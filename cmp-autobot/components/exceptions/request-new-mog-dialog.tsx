"use client";

import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMockStore } from "@/lib/mock-store";

interface RequestNewMogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exceptionId: string;
  aplLabel: string;
}

export function RequestNewMogDialog({
  open,
  onOpenChange,
  exceptionId,
  aplLabel,
}: RequestNewMogDialogProps) {
  const requestNewMog = useMockStore((s) => s.requestNewMog);
  const [note, setNote] = useState("");

  const close = (next: boolean) => {
    if (!next) setNote("");
    onOpenChange(next);
  };

  const submit = () => {
    // Note is optional now — submit fires regardless of input.
    requestNewMog(exceptionId, note.trim());
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="h-4 w-4 text-blue-queue" />
            Raise Issue 
          </DialogTitle>
          <DialogDescription>
            The Culinary team will review and create a matching
            Ingredient. Add a note if helpful.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
          {aplLabel}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="note" className="text-[12px]">
            Note (optional)
          </Label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add any kitchen context that would help…"
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Raise Issue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
