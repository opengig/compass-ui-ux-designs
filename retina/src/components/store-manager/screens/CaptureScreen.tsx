import { ArrowLeft, Barcode, Camera, Plus, Check, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';
import { useStoreManager, type CaptureContext, type CaptureStep } from '../StoreManagerContext';

const labels: Record<CaptureStep, string> = {
  barcode: 'Barcode',
  front: 'Front label',
  back: 'Back label',
  more: 'Additional image',
};

function captureReqs(mode: CaptureContext['mode']): CaptureStep[] {
  return mode === 'loose' ? ['front'] : ['barcode', 'front', 'back'];
}

export function CaptureScreen() {
  const navigate = useNavigate();
  const { capture, setCapture } = useStoreManager();
  const onUpdate = (next: CaptureContext) => setCapture(next);
  const onCancel = () => navigate(STORE_MANAGER_ROUTES.articles);
  const onReview = () => navigate(STORE_MANAGER_ROUTES.review);
  const loose = capture.mode === 'loose';
  const reqs = captureReqs(capture.mode);
  const done = reqs.filter((k) => capture[k]).length;
  const isComplete = done >= reqs.length;

  const selectStep = (step: CaptureStep) => {
    if (loose && (step === 'barcode' || step === 'back')) return;
    onUpdate({ ...capture, active: step });
  };

  const doCapture = () => {
    if (!capture.active) return;
    const next: CaptureContext = { ...capture };
    if (capture.active === 'more') {
      next.more = capture.more + 1;
    } else {
      next[capture.active] = true;
    }
    const pending = reqs.find((s) => !next[s]);
    next.active = pending ?? 'more';
    onUpdate(next);
  };

  // Sub-bar caption + button label depends on active step / completion state
  let captionText = capture.active ? labels[capture.active] : 'Tap a step to capture';
  let hintText = capture.active
    ? `Point at ${labels[capture.active].toLowerCase()}`
    : 'Tap a step below to start';

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
          onClick={onCancel}
          aria-label="back"
          className="w-9 h-9 flex items-center justify-center -ml-2 active:bg-[#F9F4EA] rounded-full"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: '#9C9B94' }} />
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold truncate"
            style={{ fontSize: '16px', color: '#2B2A26' }}
          >
            {capture.title}
          </div>
          <div className="text-[11.5px] mt-[1px]" style={{ color: '#9C9B94' }}>
            {captionText}
          </div>
        </div>
        <span
          className="text-[11px] flex-shrink-0"
          style={{
            color: '#9C9B94',
            background: '#ECECEB',
            padding: '4px 9px',
            borderRadius: '5px',
          }}
        >
          {done}/{reqs.length}
        </span>
      </div>

      <div className="sm-cam-dark">
        {capture.active === 'barcode' ? (
          <div
            className="sm-cam-frame"
            style={{ width: '230px', height: '118px' }}
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
        ) : (
          <div
            className="sm-cam-frame flex items-center justify-center"
            style={{
              width: '180px',
              height: '220px',
              border: '2px dashed rgba(255,255,255,0.35)',
              borderRadius: '12px',
            }}
          >
            <div
              className="text-[11px] text-center"
              style={{ color: 'rgba(255,255,255,0.45)', padding: '0 16px' }}
            >
              {hintText}
            </div>
          </div>
        )}
      </div>

      {/* Quality bar */}
      <div
        style={{ background: '#fff', padding: '8px 16px 6px', flexShrink: 0 }}
      >
        <div
          className="flex justify-between text-[11.5px]"
          style={{ color: '#9C9B94', marginBottom: '3px' }}
        >
          <span>Quality</span>
          <span style={{ color: '#5A8C1A', fontWeight: 500 }}>Good</span>
        </div>
        <div
          style={{
            height: '4px',
            background: '#F1ECDD',
            borderRadius: '2px',
          }}
        >
          <div
            style={{
              height: '4px',
              borderRadius: '2px',
              width: '78%',
              background: '#5A8C1A',
            }}
          />
        </div>
      </div>

      {/* Thumb row */}
      <div
        className="flex gap-1.5 flex-shrink-0"
        style={{
          padding: '8px 14px',
          background: '#fff',
          borderTop: '1px solid #F1ECDD',
        }}
      >
        {(['barcode', 'front', 'back'] as const).map((k) => {
          if (loose && (k === 'barcode' || k === 'back')) return null;
          const isDone = capture[k];
          const isActive = capture.active === k && !isDone;
          return (
            <div
              key={k}
              onClick={() => selectStep(k)}
              className="flex flex-col items-center justify-center gap-[2px] cursor-pointer flex-shrink-0"
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '8px',
                border: isActive
                  ? '2px solid #C68A1E'
                  : isDone
                    ? '1px solid #7DBD3B'
                    : '1px solid #F1ECDD',
                background: isDone ? '#EAF3DE' : '#F5F5F4',
                fontSize: '9px',
                color: isDone ? '#3B6D11' : '#9C9B94',
              }}
            >
              {isDone ? (
                <Check className="w-[15px] h-[15px]" style={{ color: '#3B6D11' }} />
              ) : k === 'barcode' ? (
                <Barcode className="w-[15px] h-[15px]" />
              ) : (
                <Camera className="w-[15px] h-[15px]" />
              )}
              <span>
                {k === 'barcode' ? 'Barcode' : k === 'front' ? 'Front' : 'Back'}
              </span>
            </div>
          );
        })}
        <div
          onClick={() => selectStep('more')}
          className="flex flex-col items-center justify-center gap-[2px] cursor-pointer flex-shrink-0 relative"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '8px',
            border:
              capture.active === 'more'
                ? '2px solid #C68A1E'
                : '1px dashed #F1ECDD',
            background: '#F5F5F4',
            fontSize: '9px',
            color: '#9C9B94',
          }}
        >
          <Plus className="w-3 h-3" style={{ color: '#C5C4BC' }} />
          <span>More</span>
          {capture.more > 0 && (
            <span
              className="absolute"
              style={{
                top: '-3px',
                right: '-3px',
                fontSize: '8px',
                background: '#C68A1E',
                color: '#fff',
                padding: '1px 4px',
                borderRadius: '99px',
                fontWeight: 600,
              }}
            >
              +{capture.more}
            </span>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div
        className="flex gap-2 flex-shrink-0"
        style={{
          padding: '10px 16px',
          paddingBottom: 'max(0.875rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
          background: '#fff',
          borderTop: '1px solid #F1ECDD',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center text-[13px] font-medium active:opacity-80"
          style={{
            flex: 0.55,
            padding: '14px 16px',
            borderRadius: '8px',
            background: '#fff',
            border: '1px solid #C5C4BC',
            color: '#2B2A26',
            minHeight: '48px',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!capture.active}
          onClick={isComplete ? onReview : doCapture}
          className="flex-1 flex items-center justify-center gap-1.5 text-[14px] font-medium active:opacity-90"
          style={{
            padding: '14px 16px',
            borderRadius: '8px',
            background: '#C68A1E',
            color: '#fff',
            border: '1px solid #C68A1E',
            opacity: capture.active ? 1 : 0.55,
            pointerEvents: capture.active ? 'auto' : 'none',
            minHeight: '48px',
          }}
        >
          {isComplete ? (
            <>
              <Check className="w-[15px] h-[15px]" />
              Review &amp; Submit
            </>
          ) : capture.active === 'barcode' ? (
            <>
              <ScanLine className="w-[15px] h-[15px]" />
              Capture {labels[capture.active]}
            </>
          ) : capture.active === 'more' ? (
            <>
              <Camera className="w-[15px] h-[15px]" />
              Capture More
            </>
          ) : capture.active ? (
            <>
              <Camera className="w-[15px] h-[15px]" />
              Capture {labels[capture.active]}
            </>
          ) : (
            <>
              <Camera className="w-[15px] h-[15px]" />
              Capture
            </>
          )}
        </button>
      </div>
    </>
  );
}
