import React from 'react';
import type { ReviewSection } from '../data/mockData';
import { useReviewStore } from '../stores/useReviewStore';

type EditHistoryProps = {
  articleId: string;
};

const sectionFilters: { label: string; value: 'all' | ReviewSection }[] = [
  { label: 'All', value: 'all' },
  { label: 'Ingredients', value: 'ingredients' },
  { label: 'Nutrition', value: 'nutrition' },
  { label: 'Allergens', value: 'allergens' },
  { label: 'Claims', value: 'claims' },
];

export function EditHistory({ articleId }: EditHistoryProps) {
  const { state } = useReviewStore();
  const [isOpen, setIsOpen] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | ReviewSection>('all');

  const rows = state.editLog.filter(
    (entry) => entry.articleId === articleId && (filter === 'all' || entry.section === filter),
  );

  return (
    <div className="border border-border rounded-lg shadow-soft overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <h2 className="text-base font-semibold text-foreground">4. AI Extraction & Audit</h2>
        <span className="text-xs text-muted-foreground">{rows.length} entries</span>
      </button>
      {isOpen ? (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            {sectionFilters.map((item) => (
              <button
                key={item.value}
                className={`px-2 py-1 rounded-full text-xs ${
                  filter === item.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {rows.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-auto pr-1">
              {rows.map((entry) => (
                <div key={entry.id} className="rounded-md border border-border p-2">
                  <p className="text-xs text-foreground">
                    <span className="font-medium">{entry.editedBy}</span> changed{' '}
                    <span className="font-medium">{entry.field}</span> from{' '}
                    <span className="line-through text-muted-foreground">{entry.oldValue}</span> to{' '}
                    <span className="font-medium">{entry.newValue}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {entry.editedAt} · {entry.section} · {entry.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No edits captured for this article yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
