import { ChevronLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';

/**
 * S1 — Microsoft sign-in handoff. Mirrors the source prototype: a faux browser
 * chrome (URL bar + load progress) above the Microsoft sign-in card.
 */
export function SsoScreen() {
  const navigate = useNavigate();
  const onNext = () => navigate(STORE_MANAGER_ROUTES.articles);
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Faux browser chrome */}
      <div
        className="flex-shrink-0"
        style={{
          background: '#F2F2F2',
          borderBottom: '1px solid #DADADA',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="flex items-center" style={{ padding: '6px 10px 4px', gap: '6px' }}>
          <ChevronLeft className="w-[17px] h-[17px]" style={{ color: '#6B6A64' }} />
          <div
            className="flex-1 flex items-center"
            style={{
              background: '#fff',
              border: '1px solid #DADADA',
              borderRadius: '20px',
              padding: '5px 12px',
              gap: '5px',
            }}
          >
            <Lock className="w-[11px] h-[11px]" style={{ color: '#1A7F3C' }} />
            <span className="text-[11px]" style={{ color: '#2B2A26' }}>
              login.microsoftonline.com
            </span>
          </div>
        </div>
        <div style={{ height: '2px', background: '#E0E0E0' }}>
          <div style={{ height: '2px', width: '75%', background: '#0067B8', borderRadius: '1px' }} />
        </div>
      </div>

      {/* Sign-in card */}
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{ background: '#E8F0F9', padding: '16px', gap: '8px' }}
      >
        <div
          className="w-full"
          style={{
            background: '#fff',
            borderRadius: '4px',
            padding: '22px 22px 18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          }}
        >
          <div className="flex items-center" style={{ gap: '8px', marginBottom: '14px' }}>
            <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
              <rect x="0" y="0" width="10" height="10" fill="#F25022" />
              <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
              <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
              <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
            </svg>
            <span className="text-[13px]" style={{ color: '#2B2A26' }}>
              Microsoft
            </span>
          </div>
          <div
            className="font-semibold"
            style={{ fontSize: '19px', color: '#2B2A26', marginBottom: '14px' }}
          >
            Sign in
          </div>
          <div
            style={{
              borderBottom: '1.5px solid #0067B8',
              paddingBottom: '4px',
              marginBottom: '5px',
            }}
          >
            <div className="text-[10px] mb-0.5" style={{ color: '#0067B8' }}>
              Email
            </div>
            <div className="text-[12px]" style={{ color: '#2B2A26' }}>
              ravi.kumar@compass-group.com
            </div>
          </div>
          <div className="text-[11px]" style={{ color: '#0067B8', margin: '8px 0 18px' }}>
            Can&apos;t access your account?
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onNext}
              className="active:opacity-90"
              style={{
                background: '#0067B8',
                color: '#fff',
                fontSize: '13px',
                padding: '8px 20px',
                borderRadius: '2px',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
