import { useNavigate } from 'react-router-dom';
import { SHARED_ROUTES } from '../../router/routes';

/**
 * Unified SSO landing screen — the single entry point for all roles.
 * On Sign in, navigate to /index, where the user picks which role app to enter.
 */
export function UnifiedLoginScreen() {
  const navigate = useNavigate();
  const onSignIn = () => navigate(SHARED_ROUTES.index);
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background:
          'radial-gradient(1200px 600px at 50% -10%, #FFF7ED 0%, #FFFFFF 60%)',
      }}
    >
      <div className="flex-1 flex items-center justify-center px-6">
        <div
          className="w-full max-w-[420px] flex flex-col items-center"
          style={{
            background: '#fff',
            border: '1px solid #E5E5E4',
            borderRadius: 16,
            padding: '40px 32px 28px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(31, 22, 17, 0.06)',
          }}
        >
          <svg width="72" height="72" viewBox="0 0 44 44" aria-hidden="true">
            <rect width="44" height="44" rx="11" fill="#FB923C" />
            <line
              x1="10"
              y1="34"
              x2="34"
              y2="10"
              stroke="#E5E5E4"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <polygon points="34,10 29,14 32,17" fill="#E5E5E4" />
            <polygon points="10,34 15,30 12,27" fill="#71717A" />
            <circle cx="22" cy="22" r="2.2" fill="#E5E5E4" />
          </svg>
          <div className="text-center mt-5">
            <div
              className="text-[28px] font-bold leading-none"
              style={{ color: '#1F1611', letterSpacing: '-0.4px' }}
            >
              RETINA <span style={{ color: '#A1A1AA' }}>AI</span>
            </div>
            <div
              className="text-[11px] uppercase mt-2"
              style={{ color: '#71717A', letterSpacing: '0.18em' }}
            >
              by Compass Group
            </div>
            <div
              className="text-[13px] mt-5"
              style={{ color: '#52525B', lineHeight: 1.5 }}
            >
              Food Article Intelligence — sign in to access your role&apos;s
              workspace.
            </div>
          </div>

          <button
            type="button"
            onClick={onSignIn}
            className="w-full flex items-center justify-center gap-2 rounded-xl text-[15px] font-medium active:opacity-90 mt-7"
            style={{
              background: '#0078D4',
              color: '#fff',
              padding: '14px 16px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="0" y="0" width="7" height="7" fill="#F25022" />
              <rect x="9" y="0" width="7" height="7" fill="#7FBA00" />
              <rect x="0" y="9" width="7" height="7" fill="#00A4EF" />
              <rect x="9" y="9" width="7" height="7" fill="#FFB900" />
            </svg>
            Sign in with Compass SSO
          </button>
          <div
            className="text-[12px] text-center mt-3"
            style={{ color: '#71717A' }}
          >
            Use your Compass Group email
          </div>
          <div
            className="text-[11px] text-center mt-6"
            style={{ color: '#A1A1AA' }}
          >
            Secured by Microsoft Entra ID
          </div>
        </div>
      </div>
      <div
        className="text-[11px] text-center pb-6"
        style={{ color: '#A1A1AA' }}
      >
        © {new Date().getFullYear()} Compass Group · Retina.AI
      </div>
    </div>
  );
}
