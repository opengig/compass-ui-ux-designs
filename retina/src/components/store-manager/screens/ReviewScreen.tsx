import { ArrowLeft, Barcode, Check, CircleCheck, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';
import { useStoreManager } from '../StoreManagerContext';

export function ReviewScreen() {
  const navigate = useNavigate();
  const { capture, setPaneerScanned } = useStoreManager();

  const onRetake = () => navigate(STORE_MANAGER_ROUTES.capture);
  const onSubmit = () => {
    // For the demo flow, "submitting" Paneer marks it scanned.
    if (capture.code === 'ART-10234') setPaneerScanned(true);
    navigate(STORE_MANAGER_ROUTES.done);
  };
  const loose = capture.mode === 'loose';
  const detailParts: string[] = [capture.code, capture.category].filter(Boolean);
  if (!loose && capture.gtin !== '—') detailParts.push(`Barcode: ${capture.gtin}`);

  const brandLabel = (() => {
    if (loose) return `${capture.title.split(',')[0] ?? capture.title} — ready to submit`;
    const parts = capture.title.split(',');
    const brand = parts.length > 1 ? parts[1].trim() : (capture.title.split(' ')[0] ?? '');
    return `Barcode detected · GTIN ${capture.gtin} · ${brand} verified`;
  })();

  const thumbs: Array<{ icon: 'barcode' | 'check' | 'camera'; label: string }> = [];
  if (!loose) thumbs.push({ icon: 'barcode', label: 'Barcode' });
  if (capture.front) thumbs.push({ icon: 'check', label: 'Front' });
  if (!loose && capture.back) thumbs.push({ icon: 'check', label: 'Back' });
  for (let i = 0; i < capture.more; i++) thumbs.push({ icon: 'check', label: `Extra ${i + 1}` });
  if (thumbs.length === 0) thumbs.push({ icon: 'camera', label: 'Image' });

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
          onClick={onRetake}
          aria-label="back"
          className="w-9 h-9 flex items-center justify-center -ml-2 active:bg-[#ECECEB] rounded-full"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: '#71717A' }} />
        </button>
        <div
          className="font-semibold flex-1"
          style={{ fontSize: '17px', color: '#1F1611' }}
        >
          Review &amp; submit
        </div>
      </div>

      <div
        style={{
          padding: '10px 16px 8px',
          background: '#fff',
          borderBottom: '1px solid #E5E5E4',
          flexShrink: 0,
        }}
      >
        <div
          className="text-[14px] font-medium"
          style={{ color: '#1F1611' }}
        >
          {capture.title}
        </div>
        <div className="text-[12px] mt-[2px]" style={{ color: '#71717A' }}>
          {detailParts.join(' · ')}
        </div>
      </div>

      <div
        className="flex-1 flex flex-col gap-2.5 overflow-y-auto"
        style={{ padding: '12px 16px', background: '#F5F5F4' }}
      >
        <div className="flex gap-[7px] flex-wrap">
          {thumbs.map((t, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center gap-[2px]"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '8px',
                border: '1px solid #7DBD3B',
                background: '#EAF3DE',
                color: '#3B6D11',
              }}
            >
              {t.icon === 'barcode' ? (
                <Barcode className="w-[18px] h-[18px]" />
              ) : t.icon === 'camera' ? (
                <Camera className="w-[18px] h-[18px]" />
              ) : (
                <Check className="w-[18px] h-[18px]" />
              )}
              <span style={{ fontSize: '9px' }}>{t.label}</span>
            </div>
          ))}
        </div>

        <div
          className="flex gap-[7px] items-center"
          style={{
            background: '#EAF3DE',
            borderRadius: '8px',
            padding: '10px 13px',
            border: '1px solid #97C459',
          }}
        >
          <CircleCheck
            className="w-4 h-4 flex-shrink-0"
            style={{ color: '#3B6D11' }}
          />
          <div className="text-[12.5px]" style={{ color: '#3B6D11' }}>
            {brandLabel}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #E5E5E4',
            borderRadius: '10px',
            padding: '12px 13px',
          }}
        >
          <div className="text-[11.5px]" style={{ color: '#71717A', marginBottom: '3px' }}>
            What happens next
          </div>
          <div className="text-[12.5px] leading-[1.6]" style={{ color: '#71717A' }}>
            AI extracts allergens, ingredients and nutrition in the background. You can keep
            scanning.
          </div>
        </div>
      </div>

      <div
        className="flex gap-2 flex-shrink-0"
        style={{
          padding: '10px 16px',
          paddingBottom: 'max(0.875rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
          background: '#fff',
          borderTop: '1px solid #E5E5E4',
        }}
      >
        <button
          type="button"
          onClick={onRetake}
          className="flex items-center justify-center text-[13px] font-medium active:opacity-80"
          style={{
            flex: 0.55,
            padding: '14px 16px',
            borderRadius: '8px',
            background: '#fff',
            border: '1px solid #A1A1AA',
            color: '#1F1611',
            minHeight: '48px',
          }}
        >
          Retake
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 flex items-center justify-center text-[14px] font-medium active:opacity-90"
          style={{
            padding: '14px 16px',
            borderRadius: '8px',
            background: '#FB923C',
            color: '#fff',
            border: '1px solid #FB923C',
            minHeight: '48px',
          }}
        >
          Submit
        </button>
      </div>
    </>
  );
}
