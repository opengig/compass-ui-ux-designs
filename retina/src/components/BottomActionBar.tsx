import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { useReviewStore } from '../stores/useReviewStore';
import type { QueueTab } from '../hooks/useQueueFilter';

type BottomActionBarProps = {
  articleId: string;
  queueTab: QueueTab;
};

export function BottomActionBar({ articleId, queueTab }: BottomActionBarProps) {
  const { saveChanges, approveArticle, moveToLow, markNeedsReview, getUnsavedEditCount } = useReviewStore();
  const [approvalComment, setApprovalComment] = React.useState('');
  const [showApprovePrompt, setShowApprovePrompt] = React.useState(false);
  const unsavedEdits = getUnsavedEditCount(articleId);

  return (
    <div className="flex-shrink-0 bg-background/95 backdrop-blur border-t border-border px-4 md:px-6 py-1 z-10">
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-3">
        <div className="flex items-center gap-2.5">
          {unsavedEdits > 0 ? (
            <span className="text-xs text-amber-700 bg-amber-100 rounded-md px-2 py-1">
              {unsavedEdits} unsaved edits
            </span>
          ) : null}
          <button
            className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => saveChanges(articleId)}
            disabled={unsavedEdits === 0}
          >
            Save changes
          </button>
          {queueTab === 'amber' ? (
            <button
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 inline-flex items-center px-3 py-1.5 rounded-md text-sm"
              onClick={() => moveToLow(articleId)}
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          ) : null}
          {queueTab === 'high' ? (
            <button
              className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 inline-flex items-center px-3 py-1.5 rounded-md text-sm"
              onClick={() => markNeedsReview(articleId)}
            >
              <AlertCircle className="w-4 h-4" />
              Needs Review
            </button>
          ) : null}
          <button
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 inline-flex items-center px-3 py-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowApprovePrompt((prev) => !prev)}
            disabled={unsavedEdits > 0}
          >
            <Check className="w-4 h-4" />
            Approve Article
          </button>
        </div>
      </div>
      {showApprovePrompt ? (
        <div className="mt-2 p-3 border border-border rounded-md bg-card max-w-md ml-auto">
          <p className="text-sm font-medium text-foreground">Approve this article?</p>
          <input
            className="mt-2 w-full rounded border border-border px-2 py-1.5 text-sm bg-background"
            placeholder="Optional approval comment"
            value={approvalComment}
            onChange={(event) => setApprovalComment(event.target.value)}
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button className="px-2 py-1 text-xs rounded-md border border-border" onClick={() => setShowApprovePrompt(false)}>
              Cancel
            </button>
            <button
              className="px-2 py-1 text-xs rounded-md bg-emerald-600 text-white"
              onClick={() => {
                approveArticle(articleId, approvalComment);
                setApprovalComment('');
                setShowApprovePrompt(false);
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

}