"use client";

import { Bot, Check, AlertTriangle, X } from "lucide-react";
import type { MappingDecision } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BotReasoningCardProps {
  decision: MappingDecision;
}

type SignalKind = "match" | "warning" | "miss";

function parseSignal(raw: string): { kind: SignalKind; text: string } {
  if (raw.startsWith("⚠")) return { kind: "warning", text: raw.replace(/^⚠\s*/, "") };
  if (raw.startsWith("✗")) return { kind: "miss", text: raw.replace(/^✗\s*/, "") };
  return { kind: "match", text: raw };
}

export function BotReasoningCard({ decision }: BotReasoningCardProps) {
  const hasSignals = decision.signals.length > 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 lg:p-6 relative overflow-hidden">
      <div
        className={cn(
          "grid gap-5",
          hasSignals && "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-8"
        )}
      >
        {/* Left: bot avatar + explanation paragraph */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-4.5 w-4.5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium">CMP Autobot</span>
              <span className="text-muted-foreground">{prettyTime(decision.generatedAt)}</span>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-foreground/90">
              {decision.explanation}
            </p>
          </div>
        </div>

        {/* Right: signal checklist */}
        {hasSignals && (
          <div className="lg:border-l lg:border-border/70 lg:pl-6">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
              What the bot checked
            </div>
            <ul className="space-y-1.5">
              {decision.signals.map((raw, i) => {
                const { kind, text } = parseSignal(raw);
                return (
                  <li
                    key={i}
                    className={cn(
                      "flex items-start gap-2 text-[12.5px] leading-relaxed",
                      kind === "match" && "text-foreground/80",
                      kind === "warning" && "text-amber-queue",
                      kind === "miss" && "text-red-queue"
                    )}
                  >
                    {kind === "match" && (
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-queue" />
                    )}
                    {kind === "warning" && (
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-queue" />
                    )}
                    {kind === "miss" && (
                      <X className="h-3.5 w-3.5 mt-0.5 shrink-0 text-red-queue" />
                    )}
                    <span>{text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function prettyTime(iso: string) {
  const d = new Date(iso);
  return `Generated ${d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} IST · ${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
}
