import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Search, Plus } from 'lucide-react';
import { ADMIN_ROUTES } from '../../../router/routes';
import {
  MOCK_USERS,
  MOCK_SITES,
  ROLE_LABELS,
  type UserRole,
} from '../data/adminMockData';
import { AdminPageHeader, AdminToast } from '../components/AdminPageHeader';

const ROLES: UserRole[] = ['STORE_MANAGER', 'NUTRITIONIST', 'ARTICLE_SME', 'APPLICATION_ADMIN', 'SUPER_ADMIN'];

export function UserDetailScreen() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const user = MOCK_USERS.find((u) => u.userId === userId) ?? null;

  const [userName, setUserName] = React.useState(user?.userName ?? '');
  const [userEmail, setUserEmail] = React.useState(user?.userEmail ?? '');
  const [userType, setUserType] = React.useState<UserRole>(user?.userType ?? 'STORE_MANAGER');
  const [selectedSites, setSelectedSites] = React.useState<Set<string>>(
    () => new Set(user?.sites.map((s) => s.siteId) ?? []),
  );
  const [siteSearch, setSiteSearch] = React.useState('');
  const [showOffboard, setShowOffboard] = React.useState(false);
  const [toast, setToast] = React.useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  if (!user) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden bg-background">
        <AdminPageHeader title="Edit User" backTo={ADMIN_ROUTES.users} />
        <div className="flex-1 flex items-center justify-center text-[13px] text-muted-foreground">User not found</div>
      </div>
    );
  }

  const assignedSites = MOCK_SITES.filter((s) => selectedSites.has(s.siteId));
  const searchResults = (() => {
    const q = siteSearch.toLowerCase();
    if (!q) return [] as typeof MOCK_SITES;
    return MOCK_SITES.filter((s) => !selectedSites.has(s.siteId) && s.siteName.toLowerCase().includes(q));
  })();

  const removeSite = (siteId: string) =>
    setSelectedSites((prev) => {
      const next = new Set(prev);
      next.delete(siteId);
      return next;
    });

  const addSite = (siteId: string) => {
    setSelectedSites((prev) => new Set([...prev, siteId]));
    setSiteSearch('');
  };

  const save = () => setToast({ message: 'User updated', variant: 'success' });
  const offboard = () => {
    setShowOffboard(false);
    navigate(ADMIN_ROUTES.users);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <AdminPageHeader title={user.userName} subtitle={ROLE_LABELS[user.userType]} backTo={ADMIN_ROUTES.users} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-4 rounded-lg border border-border bg-card shadow-soft p-4">
          <Field label="Full name">
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>
          <Field label="Role">
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value as UserRole)}
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-[13px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Site Access</p>
            {assignedSites.length > 0 && (
              <span className="text-[11.5px] text-muted-foreground">{assignedSites.length} assigned</span>
            )}
          </div>

          {assignedSites.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
              {assignedSites.map((s) => (
                <span
                  key={s.siteId}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 py-1 pr-1 pl-3 text-[11.5px] font-medium text-primary"
                >
                  {s.siteName}
                  <button
                    onClick={() => removeSite(s.siteId)}
                    aria-label={`Remove ${s.siteName}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
                  >
                    <X className="w-2.5 h-2.5 text-primary" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={siteSearch}
                onChange={(e) => setSiteSearch(e.target.value)}
                placeholder={assignedSites.length === 0 ? 'Search sites to add…' : 'Search to add more sites…'}
                className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-3 text-[12.5px] placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {searchResults.length > 0 && (
              <ul className="mt-2 divide-y divide-border/60 overflow-hidden rounded-md border border-border">
                {searchResults.map((s) => (
                  <li key={s.siteId}>
                    <button
                      onClick={() => addSite(s.siteId)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-[13px] text-foreground flex-1">{s.siteName}</span>
                      <span className="text-[11.5px] text-muted-foreground">{s.userCount} users</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {siteSearch && searchResults.length === 0 && (
              <p className="mt-2 py-2 text-center text-[11.5px] text-muted-foreground">
                No unassigned sites match "{siteSearch}"
              </p>
            )}
          </div>
        </div>

        <button
          onClick={save}
          className="w-full h-11 rounded-md bg-primary text-primary-foreground text-[13.5px] font-semibold hover:bg-primary-hover transition-colors"
        >
          Save Changes
        </button>

        <div className="rounded-lg border border-rose-200 bg-card shadow-soft p-4">
          <p className="mb-1 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Danger Zone</p>
          <p className="mb-3 text-[11.5px] text-muted-foreground">
            Permanently removes this user and revokes all access.
          </p>
          <button
            onClick={() => setShowOffboard(true)}
            className="w-full h-10 rounded-md border border-rose-300 text-[13px] font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
          >
            Offboard User
          </button>
        </div>
      </div>

      {showOffboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card border border-border p-5 shadow-lg">
            <h3 className="text-[15px] font-semibold text-foreground mb-1">Offboard {user.userName}?</h3>
            <p className="mb-4 text-[13px] text-muted-foreground">
              This is permanent. The user will immediately lose all access.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowOffboard(false)}
                className="flex-1 h-9 rounded-md border border-border text-[13px] font-medium text-foreground hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                onClick={offboard}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
