import { useNavigate } from 'react-router-dom';
import { ClipboardList, Salad, ScanLine } from 'lucide-react';
import {
  NUTRITIONIST_ROUTES,
  ROUTES,
  STORE_MANAGER_ROUTES,
} from '../../router/routes';

type Role = {
  key: 'store-manager' | 'nutritionist' | 'article-sme';
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  accentBg: string;
  to: string;
};

const ROLES: Role[] = [
  {
    key: 'store-manager',
    title: 'Store Manager',
    subtitle: 'On-site capture',
    description:
      'Scan barcodes, capture article images, and submit new SKUs from the unit.',
    icon: <ScanLine className="w-6 h-6" strokeWidth={1.75} />,
    accent: '#FB923C',
    accentBg: '#FFF7ED',
    to: STORE_MANAGER_ROUTES.articles,
  },
  {
    key: 'nutritionist',
    title: 'Nutritionist',
    subtitle: 'Clinical review',
    description:
      'Review extracted nutrition data, validate ingredients and allergens, and approve.',
    icon: <Salad className="w-6 h-6" strokeWidth={1.75} />,
    accent: '#C68A1E',
    accentBg: '#FEF7E6',
    to: NUTRITIONIST_ROUTES.dashboard,
  },
  {
    key: 'article-sme',
    title: 'Article SME',
    subtitle: 'Catalog & audit',
    description:
      'Triage the review queue, manage the catalog, and audit changes across sites.',
    icon: <ClipboardList className="w-6 h-6" strokeWidth={1.75} />,
    accent: '#0E7C66',
    accentBg: '#E7F6F1',
    to: ROUTES.review,
  },
];

/**
 * /index — role picker shown after the unified SSO sign-in.
 * One tile per role; clicking lands the user in that role's home screen.
 */
export function RolePickerScreen() {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background:
          'radial-gradient(1200px 600px at 50% -10%, #FFF7ED 0%, #FFFFFF 60%)',
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center mb-10">
          <svg width="48" height="48" viewBox="0 0 44 44" aria-hidden="true">
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
          <div
            className="text-[22px] font-bold mt-4"
            style={{ color: '#1F1611', letterSpacing: '-0.3px' }}
          >
            Welcome to Retina.AI
          </div>
          <div
            className="text-[13px] mt-1"
            style={{ color: '#71717A' }}
          >
            Choose how you&apos;ll be working today
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-[960px]">
          {ROLES.map((role) => (
            <button
              key={role.key}
              type="button"
              onClick={() => navigate(role.to)}
              className="text-left group transition-colors"
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: 16,
                padding: 20,
                cursor: 'pointer',
              }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: role.accentBg,
                    color: role.accent,
                  }}
                >
                  {role.icon}
                </div>
                <div
                  className="text-[10px] uppercase font-medium"
                  style={{
                    color: role.accent,
                    letterSpacing: '0.12em',
                  }}
                >
                  {role.subtitle}
                </div>
              </div>
              <div
                className="text-[18px] font-semibold mt-4"
                style={{ color: '#1F1611', letterSpacing: '-0.2px' }}
              >
                {role.title}
              </div>
              <div
                className="text-[13px] mt-1.5"
                style={{ color: '#52525B', lineHeight: 1.5 }}
              >
                {role.description}
              </div>
            </button>
          ))}
        </div>

        <div
          className="text-[12px] text-center mt-10"
          style={{ color: '#A1A1AA' }}
        >
          Signed in as <span style={{ color: '#52525B' }}>ravi.kumar@compass-group.com</span> ·{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#FB923C',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Switch account
          </button>
        </div>
      </div>
    </div>
  );
}
