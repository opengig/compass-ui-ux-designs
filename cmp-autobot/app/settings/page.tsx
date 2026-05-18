"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  Sparkles,
  Building2,
  RotateCcw,
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const target = useMockStore((s) => s.target);
  const sites = useMockStore((s) => s.sites);
  const setTargetDate = useMockStore((s) => s.setTargetDate);
  const setSiteTargetDate = useMockStore((s) => s.setSiteTargetDate);
  const clearSiteTargetDate = useMockStore((s) => s.clearSiteTargetDate);
  const simulate = useMockStore((s) => s.simulateOdsRefresh);
  const lastRefresh = useMockStore((s) => s.lastRefreshAt);

  const [globalDate, setGlobalDate] = useState(target.targetDate);
  const [enabledSites, setEnabledSites] = useState<Set<string>>(new Set(sites.map((s) => s.id)));

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8 py-3 lg:py-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Panel className="p-3.5">
            <SectionHeader
              icon={CalendarDays}
              title="Global default target"
              description="Applies to every site that doesn't have its own override below."
            />
            <div className="mt-3">
              <Eyebrow>Default target completion</Eyebrow>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  id="target-date"
                  type="date"
                  value={globalDate}
                  onChange={(e) => setGlobalDate(e.target.value)}
                  className="max-w-[220px] numeric-tabular tabular-nums"
                />
                <BrandButton onClick={() => setTargetDate(globalDate)}>
                  Save default
                </BrandButton>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 numeric-tabular tabular-nums">
                Exercise started on{" "}
                <span className="text-foreground/85 font-medium">
                  {new Date(target.exerciseStartedOn).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                . Original baseline frozen at that date.
              </p>
            </div>
          </Panel>

          <Panel className="p-3.5">
            <SectionHeader
              icon={Sparkles}
              title="Demo helpers"
              description="Tools that exist only in the prototype to simulate operational events."
            />
            <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Simulate next ODS refresh
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Pretends the nightly batch ran. Auto-confirms 2 Green decisions to demonstrate the
                    dashboard updating in real time.
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2 numeric-tabular tabular-nums">
                    Last refresh:{" "}
                    {new Date(lastRefresh).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })} IST
                  </p>
                </div>
                <BrandButton onClick={simulate}>Run now</BrandButton>
              </div>
            </div>
          </Panel>
        </div>

        <Panel className="p-3.5">
          <SectionHeader
            icon={CalendarDays}
            title="Per-site target dates"
            description={"Override the global default per site. Dashboard's “days remaining” + pace forecast respect the active site filter."}
          />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {sites.map((s) => (
              <SiteTargetRow
                key={s.id}
                siteId={s.id}
                city={s.city}
                name={s.name}
                code={s.code}
                globalDate={target.targetDate}
                override={target.siteTargetDates?.[s.id]}
                onSave={(iso) => setSiteTargetDate(s.id, iso)}
                onClear={() => clearSiteTargetDate(s.id)}
              />
            ))}
          </div>
        </Panel>

        <Panel className="p-3.5">
          <SectionHeader
            icon={Building2}
            title="Sites in scope"
            description="Showing 8 of ~400 sites · prototype scope"
          />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {sites.map((s) => {
              const on = enabledSites.has(s.id);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 bg-card/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.city}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {s.name} · {s.code}
                    </div>
                  </div>
                  <Switch
                    checked={on}
                    onCheckedChange={(v) => {
                      const next = new Set(enabledSites);
                      if (v) next.add(s.id);
                      else next.delete(s.id);
                      setEnabledSites(next);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
      {children}
    </p>
  );
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card/40 p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function BrandButton({
  children,
  onClick,
  disabled,
  size = "default",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: "default" | "sm";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border bg-brand-soft text-brand border-brand/30 font-semibold transition-colors hover:bg-brand-soft/70 disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs",
        className
      )}
    >
      {children}
    </button>
  );
}

interface SiteTargetRowProps {
  siteId: string;
  city: string;
  name: string;
  code: string;
  globalDate: string;
  override: string | undefined;
  onSave: (iso: string) => void;
  onClear: () => void;
}

function SiteTargetRow({
  city,
  name,
  code,
  globalDate,
  override,
  onSave,
  onClear,
}: SiteTargetRowProps) {
  const [value, setValue] = useState(override ?? globalDate);

  useEffect(() => {
    setValue(override ?? globalDate);
  }, [override, globalDate]);

  const isOverride = Boolean(override);
  const dirty = value !== (override ?? globalDate);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-card/40 px-3 py-2.5",
        isOverride ? "border-brand/40" : "border-border/70"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{city}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {name} · {code}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider font-semibold",
            isOverride
              ? "bg-brand-soft text-brand border border-brand/30"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isOverride ? "Override" : "Default"}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 text-xs flex-1 numeric-tabular tabular-nums"
        />
        <BrandButton
          size="sm"
          onClick={() => onSave(value)}
          disabled={!dirty}
          className="h-8"
        >
          Save
        </BrandButton>
        {isOverride && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClear}
            aria-label="Reset to default"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
