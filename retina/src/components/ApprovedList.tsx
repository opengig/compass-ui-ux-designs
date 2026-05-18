import React from 'react';
import { useReviewStore } from '../stores/useReviewStore';

type ApprovedListProps = {
  onOpenArticle: (articleId: string) => void;
};

export function ApprovedList({ onOpenArticle }: ApprovedListProps) {
  const { articles } = useReviewStore();
  const approved = articles.filter((item) => item.status === 'approved');

  return (
    <div className="flex-1 p-5 overflow-auto">
      <div className="border border-border rounded-lg bg-card shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Approved Articles</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{approved.length} approved items</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2">Article</th>
              <th className="px-4 py-2">Site</th>
              <th className="px-4 py-2">Approved by</th>
              <th className="px-4 py-2">Approved at</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {approved.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="px-4 py-2">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.aplCode}</p>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{item.site}</td>
                <td className="px-4 py-2 text-muted-foreground">{item.reviewer ?? '-'}</td>
                <td className="px-4 py-2 text-muted-foreground">{item.approvedAt ?? '-'}</td>
                <td className="px-4 py-2">
                  <button
                    className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted"
                    onClick={() => onOpenArticle(item.id)}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
