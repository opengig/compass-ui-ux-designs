import { Outlet } from 'react-router-dom';

/**
 * Outer page wrapper for the Store Manager flow — provides the warm grey
 * backdrop and lets the page scroll when the phone mockup exceeds the viewport.
 *
 * The phone-mockup chrome (step pills, bezel, status bar, footer) + provider +
 * screen outlet live inside `StoreManagerLayout`, mounted as a child route of
 * this shell in App.tsx so every screen owns its URL.
 */
export function StoreManagerShell() {
  return (
    <div className="min-h-screen bg-[#E8E7E1] font-heading text-foreground">
      <Outlet />
    </div>
  );
}
