import { useEffect } from 'react';
import { Check, List, ChevronRight, Barcode, CircleCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';
import { useStoreManager } from '../StoreManagerContext';
import { TO_SCAN_ARTICLES, GTIN_MAP, type Article } from '../data/storeManagerMockData';

/**
 * S6 — "Submitted" confirmation. Shown straight after the capture flow's
 * "Review & Submit". Confirms the submission and offers the next articles to
 * scan so the manager can keep going without returning to the full list.
 */
export function ReviewScreen() {
  const navigate = useNavigate();
  const { capture, setCapture, paneerScanned, setPaneerScanned } = useStoreManager();

  // The submit happened on entry — mark the demo Paneer article as scanned.
  useEffect(() => {
    if (capture.code === 'ART-10234') setPaneerScanned(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBackToList = () => navigate(STORE_MANAGER_ROUTES.articles);
  const onViewDetails = () => navigate(STORE_MANAGER_ROUTES.done);

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

  // Next "to scan" articles — exclude the one just submitted + the demo paneer
  // once it's been marked scanned.
  const nextArticles = TO_SCAN_ARTICLES.filter(
    (a) =>
      a.status === 'todo' &&
      a.code !== capture.code &&
      !(a.id === 'paneer-amul' && paneerScanned),
  ).slice(0, 5);

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
        <div className="font-semibold flex-1" style={{ fontSize: '16px', color: '#2B2A26' }}>
          Submitted
        </div>
      </div>

      {/* Success row */}
      <div
        className="flex items-center gap-[10px] flex-shrink-0"
        style={{ padding: '14px 16px 12px', background: '#fff', borderBottom: '1px solid #F1ECDD' }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E0F0E7' }}
        >
          <Check className="w-[17px] h-[17px]" style={{ color: '#0F6B3D' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate" style={{ color: '#2B2A26' }}>
            {capture.title}
          </div>
          <div className="text-[11px] mt-[1px]" style={{ color: '#0F6B3D' }}>
            Submitted successfully
          </div>
        </div>
      </div>

      {/* Next-to-scan list */}
      <div
        className="flex-1 flex flex-col gap-2 overflow-y-auto"
        style={{ padding: '14px 16px 12px', background: '#FBF8F0' }}
      >
        <div className="flex items-baseline justify-between" style={{ marginBottom: '2px' }}>
          <div
            className="text-[10px] font-semibold uppercase"
            style={{ color: '#9C9B94', letterSpacing: '0.08em' }}
          >
            Next articles to scan
          </div>
          <div
            onClick={onBackToList}
            className="text-[11px] font-medium cursor-pointer flex items-center gap-[2px]"
            style={{ color: '#B9831F' }}
          >
            View all
            <ChevronRight className="w-[13px] h-[13px]" />
          </div>
        </div>

        {nextArticles.length > 0 ? (
          nextArticles.map((a) => (
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
          ))
        ) : (
          <div
            className="text-center"
            style={{ background: '#fff', border: '1px dashed #EAE3D0', borderRadius: '10px', padding: '18px 14px' }}
          >
            <CircleCheck className="w-[22px] h-[22px] mx-auto" style={{ color: '#0F6B3D', marginBottom: '6px' }} />
            <div className="text-[12px] font-medium" style={{ color: '#2B2A26' }}>
              All articles scanned
            </div>
            <div className="text-[11px] mt-[2px]" style={{ color: '#9C9B94' }}>
              Nothing left in your To scan list
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div
        className="flex gap-2 flex-shrink-0"
        style={{
          padding: '8px 16px',
          paddingBottom: 'max(0.875rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
          background: '#fff',
          borderTop: '1px solid #F1ECDD',
        }}
      >
        <button
          type="button"
          onClick={onViewDetails}
          className="flex items-center justify-center text-[13px] font-medium active:opacity-80"
          style={{
            flex: 0.55,
            padding: '10px 16px',
            borderRadius: '10px',
            background: '#fff',
            border: '1px solid #C5C4BC',
            color: '#2B2A26',
            minHeight: '44px',
          }}
        >
          Details
        </button>
        <button
          type="button"
          onClick={onBackToList}
          className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-medium active:opacity-80"
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            background: '#fff',
            border: '1px solid #F1ECDD',
            color: '#6B6A64',
            minHeight: '44px',
          }}
        >
          <List className="w-[14px] h-[14px]" />
          Back to list
        </button>
      </div>
    </>
  );
}
