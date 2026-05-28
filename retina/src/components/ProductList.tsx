import React from 'react';
import { Search, X, ArrowRightLeft, ArrowDownWideNarrow } from 'lucide-react';
import { useReviewStore } from '../stores/useReviewStore';
import { useQueueFilter } from '../hooks/useQueueFilter';
import { FilterPopover } from './FilterPopover';

type ProductListProps = {
  selectedProductId: string | null;
  onSelectProduct: (productId: string) => void;
  visibleArticleIds?: string[];
  width: number;
};

const BATCH_SIZE = 20;

const MOVE_TARGETS: { key: 'high' | 'amber' | 'low'; label: string; dot: string; sub: string }[] = [
  { key: 'high', label: 'Match', dot: 'bg-emerald-500', sub: 'High confidence' },
  { key: 'amber', label: 'Review', dot: 'bg-amber-500', sub: 'Needs a second look' },
  { key: 'low', label: 'Fix', dot: 'bg-rose-500', sub: 'Low confidence — rework' },
];

export function ProductList({
  selectedProductId,
  onSelectProduct,
  visibleArticleIds,
  width,
}: ProductListProps) {
  const { articles, getUnsavedEditCount, moveToBucket } = useReviewStore();
  const { searchQuery, setSearchQuery } = useQueueFilter(articles);
  const [shownCount, setShownCount] = React.useState(BATCH_SIZE);
  const [sortDesc, setSortDesc] = React.useState(false);
  const [rowMenu, setRowMenu] = React.useState<{ id: string; top: number; right: number } | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const filterRowRef = React.useRef<HTMLDivElement | null>(null);

  const visibleArticles = React.useMemo(() => {
    const base = visibleArticleIds?.length
      ? articles.filter((article) => visibleArticleIds.includes(article.id))
      : articles;
    return sortDesc ? [...base].reverse() : base;
  }, [articles, visibleArticleIds, sortDesc]);

  React.useEffect(() => {
    setShownCount(BATCH_SIZE);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [visibleArticleIds]);

  // Close the row move-menu on Esc / resize.
  React.useEffect(() => {
    if (!rowMenu) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRowMenu(null);
    };
    const onResize = () => setRowMenu(null);
    window.addEventListener('keydown', onEsc);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onEsc);
      window.removeEventListener('resize', onResize);
    };
  }, [rowMenu]);

  const visibleSlice = visibleArticles.slice(0, shownCount);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (rowMenu) setRowMenu(null);
    const target = event.currentTarget;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 120;
    if (nearBottom && shownCount < visibleArticles.length) {
      setShownCount((prev) => Math.min(prev + BATCH_SIZE, visibleArticles.length));
    }
  };

  return (
    <aside
      className="hidden md:flex flex-col min-h-0 bg-card border-r border-border"
      style={{ width, flexShrink: 0 }}
    >
      {/* Search + filter + sort toolbar */}
      <div
        ref={filterRowRef}
        className="flex items-center gap-2 px-3 py-1.5 border-b border-border flex-shrink-0"
      >
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search articles..."
            className="h-9 w-full rounded-md border border-border bg-card pl-8 pr-7 text-[12.5px] placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40"
            >
              <X className="w-3 h-3" />
            </button>
          ) : null}
        </div>
        <FilterPopover anchorRef={filterRowRef} />
        <button
          type="button"
          onClick={() => setSortDesc((s) => !s)}
          aria-label="Sort"
          title={sortDesc ? 'Sort: reversed' : 'Sort: default'}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0"
        >
          <ArrowDownWideNarrow className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List — full-width rows separated by divider lines */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto retina-thin-scroll bg-card">
        {visibleSlice.map((product) => {
          const isActive = selectedProductId === product.id;
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
              className={`group flex items-center gap-2 px-4 py-3 cursor-pointer border-b border-border/60 transition-colors ${
                isActive ? 'bg-[#FBF3E0]' : 'hover:bg-muted/40'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-[13px] leading-snug ${
                      isActive ? 'font-semibold text-foreground' : 'font-medium text-foreground'
                    }`}
                  >
                    {product.name}
                  </p>
                  {unsavedCount > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full border border-amber-500 text-amber-700 text-[10px] px-1.5 font-semibold shrink-0">
                      {unsavedCount}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{product.aplCode}</p>
              </div>
              <button
                type="button"
                aria-label="Move article"
                title="Move article"
                onClick={(event) => {
                  event.stopPropagation();
                  const r = event.currentTarget.getBoundingClientRect();
                  setRowMenu((rm) =>
                    rm?.id === product.id
                      ? null
                      : { id: product.id, top: r.bottom + 4, right: window.innerWidth - r.right },
                  );
                }}
                className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {shownCount < visibleArticles.length ? (
          <div className="px-3 py-2 text-center text-[11px] text-muted-foreground">Loading more…</div>
        ) : visibleArticles.length === 0 ? (
          <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">No articles</div>
        ) : null}
      </div>

      {/* Per-row move menu */}
      {rowMenu ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setRowMenu(null)} />
          <div
            className="fixed z-50 w-56 rounded-lg border border-border bg-card shadow-soft overflow-hidden"
            style={{ top: rowMenu.top, right: rowMenu.right }}
          >
            <div className="px-3 py-2 border-b border-border/70">
              <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
                Move to bucket
              </p>
            </div>
            <div className="p-1">
              {MOVE_TARGETS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    moveToBucket(rowMenu.id, t.key);
                    setRowMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left hover:bg-muted/40 transition-colors"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${t.dot} shrink-0`} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium text-foreground">{t.label}</span>
                    <span className="block text-[11.5px] text-muted-foreground truncate">{t.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </aside>
  );
}
