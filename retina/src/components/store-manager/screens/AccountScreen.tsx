import { useState } from 'react';
import { MapPin, ChevronDown, LogOut, List, BarChart3, UserCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';

const SITES = [
  { id: 'bck-001', name: 'Bengaluru Central Kitchen', code: 'BCK-001 · Primary' },
  { id: 'bck-002', name: 'Whitefield Kitchen',         code: 'BCK-002' },
  { id: 'bck-003', name: 'Electronic City Kitchen',    code: 'BCK-003' },
];

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
  const [siteOpen, setSiteOpen] = useState(false);
  const [siteId, setSiteId] = useState(SITES[0].id);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const onSignOut = () => navigate(STORE_MANAGER_ROUTES.login);
  const onOpenArticles = () => navigate(STORE_MANAGER_ROUTES.articles);
  const onOpenProgress = () => navigate(STORE_MANAGER_ROUTES.progress);
  const currentSite = SITES.find((s) => s.id === siteId) ?? SITES[0];

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
        style={{ background: '#FCF8F0', padding: '12px 16px' }}
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
          <button
            type="button"
            onClick={() => setSiteOpen(true)}
            className="w-full flex items-center gap-2.5 cursor-pointer active:bg-[#F5F5F4]"
            style={{
              padding: '12px 14px',
              minHeight: '48px',
              borderTop: '1px solid #ECECEB',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
            }}
          >
            <MapPin
              className="w-4 h-4 flex-shrink-0"
              style={{ color: '#C68A1E' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[14px]" style={{ color: '#1F1611' }}>
                {currentSite.name}
              </div>
              <div className="text-[12px] mt-[1px]" style={{ color: '#71717A' }}>
                {currentSite.code}
              </div>
            </div>
            <ChevronDown
              className="w-[16px] h-[16px]"
              style={{ color: '#C68A1E' }}
            />
          </button>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #E5E5E4',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            className="w-full flex items-center gap-2.5 cursor-pointer active:bg-[#F5F5F4]"
            style={{
              padding: '14px 14px',
              minHeight: '48px',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
            }}
            onClick={() => setSignOutOpen(true)}
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
          </button>
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
            style={{ width: '32px', height: '3px', borderRadius: '2px', background: '#C68A1E', marginBottom: '1px' }}
          />
          <UserCircle className="w-[22px] h-[22px]" style={{ color: '#C68A1E' }} />
          <span
            className="text-[10px] font-medium"
            style={{ color: '#C68A1E' }}
          >
            Account
          </span>
        </div>
      </div>

      {/* Site picker action sheet */}
      {siteOpen && (
        <>
          <div className="sm-overlay" onClick={() => setSiteOpen(false)} />
          <div className="sm-sheet" style={{ maxHeight: '70%' }}>
            <div className="sm-handle" />
            <div className="flex items-center gap-3" style={{ padding: '12px 16px 8px' }}>
              <span
                className="flex-1 font-semibold"
                style={{ fontSize: '16px', color: '#1F1611' }}
              >
                Select site
              </span>
            </div>
            <div className="overflow-y-auto" style={{ paddingBottom: '8px' }}>
              {SITES.map((s) => {
                const on = s.id === siteId;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSiteId(s.id);
                      setSiteOpen(false);
                    }}
                    className="flex items-center gap-[10px] cursor-pointer active:bg-[#F5F5F4]"
                    style={{
                      padding: '12px 16px',
                      minHeight: '48px',
                      borderBottom: '1px solid #ECECEB',
                      background: on ? '#FBF3E0' : 'transparent',
                    }}
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: on ? '#C68A1E' : '#71717A' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px]" style={{ color: '#1F1611', fontWeight: on ? 600 : 400 }}>
                        {s.name}
                      </div>
                      <div className="text-[12px] mt-[1px]" style={{ color: '#71717A' }}>
                        {s.code}
                      </div>
                    </div>
                    {on && <Check className="w-[16px] h-[16px]" style={{ color: '#C68A1E' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Sign-out confirmation */}
      {signOutOpen && (
        <>
          <div className="sm-overlay" onClick={() => setSignOutOpen(false)} />
          <div className="sm-sheet" style={{ paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom) + 8px))' }}>
            <div className="sm-handle" />
            <div style={{ padding: '16px 20px 4px' }}>
              <div className="text-[16px] font-semibold" style={{ color: '#1F1611' }}>
                Sign out?
              </div>
              <div className="text-[13px] mt-[4px]" style={{ color: '#71717A' }}>
                You'll need to sign back in to continue scanning.
              </div>
            </div>
            <div className="flex gap-2" style={{ padding: '14px 20px 8px' }}>
              <button
                type="button"
                onClick={() => setSignOutOpen(false)}
                className="flex-1 flex items-center justify-center text-[14px] font-medium active:opacity-80"
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: '#fff',
                  border: '1px solid #E5E5E4',
                  color: '#1F1611',
                  minHeight: '48px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="flex-1 flex items-center justify-center gap-1.5 text-[14px] font-medium active:opacity-90"
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: '#A32D2D',
                  color: '#fff',
                  border: '1px solid #A32D2D',
                  minHeight: '48px',
                }}
              >
                <LogOut className="w-[15px] h-[15px]" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
