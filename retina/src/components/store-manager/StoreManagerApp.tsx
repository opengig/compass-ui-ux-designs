import { Check } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import './storeManager.css';
import { StoreManagerProvider, useStoreManager } from './StoreManagerContext';

// Re-export the capture types from their new home so existing screen imports
// (`import type { CaptureContext } from '../StoreManagerApp'`) keep working.
export type { CaptureContext, CaptureStep } from './StoreManagerContext';

/**
 * Layout for the Store Manager flow. Owns the phone-shell chrome and the
 * global toast; provides the cross-screen state through context. Screens are
 * rendered through <Outlet /> — each screen has its own URL.
 */
export function StoreManagerLayout() {
  return (
    <StoreManagerProvider>
      <div className="sm-outer">
        <div className="sm-phone">
          <ToastOverlay />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    </StoreManagerProvider>
  );
}

function ToastOverlay() {
  const { toast } = useStoreManager();
  return (
    <div className={`sm-toast${toast ? ' on' : ''}`}>
      <Check className="w-[14px] h-[14px]" style={{ color: '#97C459' }} />
      <span>{toast ?? 'Done'}</span>
    </div>
  );
}
