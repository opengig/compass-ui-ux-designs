// @ts-nocheck
import { Outlet, useLocation } from "react-router-dom";
import { Check, AlertCircle } from "lucide-react";
import { NUTRITIONIST_ROUTES } from "../../router/routes";
import { NutritionistProvider, useNutritionist } from "./NutritionistContext";
import { SideNav } from "./components/SideNav";

export function NutritionistShell() {
  return (
    <NutritionistProvider>
      <ShellChrome />
    </NutritionistProvider>
  );
}

function ShellChrome() {
  const location = useLocation();
  const { toast, showToast: _showToast } = useNutritionist();
  void _showToast;
  // Normalize toast to { msg, action? } for rendering. Legacy string toasts
  // are wrapped on read so we can render an Undo button when provided.
  const t = toast ? (typeof toast === "string" ? { msg: toast } : toast) : null;
  const showSideNav = !location.pathname.startsWith("/nutritionist/login");

  return (
    <div className="flex w-full h-screen bg-background font-heading text-foreground overflow-hidden">
      <style>{`@keyframes artGlow { 0%,100%{ background-color:transparent; box-shadow:none } 30%,70%{ background-color:rgba(251,146,60,0.18); box-shadow:inset 0 -1px 0 hsl(var(--border)) } } @keyframes shimmer { 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }`}</style>
      {showSideNav && <SideNav />}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
      {t && (
        <div
          className="fixed bottom-5 right-5 z-[300] flex items-center gap-3 rounded-lg pl-4 pr-2.5 py-2.5 text-[13px] font-semibold shadow-lg"
          style={{
            animation:"toastIn 0.18s cubic-bezier(0.34,1.56,0.64,1)",
            backgroundColor: t.kind === "warn" ? "#7A5310" : "#1F1611",
            color: "#fff",
          }}>
          {t.kind === "warn" ? (
            <AlertCircle size={14} className="text-amber-300 flex-shrink-0" />
          ) : (
            <Check size={14} className="text-emerald-400 flex-shrink-0" />
          )}
          <span>{t.msg}</span>
          {t.action && (
            <button
              onClick={t.action.onClick}
              className="ml-1 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide transition-colors"
              style={{
                backgroundColor:"rgba(255,255,255,0.12)",
                color:"#fff",
                letterSpacing:"0.06em",
              }}
              onMouseEnter={e=>e.currentTarget.style.backgroundColor="rgba(255,255,255,0.22)"}
              onMouseLeave={e=>e.currentTarget.style.backgroundColor="rgba(255,255,255,0.12)"}>
              {t.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { NUTRITIONIST_ROUTES };
