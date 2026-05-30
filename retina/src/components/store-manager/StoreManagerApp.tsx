import { Check, Wifi, BatteryMedium } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import './storeManager.css';
import { STORE_MANAGER_ROUTES } from '../../router/routes';
import { StoreManagerProvider, useStoreManager } from './StoreManagerContext';

// Re-export the capture types from their new home so existing screen imports
// (`import type { CaptureContext } from '../StoreManagerApp'`) keep working.
export type { CaptureContext, CaptureStep } from './StoreManagerContext';

// Step pills shown above the phone — mirror the source prototype's stepper.
const STEPS: { label: string; path: string }[] = [
  { label: '1 Login', path: STORE_MANAGER_ROUTES.login },
  { label: '2 SSO', path: STORE_MANAGER_ROUTES.sso },
  { label: '3 Articles', path: STORE_MANAGER_ROUTES.articles },
  { label: '4 Mark irrelevant', path: STORE_MANAGER_ROUTES.markIrrelevant },
  { label: '5 Barcode', path: STORE_MANAGER_ROUTES.barcode },
  { label: '6 Capture', path: STORE_MANAGER_ROUTES.capture },
  { label: '7 Submit', path: STORE_MANAGER_ROUTES.review },
  { label: '8 Done + metadata', path: STORE_MANAGER_ROUTES.done },
  { label: '9 Progress + games', path: STORE_MANAGER_ROUTES.progress },
  { label: '10 Retry', path: STORE_MANAGER_ROUTES.retry },
  { label: '11 Account', path: STORE_MANAGER_ROUTES.account },
];

/**
 * Layout for the Store Manager flow. Renders the phone-mockup chrome — step
 * pills, black bezel, status bar, and footer hint — around the routed screens,
 * matching the source HTML prototype. Cross-screen state comes from context;
 * each screen renders through <Outlet /> and owns its own URL.
 */
export function StoreManagerLayout() {
  return (
    <StoreManagerProvider>
      <div className="sm-frame-outer font-heading text-foreground">
        <StepPills />
        <div className="sm-phone-wrap">
          <div className="sm-phone">
            <StatusBar />
            <ToastOverlay />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Outlet />
            </div>
          </div>
        </div>
        <div className="sm-foot">Tap steps · Tap ⋮ on article cards to mark as irrelevant</div>
      </div>
    </StoreManagerProvider>
  );
}

function StepPills() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <div className="sm-step-row">
      {STEPS.map((s) => {
        const active = pathname === s.path || pathname.startsWith(`${s.path}/`);
        return (
          <button
            key={s.path}
            type="button"
            onClick={() => navigate(s.path)}
            className={`sm-pill${active ? ' on' : ''}`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

function StatusBar() {
  return (
    <div className="sm-sbar">
      <span className="sm-stime">9:41</span>
      <div className="flex items-center gap-[5px]" style={{ color: '#2B2A26' }}>
        <span className="text-[11px] font-semibold tracking-tight">4G</span>
        <Wifi className="w-[15px] h-[15px]" />
        <BatteryMedium className="w-[18px] h-[18px]" />
      </div>
    </div>
  );
}

function ToastOverlay() {
  const { toast } = useStoreManager();
  return (
    <div className={`sm-toast${toast ? ' on' : ''}`}>
      <Check className="w-[14px] h-[14px]" style={{ color: '#3FA56E' }} />
      <span>{toast ?? 'Done'}</span>
    </div>
  );
}
