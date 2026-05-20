import { ArrowLeft, WifiOff, Package, Check, X, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';

export function RetryScreen() {
  const navigate = useNavigate();
  const onCancel = () => navigate(STORE_MANAGER_ROUTES.articles);
  const onRetry = () => navigate(STORE_MANAGER_ROUTES.done);
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
          className="w-9 h-9 flex items-center justify-center -ml-2 active:bg-[#ECECEB] rounded-full"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: '#71717A' }} />
        </button>
        <div
          className="font-semibold flex-1"
          style={{ fontSize: '17px', color: '#1F1611' }}
        >
          Upload failed
        </div>
      </div>

      <div
        className="flex-1 flex flex-col gap-2.5 overflow-y-auto"
        style={{ padding: '12px 16px', background: '#FCF8F0' }}
      >
        <div
          style={{
            background: '#FCEBEB',
            borderRadius: '10px',
            padding: '12px 14px',
            border: '1px solid #F09595',
          }}
        >
          <div
            className="text-[12.5px] font-semibold flex items-center gap-1.5"
            style={{ color: '#A32D2D', marginBottom: '4px' }}
          >
            <WifiOff className="w-[15px] h-[15px]" />
            Connection lost during upload
          </div>
          <div className="text-[12.5px] leading-[1.5]" style={{ color: '#A32D2D' }}>
            Your images were saved. Tap retry — no need to rescan.
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #E5E5E4',
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase"
            style={{
              color: '#71717A',
              letterSpacing: '0.05em',
              marginBottom: '5px',
            }}
          >
            Failed article
          </div>
          <div className="flex items-center gap-2.5 mt-1.5">
            <div
              style={{
                width: '34px',
                height: '34px',
                background: '#FCEBEB',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Package className="w-[17px] h-[17px]" style={{ color: '#A32D2D' }} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[13.5px] font-medium"
                style={{ color: '#1F1611' }}
              >
                MDH Chana Masala 100g
              </div>
              <div className="text-[12px]" style={{ color: '#71717A' }}>
                ART-10102 · 3 images saved
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #E5E5E4',
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase"
            style={{
              color: '#71717A',
              letterSpacing: '0.05em',
              marginBottom: '5px',
            }}
          >
            Saved images — ready to upload
          </div>
          <div className="flex gap-[7px] mt-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center"
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '8px',
                  border: '1px solid #7DBD3B',
                  background: '#EAF3DE',
                }}
              >
                <Check className="w-[18px] h-[18px]" style={{ color: '#3B6D11' }} />
              </div>
            ))}
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
          onClick={onCancel}
          className="flex items-center justify-center gap-1.5 text-[13px] font-medium active:opacity-80"
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
          <X className="w-[14px] h-[14px]" />
          Cancel
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-1.5 text-[14px] font-medium active:opacity-90"
          style={{
            padding: '14px 16px',
            borderRadius: '8px',
            background: '#C68A1E',
            color: '#fff',
            border: '1px solid #C68A1E',
            minHeight: '48px',
          }}
        >
          <RefreshCw className="w-[15px] h-[15px]" />
          Retry upload
        </button>
      </div>
    </>
  );
}
