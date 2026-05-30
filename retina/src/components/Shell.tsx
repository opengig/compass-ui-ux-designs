import { Outlet } from 'react-router-dom';
import { Check, AlertCircle } from 'lucide-react';
import { IconNavRail } from './IconNavRail';
import { useReviewStore } from '../stores/useReviewStore';

export function Shell() {
  const { toast } = useReviewStore();

  return (
    <div className="flex w-full h-screen bg-background font-heading text-foreground">
      <IconNavRail />
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>
      {toast ? (
        <div
          className="fixed top-5 right-5 z-[300] flex items-center gap-3 rounded-lg pl-4 pr-3.5 py-2.5 text-[13px] font-semibold shadow-lg"
          style={{
            animation: 'toastIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
            backgroundColor: toast.kind === 'warn' ? '#7A5310' : '#1F1611',
            color: '#fff',
          }}
        >
          {toast.kind === 'warn' ? (
            <AlertCircle size={14} className="text-amber-300 flex-shrink-0" />
          ) : (
            <Check size={14} className="text-emerald-400 flex-shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      ) : null}
    </div>
  );
}
