// @ts-nocheck
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList, CheckCircle2, BookOpen,
  Building, Check,
} from "lucide-react";
import { ALL_SITES } from "../data/sites";
import { ARTS } from "../data/mockData";
import { COMPASS_LOGO } from "../data/images";
import { NUTRITIONIST_ROUTES } from "../../../router/routes";
import { useNutritionist } from "../NutritionistContext";

/**
 * Left-side icon nav rail for the nutritionist flow.
 * Mirrors IconNavRail (Article SME) token usage: bg-card, border-border,
 * active = bg-primary/15 + text-primary, hover = bg-muted/40 + text-foreground.
 */
export function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSites, setSelectedSites } = useNutritionist();
  const [siteOpen, setSiteOpen] = useState(false);
  const pendingCount = ARTS.filter((a) => selectedSites.includes(a.site)).length;

  const NAV = [
    { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard, path: NUTRITIONIST_ROUTES.dashboard },
    { key: "queue",     label: "Tasks",     Icon: ClipboardList,   path: NUTRITIONIST_ROUTES.queue, badge: pendingCount > 0 ? pendingCount : null },
    { key: "approved",  label: "Approved",  Icon: CheckCircle2,    path: NUTRITIONIST_ROUTES.approved },
    { key: "audit",     label: "Audit",     Icon: BookOpen,        path: NUTRITIONIST_ROUTES.audit },
  ];

  const pathname = location.pathname;
  const active =
    pathname.startsWith("/nutritionist/dashboard") ? "dashboard" :
    pathname.startsWith("/nutritionist/queue") ? "queue" :
    pathname.startsWith("/nutritionist/article") ? "queue" :
    pathname.startsWith("/nutritionist/approved") ? "approved" :
    pathname.startsWith("/nutritionist/audit") ? "audit" :
    "dashboard";

  const toggleSite = (s) =>
    setSelectedSites((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const allSelected = selectedSites.length === ALL_SITES.length;
  const siteLabel =
    allSelected ? "All Sites" :
    selectedSites.length === 0 ? "No Sites" :
    selectedSites.length === 1 ? selectedSites[0] :
    `${selectedSites.length} Sites`;
  const sitesIndicate = siteOpen || !allSelected;

  return (
    <aside className="flex-shrink-0 flex flex-col w-[72px] bg-card border-r border-border relative z-[100]">
      {/* Logo */}
      <div className="flex items-center justify-center flex-shrink-0 h-[72px] border-b border-border px-2 py-2.5">
        <img src={COMPASS_LOGO} alt="Compass Group" className="w-11 h-11 object-contain" />
      </div>

      {/* Main nav */}
      <nav className="flex-1 flex flex-col overflow-y-auto py-1">
        {NAV.map((item) => (
          <NavBtn
            key={item.key}
            item={item}
            isActive={active === item.key}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      {/* Sites filter */}
      <div className="flex-shrink-0 relative border-t border-border">
        <button
          onClick={() => setSiteOpen((o) => !o)}
          title={siteLabel}
          className={`relative w-full h-16 flex flex-col items-center justify-center gap-[3px] transition-colors ${
            siteOpen ? "bg-muted/40" : "hover:bg-muted/40"
          }`}
        >
          {sitesIndicate && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-primary"
              aria-hidden
            />
          )}
          <div className="relative flex items-center justify-center w-10 h-8 rounded-lg">
            <Building
              size={17}
              className={sitesIndicate ? "text-primary" : "text-muted-foreground"}
            />
            {selectedSites.length > 0 && selectedSites.length < ALL_SITES.length && (
              <span className="absolute -top-1 -right-1.5 inline-flex items-center justify-center min-w-[17px] h-[17px] px-[3px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold tabular-nums leading-none">
                {selectedSites.length}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] tracking-wide leading-none ${
              sitesIndicate ? "text-primary font-semibold" : "text-muted-foreground font-normal"
            }`}
          >
            Sites
          </span>
        </button>

        {siteOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setSiteOpen(false)} />
            <div className="absolute z-50 rounded-xl p-2 w-[168px] bg-card border border-border shadow-lg"
              style={{ bottom: 0, left: "calc(100% + 8px)" }}
            >
              <SitePopoverItem
                label="All Sites"
                selected={allSelected}
                onClick={() => (allSelected ? setSelectedSites([]) : setSelectedSites([...ALL_SITES]))}
              />
              <div className="h-px bg-border my-1 mx-2" />
              {ALL_SITES.map((s) => (
                <SitePopoverItem
                  key={s}
                  label={s}
                  selected={selectedSites.includes(s)}
                  onClick={() => toggleSite(s)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* User avatar */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center py-3 gap-1 border-t border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted border border-border">
          <span className="text-[11px] font-semibold text-muted-foreground -tracking-[0.01em]">PS</span>
        </div>
        <span className="text-[10px] text-muted-foreground/80 tracking-wide leading-none">Priya</span>
      </div>
    </aside>
  );
}

function NavBtn({ item, isActive, onClick }) {
  const { Icon } = item;
  return (
    <button
      onClick={onClick}
      title={item.label}
      className={`relative w-full h-16 flex flex-col items-center justify-center gap-[3px] transition-colors ${
        isActive ? "" : "hover:bg-muted/40"
      }`}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-primary"
          aria-hidden
        />
      )}
      <div className="relative flex items-center justify-center w-10 h-8 rounded-lg">
        <Icon
          size={17}
          className={isActive ? "text-primary" : "text-muted-foreground"}
        />
        {item.badge ? (
          <span className="absolute -top-1 -right-1.5 inline-flex items-center justify-center min-w-[17px] h-[17px] px-[3px] rounded-full bg-destructive/15 text-destructive text-[9px] font-semibold tabular-nums leading-none">
            {item.badge}
          </span>
        ) : null}
      </div>
      <span
        className={`text-[10px] tracking-wide leading-none ${
          isActive ? "text-primary font-semibold" : "text-muted-foreground font-normal"
        }`}
      >
        {item.label}
      </span>
    </button>
  );
}

function SitePopoverItem({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-colors ${
        selected
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground hover:bg-muted/40 font-normal"
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center flex-shrink-0 border-[1.5px] ${
          selected ? "bg-primary border-primary" : "border-border"
        }`}
      >
        {selected && <Check size={9} className="text-primary-foreground" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}
