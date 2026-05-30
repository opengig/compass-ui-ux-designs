import { ChevronRight, Barcode, List, BarChart3, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';
import { useStoreManager } from '../StoreManagerContext';
import { TO_SCAN_ARTICLES, GTIN_MAP, type Article } from '../data/storeManagerMockData';

type DayBar = { day: string; count: number; tone: 'normal' | 'today' | 'empty' };

const WEEK_BARS: DayBar[] = [
  { day: 'Mon', count: 12, tone: 'normal' },
  { day: 'Tue', count: 8, tone: 'normal' },
  { day: 'Wed', count: 15, tone: 'normal' },
  { day: 'Thu', count: 7, tone: 'today' },
  { day: 'Fri', count: 0, tone: 'empty' },
];

/**
 * S8 — standalone Progress screen. Operational stats (this week / month),
 * a day-by-day bar count, and the next articles to scan.
 */
export function ProgressScreen() {
  const navigate = useNavigate();
  const { setCapture } = useStoreManager();
  const onOpenArticles = () => navigate(STORE_MANAGER_ROUTES.articles);
  const onOpenAccount = () => navigate(STORE_MANAGER_ROUTES.account);

  const startScan = (article: Article) => {
    setCapture({
      mode: 'barcode',
      barcode: false,
      front: false,
      back: false,
      more: 0,
      active: 'front',
      title: article.name,
      code: article.code,
      gtin: GTIN_MAP[article.code] ?? '—',
      category: article.category,
    });
    navigate(STORE_MANAGER_ROUTES.capture);
  };

  const nextArticles = TO_SCAN_ARTICLES.filter((a) => a.status === 'todo').slice(0, 5);

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
          Progress
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto flex flex-col gap-[14px]"
        style={{ padding: '10px 16px 12px', background: '#FBF8F0' }}
      >
        {/* This week / This month */}
        <div className="flex gap-2.5">
          {[
            { label: 'This week', value: 68 },
            { label: 'This month', value: 242 },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1"
              style={{ background: '#fff', border: '1px solid #F1ECDD', borderRadius: '12px', padding: '14px 14px 13px' }}
            >
              <div
                className="font-semibold uppercase"
                style={{ fontSize: '9.5px', color: '#B9831F', letterSpacing: '0.1em' }}
              >
                {s.label}
              </div>
              <div
                className="font-bold"
                style={{ fontSize: '32px', color: '#2B2A26', lineHeight: 1.05, letterSpacing: '-0.7px', marginTop: '8px' }}
              >
                {s.value}
              </div>
              <div className="text-[11px]" style={{ color: '#9C9B94', marginTop: '3px' }}>
                articles scanned
              </div>
            </div>
          ))}
        </div>

        {/* Weekly day-by-day counts */}
        <div>
          <div className="flex items-baseline justify-between" style={{ marginBottom: '10px' }}>
            <div
              className="font-semibold uppercase"
              style={{ fontSize: '10px', color: '#9C9B94', letterSpacing: '0.08em' }}
            >
              This week
            </div>
            <div className="text-[10px]" style={{ color: '#B5B3AA' }}>
              Articles scanned per day
            </div>
          </div>
          <div className="flex gap-1">
            {WEEK_BARS.map((b) => {
              const boxBg = b.tone === 'today' ? '#E8D29A' : b.tone === 'empty' ? '#F7F3E8' : '#F5ECDA';
              const numColor = b.tone === 'today' ? '#6B4F1A' : b.tone === 'empty' ? '#C5C0B0' : '#7A5310';
              const numWeight = b.tone === 'today' ? 700 : b.tone === 'empty' ? 500 : 600;
              const labelColor = b.tone === 'today' ? '#A67C2E' : b.tone === 'empty' ? '#C5C4BC' : '#9C9B94';
              return (
                <div key={b.day} className="flex-1 flex flex-col items-center gap-[5px]">
                  <div
                    className="w-full flex items-center justify-center"
                    style={{ background: boxBg, borderRadius: '8px', padding: '8px 0' }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: numWeight, color: numColor }}>{b.count}</span>
                  </div>
                  <span
                    className="text-[9px]"
                    style={{ color: labelColor, fontWeight: b.tone === 'today' ? 600 : 400 }}
                  >
                    {b.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next to scan */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
            <div
              className="font-semibold uppercase"
              style={{ fontSize: '10px', color: '#9C9B94', letterSpacing: '0.08em' }}
            >
              Next to scan
            </div>
            <div
              onClick={onOpenArticles}
              className="text-[11px] font-medium cursor-pointer flex items-center gap-[2px]"
              style={{ color: '#B9831F' }}
            >
              View all
              <ChevronRight className="w-[13px] h-[13px]" />
            </div>
          </div>
          {nextArticles.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {nextArticles.map((a) => (
                <div
                  key={a.id}
                  onClick={() => startScan(a)}
                  className="bg-white rounded-[10px] flex items-center gap-[10px] cursor-pointer active:scale-[0.985]"
                  style={{ border: '1px solid #F1ECDD', padding: '10px 12px' }}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px] font-medium leading-[1.25]"
                      style={{
                        color: '#2B2A26',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {a.name}
                    </div>
                    <div className="text-[11px] mt-[2px] truncate" style={{ color: '#9C9B94' }}>
                      {a.weight}
                    </div>
                  </div>
                  <Barcode className="w-[15px] h-[15px] flex-shrink-0" style={{ color: '#D4C2A1', opacity: 0.7 }} />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="text-center"
              style={{ background: '#fff', border: '1px dashed #EAE3D0', borderRadius: '12px', padding: '18px 14px' }}
            >
              <div className="text-[12px] font-medium" style={{ color: '#2B2A26' }}>
                All caught up
              </div>
              <div className="text-[11px] mt-[2px]" style={{ color: '#9C9B94' }}>
                Nothing left to scan
              </div>
            </div>
          )}
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
        <div className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-1 active:bg-[#F5F5F4]">
          <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: '#C68A1E', marginBottom: '1px' }} />
          <BarChart3 className="w-[22px] h-[22px]" style={{ color: '#C68A1E' }} />
          <span className="text-[10px] font-medium" style={{ color: '#C68A1E' }}>
            Progress
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-1 active:bg-[#F5F5F4]" onClick={onOpenAccount}>
          <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'transparent', marginBottom: '1px' }} />
          <UserCircle className="w-[22px] h-[22px]" style={{ color: '#9C9B94' }} />
          <span className="text-[10px]" style={{ color: '#9C9B94' }}>
            Account
          </span>
        </div>
      </div>
    </>
  );
}
