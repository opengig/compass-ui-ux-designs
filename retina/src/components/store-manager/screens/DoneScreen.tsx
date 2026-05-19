import { Check, Flame, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';
import { useStoreManager } from '../StoreManagerContext';

function nowTimeAndDate(): { time: string; date: string } {
  const now = new Date();
  const time = now
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace('am', 'AM')
    .replace('pm', 'PM');
  const date = now
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/,/g, '');
  return { time, date };
}

export function DoneScreen() {
  const navigate = useNavigate();
  const { capture } = useStoreManager();
  const onScanNext = () => navigate(STORE_MANAGER_ROUTES.articles);
  const onViewProgress = () => navigate(STORE_MANAGER_ROUTES.progress);

  const loose = capture.mode === 'loose';
  const imgCount =
    (capture.barcode ? 1 : 0) +
    (capture.front ? 1 : 0) +
    (capture.back ? 1 : 0) +
    capture.more;
  const { time, date } = nowTimeAndDate();

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-[14px] overflow-y-auto w-full"
      style={{
        padding: '24px 20px',
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom) + 1rem))',
        background: '#F5F5F4',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#EAF3DE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check className="w-[28px] h-[28px]" style={{ color: '#3B6D11' }} />
      </div>
      <div
        className="font-semibold text-center"
        style={{ fontSize: '22px', color: '#1F1611' }}
      >
        Submitted!
      </div>
      <div
        className="text-[14px] text-center leading-[1.6]"
        style={{ color: '#71717A' }}
      >
        Submitted — keep scanning your next article.
      </div>

      <div
        className="w-full max-w-md"
        style={{
          background: '#fff',
          border: '1px solid #E5E5E4',
          borderRadius: '10px',
          padding: '12px 14px',
        }}
      >
        <div
          className="text-[10px] font-semibold uppercase"
          style={{
            color: '#71717A',
            letterSpacing: '0.05em',
            marginBottom: '5px',
          }}
        >
          Submission details
        </div>
        <div className="flex flex-col gap-[7px] mt-1">
          <Row label="Article" value={capture.title} />
          <Row label="Article code" value={capture.code || '—'} />
          <Row label="Barcode (GTIN)" value={loose ? '—' : capture.gtin} />
          <Row
            label="Images sent"
            value={`${imgCount} ${imgCount === 1 ? 'image' : 'images'}`}
          />
          <Row label="Scanned at" value={`${time} · ${date}`} />
          <Row label="Scanned by" value="Ravi Kumar · BCK-001" />
          <div className="flex justify-between">
            <span className="text-[11.5px]" style={{ color: '#71717A' }}>
              Status
            </span>
            <span
              className="text-[11.5px] font-medium flex items-center gap-1"
              style={{ color: '#3B6D11' }}
            >
              <Check className="w-[11px] h-[11px]" />
              Submitted
            </span>
          </div>
        </div>
      </div>

      <div
        className="w-full max-w-md flex items-center gap-2.5"
        style={{
          background: '#FB923C',
          borderRadius: '10px',
          padding: '12px 14px',
        }}
      >
        <div className="flex-1">
          <div
            className="text-[11.5px]"
            style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2px' }}
          >
            Today&apos;s progress
          </div>
          <div
            className="font-bold"
            style={{ fontSize: '17px', color: '#E5E5E4' }}
          >
            8{' '}
            <span
              className="font-normal text-[11.5px]"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              of 20 done
            </span>
          </div>
        </div>
        <div
          style={{
            height: '36px',
            width: '36px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Flame className="w-[18px] h-[18px]" style={{ color: '#E5E5E4' }} />
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col gap-2">
        <button
          type="button"
          onClick={onScanNext}
          className="w-full flex items-center justify-center gap-1.5 text-[14px] font-medium active:opacity-90"
          style={{
            padding: '14px 16px',
            borderRadius: '8px',
            background: '#FB923C',
            color: '#fff',
            border: '1px solid #FB923C',
            minHeight: '48px',
          }}
        >
          <ScanLine className="w-[16px] h-[16px]" />
          Scan Next Article
        </button>
        <button
          type="button"
          onClick={onViewProgress}
          className="w-full text-[13px] active:opacity-80"
          style={{
            padding: '14px 16px',
            borderRadius: '8px',
            background: '#fff',
            color: '#71717A',
            border: '1px solid #E5E5E4',
            minHeight: '48px',
          }}
        >
          View progress
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[11.5px] flex-shrink-0" style={{ color: '#71717A' }}>
        {label}
      </span>
      <span
        className="text-[12.5px] font-medium text-right"
        style={{ color: '#1F1611' }}
      >
        {value}
      </span>
    </div>
  );
}
