// @ts-nocheck
import { Outlet, useLocation } from "react-router-dom";
import { Check } from "lucide-react";
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
  const { toast } = useNutritionist();
  const showSideNav = !location.pathname.startsWith("/nutritionist/login");

  return (
    <div className="flex w-full h-screen bg-background font-heading text-foreground overflow-hidden">
      <style>{`@keyframes artGlow { 0%,100%{ background-color:transparent; box-shadow:none } 30%,70%{ background-color:rgba(251,146,60,0.18); box-shadow:inset 0 -1px 0 hsl(var(--border)) } } @keyframes shimmer { 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }`}</style>
      {showSideNav && <SideNav />}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
      {toast && (
        <div className="fixed bottom-5 right-5 z-[300] flex items-center gap-2 rounded-lg px-4 py-2.5 bg-foreground text-background text-[13px] font-semibold shadow-lg">
          <Check size={14} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}

export { NUTRITIONIST_ROUTES };
