import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Check,
  Copy,
  CheckCheck,
  Undo2,
  Redo2,
  ScanLine,
  RefreshCw,
  Barcode,
  Hash,
} from 'lucide-react';
import { useReviewStore } from '../stores/useReviewStore';
import { useExpandSections } from '../stores/ExpandSections';
import { IngredientsTable } from './IngredientsTable';
import { NutritionTable } from './NutritionTable';
import { ROUTES } from '../router/routes';
import type { QueueTab } from '../hooks/useQueueFilter';

type ProductDetailProps = {
  selectedArticleId: string | null;
  queueTab: QueueTab;
};

function formatBarcode(barcode: string): string {
  // Keep barcode contiguous — easier to scan as a single identifier
  return barcode;
}

function dateOnly(value: string): string {
  // Inputs are formatted like "13 May 2025, 09:30 PM" — strip the time portion.
  const commaIndex = value.indexOf(',');
  return commaIndex === -1 ? value : value.slice(0, commaIndex);
}

function confidenceTone(confidence: number) {
  if (confidence >= 90) {
    return { label: 'High', color: 'text-emerald-700', border: 'border-emerald-300' };
  }
  if (confidence >= 80) {
    return { label: 'Medium', color: 'text-amber-700', border: 'border-amber-300' };
  }
  return { label: 'Low', color: 'text-rose-700', border: 'border-rose-300' };
}

