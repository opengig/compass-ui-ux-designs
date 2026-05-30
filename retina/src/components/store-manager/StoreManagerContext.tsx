import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/* ------------------------------------------------------------------ */
/* Capture flow types — shared between Capture / Review / Done / etc.  */
/* ------------------------------------------------------------------ */

export type CaptureStep = 'barcode' | 'front' | 'back' | 'more';

export type CaptureContext = {
  mode: 'barcode' | 'loose';
  barcode: boolean;
  front: boolean;
  back: boolean;
  more: number;
  active: CaptureStep | null;
  title: string;
  code: string;
  gtin: string;
  category: string;
};

export const INITIAL_CAPTURE: CaptureContext = {
  mode: 'barcode',
  barcode: false,
  front: false,
  back: false,
  more: 0,
  active: null,
  title: '',
  code: '',
  gtin: '',
  category: '',
};

/* ------------------------------------------------------------------ */
/* Store Manager shared state — capture pipeline + demo flags + toast */
/* ------------------------------------------------------------------ */

export type StoreManagerContextValue = {
  capture: CaptureContext;
  setCapture: (next: CaptureContext | ((prev: CaptureContext) => CaptureContext)) => void;
  paneerScanned: boolean;
  setPaneerScanned: (v: boolean) => void;
  paneerExcluded: boolean;
  setPaneerExcluded: (v: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  excludeLoose: boolean;
  setExcludeLoose: (v: boolean) => void;
  siteId: string;
  setSiteId: (id: string) => void;
};

const StoreManagerCtx = createContext<StoreManagerContextValue | null>(null);

export function StoreManagerProvider({ children }: { children: ReactNode }) {
  const [capture, setCaptureState] = useState<CaptureContext>(INITIAL_CAPTURE);
  const [paneerScanned, setPaneerScanned] = useState(false);
  const [paneerExcluded, setPaneerExcluded] = useState(false);
  const [excludeLoose, setExcludeLoose] = useState(false);
  const [siteId, setSiteId] = useState('BCK-001');

  // Toast — auto-clears after ~1800ms to preserve existing behavior.
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  // setCapture wraps useState's setter to support either a value or an updater
  // (preserves the StoreManagerApp behavior that uses `setCapture(prev => …)`).
  const setCapture = useCallback<StoreManagerContextValue['setCapture']>((next) => {
    if (typeof next === 'function') {
      setCaptureState((prev) => (next as (p: CaptureContext) => CaptureContext)(prev));
    } else {
      setCaptureState(next);
    }
  }, []);

  const value = useMemo<StoreManagerContextValue>(
    () => ({
      capture,
      setCapture,
      paneerScanned,
      setPaneerScanned,
      paneerExcluded,
      setPaneerExcluded,
      toast,
      showToast,
      excludeLoose,
      setExcludeLoose,
      siteId,
      setSiteId,
    }),
    [capture, setCapture, paneerScanned, paneerExcluded, toast, showToast, excludeLoose, siteId],
  );

  return <StoreManagerCtx.Provider value={value}>{children}</StoreManagerCtx.Provider>;
}

export function useStoreManager(): StoreManagerContextValue {
  const ctx = useContext(StoreManagerCtx);
  if (!ctx) {
    throw new Error('useStoreManager must be used inside <StoreManagerProvider>');
  }
  return ctx;
}
