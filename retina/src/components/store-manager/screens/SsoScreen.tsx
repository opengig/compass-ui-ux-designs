import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';

/**
 * S1 — Microsoft sign-in handoff. Phone-first, no fake browser chrome — on a
 * real device the OS webview supplies its own URL bar, so the mock didn't add
 * value. Just the Microsoft sign-in card on the standard mobile screen.
 */
export function SsoScreen() {
  const navigate = useNavigate();
  const onNext = () => navigate(STORE_MANAGER_ROUTES.articles);
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-5"
      style={{
        background: '#E8F0F9',
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
      }}
    >
      <div
        className="w-full max-w-md"
        style={{
          background: '#fff',
          borderRadius: '6px',
          padding: '28px 26px 22px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-center gap-2.5 mb-5">
          <svg width="22" height="22" viewBox="0 0 21 21" aria-hidden="true">
            <rect x="0" y="0" width="10" height="10" fill="#F25022" />
            <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
            <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
            <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
          </svg>
          <span className="text-[14px]" style={{ color: '#1F1611' }}>
            Microsoft
          </span>
        </div>
        <div
          className="font-semibold mb-4"
          style={{ fontSize: '24px', color: '#1F1611', lineHeight: 1.15 }}
        >
          Sign in
        </div>
        <div
          style={{
            borderBottom: '1.5px solid #0067B8',
            paddingBottom: '6px',
            marginBottom: '6px',
          }}
        >
          <div className="text-[11px] mb-0.5" style={{ color: '#0067B8' }}>
            Email
          </div>
          <div className="text-[14px]" style={{ color: '#1F1611' }}>
            ravi.kumar@compass-group.com
          </div>
        </div>
        <div className="text-[12px]" style={{ color: '#0067B8', margin: '10px 0 24px' }}>
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
              fontSize: '14px',
              padding: '10px 28px',
              borderRadius: '2px',
              cursor: 'pointer',
              border: 'none',
              fontWeight: 500,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
