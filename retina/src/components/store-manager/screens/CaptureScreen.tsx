import { type CSSProperties } from 'react';
import { ArrowLeft, Barcode, Camera, Plus, Check, ScanLine, Info } from 'lucide-react';
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
  return mode === 'loose' ? ['front'] : ['front', 'back', 'barcode'];
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

  const captionText = capture.active ? labels[capture.active] : 'Tap a step to capture';
  const hintText = capture.active
    ? `Point at ${labels[capture.active].toLowerCase()}`
    : 'Tap a step below to start';

  // Capture button label mirrors the source: front/back collapse to "Capture".
  const captureLabel =
    capture.active === 'more'
      ? 'Capture More'
      : capture.active === 'barcode'
        ? 'Capture Barcode'
        : 'Capture';

  const cornerStyle = (pos: 'tl' | 'tr' | 'bl' | 'br') => {
    const c = '#3FA56E';
    const base: CSSProperties = { position: 'absolute' };
    if (pos === 'tl') return { ...base, top: 0, left: 0, borderTop: `2.5px solid ${c}`, borderLeft: `2.5px solid ${c}`, borderRadius: '3px 0 0 0' };
    if (pos === 'tr') return { ...base, top: 0, right: 0, borderTop: `2.5px solid ${c}`, borderRight: `2.5px solid ${c}`, borderRadius: '0 3px 0 0' };
    if (pos === 'bl') return { ...base, bottom: 0, left: 0, borderBottom: `2.5px solid ${c}`, borderLeft: `2.5px solid ${c}`, borderRadius: '0 0 0 3px' };
    return { ...base, bottom: 0, right: 0, borderBottom: `2.5px solid ${c}`, borderRight: `2.5px solid ${c}`, borderRadius: '0 0 3px 0' };
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
          onClick={onCancel}
          aria-label="back"
          className="w-9 h-9 flex items-center justify-center -ml-2 active:bg-[#F9F4EA] rounded-full"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: '#6B6A64' }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate" style={{ fontSize: '16px', color: '#2B2A26' }}>
            {capture.title}
          </div>
          <div className="text-[11px] mt-[1px]" style={{ color: '#9C9B94' }}>
            {captionText}
          </div>
        </div>
        <span
          className="text-[10px] flex-shrink-0"
          style={{ color: '#9C9B94', background: '#F9F4EA', padding: '3px 8px', borderRadius: '5px' }}
        >
          {done}/{reqs.length}
        </span>
      </div>

      <div className="sm-cam-dark">
        {capture.active === 'barcode' ? (
          <div className="sm-cam-frame" style={{ width: '230px', height: '118px' }}>
            <div className="sm-corner" style={cornerStyle('tl')} />
            <div className="sm-corner" style={cornerStyle('tr')} />
            <div className="sm-corner" style={cornerStyle('bl')} />
            <div className="sm-corner" style={cornerStyle('br')} />
            <div className="sm-scanline" />
          </div>
        ) : (
          <div
            className="sm-cam-frame flex items-center justify-center"
            style={{ width: '180px', height: '220px', border: '2px dashed rgba(255,255,255,0.35)', borderRadius: '12px' }}
          >
            <div className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.45)', padding: '0 16px' }}>
              {hintText}
            </div>
          </div>
        )}
      </div>

      {/* Instruction strip */}
      <div
        className="flex items-center gap-2 flex-shrink-0"
        style={{
          margin: '10px 14px 6px',
          padding: '9px 12px',
          background: '#F6F1E6',
          border: '1px solid #EFE6CF',
          borderRadius: '8px',
          fontSize: '11px',
          lineHeight: 1.45,
          color: '#8A8275',
        }}
      >
        <Info className="w-[13px] h-[13px] flex-shrink-0" style={{ color: '#B9831F' }} />
        <span>
          {loose
            ? 'Capture the item, then add more angles if needed'
            : 'Capture Front → Back → Barcode, then add more if needed'}
        </span>
      </div>

      {/* Thumb row */}
      <div
        className="flex gap-1.5 flex-shrink-0"
        style={{ padding: '6px 14px', background: '#fff' }}
      >
        {(['front', 'back', 'barcode'] as const).map((k) => {
          if (loose && (k === 'barcode' || k === 'back')) return null;
          const isDone = capture[k];
          const isActive = capture.active === k && !isDone;
          return (
            <div
              key={k}
              onClick={() => selectStep(k)}
              className="flex flex-col items-center justify-center gap-[2px] cursor-pointer flex-shrink-0"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '9px',
                border: isActive
                  ? '1px solid #C68A1E'
                  : isDone
                    ? '1px solid #C5DCCD'
                    : '1px solid #E8D8B5',
                background: isActive ? '#F5E8C7' : isDone ? '#E0F0E7' : '#F9F4EA',
                fontSize: '8px',
                fontWeight: isDone || isActive ? 600 : 500,
                color: isActive ? '#C68A1E' : isDone ? '#0F6B3D' : '#B9831F',
              }}
            >
              {isDone ? (
                <Check className="w-[13px] h-[13px]" style={{ color: '#0F6B3D' }} />
              ) : k === 'barcode' ? (
                <Barcode className="w-[13px] h-[13px]" />
              ) : (
                <Camera className="w-[13px] h-[13px]" />
              )}
              <span>{k === 'barcode' ? 'Barcode' : k === 'front' ? 'Front' : 'Back'}</span>
            </div>
          );
        })}
        <div
          onClick={() => selectStep('more')}
          className="flex flex-col items-center justify-center gap-[2px] cursor-pointer flex-shrink-0 relative"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '9px',
            border: capture.active === 'more' ? '1px solid #C68A1E' : '1px dashed #E8D8B5',
            background: capture.active === 'more' ? '#F5E8C7' : '#F9F4EA',
            fontSize: '8px',
            fontWeight: 500,
            color: capture.active === 'more' ? '#C68A1E' : '#B9831F',
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
          padding: '8px 14px',
          paddingBottom: 'max(0.875rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
          background: '#fff',
          borderTop: '1px solid #F1ECDD',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center text-[12px] font-medium active:opacity-80"
          style={{
            flex: 0.55,
            padding: '12px 14px',
            borderRadius: '8px',
            background: '#fff',
            border: '1px solid #C5C4BC',
            color: '#2B2A26',
            minHeight: '44px',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!capture.active}
          onClick={isComplete ? onReview : doCapture}
          className="flex-1 flex items-center justify-center gap-1.5 text-[12.5px] font-medium active:opacity-90"
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            background: '#C68A1E',
            color: '#fff',
            border: '1px solid #C68A1E',
            opacity: capture.active ? 1 : 0.55,
            pointerEvents: capture.active ? 'auto' : 'none',
            minHeight: '44px',
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
              {captureLabel}
            </>
          ) : (
            <>
              <Camera className="w-[15px] h-[15px]" />
              {captureLabel}
            </>
          )}
        </button>
      </div>
    </>
  );
}
