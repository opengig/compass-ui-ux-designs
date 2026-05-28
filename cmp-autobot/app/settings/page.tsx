"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  Sparkles,
  Building2,
  RotateCcw,
  Users,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { useMockStore } from "@/lib/mock-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, X, Search } from "lucide-react";
import type { AppUser, UserRole } from "@/lib/types";

// ─── Role display helpers ──────────────────────────────────────────────────

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  mapper: "Store Manager",
};

const ROLE_CLASSES: Record<UserRole, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  mapper: "bg-green-queue-soft text-green-queue border-green-queue/20",
};

// ─── Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8 py-4 lg:py-5">
        <Tabs defaultValue="users">
          <TabsList className="mb-5">
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Users
            </TabsTrigger>
            <TabsTrigger value="configuration" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="sites" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Sites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="configuration">
            <ConfigurationTab />
          </TabsContent>

          <TabsContent value="sites">
            <SitesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Tab: Users ────────────────────────────────────────────────────────────

function UsersTab() {
  const users = useMockStore((s) => s.users);
  const sites = useMockStore((s) => s.sites);
  const addUser = useMockStore((s) => s.addUser);
  const removeUser = useMockStore((s) => s.removeUser);
  const updateUser = useMockStore((s) => s.updateUser);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  function openAdd() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEdit(user: AppUser) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  function handleSave(values: Omit<AppUser, "id">) {
    if (editingUser) {
      updateUser(editingUser.id, values);
    } else {
      addUser(values);
    }
    setDialogOpen(false);
  }

  // site code lookup for display
  const siteCodeById = Object.fromEntries(sites.map((s) => [s.id, s.code]));

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader
            icon={Users}
            title="User management"
            description="Add users and control which sites they can access."
          />
          <Button size="sm" onClick={openAdd} className="gap-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5" />
            Add user
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                  Name
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                  Email
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                  Role
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                  Site access
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                  Active
                </th>
                <th className="px-4 py-2.5 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        ROLE_CLASSES[user.role]
                      )}
                    >
                      {ROLE_LABEL[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.siteIds.length === 0 ? (
                      <span className="text-xs text-muted-foreground">All sites</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {user.siteIds.map((id) => (
                          <Badge key={id} variant="secondary" className="text-[11px] px-1.5 py-0">
                            {siteCodeById[id] ?? id}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={(v) => updateUser(user.id, { isActive: v })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground"
                        onClick={() => openEdit(user)}
                        aria-label="Edit user"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeUser(user.id)}
                        aria-label="Remove user"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No users yet. Click &quot;Add user&quot; to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingUser={editingUser}
        sites={sites}
        onSave={handleSave}
      />
    </div>
  );
}

// ─── Searchable multi-select for sites ────────────────────────────────────

interface SiteMultiSelectProps {
  sites: { id: string; code: string; name: string; city: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

function SiteMultiSelect({ sites, selected, onChange }: SiteMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? sites.filter((s) => {
        const q = query.toLowerCase();
        return (
          s.city.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
        );
      })
    : sites;

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  }

  function remove(id: string) {
    onChange(selected.filter((s) => s !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setTimeout(() => searchRef.current?.focus(), 50); }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
              "hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "transition-colors"
            )}
          >
            <span className={selected.length === 0 ? "text-muted-foreground" : "text-foreground"}>
              {selected.length === 0
                ? "All sites (no restriction)"
                : `${selected.length} site${selected.length === 1 ? "" : "s"} selected`}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
          sideOffset={4}
        >
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by city or code…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <ScrollArea className="max-h-52">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No sites match &ldquo;{query}&rdquo;
              </div>
            ) : (
              <div className="py-1">
                {filtered.map((s) => {
                  const checked = selected.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                        checked ? "bg-accent/60" : "hover:bg-accent/40"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(s.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 pointer-events-none"
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-left">{s.city}</span>
                      <span className="text-[11px] text-muted-foreground numeric-tabular shrink-0">
                        {s.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="border-t border-border px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {selected.length} selected
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const site = sites.find((s) => s.id === id);
            if (!site) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-[11.5px] font-medium text-foreground/80"
              >
                {site.city}
                <span className="text-muted-foreground">{site.code}</span>
                <button
                  type="button"
                  onClick={() => remove(id)}
                  aria-label={`Remove ${site.city}`}
                  className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Add / Edit user dialog ────────────────────────────────────────────────

interface UserDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingUser: AppUser | null;
  sites: { id: string; code: string; name: string; city: string }[];
  onSave: (values: Omit<AppUser, "id">) => void;
}

function UserDialog({ open, onOpenChange, editingUser, sites, onSave }: UserDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("mapper");
  const [siteIds, setSiteIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Populate form when editing
  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name);
      setEmail(editingUser.email);
      setRole(editingUser.role);
      setSiteIds(editingUser.siteIds);
      setIsActive(editingUser.isActive);
    } else {
      setName("");
      setEmail("");
      setRole("mapper");
      setSiteIds([]);
      setIsActive(true);
    }
  }, [editingUser, open]);

  function handleSubmit() {
    if (!name.trim() || !email.trim()) return;
    onSave({ name: name.trim(), email: email.trim(), role, siteIds, isActive });
  }

  const isEdit = Boolean(editingUser);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="u-name">Full name</Label>
            <Input
              id="u-name"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="u-email">Email</Label>
            <Input
              id="u-email"
              type="email"
              placeholder="e.g. priya@compass.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="mapper">Store Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Site access */}
          <div className="flex flex-col gap-2">
            <Label>Site access</Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Leave empty to grant access to all sites (admin default).
            </p>
            <SiteMultiSelect
              sites={sites}
              selected={siteIds}
              onChange={setSiteIds}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <Switch id="u-active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="u-active" className="cursor-pointer">
              Active
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !email.trim()}>
            {isEdit ? "Save changes" : "Add user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: Configuration ────────────────────────────────────────────────────

function ConfigurationTab() {
  const target = useMockStore((s) => s.target);
  const sites = useMockStore((s) => s.sites);
  const setTargetDate = useMockStore((s) => s.setTargetDate);
  const setSiteTargetDate = useMockStore((s) => s.setSiteTargetDate);
  const clearSiteTargetDate = useMockStore((s) => s.clearSiteTargetDate);
  const simulate = useMockStore((s) => s.simulateOdsRefresh);
  const lastRefresh = useMockStore((s) => s.lastRefreshAt);

  const [globalDate, setGlobalDate] = useState(target.targetDate);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Global target date */}
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

        {/* Demo helpers */}
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
                  })}{" "}
                  IST
                </p>
              </div>
              <BrandButton onClick={simulate}>Run now</BrandButton>
            </div>
          </div>
        </Panel>
      </div>

      {/* Per-site overrides */}
      <Panel className="p-3.5">
        <SectionHeader
          icon={CalendarDays}
          title="Per-site target dates"
          description='Override the global default per site. Dashboard&rsquo;s "days remaining" + pace forecast respect the active site filter.'
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
    </div>
  );
}

// ─── Tab: Sites ────────────────────────────────────────────────────────────

function SitesTab() {
  const sites = useMockStore((s) => s.sites);
  const toggleSiteStatus = useMockStore((s) => s.toggleSiteStatus);

  return (
    <Panel>
      <SectionHeader
        icon={Building2}
        title="Sites"
        description="All sites in the mapping exercise scope. Toggle a site inactive to exclude it from the workload."
      />
      <div className="mt-4 overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40">
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Code
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Name
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                City
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Region
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Status
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Active
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {sites.map((site) => (
              <tr key={site.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                  {site.code}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{site.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{site.city}</td>
                <td className="px-4 py-3 text-muted-foreground">{site.region}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      site.status === "active"
                        ? "bg-green-queue-soft text-green-queue border-green-queue/20"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {site.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={site.status === "active"}
                    onCheckedChange={() => toggleSiteStatus(site.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ─── Shared sub-components ─────────────────────────────────────────────────

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
    <div className={cn("rounded-xl border border-border/70 bg-card/40 p-5", className)}>
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
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
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
        <BrandButton size="sm" onClick={() => onSave(value)} disabled={!dirty} className="h-8">
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
