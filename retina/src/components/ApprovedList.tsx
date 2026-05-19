import { useReviewStore } from '../stores/useReviewStore';

type ApprovedListProps = {
  onOpenArticle: (articleId: string) => void;
};

export function ApprovedList({ onOpenArticle }: ApprovedListProps) {
  const { articles } = useReviewStore();
  const approved = articles.filter((item) => item.status === 'approved');

  return (
    <div className="flex-1 p-5 overflow-auto retina-thin-scroll">
      <div className="max-w-5xl mx-auto rounded-lg bg-card overflow-hidden">
        <div className="px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">Approved Articles</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{approved.length} approved items</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground/80">
              <th className="px-4 py-2 font-medium">Article</th>
              <th className="px-4 py-2 font-medium">Approved by</th>
              <th className="px-4 py-2 font-medium">Approved at</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {approved.map((item) => (
              <tr key={item.id} className="hover:bg-muted/20">
                <td className="px-4 py-2">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.aplCode}</p>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{item.reviewer ?? '-'}</td>
                <td className="px-4 py-2 text-muted-foreground">{item.approvedAt ?? '-'}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    className="text-xs px-2 py-1 rounded-md text-muted-foreground hover:bg-muted/40 hover:text-foreground"
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
