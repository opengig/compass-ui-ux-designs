import { Outlet } from 'react-router-dom';

/**
 * Phone-first wrapper for the Store Manager flow. No surrounding chrome,
 * no header, no "switch back" button — the app fills the full viewport so
 * the prototype works as a real mobile experience (test via DevTools device
 * toolbar for sizes like iPhone 14 Pro Max 430×932).
 *
 * The actual phone chrome + provider + screen outlet live inside
 * `StoreManagerLayout`, which is mounted as a child route of this shell in
 * App.tsx so every screen owns its URL.
 */
export function StoreManagerShell() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-[#FCF8F0] font-heading text-foreground">
      <Outlet />
    </div>
  );
}
