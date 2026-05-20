import { ArrowLeft, Camera, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';
import { useStoreManager, type CaptureContext, type CaptureStep } from '../StoreManagerContext';

/**
 * S4 — Standalone barcode scan screen. Tap anywhere on the camera surface
 * to simulate "barcode detected", which jumps to the capture flow.
 */
export function BarcodeScreen() {
  const navigate = useNavigate();
  const { capture, setCapture } = useStoreManager();

  const onBack = () => navigate(STORE_MANAGER_ROUTES.capture);
  const onCancel = () => navigate(STORE_MANAGER_ROUTES.articles);
  const onDetected = () => {
    setCapture((prev: CaptureContext) => {
      const next: CaptureContext = { ...prev, barcode: true };
      const reqs: CaptureStep[] = prev.mode === 'loose' ? ['front'] : ['barcode', 'front', 'back'];
      const pending = reqs.find((s) => !next[s]);
      next.active = pending ?? 'more';
      return next;
    });
    navigate(STORE_MANAGER_ROUTES.capture);
  };
  return (
    <>
      <div
        className="flex items-center gap-2 flex-shrink-0"
        style={{
          padding: '10px 16px 8px',
          paddingTop: 'max(10px, env(safe-area-inset-top))',
          background: '#fff',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="back"
          className="w-9 h-9 flex items-center justify-center -ml-2 active:bg-[#F9F4EA] rounded-full"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: '#9C9B94' }} />
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold"
            style={{ fontSize: '17px', color: '#2B2A26' }}
          >
            Scan Article
          </div>
          <div className="text-[11.5px] mt-[1px] truncate" style={{ color: '#9C9B94' }}>
            {capture.title.split(',').slice(0, 2).join(',').trim() || 'Article'} · {capture.code}
          </div>
        </div>
      </div>

      <div className="sm-cam-dark cursor-pointer" onClick={onDetected}>
        <div
          className="sm-cam-frame"
          style={{ width: 'min(240px, 70%)', height: '120px', zIndex: 1 }}
        >
          <div
            className="sm-corner"
            style={{
              top: 0,
              left: 0,
              borderTop: '2.5px solid #97C459',
              borderLeft: '2.5px solid #97C459',
              borderRadius: '3px 0 0 0',
            }}
          />
          <div
            className="sm-corner"
            style={{
              top: 0,
              right: 0,
              borderTop: '2.5px solid #97C459',
              borderRight: '2.5px solid #97C459',
              borderRadius: '0 3px 0 0',
            }}
          />
          <div
            className="sm-corner"
            style={{
              bottom: 0,
              left: 0,
              borderBottom: '2.5px solid #97C459',
              borderLeft: '2.5px solid #97C459',
              borderRadius: '0 0 0 3px',
            }}
          />
          <div
            className="sm-corner"
            style={{
              bottom: 0,
              right: 0,
              borderBottom: '2.5px solid #97C459',
              borderRight: '2.5px solid #97C459',
              borderRadius: '0 0 3px 0',
            }}
          />
          <div className="sm-scanline" />
        </div>
        <div
          className="text-[12.5px]"
          style={{
            color: 'rgba(255,255,255,0.6)',
            marginTop: '22px',
            letterSpacing: '0.01em',
            zIndex: 1,
          }}
        >
          Align barcode inside frame
        </div>
      </div>

      <div
        className="flex items-center justify-between flex-shrink-0 gap-3"
        style={{
          background: '#fff',
          padding: '10px 16px',
          borderTop: '1px solid #F1ECDD',
        }}
      >
        <div className="min-w-0">
          <div
            className="text-[12.5px] font-medium"
            style={{ color: '#9C9B94' }}
          >
            Barcode not detected?
          </div>
          <div className="text-[11px] mt-[1px]" style={{ color: '#C5C4BC' }}>
            Take a photo instead
          </div>
        </div>
        <button
          type="button"
          className="text-[12.5px] font-medium flex items-center gap-1 cursor-pointer flex-shrink-0 active:opacity-80"
          style={{
            color: '#2B2A26',
            background: '#ECECEB',
            padding: '10px 14px',
            borderRadius: '8px',
            minHeight: '40px',
            border: 'none',
          }}
        >
          <Camera className="w-[14px] h-[14px]" />
          Photo
        </button>
      </div>

      <div
        className="flex gap-2 flex-shrink-0"
        style={{
          padding: '10px 16px',
          paddingBottom: 'max(0.75rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
          background: '#fff',
          borderTop: '1px solid #F1ECDD',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-medium active:opacity-80"
          style={{
            padding: '14px 16px',
            borderRadius: '8px',
            background: '#fff',
            border: '1px solid #F1ECDD',
            color: '#9C9B94',
            minHeight: '48px',
          }}
        >
          <X className="w-[14px] h-[14px]" />
          Cancel
        </button>
      </div>
    </>
  );
}
