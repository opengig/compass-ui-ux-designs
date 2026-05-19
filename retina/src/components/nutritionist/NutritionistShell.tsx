// @ts-nocheck
import { Outlet, useLocation } from "react-router-dom";
import { Check } from "lucide-react";
import { NUTRITIONIST_ROUTES } from "../../router/routes";
import { NutritionistProvider, useNutritionist } from "./NutritionistContext";
import { SideNav } from "./components/SideNav";
import { C } from "./data/tokens";

/**
 * Root layout for the nutritionist route tree.
 *
 * Owns:
 *   - NutritionistProvider (cross-screen state: site filter, toast, queue tab, etc.)
 *   - Global font/keyframe <style> tag (formerly inside NutritionistApp)
 *   - SideNav (hidden on /login)
 *   - <Outlet/> for the active screen
 *   - Global <Toast/>
 */
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
  // Hide the side rail on the login page so the login card gets the whole viewport.
  const showSideNav = !location.pathname.startsWith("/nutritionist/login");

  return (
    <div
      className="h-screen flex flex-row overflow-hidden"
      style={{ backgroundColor: C.page, fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); * { font-family: 'Inter', sans-serif; font-feature-settings: 'tnum', 'ss01'; } input, button, textarea, select { font-family: 'Inter', sans-serif; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes artGlow { 0%,100%{ background-color:transparent; box-shadow:none } 30%,70%{ background-color:rgba(198,138,30,0.18); box-shadow:inset 0 -1px 0 #D5CDBA } } @keyframes shimmer { 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } } button[role="checkbox"] { border-color: #C68A1E !important; } button[role="checkbox"][data-state="checked"] { background-color: #C68A1E !important; border-color: #C68A1E !important; } button[role="checkbox"]:focus-visible { outline-color: #C68A1E !important; box-shadow: 0 0 0 2px rgba(198,138,30,0.3) !important; }`}</style>
      {showSideNav && <SideNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
      {toast && (
        <div
          className="fixed bottom-5 right-5 flex items-center gap-2 rounded-lg px-4 py-2.5 text-white"
          style={{
            backgroundColor: "#1A1A1A",
            fontSize: 13,
            fontWeight: 600,
            zIndex: 300,
            boxShadow: "0 16px 32px rgba(26,26,26,0.16)",
          }}
        >
          <Check size={14} style={{ color: C.gr }} />
          {toast}
        </div>
      )}
    </div>
  );
}

export { NUTRITIONIST_ROUTES };
