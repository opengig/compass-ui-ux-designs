import React from 'react';
import { useReviewStore } from '../stores/useReviewStore';
import type { ReviewSection } from '../data/mockData';

const sectionOptions: Array<'all' | ReviewSection> = ['all', 'ingredients', 'nutrition', 'allergens', 'claims'];

export function AuditLog() {
  const { state } = useReviewStore();
  const [query, setQuery] = React.useState('');
  const [section, setSection] = React.useState<'all' | ReviewSection>('all');

  const rows = state.editLog.filter((entry) => {
    const sectionMatch = section === 'all' || entry.section === section;
    const queryMatch =
      query.length === 0 ||
      [entry.articleId, entry.field, entry.oldValue, entry.newValue, entry.editedBy]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());
    return sectionMatch && queryMatch;
  });

  return (
    <div className="flex-1 p-5 overflow-auto">
      <div className="border border-border rounded-lg bg-card shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-border space-y-2">
          <h2 className="text-base font-semibold text-foreground">Audit Log</h2>
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-60 rounded border border-border px-2 py-1.5 text-sm bg-background"
              placeholder="Search audit entries"
            />
            <select
              className="rounded border border-border px-2 py-1.5 text-sm bg-background"
              value={section}
              onChange={(event) => setSection(event.target.value as 'all' | ReviewSection)}
            >
              {sectionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Article</th>
              <th className="px-4 py-2">Section</th>
              <th className="px-4 py-2">Change</th>
              <th className="px-4 py-2">Editor</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.id} className="border-t border-border">
                <td className="px-4 py-2 text-muted-foreground">{entry.editedAt}</td>
                <td className="px-4 py-2 text-muted-foreground">{entry.articleId}</td>
                <td className="px-4 py-2 capitalize text-muted-foreground">{entry.section}</td>
                <td className="px-4 py-2">
                  <span className="text-muted-foreground line-through mr-1">{entry.oldValue}</span>
                  <span className="text-foreground">{entry.newValue}</span>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{entry.editedBy}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-xs ${
                      entry.status === 'applied'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
