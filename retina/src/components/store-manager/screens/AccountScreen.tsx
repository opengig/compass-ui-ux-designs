import { useState } from 'react';
import { MapPin, ChevronRight, LogOut, List, BarChart3, UserCircle, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';
import { useStoreManager } from '../StoreManagerContext';
import { SITES } from '../data/storeManagerMockData';

export function AccountScreen() {
  const navigate = useNavigate();
  const { showToast, siteId, setSiteId } = useStoreManager();
  const [siteOpen, setSiteOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const onSignOut = () => navigate(STORE_MANAGER_ROUTES.login);
  const onOpenArticles = () => navigate(STORE_MANAGER_ROUTES.articles);
  const onOpenProgress = () => navigate(STORE_MANAGER_ROUTES.progress);
  const currentSite = SITES.find((s) => s.id === siteId) ?? SITES[0];

  const selectSite = (id: string) => {
    const s = SITES.find((x) => x.id === id);
    setSiteId(id);
    setSiteOpen(false);
    if (s) showToast(`Site switched to ${s.name}`);
  };

  return (
    <>
      {/* Topbar */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          padding: '10px 16px 8px',
          paddingTop: 'max(10px, env(safe-area-inset-top))',
          background: '#fff',
        }}
      >
        <div className="font-semibold" style={{ fontSize: '16px', color: '#2B2A26' }}>
          Account
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto flex flex-col gap-2.5"
        style={{ background: '#FBF8F0', padding: '12px 16px' }}
      >
        {/* Profile card */}
        <div
          className="flex items-center gap-3"
          style={{ background: '#fff', border: '1px solid #F1ECDD', borderRadius: '12px', padding: '16px' }}
        >
          <div
            className="flex items-center justify-center font-semibold flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#E6F1FB',
              fontSize: '16px',
              color: '#185FA5',
            }}
          >
            RK
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-medium" style={{ color: '#2B2A26' }}>
              Ravi Kumar
            </div>
            <div className="text-[11px] mt-[2px] truncate" style={{ color: '#9C9B94' }}>
              ravi.kumar@compass-group.com
            </div>
            <div className="text-[11px] mt-[1px]" style={{ color: '#9C9B94' }}>
              Store Manager · Bengaluru
            </div>
          </div>
        </div>

        {/* Site */}
        <div style={{ background: '#fff', border: '1px solid #F1ECDD', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            className="text-[10px] font-semibold uppercase"
            style={{ color: '#9C9B94', letterSpacing: '0.06em', padding: '10px 14px 6px' }}
          >
            Site
          </div>
          <button
            type="button"
            onClick={() => setSiteOpen(true)}
            className="w-full flex items-center gap-2.5 cursor-pointer active:bg-[#F5F5F4]"
            style={{
              padding: '10px 14px',
              borderTop: '1px solid #F9F4EA',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
            }}
          >
            <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#6B6A64' }} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px]" style={{ color: '#2B2A26' }}>
                {currentSite.name}
              </div>
              <div className="text-[11px] mt-[1px]" style={{ color: '#9C9B94' }}>
                {currentSite.meta}
              </div>
            </div>
            <ChevronRight className="w-[15px] h-[15px]" style={{ color: '#C5C4BC' }} />
          </button>
        </div>

        {/* Sign out */}
        <div style={{ background: '#fff', border: '1px solid #F1ECDD', borderRadius: '12px', overflow: 'hidden' }}>
          <button
            type="button"
            className="w-full flex items-center gap-2.5 cursor-pointer active:bg-[#F5F5F4]"
            style={{ padding: '12px 14px', background: 'transparent', border: 'none', textAlign: 'left' }}
            onClick={() => setSignOutOpen(true)}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" style={{ color: '#A32D2D' }} />
            <div className="flex-1 text-[13px] font-medium" style={{ color: '#A32D2D' }}>
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
          borderTop: '1px solid #F1ECDD',
          padding: '6px 0 0',
          paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-1 active:bg-[#F5F5F4]" onClick={onOpenArticles}>
          <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'transparent', marginBottom: '1px' }} />
          <List className="w-[22px] h-[22px]" style={{ color: '#9C9B94' }} />
          <span className="text-[10px]" style={{ color: '#9C9B94' }}>
            Articles
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-1 active:bg-[#F5F5F4]" onClick={onOpenProgress}>
          <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'transparent', marginBottom: '1px' }} />
          <BarChart3 className="w-[22px] h-[22px]" style={{ color: '#9C9B94' }} />
          <span className="text-[10px]" style={{ color: '#9C9B94' }}>
            Progress
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-1 active:bg-[#F5F5F4]">
          <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: '#C68A1E', marginBottom: '1px' }} />
          <UserCircle className="w-[22px] h-[22px]" style={{ color: '#C68A1E' }} />
          <span className="text-[10px] font-medium" style={{ color: '#C68A1E' }}>
            Account
          </span>
        </div>
      </div>

      {/* Switch-site bottom sheet */}
      {siteOpen && (
        <>
          <div className="sm-overlay" onClick={() => setSiteOpen(false)} />
          <div className="sm-sheet" style={{ maxHeight: '70%' }}>
            <div className="sm-handle" />
            <div className="flex items-center justify-between" style={{ padding: '12px 18px 4px' }}>
              <span className="font-semibold" style={{ fontSize: '15px', color: '#2B2A26' }}>
                Switch site
              </span>
              <button
                type="button"
                onClick={() => setSiteOpen(false)}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center -mr-2 active:bg-[#F9F4EA] rounded-full"
              >
                <X className="w-[18px] h-[18px]" style={{ color: '#6B6A64' }} />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ padding: '8px 14px 18px' }}>
              {SITES.map((s) => {
                const on = s.id === siteId;
                return (
                  <div
                    key={s.id}
                    onClick={() => selectSite(s.id)}
                    className="flex items-center gap-[10px] cursor-pointer active:opacity-90"
                    style={{
                      padding: '12px 14px',
                      border: `1px solid ${on ? '#C68A1E' : '#F1ECDD'}`,
                      borderRadius: '10px',
                      marginBottom: '6px',
                      background: on ? '#FBF6EC' : '#fff',
                    }}
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: on ? '#C68A1E' : '#6B6A64' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px]" style={{ color: '#2B2A26', fontWeight: on ? 600 : 500 }}>
                        {s.name}
                      </div>
                      <div className="text-[11px] mt-[1px]" style={{ color: '#9C9B94' }}>
                        {s.meta}
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

      {/* Sign-out confirmation modal (centered) */}
      {signOutOpen && (
        <>
          <div className="sm-overlay" style={{ zIndex: 11 }} onClick={() => setSignOutOpen(false)} />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              background: '#fff',
              borderRadius: '14px',
              width: '78%',
              maxWidth: '300px',
              padding: '18px 18px 14px',
              zIndex: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
          >
            <div className="flex items-center gap-2.5" style={{ marginBottom: '8px' }}>
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FAF1EE' }}
              >
                <LogOut className="w-4 h-4" style={{ color: '#B94A48' }} />
              </div>
              <div className="text-[14px] font-semibold" style={{ color: '#2B2A26' }}>
                Sign out?
              </div>
            </div>
            <div className="text-[12px]" style={{ color: '#6B6A64', lineHeight: 1.5, marginBottom: '14px' }}>
              You&apos;ll need to sign in again to continue scanning.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSignOutOpen(false)}
                className="flex-1 flex items-center justify-center text-[12px] font-medium active:opacity-80"
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#fff',
                  border: '1px solid #C5C4BC',
                  color: '#2B2A26',
                  minHeight: '44px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="flex-1 flex items-center justify-center text-[12px] font-medium active:opacity-90"
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#B94A48',
                  color: '#fff',
                  border: '1px solid #B94A48',
                  minHeight: '44px',
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
