import React from 'react';
import { Check, X } from 'lucide-react';
import { useReviewStore } from '../stores/useReviewStore';
import type { ArticleData, ArticleStatus } from '../data/mockData';
import { getFrontImage } from '../data/offImages';

const MOVE_TARGETS: { label: string; tone: string; confidence: number }[] = [
  { label: 'Match', tone: 'text-emerald-700 hover:bg-emerald-50 border-emerald-300', confidence: 92 },
  { label: 'Review', tone: 'text-amber-700 hover:bg-amber-50 border-amber-300', confidence: 85 },
  { label: 'Fix', tone: 'text-rose-700 hover:bg-rose-50 border-rose-300', confidence: 70 },
];

type ProductListProps = {
  selectedProductId: string | null;
  onSelectProduct: (productId: string) => void;
  visibleArticleIds?: string[];
  width: number;
  selectedIds?: Set<string>;
  onToggleSelect?: (productId: string) => void;
  onToggleSelectAll?: () => void;
  onClearSelection?: () => void;
};

const BATCH_SIZE = 20;

function getStatusDot(status: ArticleStatus): string {
  if (status === 'approved') {
    return 'bg-emerald-500';
  }
  if (status === 'rejected') {
    return 'bg-rose-500';
  }
  return 'bg-amber-500';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function RowThumb({ article }: { article: ArticleData }) {
  const [errored, setErrored] = React.useState(false);
  const url = React.useMemo(() => getFrontImage(article.barcode), [article.barcode]);
  if (errored || !url) {
    return (
      <div className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center border border-border">
        <span className="text-[10px] font-semibold text-foreground/70">{initials(article.name)}</span>
      </div>
    );
  }
  return (
    <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden border border-border">
      <img
        src={url}
        alt=""
        onError={() => setErrored(true)}
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}

function RowCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (event: React.MouseEvent | React.KeyboardEvent) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(event) => {
        event.stopPropagation();
        onChange(event);
      }}
      className={`shrink-0 mt-1 w-4 h-4 rounded border transition-colors flex items-center justify-center ${
        checked
          ? 'bg-primary border-primary text-primary-foreground'
          : 'bg-card border-border hover:border-foreground/40'
      }`}
    >
      {checked ? <Check className="w-3 h-3" /> : null}
    </button>
  );
}

export function ProductList({
  selectedProductId,
  onSelectProduct,
  visibleArticleIds,
  width,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onClearSelection,
}: ProductListProps) {
  const { articles, getUnsavedEditCount, bulkSetConfidence } = useReviewStore();
  const [shownCount, setShownCount] = React.useState(BATCH_SIZE);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const visibleArticles = React.useMemo(
    () =>
      visibleArticleIds?.length
        ? articles.filter((article) => visibleArticleIds.includes(article.id))
        : articles,
    [articles, visibleArticleIds],
  );

  React.useEffect(() => {
    setShownCount(BATCH_SIZE);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [visibleArticleIds]);

  const visibleSlice = visibleArticles.slice(0, shownCount);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 120;
    if (nearBottom && shownCount < visibleArticles.length) {
      setShownCount((prev) => Math.min(prev + BATCH_SIZE, visibleArticles.length));
    }
  };

  const selectionEnabled = selectedIds !== undefined && onToggleSelect !== undefined;
  const allSelected =
    selectionEnabled && visibleArticles.length > 0 && selectedIds!.size === visibleArticles.length;

  return (
    <aside
      className="hidden md:flex flex-col min-h-0 bg-card border-r border-border"
      style={{ width, flexShrink: 0 }}
    >
      {/* Select-all header — morphs into bulk-action toolbar when selection > 0 */}
      {selectionEnabled ? (
        <div className="flex items-center gap-2 px-2.5 h-9 border-b border-border">
          <button
            type="button"
            role="checkbox"
            aria-checked={allSelected}
            onClick={onToggleSelectAll}
            className={`shrink-0 w-4 h-4 rounded border transition-colors flex items-center justify-center ${
              allSelected
                ? 'bg-primary border-primary text-primary-foreground'
                : selectedIds!.size > 0
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-card border-border hover:border-foreground/40'
            }`}
          >
            {allSelected ? (
              <Check className="w-3 h-3" />
            ) : selectedIds!.size > 0 ? (
              <span className="block w-2 h-px bg-primary" />
            ) : null}
          </button>
          {selectedIds!.size === 0 ? (
            <span className="text-[11.5px] text-muted-foreground">
              {visibleArticles.length} {visibleArticles.length === 1 ? 'article' : 'articles'}
            </span>
          ) : (
            <>
              <span className="text-[11.5px] font-medium text-foreground tabular-nums">
                {selectedIds!.size} selected
              </span>
              <div className="ml-auto flex items-center gap-1">
                <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground/70 mr-1">
                  Move
                </span>
                {MOVE_TARGETS.map((target) => (
                  <button
                    key={target.label}
                    type="button"
                    onClick={() => {
                      bulkSetConfidence(Array.from(selectedIds!), target.confidence);
                      onClearSelection?.();
                    }}
                    className={`h-6 px-2 rounded border bg-card text-[11px] font-medium transition-colors ${target.tone}`}
                  >
                    {target.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={onClearSelection}
                  title="Clear selection"
                  className="inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto retina-thin-scroll"
      >
        <div className="flex flex-col py-1 gap-px px-1.5">
          {visibleSlice.map((product) => {
            const isActive = selectedProductId === product.id;
            const isChecked = selectionEnabled && selectedIds!.has(product.id);
            const unsavedCount = getUnsavedEditCount(product.id);

            return (
              <div
                key={product.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectProduct(product.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectProduct(product.id);
                  }
                }}
                title={product.name}
                className={`group flex items-start gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors border-l-2 -ml-px ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-muted/30'
                }`}
              >
                {selectionEnabled ? (
                  <RowCheckbox checked={isChecked} onChange={() => onToggleSelect!(product.id)} />
                ) : null}
                <RowThumb article={product} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-1.5">
                    <span
                      className={`mt-1 inline-block w-2 h-2 rounded-full shrink-0 ${getStatusDot(
                        product.status,
                      )}`}
                    />
                    <p
                      className={`text-[12.5px] leading-snug ${
                        isActive ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'
                      }`}
                    >
                      {product.name}
                    </p>
                    {unsavedCount > 0 ? (
                      <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full border border-amber-500 text-amber-700 text-[10px] px-1.5 font-semibold shrink-0">
                        {unsavedCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[10.5px] text-muted-foreground mt-0.5 truncate">
                    {product.aplCode}
                  </p>
                </div>
              </div>
            );
          })}

          {shownCount < visibleArticles.length ? (
            <div className="px-3 py-2 text-center text-[11px] text-muted-foreground">Loading more…</div>
          ) : visibleArticles.length === 0 ? (
            <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">No articles</div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
