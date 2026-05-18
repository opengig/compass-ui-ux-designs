"use client";

import { CheckCheck, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMockStore } from "@/lib/mock-store";
import type { MappingDecision } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selected: MappingDecision[];
  onClear: () => void;
}

export function BulkActionBar({ selected, onClear }: BulkActionBarProps) {
  const bulkConfirmGreen = useMockStore((s) => s.bulkConfirmGreen);
  const bulkPlanBlue = useMockStore((s) => s.bulkPlanBlue);

  const greens = selected.filter((d) => d.queue === "green").map((d) => d.id);
  const blues = selected.filter((d) => d.queue === "blue").map((d) => d.id);
  const ambers = selected.filter((d) => d.queue === "amber");
  const reds = selected.filter((d) => d.queue === "red");

  return (
    <div className="border-b border-border bg-foreground text-background px-4 py-2 flex items-center gap-3">
      <span className="text-xs font-medium">{selected.length} selected</span>
      <div className="ml-2 flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={greens.length === 0}
          onClick={() => {
            bulkConfirmGreen(greens);
            onClear();
          }}
          className="h-7 text-xs"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark {greens.length || ""} Green as entered
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={blues.length === 0}
          onClick={() => {
            bulkPlanBlue(blues);
            onClear();
          }}
          className="h-7 text-xs"
        >
          <Eye className="h-3.5 w-3.5" />
          Plan {blues.length || ""} Blue transitions
        </Button>
        {(ambers.length > 0 || reds.length > 0) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "text-[11px] text-background/60 ml-2",
                  ambers.length + reds.length > 0 && "cursor-help"
                )}
              >
                {ambers.length} Amber, {reds.length} Red — review individually
              </span>
            </TooltipTrigger>
            <TooltipContent>Amber and Red items need single-item review before action.</TooltipContent>
          </Tooltip>
        )}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto inline-flex items-center gap-1 text-xs opacity-80 hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
        Clear
      </button>
    </div>
  );
}
