// Single source of truth for queue identity (color, icon, copy, primary action).
// Never inline queue color/copy logic anywhere else.

import { Eye, CircleAlert, CircleCheck, CircleHelp, type LucideIcon } from "lucide-react";
import type { Queue } from "./types";

export interface QueueConfig {
  key: Queue;
  label: string;
  shortLabel: string;
  /** One- or two-word caption for compact tab strips (e.g., 'Needs review'). */
  tabCaption: string;
  /** Short descriptive line shown UNDER tabCaption in the tab cards.
   *  Describes what's IN the queue rather than what to do with it,
   *  so it complements (rather than duplicates) tabCaption. */
  tabSubtext: string;
  description: string;
  // Tailwind class fragments — used via `cn()` and string interpolation
  textClass: string;
  bgSoftClass: string;
  borderClass: string;
  stripeClass: string;
  ringClass: string;
  icon: LucideIcon;
  primaryActionLabel: string;
  bulkActionable: boolean;
  bulkActionLabel?: string;
}

export const QUEUES: Record<Queue, QueueConfig> = {
  green: {
    key: "green",
    label: "Green — Perfect Match",
    shortLabel: "Green",
    tabCaption: "Matches",
    tabSubtext: "Auto-matched",
    description: "All checks passed. Ready for CookBook entry.",
    textClass: "text-green-queue",
    bgSoftClass: "bg-green-queue-soft",
    borderClass: "border-green-queue/40",
    stripeClass: "bg-green-queue",
    ringClass: "ring-green-queue/30",
    icon: CircleCheck,
    primaryActionLabel: "Confirm match",
    bulkActionable: true,
    bulkActionLabel: "Mark as entered in CookBook",
  },
  amber: {
    key: "amber",
    label: "Likely Matches",
    shortLabel: "Likely Matches",
    tabCaption: "Likely Matches",
    tabSubtext: "Likely match",
    description: "Likely match. Review the Autobot's reasoning before confirming.",
    textClass: "text-amber-queue",
    bgSoftClass: "bg-amber-queue-soft",
    borderClass: "border-amber-queue/40",
    stripeClass: "bg-amber-queue",
    ringClass: "ring-amber-queue/30",
    icon: CircleAlert,
    primaryActionLabel: "Confirm match",
    bulkActionable: false,
  },
  red: {
    key: "red",
    label: "Red — Investigation Required",
    shortLabel: "Red",
    tabCaption: "No Match",
    tabSubtext: "No match found",
    description: "No credible Article match found. Human investigation needed.",
    textClass: "text-red-queue",
    bgSoftClass: "bg-red-queue-soft",
    borderClass: "border-red-queue/40",
    stripeClass: "bg-red-queue",
    ringClass: "ring-red-queue/30",
    icon: CircleHelp,
    primaryActionLabel: "Mark investigated",
    bulkActionable: false,
  },
  blue: {
    key: "blue",
    label: "Blue — Transition Watch",
    shortLabel: "Blue",
    tabCaption: "Retired",
    tabSubtext: "Article retiring",
    description: "Mapping is still valid. Article retired in SAP — plan the transition.",
    textClass: "text-blue-queue",
    bgSoftClass: "bg-blue-queue-soft",
    borderClass: "border-blue-queue/40",
    stripeClass: "bg-blue-queue",
    ringClass: "ring-blue-queue/30",
    icon: Eye,
    primaryActionLabel: "Mark transition planned",
    bulkActionable: true,
    bulkActionLabel: "Mark transition planned",
  },
};

export const QUEUE_ORDER: Queue[] = ["amber", "red", "green", "blue"];
