"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
 * Checkbox — Radix root + an indicator that swaps the icon based on state:
 *   checked       → Check  (green)
 *   indeterminate → Minus  (amber, for partial-selection feedback)
 *
 * Size + colour palette match the Worklist selection-UX spec:
 *   18×18 box, 1.5px #9CA3AF border in the resting state, green-600
 *   (#16A34A) when checked, amber-400 when indeterminate. The size bump
 *   from 16→18 gives multi-row tables a more clickable hit target without
 *   making single-checkbox forms feel oversized.
 * ────────────────────────────────────────────────────────────────────────── */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, checked, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    checked={checked}
    className={cn(
      "peer h-[14px] w-[14px] shrink-0 rounded-[3px] border-[1.5px] border-[#9CA3AF] bg-background ring-offset-background transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Checked → green
      "data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] data-[state=checked]:text-white",
      // Indeterminate → amber, distinct so partial state is unambiguous
      "data-[state=indeterminate]:bg-[#F59E0B] data-[state=indeterminate]:border-[#F59E0B] data-[state=indeterminate]:text-white",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      {checked === "indeterminate" ? (
        <Minus className="h-2.5 w-2.5" strokeWidth={3} />
      ) : (
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
