import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, Plus, Pencil, UserMinus, X } from 'lucide-react';
import { ADMIN_ROUTES } from '../../../router/routes';
import {
  MOCK_USERS,
  ROLE_LABELS,
  ROLE_COLORS,
  type AdminUser,
} from '../data/adminMockData';
import { AdminPageHeader, AdminToast } from '../components/AdminPageHeader';

export function UsersListScreen() {
  const [users, setUsers] = React.useState<AdminUser[]>(MOCK_USERS);
  const [search, setSearch] = React.useState('');
  const [siteFilter, setSiteFilter] = React.useState('');
  const [confirmOffboard, setConfirmOffboard] = React.useState<AdminUser | null>(null);
  const [toast, setToast] = React.useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const allSites = React.useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => u.sites.forEach((s) => map.set(s.siteId, s.siteName)));
    return Array.from(map.entries())
      .map(([siteId, siteName]) => ({ siteId, siteName }))
      .sort((a, b) => a.siteName.localeCompare(b.siteName));
  }, [users]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const okText =
        !q || u.userName.toLowerCase().includes(q) || u.userEmail.toLowerCase().includes(q);
      const okSite = !siteFilter || u.sites.some((s) => s.siteId === siteFilter);
      return okText && okSite;
    });
  }, [users, search, siteFilter]);

  const offboard = (user: AdminUser) => {
    setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
    setConfirmOffboard(null);
    setToast({ message: `${user.userName} offboarded`, variant: 'success' });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <AdminPageHeader
        title="Users"
        subtitle={`${filtered.length}${filtered.length !== users.length ? ` of ${users.length}` : ''} total`}
        action={
          <Link
            to={ADMIN_ROUTES.newUser}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12.5px] font-semibold hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </Link>
        }
      />

      <div className="flex items-center gap-2 px-4 pt-3 pb-2 bg-card border-b border-border">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-3 text-[12.5px] placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {allSites.length > 0 && (
          <div className="relative">
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="appearance-none h-8 rounded-md border border-border bg-card pl-3 pr-7 text-[12.5px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All sites</option>
              {allSites.map((s) => (
                <option key={s.siteId} value={s.siteId}>
                  {s.siteName}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[13px] text-muted-foreground">
              {users.length === 0 ? 'No users yet' : 'No users match your filters'}
            </p>
            {users.length === 0 && (
              <Link to={ADMIN_ROUTES.newUser} className="mt-3 text-[13px] font-semibold text-primary hover:underline">
                Add first user
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border/60 bg-card border border-border shadow-soft rounded-lg overflow-hidden mx-4 mt-2 mb-4">
            {filtered.map((u) => (
              <li key={u.userId} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <span className="text-[13px] font-semibold text-foreground">
                    {u.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-foreground">{u.userName}</p>
                  <p className="truncate text-[11.5px] text-muted-foreground">{u.userEmail}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${ROLE_COLORS[u.userType]}`}>
                      {ROLE_LABELS[u.userType]}
                    </span>
                    {u.sites.slice(0, 2).map((s) => (
                      <span key={s.siteId} className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">
                        {s.siteName}
                      </span>
                    ))}
                    {u.sites.length > 2 && (
                      <span className="text-[10.5px] text-muted-foreground">+{u.sites.length - 2}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    to={`/admin/users/${u.userId}`}
                    aria-label={`Edit ${u.userName}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => setConfirmOffboard(u)}
                    aria-label={`Offboard ${u.userName}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmOffboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card border border-border p-5 shadow-lg">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-[15px] font-semibold text-foreground">Offboard user?</h3>
              <button
                onClick={() => setConfirmOffboard(null)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mb-4 text-[13px] text-muted-foreground">
              <span className="font-medium text-foreground">{confirmOffboard.userName}</span> will be permanently
              removed and lose access.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOffboard(null)}
                className="flex-1 h-9 rounded-md border border-border text-[13px] font-medium text-foreground hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                onClick={() => offboard(confirmOffboard)}
                className="flex-1 h-9 rounded-md bg-destructive text-destructive-foreground text-[13px] font-semibold hover:bg-destructive/90"
              >
                Offboard
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <AdminToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}
