import React from 'react';
import { Search, Plus, Trash2, MapPin, X } from 'lucide-react';
import { MOCK_SITES, type AdminSite } from '../data/adminMockData';
import { AdminPageHeader, AdminToast } from '../components/AdminPageHeader';

export function SitesScreen() {
  const [sites, setSites] = React.useState<AdminSite[]>(MOCK_SITES);
  const [search, setSearch] = React.useState('');
  const [showAdd, setShowAdd] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState<AdminSite | null>(null);
  const [toast, setToast] = React.useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return !q ? sites : sites.filter((s) => s.siteName.toLowerCase().includes(q));
  }, [sites, search]);

  const addSite = () => {
    if (!newName.trim()) return;
    const site: AdminSite = {
      siteId: `new-${Date.now()}`,
      siteName: newName.trim(),
      userCount: 0,
      createdAt: new Date().toISOString(),
    };
    setSites((prev) => [...prev, site].sort((a, b) => a.siteName.localeCompare(b.siteName)));
    setNewName('');
    setShowAdd(false);
    setToast({ message: `Site "${site.siteName}" created`, variant: 'success' });
  };

  const removeSite = (site: AdminSite) => {
    setSites((prev) => prev.filter((s) => s.siteId !== site.siteId));
    setConfirmDelete(null);
    setToast({ message: `Site "${site.siteName}" removed`, variant: 'success' });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <AdminPageHeader
        title="Sites"
        subtitle={`${filtered.length}${filtered.length !== sites.length ? ` of ${sites.length}` : ''} sites`}
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12.5px] font-semibold hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        }
      />

      <div className="px-4 pt-3 pb-2 bg-card border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sites…"
            className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-3 text-[12.5px] placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[13px] text-muted-foreground">
              {sites.length === 0 ? 'No sites yet' : 'No sites match your search'}
            </p>
            {sites.length === 0 && (
              <button
                onClick={() => setShowAdd(true)}
                className="mt-3 text-[13px] font-semibold text-primary hover:underline"
              >
                Add first site
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border/60 bg-card border border-border shadow-soft rounded-lg overflow-hidden mx-4 mt-2 mb-4">
            {filtered.map((s) => (
              <li key={s.siteId} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-foreground truncate">{s.siteName}</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {s.userCount} {s.userCount === 1 ? 'user' : 'users'}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmDelete(s)}
                  aria-label={`Remove ${s.siteName}`}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card border border-border p-5 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-[15px] font-semibold text-foreground">New Site</h3>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setNewName('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSite()}
              placeholder="Site name"
              className="mb-4 h-9 w-full rounded-md border border-border bg-card px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setNewName('');
                }}
                className="flex-1 h-9 rounded-md border border-border text-[13px] font-medium text-foreground hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                onClick={addSite}
                disabled={!newName.trim()}
                className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                Add Site
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card border border-border p-5 shadow-lg">
            <h3 className="mb-1 text-[15px] font-semibold text-foreground">Remove site?</h3>
            <p className="mb-4 text-[13px] text-muted-foreground">
              <span className="font-medium text-foreground">{confirmDelete.siteName}</span> will be removed. Users
              assigned to this site will lose that mapping.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 h-9 rounded-md border border-border text-[13px] font-medium text-foreground hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                onClick={() => removeSite(confirmDelete)}
                className="flex-1 h-9 rounded-md bg-destructive text-destructive-foreground text-[13px] font-semibold hover:bg-destructive/90"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <AdminToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}
