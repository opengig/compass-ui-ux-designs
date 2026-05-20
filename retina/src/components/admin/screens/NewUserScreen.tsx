import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { ADMIN_ROUTES } from '../../../router/routes';
import { MOCK_SITES, ROLE_LABELS, type UserRole } from '../data/adminMockData';
import { AdminPageHeader, AdminToast } from '../components/AdminPageHeader';

const ROLES: UserRole[] = ['STORE_MANAGER', 'NUTRITIONIST', 'ARTICLE_SME', 'APPLICATION_ADMIN', 'SUPER_ADMIN'];

export function NewUserScreen() {
  const navigate = useNavigate();
  const [form, setForm] = React.useState<{ userName: string; userEmail: string; userType: UserRole | '' }>({
    userName: '',
    userEmail: '',
    userType: '',
  });
  const [selectedSites, setSelectedSites] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);

  const toggleSite = (siteId: string) =>
    setSelectedSites((prev) => {
      const next = new Set(prev);
      next.has(siteId) ? next.delete(siteId) : next.add(siteId);
      return next;
    });

  const submit = () => {
    if (!form.userName.trim() || !form.userEmail.trim() || !form.userType) {
      setError('Name, email and role are required');
      return;
    }
    // Mock: bypass real create call, just route back to list.
    navigate(ADMIN_ROUTES.users);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <AdminPageHeader title="Add User" backTo={ADMIN_ROUTES.users} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-4 rounded-lg border border-border bg-card shadow-soft p-4">
          <Field label="Full name">
            <input
              value={form.userName}
              onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
              placeholder="Jane Smith"
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-[13px] placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.userEmail}
              onChange={(e) => setForm((f) => ({ ...f, userEmail: e.target.value }))}
              placeholder="jane@company.com"
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-[13px] placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>
          <Field label="Role">
            <select
              value={form.userType}
              onChange={(e) => setForm((f) => ({ ...f, userType: e.target.value as UserRole }))}
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-[13px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select role…</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Assign Sites</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Optional — leave empty for roles with no site scope
            </p>
          </div>
          <ul className="divide-y divide-border/60">
            {MOCK_SITES.map((s) => {
              const on = selectedSites.has(s.siteId);
              return (
                <li key={s.siteId}>
                  <button
                    type="button"
                    onClick={() => toggleSite(s.siteId)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-[1.5px] transition-colors ${
                        on ? 'bg-primary border-primary' : 'border-border'
                      }`}
                    >
                      {on && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                    </span>
                    <span className="text-[13px] text-foreground flex-1">{s.siteName}</span>
                    <span className="text-[11.5px] text-muted-foreground">{s.userCount} users</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          onClick={submit}
          className="w-full h-11 rounded-md bg-primary text-primary-foreground text-[13.5px] font-semibold hover:bg-primary-hover transition-colors"
        >
          Create User
        </button>
      </div>

      {error && <AdminToast message={error} variant="error" onDismiss={() => setError(null)} />}
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
