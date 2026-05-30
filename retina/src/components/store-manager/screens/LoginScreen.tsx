import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';

/**
 * S0 — Login splash. Microsoft-branded SSO entry point, mirroring the source
 * prototype: retina.ai wordmark + "by Compass Group", a blue "Sign in with
 * Microsoft" button, divider, and the role-based access note. Everything is
 * vertically centered in the available space.
 */

/** Microsoft four-square logo (matches the source SVG). */
function MicrosoftMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" aria-hidden="true">
      <rect x="0" y="0" width="10" height="10" fill="#F25022" />
      <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
      <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

/** Retina leaf logo mark. */
function RetinaMark({ size = 86 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M7 22 C 5 13, 16 8, 26 9 C 33 9.5, 36 13, 34 17 C 32 21, 26 20, 22 18 C 14 14, 10 16, 8 21 C 7 23, 6 24, 7 22 Z"
        fill="#2B2A26"
        opacity=".5"
      />
      <ellipse cx="21" cy="9" rx="2" ry="2.6" fill="#2B2A26" />
      <path d="M19 14 C 17 17, 20 23, 24 21 C 27 19.5, 25 14, 21 14 Z" fill="#2B2A26" />
      <path d="M22 23 L 24.5 33 L 21 34.5 L 20 25 Z" fill="#2B2A26" />
    </svg>
  );
}

export function LoginScreen() {
  const navigate = useNavigate();
  const onSignIn = () => navigate(STORE_MANAGER_ROUTES.sso);
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center"
      style={{
        background: '#fff',
        gap: '22px',
        padding: '32px 24px',
        paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 1rem))',
      }}
    >
      {/* Logo / brand block */}
      <div className="flex flex-col items-center" style={{ gap: '14px' }}>
        <RetinaMark size={86} />
        <div className="text-center">
          <div
            className="text-[22px] font-bold"
            style={{ color: '#2B2A26', letterSpacing: '-0.3px' }}
          >
            retina.ai
          </div>
          <div
            className="text-[10px] uppercase mt-1"
            style={{ color: '#9C9B94', letterSpacing: '0.15em' }}
          >
            by Compass Group
          </div>
        </div>
      </div>

      {/* CTA block */}
      <div className="w-full flex flex-col items-center" style={{ gap: '16px' }}>
        <button
          type="button"
          onClick={onSignIn}
          className="w-full flex items-center justify-center text-[14px] font-semibold active:opacity-90"
          style={{
            background: '#0F6CBD',
            color: '#fff',
            gap: '10px',
            padding: '13px 16px',
            borderRadius: '10px',
          }}
        >
          <MicrosoftMark size={16} />
          Sign in with Microsoft
        </button>
        <div className="w-full" style={{ height: '1px', background: '#EDEBE5' }} />
        <div
          className="text-[12px] text-center"
          style={{ color: '#9C9B94', lineHeight: 1.5 }}
        >
          Access is role-based. Contact your admin if
          <br />
          you cannot log in.
        </div>
      </div>
    </div>
  );
}
