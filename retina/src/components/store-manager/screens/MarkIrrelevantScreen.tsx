import { useState } from 'react';
import { ArrowLeft, Info, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';
import { useStoreManager } from '../StoreManagerContext';

/**
 * S3 — Confirmation screen for marking an article as "not in my store"
 * (or, in loose mode, "not available today"). Mirrors store-manager.html #s3.
 *
 * `loose` mode is signalled both through context (excludeLoose) and through
 * the `?loose=1` query param so the URL itself is deep-linkable.
 */
export function MarkIrrelevantScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { excludeLoose, setPaneerExcluded, showToast } = useStoreManager();
  const loose = excludeLoose || searchParams.get('loose') === '1';

  const onCancel = () => navigate(STORE_MANAGER_ROUTES.articles);
  const onConfirm = () => {
    setPaneerExcluded(true);
    showToast(
      loose ? 'Item marked as not available today' : 'Article marked as not in store',
    );
    navigate(STORE_MANAGER_ROUTES.articles);
  };
  const reasons = loose
    ? ['Not received today', 'Out of season', 'Supplier issue', 'Other']
    : [
        "We don't stock this product",
        'Product was discontinued',
        'Wrong article assigned to my site',
        'Other',
      ];
  const [selected, setSelected] = useState(0);

  const title = loose ? 'Not available today' : 'Mark as not in store';
  const reasonLabel = loose ? 'Why is it not available?' : 'Why is it not in your store?';
  const info = loose
    ? "Marking this item as not available today will remove it from the loose items list for today's session."
    : 'Marking this article as "not in my store" means it will be removed from your scan list and flagged as irrelevant for Bengaluru Central Kitchen.';

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
        <button
          type="button"
          onClick={onCancel}
          aria-label="back"
          className="w-9 h-9 flex items-center justify-center -ml-2 active:bg-[#F9F4EA] rounded-full"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: '#6B6A64' }} />
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold"
            style={{ fontSize: '16px', color: '#2B2A26' }}
          >
            {title}
          </div>
          <div className="text-[11px] mt-[1px] truncate" style={{ color: '#9C9B94' }}>
            Amul Paneer 1kg · ART-10234
          </div>
        </div>
      </div>

      <div
        className="flex-1 flex flex-col gap-3 overflow-y-auto"
        style={{ padding: '16px', background: '#FBF8F0' }}
      >
        <div
          className="flex gap-[9px]"
          style={{
            background: '#FEF6E8',
            borderRadius: '10px',
            padding: '13px 14px',
            border: '1px solid #F5C842',
          }}
        >
          <Info
            className="w-4 h-4 flex-shrink-0 mt-[1px]"
            style={{ color: '#BA7517' }}
          />
          <div className="text-[12px] leading-[1.6]" style={{ color: '#854F0B' }}>
            {info}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #F1ECDD',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase"
            style={{
              color: '#9C9B94',
              letterSpacing: '0.06em',
              padding: '10px 14px 6px',
            }}
          >
            {reasonLabel}
          </div>
          <div
            className="flex flex-col"
            style={{ padding: '0 14px 8px' }}
          >
            {reasons.map((r, i) => (
              <label
                key={r}
                className="flex items-center gap-[10px] cursor-pointer text-[13.5px] active:bg-[#F5F5F4]"
                style={{ color: '#2B2A26', padding: '10px 0', minHeight: '44px' }}
              >
                <input
                  type="radio"
                  name="irrel"
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                  style={{ width: '18px', height: '18px' }}
                />
                {r}
              </label>
            ))}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #F1ECDD',
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          <div className="text-[11.5px]" style={{ color: '#9C9B94', marginBottom: '6px' }}>
            Additional note (optional)
          </div>
          <textarea
            className="w-full text-[13px] resize-none"
            placeholder="e.g. This product was replaced by a newer SKU..."
            style={{
              border: '1px solid #F1ECDD',
              borderRadius: '7px',
              padding: '10px 12px',
              fontFamily: 'inherit',
              background: '#F9F8F4',
              height: '56px',
            }}
          />
        </div>
      </div>

      <div
        className="flex gap-2 flex-shrink-0"
        style={{
          padding: '10px 16px',
          paddingBottom: 'max(0.875rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
          background: '#fff',
          borderTop: '1px solid #F1ECDD',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center text-[13px] font-medium active:opacity-80"
          style={{
            flex: 0.55,
            padding: '14px 16px',
            borderRadius: '8px',
            background: '#fff',
            border: '1px solid #C5C4BC',
            color: '#2B2A26',
            minHeight: '48px',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex items-center justify-center gap-1.5 text-[14px] font-medium active:opacity-90"
          style={{
            flex: 1,
            padding: '14px 16px',
            borderRadius: '8px',
            background: '#BA7517',
            color: '#fff',
            border: '1px solid #BA7517',
            minHeight: '48px',
          }}
        >
          <EyeOff className="w-[15px] h-[15px]" />
          Confirm
        </button>
      </div>
    </>
  );
}
