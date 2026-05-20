import { Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';

/**
 * S0 — Login splash with the Compass SSO call-to-action.
 * Phone-first layout: logo block sits in the upper-middle, CTA pinned to
 * the bottom with safe-area padding for devices with home indicators.
 */
export function LoginScreen() {
  const navigate = useNavigate();
  const onSignIn = () => navigate(STORE_MANAGER_ROUTES.sso);
  return (
    <div className="flex-1 flex flex-col" style={{ background: '#fff' }}>
      {/* Logo / hero block — vertically centered in the available space */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
        <svg width="72" height="72" viewBox="0 0 44 44" aria-hidden="true">
          <rect width="44" height="44" rx="11" fill="#C68A1E" />
          <line
            x1="10"
            y1="34"
            x2="34"
            y2="10"
            stroke="#F1ECDD"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <polygon points="34,10 29,14 32,17" fill="#F1ECDD" />
          <polygon points="10,34 15,30 12,27" fill="#9C9B94" />
          <circle cx="22" cy="22" r="2.2" fill="#F1ECDD" />
        </svg>
        <div className="text-center">
          <div
            className="text-[28px] font-bold leading-none"
            style={{ color: '#2B2A26', letterSpacing: '-0.4px' }}
          >
            RETINA <span style={{ color: '#C5C4BC' }}>AI</span>
          </div>
          <div
            className="text-[11px] uppercase mt-2"
            style={{ color: '#9C9B94', letterSpacing: '0.18em' }}
          >
            by Compass Group
          </div>
        </div>
      </div>

      {/* Bottom CTA — pinned, safe-area aware */}
      <div
        className="px-6 flex flex-col gap-3"
        style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))', paddingTop: '1.5rem' }}
      >
        <button
          type="button"
          onClick={onSignIn}
          className="w-full flex items-center justify-center gap-2 rounded-xl text-[15px] font-medium active:opacity-90"
          style={{
            background: '#C68A1E',
            color: '#fff',
            padding: '15px 16px',
          }}
        >
          <Square className="w-[18px] h-[18px]" strokeWidth={2} />
          Sign in with Compass SSO
        </button>
        <div className="text-[12px] text-center" style={{ color: '#9C9B94' }}>
          Use your Compass Group email
        </div>
        <div className="text-[11px] text-center mt-4" style={{ color: '#C5C4BC' }}>
          Secured by Microsoft Entra ID
        </div>
      </div>
    </div>
  );
}
