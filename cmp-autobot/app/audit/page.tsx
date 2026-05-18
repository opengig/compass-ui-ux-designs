"use client";

import { useMemo, useState } from "react";
import { Bot, User as UserIcon, ArrowRight } from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuditPage() {
  const audit = useMockStore((s) => s.audit);
  const [actorFilter, setActorFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return audit
      .filter((a) =>
        actorFilter === "all" ? true : actorFilter === "autobot" ? a.actor === "autobot" : a.actor !== "autobot"
      )
      .filter((a) =>
        s.length === 0
          ? true
          : (a.explanation?.toLowerCase().includes(s) ?? false) ||
            a.action.toLowerCase().includes(s) ||
            a.actor.toLowerCase().includes(s)
      );
  }, [audit, actorFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const e of filtered) {
      const day = e.timestamp.slice(0, 10);
      const list = map.get(day) ?? [];
      list.push(e);
      map.set(day, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="px-6 py-6 lg:px-10 lg:py-8 max-w-[1100px] mx-auto">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-tight">Audit Trail</h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
            Every queue assignment, confirmation, correction, and CookBook entry is recorded here. Full
            traceability of every mapping decision.
          </p>
        </div>
      </header>

      <div className="flex items-center gap-3 mb-5">
        <Select value={actorFilter} onValueChange={setActorFilter}>
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue placeholder="All actors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actors</SelectItem>
            <SelectItem value="autobot">Autobot</SelectItem>
            <SelectItem value="human">Humans</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor or explanation…"
            className="pl-8 h-9 text-xs"
          />
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {audit.length} events
        </div>
      </div>

      <div className="space-y-8">
        {grouped.map(([day, events]) => (
          <section key={day}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground numeric-tabular">
                {new Date(day).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground numeric-tabular">{events.length} events</span>
            </div>
            <ol className="border-l border-border pl-6 space-y-5">
              {events.map((e) => {
                const isBot = e.actor === "autobot";
                return (
                  <li key={e.id} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full",
                        isBot ? "bg-primary text-primary-foreground" : "bg-foreground text-background"
                      )}
                    >
                      {isBot ? <Bot className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                    </span>
                    <div className="text-sm flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{e.actor === "autobot" ? "CMP Autobot" : e.actor}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{actionLabel(e.action)}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground numeric-tabular">
                        {new Date(e.timestamp).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })} IST
                      </span>
                    </div>
                    {e.explanation && (
                      <div className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {e.explanation}
                      </div>
                    )}
                    {(e.before || e.after) && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground rounded-md border border-border bg-card px-2 py-0.5">
                        <span>{e.before ?? "—"}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="text-foreground">{e.after ?? "—"}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

function actionLabel(a: string) {
  return a.replace(/\./g, " · ");
}