function MetaField({
  icon: Icon,
  label,
  children,
}: {
  icon?: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 leading-none">
      {Icon ? <Icon className="w-3.5 h-3.5 text-muted-foreground/60" /> : null}
      <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground/70 font-medium">
        {label}
      </span>
      <span className="inline-flex items-center gap-1">{children}</span>
    </span>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          /* clipboard not available — silent */
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title={`Copy ${label}`}
      className="inline-flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      aria-label={`Copy ${label}`}
    >
      {copied ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const { expandSignal, collapseSignal } = useExpandSections();

  React.useEffect(() => {
    if (expandSignal > 0) {
      setOpen(true);
    }
  }, [expandSignal]);

  React.useEffect(() => {
    if (collapseSignal > 0) {
      setOpen(false);
    }
  }, [collapseSignal]);

  return (
    <section className="pt-5">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 hover:text-foreground transition-colors text-left mb-2"
        aria-expanded={open}
      >
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground/70 transition-transform shrink-0 ${
            open ? '' : '-rotate-90'
          }`}
        />
        <span className="text-[14px] font-semibold text-foreground">{title}</span>
        {count != null ? (
          <span className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground tabular-nums">
            {count}
          </span>
        ) : null}
      </button>
      {open ? <div>{children}</div> : null}
    </section>
  );
}

export function ProductDetail({ selectedArticleId, queueTab }: ProductDetailProps) {
  const navigate = useNavigate();
  const reviewStore = useReviewStore();
  const {
    articles,
    getArticleById,
    getUnsavedEditCount,
    saveChanges,
    submitArticle,
    undo,
    redo,
    getCanUndo,
    getCanRedo,
    moveToLow,
    getArticleEditLog,
  } = reviewStore;
  const article = getArticleById(selectedArticleId) ?? articles[0] ?? null;
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const submitRef = React.useRef<HTMLDivElement | null>(null);
  const [showSubmit, setShowSubmit] = React.useState(false);
  const [comment, setComment] = React.useState('');

  // Reset state when switching articles
  React.useEffect(() => {
    setShowSubmit(false);
    setComment('');
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [article?.id]);

  // Undo / redo keyboard shortcuts
  React.useEffect(() => {
    if (!article) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey;
      if (!isModifier) {
        return;
      }
      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo(article.id);
      } else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
        event.preventDefault();
        redo(article.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [article, undo, redo]);

  if (!article) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        No article selected
      </div>
    );
  }

  const unsavedEdits = getUnsavedEditCount(article.id);
  const canUndo = getCanUndo(article.id);
  const canRedo = getCanRedo(article.id);
  const conf = confidenceTone(article.confidence);
  const editLog = getArticleEditLog(article.id);
  const pendingLog = editLog.filter((entry) => entry.status === 'pending');
  const isReadOnly = reviewStore.isSubmitted(article.id) || article.status === 'approved';
  const submission = reviewStore.getSubmission(article.id);

  const openSubmit = () => {
    if (unsavedEdits > 0) {
      saveChanges(article.id);
    }
    setShowSubmit(true);
    // Wait a tick for the submit panel to render, then scroll into view
    setTimeout(() => {
      submitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };

  const onSubmit = () => {
    submitArticle(article.id, comment.trim());
    navigate(ROUTES.submitted);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-card border-l border-border">
      <div ref={scrollRef} className="flex-1 overflow-auto retina-thin-scroll">
        <div className="px-5 pt-4 pb-6 max-w-3xl xl:max-w-4xl mx-auto">
          {/* Header — title wraps, undo/redo on the right */}
          <header className="flex items-start gap-3">
            <h1 className="flex-1 text-[15px] font-semibold text-foreground leading-snug break-words min-w-0">
              {article.name}
            </h1>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => undo(article.id)}
                disabled={!canUndo}
                title="Undo (⌘Z)"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => redo(article.id)}
                disabled={!canRedo}
                title="Redo (⌘⇧Z)"
                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* Single-line metadata row — labelled fields with tight typography */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]">
            <MetaField icon={Hash} label="Article">
              <span className="font-mono font-medium text-foreground tracking-tight">{article.aplCode}</span>
              <CopyButton value={article.aplCode} label="article number" />
            </MetaField>

            <span className="h-3.5 w-px bg-border/70" />

            <MetaField icon={Barcode} label="Barcode">
              <span className="font-mono font-medium tabular-nums text-foreground tracking-tight">
                {formatBarcode(article.barcode)}
              </span>
              <CopyButton value={article.barcode} label="barcode" />
            </MetaField>

            <span className="h-3.5 w-px bg-border/70" />

            <MetaField label="Confidence">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${conf.border} ${conf.color}`}>
                {conf.label}
              </span>
              <span className="font-medium tabular-nums text-foreground">{article.confidence}%</span>
            </MetaField>

            <span className="h-3.5 w-px bg-border/70" />

            <MetaField icon={ScanLine} label="Scanned">
              <span className="font-medium text-foreground tracking-tight">{dateOnly(article.extractedAt)}</span>
            </MetaField>

            <MetaField icon={RefreshCw} label="Updated">
              <span className="font-medium text-foreground tracking-tight">
                {dateOnly(article.approvedAt ?? article.extractedAt)}
              </span>
            </MetaField>
          </div>

          {/* Ingredients */}
          <CollapsibleSection
            title="Ingredients"
            defaultOpen
            count={article.ingredients.length}
          >
            <IngredientsTable articleId={article.id} ingredients={article.ingredients} />
          </CollapsibleSection>

          {/* Nutrients (read only) */}
          <CollapsibleSection
            title="Nutrients"
            count={article.nutrition.length}
          >
            <NutritionTable articleId={article.id} nutritionData={article.nutrition} />
          </CollapsibleSection>

          {/* Activity timeline */}
          <CollapsibleSection
            title="Activity"
            defaultOpen={editLog.length > 0}
            count={editLog.length}
          >
            {editLog.length === 0 ? (
              <p className="text-[12px] text-muted-foreground italic">No edits yet for this article.</p>
            ) : (
              <ol className="space-y-1.5">
                {editLog.slice(0, 30).map((entry) => (
                  <li key={entry.id} className="flex items-start gap-2 text-[12px]">
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full border shrink-0 ${
                        entry.status === 'pending' ? 'border-amber-500' : 'border-emerald-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-foreground/90">
                        <span className="font-medium text-foreground">{entry.editedBy}</span>{' '}
                        <span className="text-muted-foreground">{describeEdit(entry)}</span>
                      </p>
                      <p className="text-[10.5px] text-muted-foreground/70 mt-0.5">{entry.editedAt}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CollapsibleSection>

          {/* Submit panel — appears after Save */}
          {showSubmit ? (
            <section
              ref={submitRef}
              className="mt-6 rounded-lg border border-primary/40 p-4"
              aria-live="polite"
            >
              <h2 className="text-[13px] font-semibold text-foreground">Submit for review</h2>
              {pendingLog.length > 0 ? (
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  {pendingLog.length} edit{pendingLog.length === 1 ? '' : 's'} will be sent.
                </p>
              ) : null}
              <label className="block mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
                Comment <span className="text-muted-foreground/70 normal-case">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Briefly explain your decisions (what you changed, what you verified, anything reviewers should know)…"
                rows={3}
                autoFocus
                className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/70"
              />
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmit(false)}
                  className="px-3 h-8 rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-[12.5px] font-semibold hover:bg-primary-hover"
                >
                  <Check className="w-3.5 h-3.5" />
                  Submit
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {/* Sticky bottom action bar — hidden in read-only mode */}
      {!showSubmit ? (
        <div className="flex-shrink-0 h-12 border-t border-border bg-card px-5 flex items-center justify-between">
          <div className="text-[12px] text-muted-foreground">
            {isReadOnly ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    article.status === 'approved' ? 'bg-sky-500' : 'bg-stone-400'
                  }`}
                />
                {article.status === 'approved'
                  ? `Approved · ${article.approvedAt ?? ''}`
                  : `Submitted · ${submission?.submittedAt ?? ''}`}
                <span className="text-muted-foreground/70 ml-1">read only</span>
              </span>
            ) : unsavedEdits > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {unsavedEdits} unsaved edit{unsavedEdits === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
          {!isReadOnly ? (
            <div className="flex items-center gap-2">
              {queueTab === 'amber' && unsavedEdits === 0 ? (
                <button
                  className="h-8 px-3 rounded-md text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  onClick={() => moveToLow(article.id)}
                >
                  Send to Low Confidence
                </button>
              ) : null}
              <button
                className="h-8 px-3.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                onClick={openSubmit}
              >
                {unsavedEdits > 0 ? 'Save changes' : 'Submit for review'}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function describeEdit(entry: import('../data/mockData').EditLogEntry): string {
  const field = entry.field;
  if (field === 'ingredient.add') {
    return `added ingredient "${entry.newValue}"`;
  }
  if (field === 'ingredient.delete') {
    return `removed ingredient "${entry.oldValue}"`;
  }
  if (field === 'allergen.summary') {
    return `updated allergens to "${entry.newValue}"`;
  }
  if (field === 'submission') {
    return entry.newValue.startsWith('submitted')
      ? `submitted the article${entry.newValue.startsWith('submitted — ') ? ` — "${entry.newValue.slice('submitted — '.length)}"` : ''}`
      : `set status to ${entry.newValue}`;
  }
  if (field === 'decision' || field === 'status' || field === 'approval') {
    return `set ${field} from "${entry.oldValue}" to "${entry.newValue}"`;
  }
  return `changed ${field} from "${entry.oldValue}" to "${entry.newValue}"`;
}
