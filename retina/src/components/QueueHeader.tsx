import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { useReviewStore } from '../stores/useReviewStore';
import { useQueueFilter, type QueueTab } from '../hooks/useQueueFilter';
import { useExpandSections } from '../stores/ExpandSections';

type PillSpec = {
  tab: QueueTab;
  label: string;
  dotClass: string | null;
};

const PILLS: PillSpec[] = [
  { tab: 'all', label: 'Inbox', dotClass: null },
  { tab: 'high', label: 'Match', dotClass: 'bg-emerald-500' },
  { tab: 'amber', label: 'Review', dotClass: 'bg-amber-500' },
  { tab: 'low', label: 'Fix', dotClass: 'bg-rose-500' },
  { tab: 'submitted', label: 'Submitted', dotClass: 'bg-stone-400' },
  { tab: 'approved', label: 'Approved', dotClass: 'bg-sky-500' },
];

export function QueueHeader() {
  const { articles, isSubmitted } = useReviewStore();
  const { queueTab, setQueueTab } = useQueueFilter(articles);
  const { isExpanded, toggle } = useExpandSections();

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

  return (
    <header className="flex-shrink-0 h-12 border-b border-border bg-card flex items-center gap-2 px-3">
      <nav className="inline-flex items-center bg-stone-200/70 rounded-lg p-1 gap-0.5 shrink min-w-0 overflow-x-auto">
        {PILLS.map((pill) => {
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
              {pill.dotClass ? (
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${pill.dotClass}`} />
              ) : null}
              <span className="text-[12.5px]">{pill.label}</span>
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

      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        <button
          onClick={toggle}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-card border border-border text-foreground hover:bg-muted hover:border-foreground/20 transition-colors text-[12.5px] font-medium"
        >
          {isExpanded ? (
            <>
              <ChevronsDownUp className="w-3.5 h-3.5" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronsUpDown className="w-3.5 h-3.5" />
              Expand All
            </>
          )}
        </button>
      </div>
    </header>
  );
}
