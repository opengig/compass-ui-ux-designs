"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { ExceptionRecord } from "@/lib/types";
import { useMockStore } from "@/lib/mock-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MogPickerDialog } from "./mog-picker-dialog";
import { RequestNewMogDialog } from "./request-new-mog-dialog";
import { ExceptionStatusPill } from "./exception-status-pill";

interface OrphanResolutionPanelProps {
  exception: ExceptionRecord;
}

export function OrphanResolutionPanel({ exception }: OrphanResolutionPanelProps) {
  const apls = useMockStore((s) => s.apls);
  const mogs = useMockStore((s) => s.mogs);
  const [linkOpen, setLinkOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const apl = exception.aplId ? apls.find((a) => a.id === exception.aplId) : null;
  const aplLabel = apl
    ? `${apl.genericName}${apl.characteristic ? `, ${apl.characteristic}` : ""} · ${apl.brand} · ${apl.packSize || "—"}`
    : "Orphan Article";

  // Resolved state — state-specific heading + helper line so the user knows
  // exactly what's happening and whether they need to do anything.
  if (exception.status !== "open") {
    const stateMeta = resolvedHeading(exception.status);
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              stateMeta.iconBg
            )}
          >
            <CheckCircle2 className={cn("h-4 w-4", stateMeta.iconColor)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-medium">{stateMeta.heading}</h4>
              <ExceptionStatusPill status={exception.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {stateMeta.helper}
            </p>
            <ResolvedSummary
              exception={exception}
              mogName={resolvedMogName(exception, mogs)}
            />
            {exception.resolutionNote && (
              <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Note to Culinary
                </div>
                <div className="text-sm mt-0.5">{exception.resolutionNote}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Open-state header — Article-centric copy. Heading names
          the problem, paragraph spells out what's happening: an
          Article exists in SAP but no Ingredient links to it yet.
          Drives the user toward Map / Create rather than the
          previous "decide what to do" framing. */}
      <div>
        <h3 className="text-base font-semibold text-foreground">
          No Ingredient mapped to this Article
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This Article exists in SAP but is not linked to any Ingredient.
          Map it to an existing Ingredient, or create a new one if none fits.
        </p>
      </div>

      {/* Two direct CTAs — primary "Map to Ingredient" opens the
          existing-Ingredient picker; secondary "Create Ingredient"
          opens the request-new-Ingredient dialog. The previous
          "Escalate" button (which opened the retire flow) was
          dropped per the Article-centric spec — retiring is no
          longer the right escalation for an Unmapped Article. */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setLinkOpen(true)}>Map to Ingredient</Button>
        <Button variant="outline" onClick={() => setRequestOpen(true)}>
          Create Ingredient
        </Button>
      </div>

      <MogPickerDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        exceptionId={exception.id}
      />
      <RequestNewMogDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        exceptionId={exception.id}
        aplLabel={aplLabel}
      />
    </section>
  );
}

/* State-specific heading + helper text for the resolved card. */
function resolvedHeading(status: ExceptionRecord["status"]) {
  switch (status) {
    case "linked":
      return {
        heading: "Article Linked Successfully",
        helper: "No further action needed. The mapping is live in CookBook.",
        iconBg: "bg-green-queue-soft",
        iconColor: "text-green-queue",
      };
    case "pending-culinary":
      return {
        heading: "Waiting for Culinary Team",
        helper:
          "Culinary will create or attach the right Ingredient. You'll be notified when it's done — no action needed from you right now.",
        iconBg: "bg-blue-queue-soft",
        iconColor: "text-blue-queue",
      };
    case "pending-procurement":
      return {
        heading: "Waiting for Procurement",
        helper:
          "Procurement has been asked to retire this Article in SAP. Tracking will close once they confirm — no action needed from you.",
        iconBg: "bg-amber-queue-soft",
        iconColor: "text-amber-queue",
      };
    case "resolved":
    default:
      return {
        heading: "Resolved",
        helper: "This exception is closed.",
        iconBg: "bg-muted",
        iconColor: "text-foreground",
      };
  }
}

function ResolvedSummary({
  exception,
  mogName,
}: {
  exception: ExceptionRecord;
  mogName?: string;
}) {
  if (exception.status === "linked") {
    return (
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
        Linked to Ingredient{" "}
        <span className="text-foreground font-medium">
          {mogName ?? exception.linkedMogId}
        </span>{" "}
        by {exception.resolvedBy} · {prettyDate(exception.resolvedAt)}.
      </p>
    );
  }
  if (exception.status === "pending-culinary") {
    return (
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
        New Ingredient requested by {exception.resolvedBy} on{" "}
        {prettyDate(exception.resolvedAt)}. Waiting for Culinary to create the
        Ingredient before this can be closed.
      </p>
    );
  }
  if (exception.status === "pending-procurement") {
    return (
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
        Retire request sent by {exception.resolvedBy} on{" "}
        {prettyDate(exception.resolvedAt)}. Waiting for Procurement to retire
        this Article in SAP.
      </p>
    );
  }
  return null;
}

function resolvedMogName(
  exception: ExceptionRecord,
  mogs: ReturnType<typeof useMockStore.getState>["mogs"]
) {
  if (!exception.linkedMogId) return undefined;
  return mogs.find((m) => m.id === exception.linkedMogId)?.name;
}

function prettyDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) +
    " IST"
  );
}
