import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';
import { COMPASS_LOGO } from '../../nutritionist/data/images';

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
        <img
          src={COMPASS_LOGO}
          alt="Compass Group"
          style={{ width: 86, height: 86, objectFit: 'contain' }}
        />
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
