import { Clock } from 'lucide-react';
import { useReviewStore } from '../stores/useReviewStore';
import { useQueueFilter, type QueueTab } from '../hooks/useQueueFilter';

type PillSpec = {
  tab: QueueTab;
  label: string;
};

const INBOX_PILLS: PillSpec[] = [
  { tab: 'all', label: 'All Pending Approval' },
  { tab: 'high', label: 'Ready To Cookbook' },
  { tab: 'amber', label: 'To Review' },
  { tab: 'low', label: 'To Fix' },
];

export function QueueHeader({ variant = 'inbox' }: { variant?: 'inbox' | 'submitted' }) {
  const { articles, isSubmitted } = useReviewStore();
  const { queueTab, setQueueTab } = useQueueFilter(
    articles,
    variant === 'submitted' ? 'submitted' : undefined,
  );

  const counts = (() => {
    const submitted = articles.filter((article) => isSubmitted(article.id));
    const approved = articles.filter((article) => article.status === 'approved');
    const pending = articles.filter(
      (article) => !isSubmitted(article.id) && article.status !== 'approved',
    );
    return {
      all: pending.length,
      high: pending.filter((article) => article.confidence >= 90).length,
      amber: pending.filter((article) => article.confidence >= 80 && article.confidence < 90).length,
      low: pending.filter((article) => article.confidence < 80).length,
      submitted: submitted.length,
      approved: approved.length,
    };
  })();

  const title = variant === 'submitted' ? 'Submitted' : 'My Tasks';

  const now = new Date();
  const stamp =
    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) +
    ' IST · ' +
    now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="flex-shrink-0 border-b border-border bg-card">
      {/* Page title */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <h1 className="text-[18px] font-bold text-foreground tracking-tight">{title}</h1>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="font-mono text-[11.5px] text-muted-foreground">{stamp}</span>
        </div>
      </div>

      {/* Tabs row — inbox only */}
      {variant !== 'submitted' ? (
        <div className="flex items-center gap-2 px-3 pb-2">
          <nav className="inline-flex items-center bg-stone-200/70 rounded-lg p-1 gap-0.5 shrink min-w-0 overflow-x-auto">
            {INBOX_PILLS.map((pill) => {
              const isActive = queueTab === pill.tab;
              return (
                <button
                  key={pill.tab}
                  onClick={() => setQueueTab(pill.tab)}
                  className={`inline-flex items-center gap-2 h-7 px-2.5 rounded-md transition-all shrink-0 ${
                    isActive
                      ? 'bg-card text-foreground font-semibold shadow-soft'
                      : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-card/50'
                  }`}
                >
                  <span className="text-[12.5px] whitespace-nowrap">{pill.label}</span>
                  <span
                    className={`tabular-nums text-[11px] px-1.5 py-0.5 rounded font-semibold ${
                      isActive ? 'bg-foreground/10 text-foreground/85' : 'bg-stone-300/60 text-muted-foreground/90'
                    }`}
                  >
                    {counts[pill.tab]}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
