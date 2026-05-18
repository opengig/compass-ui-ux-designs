import { Search, SlidersHorizontal } from 'lucide-react';
import type { QueueFilterTab, QueueTab } from '../hooks/useQueueFilter';
import { queueTheme } from '../styles/queueTheme';

type QueueHeaderProps = {
  filterTabs: QueueFilterTab[];
  queueTab: QueueTab;
  onQueueTabChange: (tab: QueueTab) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

export function QueueHeader({
  filterTabs,
  queueTab,
  onQueueTabChange,
  searchQuery,
  onSearchChange,
}: QueueHeaderProps) {
  return (
    <header className={`z-20 ${queueTheme.header}`}>
      <div className="flex h-11 items-center justify-between gap-4 px-5">
        {/* Tab pills */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          {filterTabs.map((tab) => {
            const isActive = queueTab === tab.tab;
            return (
              <button
                key={tab.label}
                onClick={() => onQueueTabChange(tab.tab)}
                className={`relative shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? queueTheme.headerActiveTab
                    : queueTheme.headerIdleTab
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-px text-[11px] font-semibold leading-tight ${
                    !tab.color
                      ? isActive
                        ? queueTheme.headerCountActive
                        : queueTheme.headerCountIdle
                      : 'text-white'
                  }`}
                  style={tab.color ? { backgroundColor: tab.color } : undefined}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Search + filter */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Search articles..."
              className={`h-8 w-56 rounded-lg pl-8.5 pr-8 text-[13px] outline-none transition-all focus:w-72 focus:border-primary focus:ring-2 focus:ring-primary/20 ${queueTheme.headerInput}`}
              style={{ paddingLeft: '2.125rem' }}
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-px text-[10px] font-medium text-muted-foreground leading-tight">
              /
            </kbd>
          </div>
          <button
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors ${queueTheme.headerFilterButton}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
      </div>
    </header>
  );
}
