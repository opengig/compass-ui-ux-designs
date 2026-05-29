import { Check, Lock, ScanLine, List, BarChart3, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';
import { SCANNED_TODAY_PROGRESS } from '../data/storeManagerMockData';

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
      fill="#4A463E"
      opacity=".55"
    />
    <ellipse cx="21" cy="9" rx="2" ry="2.6" fill="#4A463E" />
    <path d="M19 14 C 17 17, 20 23, 24 21 C 27 19.5, 25 14, 21 14 Z" fill="#4A463E" />
    <path d="M22 23 L 24.5 33 L 21 34.5 L 20 25 Z" fill="#4A463E" />
  </svg>
);

export function ProgressScreen() {
  const navigate = useNavigate();
  const onOpenArticles = () => navigate(STORE_MANAGER_ROUTES.articles);
  const onOpenAccount = () => navigate(STORE_MANAGER_ROUTES.account);
  const onRetryFailed = () => navigate(STORE_MANAGER_ROUTES.retry);
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
          style={{ fontSize: '17px', color: '#1A1A1A' }}
        >
          <RetinaLogo />
          Progress
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto flex flex-col gap-2.5"
        style={{ padding: '10px 14px 12px', background: '#FBF9F5' }}
      >
        {/* Gamification banner */}
        <div
          style={{
            background: 'linear-gradient(135deg,#C68A1E,#4A463E)',
            borderRadius: '12px',
            padding: '13px 15px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase mb-[3px]"
            style={{
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.08em',
            }}
          >
            Today&apos;s streak
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="font-bold"
              style={{ fontSize: '28px', color: '#ECE6DA', lineHeight: 1 }}
            >
              7
            </div>
            <div className="min-w-0">
              <div
                className="text-[13.5px] font-medium"
                style={{ color: '#fff' }}
              >
                articles scanned!
              </div>
              <div
                className="text-[11.5px] mt-[1px]"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                Keep going — 13 more to hit today&apos;s target
              </div>
            </div>
          </div>
          <div className="flex gap-1" style={{ marginTop: '10px' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: i < 7 ? '#ECE6DA' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
          <div
            className="text-[10px] mt-1"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            7 of 20 today
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid gap-[7px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div
            className="text-center"
            style={{
              background: '#E6F2EA',
              borderRadius: '10px',
              padding: '9px 8px',
              border: '1px solid #A8D9BC',
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase mb-[2px]"
              style={{ color: '#1B8754', letterSpacing: '0.04em' }}
            >
              Done
            </div>
            <div
              className="font-bold"
              style={{ fontSize: '20px', color: '#1B8754', lineHeight: 1 }}
            >
              6
            </div>
          </div>
          <div
            className="text-center"
            style={{
              background: '#FCEAEA',
              borderRadius: '10px',
              padding: '9px 8px',
              border: '1px solid #EFA0A0',
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase mb-[2px]"
              style={{ color: '#C53030', letterSpacing: '0.04em' }}
            >
              Failed
            </div>
            <div
              className="font-bold"
              style={{ fontSize: '20px', color: '#C53030', lineHeight: 1 }}
            >
              1
            </div>
          </div>
        </div>

        {/* Weekly streak */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #ECE6DA',
            borderRadius: '10px',
            padding: '10px 12px',
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase"
            style={{
              color: '#8A8275',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            Weekly streak
          </div>
          <div className="flex gap-1.5">
            {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const).map((d) => (
              <div
                key={d}
                className="flex-1 flex flex-col items-center gap-[3px]"
              >
                {d === 'Thu' ? (
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: '#C68A1E',
                      border: '2px solid #ECE6DA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      className="font-bold"
                      style={{ fontSize: '10px', color: '#ECE6DA' }}
                    >
                      7
                    </span>
                  </div>
                ) : d === 'Fri' ? (
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: '#ECE6DA',
                      border: '1.5px dashed #B8B0A1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Lock className="w-[12px] h-[12px]" style={{ color: '#B8B0A1' }} />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: '#E6F2EA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check className="w-[15px] h-[15px]" style={{ color: '#1B8754' }} />
                  </div>
                )}
                <span
                  className="text-[9px]"
                  style={{
                    color:
                      d === 'Thu'
                        ? '#ECE6DA'
                        : d === 'Fri'
                          ? '#B8B0A1'
                          : '#8A8275',
                    fontWeight: d === 'Thu' ? 500 : 400,
                  }}
                >
                  {d}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scanned today activity */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #ECE6DA',
            borderRadius: '10px',
            padding: '10px 12px',
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase"
            style={{
              color: '#8A8275',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            Scanned today
          </div>
          <div className="flex flex-col gap-[7px]">
            {SCANNED_TODAY_PROGRESS.map((r) => (
              <div key={r.name} className="flex items-center gap-2">
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: r.status === 'done' ? '#1B8754' : '#C53030',
                    flexShrink: 0,
                  }}
                />
                <span
                  className="flex-1 text-[12.5px] truncate"
                  style={{ color: '#1A1A1A' }}
                >
                  {r.name}
                </span>
                <span className="text-[11px]" style={{ color: '#8A8275' }}>
                  {r.time}
                </span>
                {r.status === 'done' ? (
                  <span
                    className="text-[11.5px] font-medium"
                    style={{ color: '#1B8754' }}
                  >
                    Done
                  </span>
                ) : (
                  <span
                    className="text-[11.5px] font-medium cursor-pointer active:opacity-70"
                    style={{ color: '#C53030', padding: '4px 6px', margin: '-4px -6px' }}
                    onClick={onRetryFailed}
                  >
                    Retry
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenArticles}
          className="w-full flex items-center justify-center gap-1.5 text-[14px] font-medium active:opacity-90"
          style={{
            padding: '14px 16px',
            borderRadius: '8px',
            background: '#C68A1E',
            color: '#fff',
            border: '1px solid #C68A1E',
            minHeight: '48px',
          }}
        >
          <ScanLine className="w-[16px] h-[16px]" />
          Continue scanning
        </button>
      </div>

      {/* Bottom nav */}
      <div
        className="flex flex-shrink-0"
        style={{
          background: '#fff',
          borderTop: '1px solid #ECE6DA',
          padding: '6px 0 0',
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <div
          className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-2 active:bg-[#F5F3EE]"
          onClick={onOpenArticles}
        >
          <div
            style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'transparent', marginBottom: '1px' }}
          />
          <List className="w-[22px] h-[22px]" style={{ color: '#8A8275' }} />
          <span className="text-[10px]" style={{ color: '#8A8275' }}>
            Articles
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-2 active:bg-[#F5F3EE]">
          <div
            style={{ width: '32px', height: '3px', borderRadius: '2px', background: '#C68A1E', marginBottom: '1px' }}
          />
          <BarChart3 className="w-[22px] h-[22px]" style={{ color: '#C68A1E' }} />
          <span
            className="text-[10px] font-medium"
            style={{ color: '#C68A1E' }}
          >
            Progress
          </span>
        </div>
        <div
          className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-2 active:bg-[#F5F3EE]"
          onClick={onOpenAccount}
        >
          <div
            style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'transparent', marginBottom: '1px' }}
          />
          <UserCircle className="w-[22px] h-[22px]" style={{ color: '#8A8275' }} />
          <span className="text-[10px]" style={{ color: '#8A8275' }}>
            Account
          </span>
        </div>
      </div>
    </>
  );
}
