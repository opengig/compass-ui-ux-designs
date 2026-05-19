import { MapPin, ChevronRight, LogOut, List, BarChart3, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';

const RetinaLogo = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M7 22 C 5 13, 16 8, 26 9 C 33 9.5, 36 13, 34 17 C 32 21, 26 20, 22 18 C 14 14, 10 16, 8 21 C 7 23, 6 24, 7 22 Z"
      fill="#44403C"
      opacity=".55"
    />
    <ellipse cx="21" cy="9" rx="2" ry="2.6" fill="#44403C" />
    <path d="M19 14 C 17 17, 20 23, 24 21 C 27 19.5, 25 14, 21 14 Z" fill="#44403C" />
    <path d="M22 23 L 24.5 33 L 21 34.5 L 20 25 Z" fill="#44403C" />
  </svg>
);

export function AccountScreen() {
  const navigate = useNavigate();
  const onSignOut = () => navigate(STORE_MANAGER_ROUTES.login);
  const onOpenArticles = () => navigate(STORE_MANAGER_ROUTES.articles);
  const onOpenProgress = () => navigate(STORE_MANAGER_ROUTES.progress);
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
        <div
          className="font-semibold flex items-center gap-[7px]"
          style={{ fontSize: '17px', color: '#1F1611' }}
        >
          <RetinaLogo />
          Account
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto flex flex-col gap-2.5"
        style={{ background: '#F5F5F4', padding: '12px 16px' }}
      >
        <div
          className="flex items-center gap-3"
          style={{
            background: '#fff',
            border: '1px solid #E5E5E4',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div
            className="flex items-center justify-center font-semibold flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#ECECEB',
              fontSize: '16px',
              color: '#44403C',
            }}
          >
            RK
          </div>
          <div className="min-w-0">
            <div
              className="text-[15px] font-medium"
              style={{ color: '#1F1611' }}
            >
              Ravi Kumar
            </div>
            <div className="text-[12px] mt-[2px] truncate" style={{ color: '#71717A' }}>
              ravi.kumar@compass-group.com
            </div>
            <div className="text-[12px] mt-[1px]" style={{ color: '#71717A' }}>
              Store Manager · Bengaluru
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #E5E5E4',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase"
            style={{
              color: '#71717A',
              letterSpacing: '0.06em',
              padding: '10px 14px 6px',
            }}
          >
            Site
          </div>
          <div
            className="flex items-center gap-2.5 cursor-pointer active:bg-[#F5F5F4]"
            style={{
              padding: '12px 14px',
              minHeight: '48px',
              borderTop: '1px solid #ECECEB',
            }}
          >
            <MapPin
              className="w-4 h-4 flex-shrink-0"
              style={{ color: '#71717A' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[14px]" style={{ color: '#1F1611' }}>
                Bengaluru Central Kitchen
              </div>
              <div className="text-[12px] mt-[1px]" style={{ color: '#71717A' }}>
                BCK-001 · Primary
              </div>
            </div>
            <ChevronRight
              className="w-[16px] h-[16px]"
              style={{ color: '#A1A1AA' }}
            />
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #E5E5E4',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center gap-2.5 cursor-pointer active:bg-[#F5F5F4]"
            style={{ padding: '14px 14px', minHeight: '48px' }}
            onClick={onSignOut}
          >
            <LogOut
              className="w-4 h-4 flex-shrink-0"
              style={{ color: '#A32D2D' }}
            />
            <div
              className="flex-1 text-[14px] font-medium"
              style={{ color: '#A32D2D' }}
            >
              Sign out
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div
        className="flex flex-shrink-0"
        style={{
          background: '#fff',
          borderTop: '1px solid #E5E5E4',
          padding: '6px 0 0',
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <div
          className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-2 active:bg-[#F5F5F4]"
          onClick={onOpenArticles}
        >
          <div
            style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'transparent', marginBottom: '1px' }}
          />
          <List className="w-[22px] h-[22px]" style={{ color: '#71717A' }} />
          <span className="text-[10px]" style={{ color: '#71717A' }}>
            Articles
          </span>
        </div>
        <div
          className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-2 active:bg-[#F5F5F4]"
          onClick={onOpenProgress}
        >
          <div
            style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'transparent', marginBottom: '1px' }}
          />
          <BarChart3 className="w-[22px] h-[22px]" style={{ color: '#71717A' }} />
          <span className="text-[10px]" style={{ color: '#71717A' }}>
            Progress
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-2 active:bg-[#F5F5F4]">
          <div
            style={{ width: '32px', height: '3px', borderRadius: '2px', background: '#FB923C', marginBottom: '1px' }}
          />
          <UserCircle className="w-[22px] h-[22px]" style={{ color: '#1F1611' }} />
          <span
            className="text-[10px] font-medium"
            style={{ color: '#1F1611' }}
          >
            Account
          </span>
        </div>
      </div>
    </>
  );
}
