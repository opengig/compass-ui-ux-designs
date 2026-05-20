import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ADMIN_ROUTES } from '../../../router/routes';
import {
  MOCK_USERS,
  MOCK_SITES,
  MOCK_PARAMS,
  ROLE_LABELS,
  type UserRole,
} from '../data/adminMockData';
import { AdminPageHeader } from '../components/AdminPageHeader';

export function DashboardScreen() {
  const usersByRole = (Object.keys(ROLE_LABELS) as UserRole[]).map((role) => ({
    role,
    count: MOCK_USERS.filter((u) => u.userType === role).length,
  }));
  const totalUsers = MOCK_USERS.length;
  const siteCount = MOCK_SITES.length;
  const paramCount = MOCK_PARAMS.length;

  const activeAdmins = MOCK_USERS.filter(
    (u) => u.userType === 'SUPER_ADMIN' || u.userType === 'APPLICATION_ADMIN',
  ).length;
  const cards = [
    { label: 'Total Users',   value: totalUsers,   accent: 'border-l-primary',     numberClass: 'text-primary',      href: ADMIN_ROUTES.users  },
    { label: 'Sites',         value: siteCount,    accent: 'border-l-emerald-500', numberClass: 'text-emerald-600',  href: ADMIN_ROUTES.sites  },
    { label: 'Config Keys',   value: paramCount,   accent: 'border-l-sky-500',     numberClass: 'text-sky-700',      href: ADMIN_ROUTES.config },
    { label: 'Active Admins', value: activeAdmins, accent: 'border-l-violet-500',  numberClass: 'text-violet-700',   href: ADMIN_ROUTES.users  },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <AdminPageHeader title="Dashboard" subtitle="Administration" />

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((card) => (
            <Link
              key={card.label}
              to={card.href}
              className={`rounded-lg border border-border border-l-4 ${card.accent} bg-card shadow-soft px-4 py-5 hover:border-foreground/20 hover:bg-muted/40 transition-colors`}
            >
              <p className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">{card.label}</p>
              <p className={`mt-1 text-[28px] font-bold leading-none tabular-nums ${card.numberClass}`}>{card.value}</p>
            </Link>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
            <p className="text-[14px] font-semibold text-foreground tracking-tight">Users by Role</p>
            <div className="flex items-center gap-3">
              <span className="text-[11.5px] text-muted-foreground">Total · {totalUsers}</span>
              <Link
                to={ADMIN_ROUTES.newUser}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-foreground hover:bg-muted/40 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add User
              </Link>
            </div>
          </div>
          <div className="divide-y divide-border/60">
            {usersByRole.map((r) => (
              <div key={r.role} className="flex items-center gap-3 px-5 py-3">
                <span className="rounded bg-muted px-2 py-0.5 text-[11.5px] font-medium text-foreground/80 w-28 shrink-0">
                  {ROLE_LABELS[r.role]}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (r.count / Math.max(totalUsers, 1)) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[13px] font-semibold text-foreground tabular-nums">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to={ADMIN_ROUTES.sites}
            className="rounded-lg border border-border bg-card shadow-soft p-4 hover:border-foreground/20 hover:bg-muted/40 transition-colors"
          >
            <p className="text-[13px] font-semibold text-foreground">Manage Sites</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Add or remove sites</p>
          </Link>
          <Link
            to={ADMIN_ROUTES.config}
            className="rounded-lg border border-border bg-card shadow-soft p-4 hover:border-foreground/20 hover:bg-muted/40 transition-colors"
          >
            <p className="text-[13px] font-semibold text-foreground">Configuration</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">Feature flags &amp; params</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
