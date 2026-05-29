import React from 'react';
import {
  Search, X, ArrowRightLeft, ArrowDownWideNarrow, Filter, FolderInput,
  ChevronDown, Check, Calendar, ChevronLeft, ChevronRight, RefreshCcw,
  ArrowDownToLine, Hand, Grab,
} from 'lucide-react';
import { useReviewStore } from '../stores/useReviewStore';
import { useQueueFilter } from '../hooks/useQueueFilter';
import { ARTICLE_CATEGORIES, type ArticleData } from '../data/mockData';
import { C } from './nutritionist/data/tokens';

type ProductListProps = {
  selectedProductId: string | null;
  onSelectProduct: (productId: string) => void;
  visibleArticleIds?: string[];
  width: number;
  // When true (e.g. the Submitted page), articles are already sent and must not
  // be moved between queues — the rebucket toggle and per-row move button hide.
  readOnly?: boolean;
};

type Bucket = 'high' | 'amber' | 'low';

type ListToast = {
  msg: string;
  kind?: 'warn';
  action?: { label: string; onClick: () => void };
  duration?: number;
};

const BATCH_SIZE = 20;

const BUCKET_LABEL: Record<Bucket, string> = {
  high: 'Ready To Cookbook',
  amber: 'To Review',
  low: 'To Fix',
};

// Drop-zone styling mirrors the nutritionist queue (status colours avoid red/green).
const BUCKET_DEFS: Record<Bucket, { label: string; sub: string; color: string; bg: string; bdr: string }> = {
  high: { label: 'Ready To Cookbook', sub: 'Drop here', color: '#0D9488', bg: '#F0FDFA', bdr: '#99F6E4' },
  amber: { label: 'To Review', sub: 'Drop here', color: '#475569', bg: '#F1F5F9', bdr: '#CBD5E1' },
  low: { label: 'To Fix', sub: 'Drop here', color: '#6B7280', bg: '#F9FAFB', bdr: '#D1D5DB' },
};

const SORT_OPTIONS: { k: 'newest' | 'oldest' | 'name' | 'confLow' | 'confHigh'; label: string }[] = [
  { k: 'newest', label: 'Newest first' },
  { k: 'oldest', label: 'Oldest first' },
  { k: 'name', label: 'Name (A → Z)' },
  { k: 'confLow', label: 'Confidence (low → high)' },
  { k: 'confHigh', label: 'Confidence (high → low)' },
];

const bucketOf = (confidence: number): Bucket =>
  confidence >= 90 ? 'high' : confidence >= 80 ? 'amber' : 'low';

const targetKeysFor = (current: Bucket): Bucket[] =>
  current === 'amber' ? ['high', 'low'] : ['amber'];

export function ProductList({
  selectedProductId,
  onSelectProduct,
  visibleArticleIds,
  width,
  readOnly = false,
}: ProductListProps) {
  const { articles, getUnsavedEditCount, moveToBucket } = useReviewStore();
  const { searchQuery, setSearchQuery, categories, setCategories, sortBy, setSortBy } =
    useQueueFilter(articles);

  const [shownCount, setShownCount] = React.useState(BATCH_SIZE);
  const [rowMenu, setRowMenu] = React.useState<{ id: string; top: number; right: number } | null>(null);

  // Filter popover
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filterAnchor, setFilterAnchor] = React.useState<{ top: number; left: number } | null>(null);
  const [catOpen, setCatOpen] = React.useState(false);
  // Scanned / Submitted Date — visual only (mirrors nutritionist, which also doesn't filter rows by date).
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [submFrom, setSubmFrom] = React.useState('');
  const [submTo, setSubmTo] = React.useState('');
  const [datePickerFor, setDatePickerFor] = React.useState<'start' | 'end' | 'submStart' | 'submEnd' | null>(null);
  const [pickerMonth, setPickerMonth] = React.useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Sort popover
  const [sortOpen, setSortOpen] = React.useState(false);
  const [sortAnchor, setSortAnchor] = React.useState<{ top: number; right: number } | null>(null);

  // Drag-to-rebucket
  const [bucketMode, setBucketMode] = React.useState(false);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [hoverBucket, setHoverBucket] = React.useState<Bucket | null>(null);
  const [sessionMoves, setSessionMoves] = React.useState<Record<Bucket, number>>({ high: 0, amber: 0, low: 0 });

  // In-list move/undo toast
  const [listToast, setListToast] = React.useState<ListToast | null>(null);
  const listToastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const filterBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const sortBtnRef = React.useRef<HTMLButtonElement | null>(null);

  const visibleArticles = React.useMemo<ArticleData[]>(() => {
    if (!visibleArticleIds) return articles;
    const byId = new Map(articles.map((a) => [a.id, a]));
    return visibleArticleIds
      .map((id) => byId.get(id))
      .filter((a): a is ArticleData => Boolean(a));
  }, [articles, visibleArticleIds]);

  React.useEffect(() => {
    setShownCount(BATCH_SIZE);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
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

  const activeFilters = (categories.length ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (submFrom ? 1 : 0) + (submTo ? 1 : 0);

  const showListToast = (t: ListToast) => {
    if (listToastTimer.current) clearTimeout(listToastTimer.current);
    setListToast(t);
    listToastTimer.current = setTimeout(() => setListToast(null), t.duration ?? 4000);
  };

  const applyMove = (id: string, to: Bucket) => {
    const art = articles.find((a) => a.id === id);
    if (!art) return;
    const current = bucketOf(art.confidence);
    const label = BUCKET_LABEL[to];
    setRowMenu(null);
    if (current === to) {
      showListToast({ msg: `${art.name} is already in ${label}`, kind: 'warn', duration: 2800 });
      return;
    }
    moveToBucket(id, to);
    setSessionMoves((prev) => ({ ...prev, [to]: prev[to] + 1 }));
    showListToast({
      msg: `Moved ${art.name} to ${label}`,
      action: { label: 'Undo', onClick: () => moveToBucket(id, current) },
      duration: 5000,
    });
  };

  const toggleCat = (cat: string) => {
    setCategories(categories.includes(cat) ? categories.filter((c) => c !== cat) : [...categories, cat]);
  };

  const clearAllFilters = () => {
    setCategories([]);
    setDateFrom('');
    setDateTo('');
    setSubmFrom('');
    setSubmTo('');
  };

  const dragAreaOpen = bucketMode && draggingId != null;
  const draggingArticle = draggingId != null ? articles.find((a) => a.id === draggingId) ?? null : null;
  const dropTargets = draggingArticle ? targetKeysFor(bucketOf(draggingArticle.confidence)) : [];

  return (
    <aside
      className="hidden md:flex flex-col min-h-0 bg-card border-r border-border relative"
      style={{ width, flexShrink: 0 }}
    >
      {/* Search + filter + move + sort toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 border-b border-border flex-shrink-0"
        style={{ backgroundColor: C.card }}
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

        {/* Filter icon button */}
        <div className="flex-shrink-0">
          <button
            ref={filterBtnRef}
            type="button"
            onClick={() => {
              setSortOpen(false);
              setSortAnchor(null);
              setFilterOpen((o) => {
                const next = !o;
                if (next && filterBtnRef.current) {
                  const r = filterBtnRef.current.getBoundingClientRect();
                  setFilterAnchor({ top: r.bottom + 6, left: r.left });
                } else {
                  setFilterAnchor(null);
                }
                return next;
              });
            }}
            aria-label="Filter"
            className="inline-flex items-center justify-center rounded-md border transition-colors relative"
            style={{
              width: 36,
              height: 36,
              borderColor: activeFilters > 0 ? C.prBdr : C.border,
              backgroundColor: activeFilters > 0 ? '#FEF9EE' : C.card,
              color: activeFilters > 0 ? C.pr : C.mutedFg,
            }}
          >
            <Filter size={14} />
            {activeFilters > 0 ? (
              <span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{ backgroundColor: '#E53935' }}
              />
            ) : null}
          </button>
        </div>

        {/* Rebucket / drag-mode toggle — hidden when read-only (Submitted page) */}
        {!readOnly ? (
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setBucketMode((o) => {
                if (!o) setSessionMoves({ high: 0, amber: 0, low: 0 });
                return !o;
              });
              setFilterOpen(false);
              setFilterAnchor(null);
              setSortOpen(false);
              setSortAnchor(null);
            }}
            aria-label={bucketMode ? 'Hide rebucket zones' : 'Show rebucket zones'}
            title={bucketMode ? 'Hide buckets' : 'Move articles between buckets'}
            className="inline-flex items-center justify-center rounded-md border transition-colors"
            style={{
              width: 36,
              height: 36,
              borderColor: bucketMode ? C.prBdr : C.border,
              backgroundColor: bucketMode ? '#FEF9EE' : C.card,
              color: bucketMode ? C.pr : C.mutedFg,
            }}
          >
            <FolderInput size={14} />
          </button>
        </div>
        ) : null}

        {/* Sort icon button */}
        <div className="flex-shrink-0">
          <button
            ref={sortBtnRef}
            type="button"
            onClick={() => {
              setFilterOpen(false);
              setFilterAnchor(null);
              setSortOpen((o) => {
                const next = !o;
                if (next && sortBtnRef.current) {
                  const r = sortBtnRef.current.getBoundingClientRect();
                  setSortAnchor({ top: r.bottom + 6, right: window.innerWidth - r.right });
                } else {
                  setSortAnchor(null);
                }
                return next;
              });
            }}
            aria-label="Sort"
            className="inline-flex items-center justify-center rounded-md border transition-colors"
            style={{
              width: 36,
              height: 36,
              borderColor: sortBy !== 'newest' ? C.prBdr : C.border,
              backgroundColor: sortBy !== 'newest' ? '#FEF9EE' : C.card,
              color: sortBy !== 'newest' ? C.pr : C.mutedFg,
            }}
          >
            <ArrowDownWideNarrow size={14} />
          </button>
        </div>
      </div>

      {/* Filter popover */}
      {filterOpen && filterAnchor ? (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => {
              setFilterOpen(false);
              setFilterAnchor(null);
              setDatePickerFor(null);
            }}
          />
          <div
            className="fixed z-[70]"
            style={{
              top: filterAnchor.top,
              left: filterAnchor.left,
              width: 320,
              backgroundColor: C.card,
              border: `1px solid ${C.border3}`,
              borderRadius: 14,
              boxShadow: '0 12px 32px rgba(26,26,26,0.14)',
              padding: '16px 18px 18px',
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.mutedFg,
                marginBottom: 8,
              }}
            >
              Category
            </p>
            {(() => {
              const label =
                categories.length === 0
                  ? 'All categories'
                  : categories.length === 1
                    ? categories[0]
                    : `${categories.length} categories selected`;
              return (
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={() => setCatOpen((o) => !o)}
                    className="w-full inline-flex items-center justify-between transition-colors"
                    style={{
                      height: 42,
                      borderRadius: 10,
                      border: `1px solid ${catOpen ? C.pr : C.border}`,
                      backgroundColor: catOpen ? '#FEF9EE' : '#fff',
                      padding: '0 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: categories.length ? C.fg : C.mutedFg,
                        fontWeight: categories.length ? 500 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {label}
                    </span>
                    <ChevronDown
                      size={14}
                      style={{
                        color: catOpen ? C.pr : C.mutedFg,
                        flexShrink: 0,
                        transition: 'transform 0.15s',
                        transform: catOpen ? 'rotate(180deg)' : 'none',
                      }}
                    />
                  </button>
                  {catOpen ? (
                    <>
                      <div className="fixed inset-0 z-[72]" onClick={() => setCatOpen(false)} />
                      <div
                        className="absolute z-[73] w-full mt-1.5 py-1.5"
                        style={{
                          backgroundColor: C.card,
                          border: `1px solid ${C.border3}`,
                          borderRadius: 10,
                          boxShadow: '0 8px 20px rgba(26,26,26,0.12)',
                        }}
                      >
                        {categories.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setCategories([])}
                            className="w-full flex items-center px-3 py-2 transition-colors"
                            style={{
                              fontSize: 12,
                              color: C.mutedFg,
                              fontWeight: 500,
                              textAlign: 'left',
                              borderBottom: `1px solid ${C.border}`,
                              cursor: 'pointer',
                              background: 'transparent',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.muted)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            Clear selection
                          </button>
                        ) : null}
                        {ARTICLE_CATEGORIES.map((c) => {
                          const on = categories.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => toggleCat(c)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors"
                              style={{ cursor: 'pointer', background: 'transparent', textAlign: 'left' }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.muted)}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <span
                                className="inline-flex items-center justify-center flex-shrink-0"
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 4,
                                  border: `1.5px solid ${on ? C.pr : C.border2}`,
                                  backgroundColor: on ? C.pr : '#fff',
                                }}
                              >
                                {on ? <Check size={11} color="#fff" strokeWidth={3} /> : null}
                              </span>
                              <span style={{ fontSize: 13, color: C.fg, fontWeight: on ? 600 : 500 }}>{c}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })()}

            {readOnly && (
              <>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: C.mutedFg,
                    marginTop: 18,
                    marginBottom: 8,
                  }}
                >
                  Submitted Date
                </p>
                <div className="flex items-center gap-2">
                  {[
                    { key: 'submStart' as const, val: submFrom, ph: 'Start date' },
                    { key: 'submEnd' as const, val: submTo, ph: 'End date' },
                  ].map((d) => {
                    const on = datePickerFor === d.key;
                    const fmt = d.val
                      ? new Date(d.val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '';
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => {
                          setDatePickerFor((prev) => (prev === d.key ? null : d.key));
                          if (d.val) {
                            const m = new Date(d.val);
                            m.setDate(1);
                            setPickerMonth(m);
                          }
                        }}
                        className="flex-1 inline-flex items-center justify-between transition-colors"
                        style={{
                          height: 42,
                          borderRadius: 10,
                          border: `1px solid ${on ? C.pr : C.border}`,
                          backgroundColor: on ? '#FEF9EE' : '#fff',
                          padding: '0 12px',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: 13, color: fmt ? C.fg : C.mutedFg, fontWeight: fmt ? 500 : 400 }}>
                          {fmt || d.ph}
                        </span>
                        <Calendar size={14} style={{ color: on ? C.pr : C.mutedFg, flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: C.mutedFg,
                marginTop: 18,
                marginBottom: 8,
              }}
            >
              Scanned Date
            </p>
            <div className="flex items-center gap-2">
              {[
                { key: 'start' as const, val: dateFrom, ph: 'Start date' },
                { key: 'end' as const, val: dateTo, ph: 'End date' },
              ].map((d) => {
                const on = datePickerFor === d.key;
                const fmt = d.val
                  ? new Date(d.val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '';
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => {
                      setDatePickerFor((prev) => (prev === d.key ? null : d.key));
                      if (d.val) {
                        const m = new Date(d.val);
                        m.setDate(1);
                        setPickerMonth(m);
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-between transition-colors"
                    style={{
                      height: 42,
                      borderRadius: 10,
                      border: `1px solid ${on ? C.pr : C.border}`,
                      backgroundColor: on ? '#FEF9EE' : '#fff',
                      padding: '0 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 13, color: fmt ? C.fg : C.mutedFg, fontWeight: fmt ? 500 : 400 }}>
                      {fmt || d.ph}
                    </span>
                    <Calendar size={14} style={{ color: on ? C.pr : C.mutedFg, flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>

            {activeFilters > 0 ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg transition-colors"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.pr,
                  border: `1px solid ${C.prBdr}`,
                  backgroundColor: '#FEF9EE',
                }}
              >
                <RefreshCcw size={11} /> Clear all filters
              </button>
            ) : null}
          </div>

          {/* Calendar picker — appears beside the filter menu */}
          {datePickerFor
            ? (() => {
                const month = pickerMonth;
                const y = month.getFullYear();
                const m = month.getMonth();
                const first = new Date(y, m, 1);
                const firstDow = first.getDay();
                const daysInMonth = new Date(y, m + 1, 0).getDate();
                const monthName = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                const selectedStr =
                  datePickerFor === 'start' ? dateFrom
                  : datePickerFor === 'end' ? dateTo
                  : datePickerFor === 'submStart' ? submFrom
                  : submTo;
                const selDate = selectedStr ? new Date(selectedStr) : null;
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                const cells: (number | null)[] = [];
                for (let i = 0; i < firstDow; i++) cells.push(null);
                for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                const setDate = (d: number) => {
                  const v = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  if (datePickerFor === 'start') setDateFrom(v);
                  else if (datePickerFor === 'end') setDateTo(v);
                  else if (datePickerFor === 'submStart') setSubmFrom(v);
                  else setSubmTo(v);
                  setDatePickerFor(null);
                };
                const shiftMonth = (delta: number) => setPickerMonth(new Date(y, m + delta, 1));
                return (
                  <div
                    style={{
                      position: 'fixed',
                      top: filterAnchor.top,
                      left: filterAnchor.left + 330 + 10,
                      width: 280,
                      backgroundColor: C.card,
                      border: `1px solid ${C.border3}`,
                      borderRadius: 14,
                      boxShadow: '0 12px 32px rgba(26,26,26,0.14)',
                      padding: '14px 14px 16px',
                      zIndex: 71,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => shiftMonth(-1)}
                        className="inline-flex items-center justify-center rounded-md"
                        style={{ width: 28, height: 28, border: `1px solid ${C.border}`, backgroundColor: '#fff', color: C.mutedFg, cursor: 'pointer' }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.fg }}>{monthName}</span>
                      <button
                        onClick={() => shiftMonth(1)}
                        className="inline-flex items-center justify-center rounded-md"
                        style={{ width: 28, height: 28, border: `1px solid ${C.border}`, backgroundColor: '#fff', color: C.mutedFg, cursor: 'pointer' }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-0 mb-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div
                          key={i}
                          style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.mutedFg, padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {cells.map((d, i) => {
                        if (d === null) return <div key={i} />;
                        const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const isSel =
                          selDate && selDate.getFullYear() === y && selDate.getMonth() === m && selDate.getDate() === d;
                        const isToday = dStr === todayStr;
                        return (
                          <button
                            key={i}
                            onClick={() => setDate(d)}
                            className="inline-flex items-center justify-center transition-colors"
                            style={{
                              height: 32,
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: isSel ? 700 : 500,
                              border: 'none',
                              cursor: 'pointer',
                              color: isSel ? '#fff' : isToday ? C.pr : C.fg,
                              backgroundColor: isSel ? C.pr : 'transparent',
                              outline: isToday && !isSel ? `1px solid ${C.prBdr}` : 'none',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSel) e.currentTarget.style.backgroundColor = C.muted;
                            }}
                            onMouseLeave={(e) => {
                              if (!isSel) e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                      <button
                        onClick={() => {
                          if (datePickerFor === 'start') setDateFrom('');
                          else if (datePickerFor === 'end') setDateTo('');
                          else if (datePickerFor === 'submStart') setSubmFrom('');
                          else setSubmTo('');
                          setDatePickerFor(null);
                        }}
                        style={{ fontSize: 11, color: C.mutedFg, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 2px' }}
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setDate(new Date().getDate())}
                        style={{ fontSize: 11, color: C.pr, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 2px' }}
                      >
                        Today
                      </button>
                    </div>
                  </div>
                );
              })()
            : null}
        </>
      ) : null}

      {/* Sort popover */}
      {sortOpen && sortAnchor ? (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => {
              setSortOpen(false);
              setSortAnchor(null);
            }}
          />
          <div
            className="fixed z-[70] rounded-xl py-1.5 w-52"
            style={{
              top: sortAnchor.top,
              right: sortAnchor.right,
              backgroundColor: C.card,
              border: `1px solid ${C.border3}`,
              boxShadow: '0 8px 16px rgba(26,26,26,0.12)',
            }}
          >
            <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.05em]" style={{ color: C.mutedFg }}>
              Sort by
            </p>
            {SORT_OPTIONS.map((o) => {
              const on = sortBy === o.k;
              return (
                <button
                  key={o.k}
                  onClick={() => {
                    setSortBy(o.k);
                    setSortOpen(false);
                    setSortAnchor(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors"
                  style={{
                    fontSize: 12.5,
                    color: on ? C.pr : C.fg,
                    fontWeight: on ? 600 : 500,
                    backgroundColor: on ? '#FEF9EE' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!on) e.currentTarget.style.backgroundColor = C.muted;
                  }}
                  onMouseLeave={(e) => {
                    if (!on) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {o.label}
                  {on ? <Check size={12} strokeWidth={3} /> : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {/* List — full-width rows separated by divider lines */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto retina-thin-scroll bg-card">
        {visibleSlice.map((product) => {
          const isActive = selectedProductId === product.id;
          const unsavedCount = getUnsavedEditCount(product.id);
          const isDragging = draggingId === product.id;
          const effectiveBucket = bucketOf(product.confidence);
          return (
            <div
              key={product.id}
              role="button"
              tabIndex={0}
              draggable={bucketMode}
              onDragStart={(e) => {
                if (!bucketMode) return;
                setDraggingId(product.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', product.id);
                if (e.dataTransfer.setDragImage) {
                  const ghost = document.createElement('div');
                  ghost.style.cssText = [
                    'position:absolute', 'top:-1000px', 'left:-1000px',
                    'padding:8px 14px', 'min-width:180px', 'max-width:260px',
                    'background:#fff', 'border:1px solid #ECE6DA', `border-left:3px solid ${BUCKET_DEFS[effectiveBucket].color}`,
                    'border-radius:10px', 'box-shadow:0 16px 32px rgba(0,0,0,0.18)',
                    'font:600 13px Inter, system-ui, sans-serif', 'color:#1A1A1A',
                    'transform:rotate(-2deg)', 'pointer-events:none',
                  ].join(';');
                  ghost.innerHTML = `<div style="font-size:13px;font-weight:700;">${product.name}</div><div style="font-size:11px;color:#8A8275;margin-top:2px;font-weight:500;">${product.aplCode}</div>`;
                  document.body.appendChild(ghost);
                  e.dataTransfer.setDragImage(ghost, 14, 14);
                  setTimeout(() => {
                    try {
                      document.body.removeChild(ghost);
                    } catch {
                      /* noop */
                    }
                  }, 0);
                }
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setHoverBucket(null);
              }}
              onClick={() => {
                if (!bucketMode) onSelectProduct(product.id);
              }}
              onKeyDown={(event) => {
                if (!bucketMode && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  onSelectProduct(product.id);
                }
              }}
              title={product.name}
              className={`group flex items-center gap-2 px-4 py-3 border-b border-border/60 transition-colors ${
                isActive ? 'bg-[#F0EDE6]' : 'hover:bg-[#F5F3EE]'
              } ${bucketMode ? (isDragging ? 'dnd-grabbing' : 'dnd-grab') : 'cursor-pointer'}`}
              style={{
                opacity: isDragging ? 0.35 : 1,
                transform: isDragging ? 'scale(0.985)' : 'scale(1)',
                transition: 'opacity 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1), background-color 0.15s ease',
              }}
            >
              {/* No leading hand icon — in bucket mode the cursor itself turns to grab/grabbing. */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <p
                    className={`text-[13px] leading-snug truncate min-w-0 ${
                      isActive ? 'font-semibold text-foreground' : 'font-medium text-foreground'
                    }`}
                  >
                    {product.name}
                  </p>
                  {bucketMode ? (() => {
                    const cfg =
                      effectiveBucket === 'high'
                        ? { l: 'Ready To Cookbook', c: 'bg-teal-50 text-teal-700 border-teal-200' }
                        : effectiveBucket === 'amber'
                          ? { l: 'To Review', c: 'bg-slate-100 text-slate-700 border-slate-200' }
                          : { l: 'To Fix', c: 'bg-gray-100 text-gray-600 border-gray-200' };
                    return (
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded border flex-shrink-0 text-[9px] font-bold uppercase tracking-wide ${cfg.c}`}
                      >
                        {cfg.l}
                      </span>
                    );
                  })() : null}
                </div>
                <p className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{product.aplCode}</p>
              </div>
              {bucketMode ? (
                <span className="dnd-hand shrink-0 inline-flex items-center justify-center w-7 h-7" style={{ color: isDragging ? C.pr : C.mutedFg, marginRight: 4 }} aria-hidden>
                  {isDragging ? <Grab className="w-4 h-4" /> : <Hand className="w-4 h-4" />}
                </span>
              ) : !readOnly ? (
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
              ) : null}
            </div>
          );
        })}

        {shownCount < visibleArticles.length ? (
          <div className="px-3 py-2 text-center text-[11px] text-muted-foreground">Loading more…</div>
        ) : visibleArticles.length === 0 ? (
          <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">No articles match this filter</div>
        ) : null}
      </div>

      {/* Drag-to-rebucket drop zones — slide up from bottom when bucket mode is on */}
      <div
        className="flex-shrink-0 flex flex-col gap-1.5 overflow-hidden"
        style={{
          borderTop: dragAreaOpen ? `1px solid ${C.border}` : 'none',
          backgroundColor: C.page,
          padding: dragAreaOpen ? '8px 8px 10px' : '0 8px',
          maxHeight: dragAreaOpen ? 150 : 0,
          opacity: dragAreaOpen ? 1 : 0,
          transform: dragAreaOpen ? 'translateY(0)' : 'translateY(20px)',
          transition:
            'max-height 0.22s cubic-bezier(0.4,0,0.2,1), padding 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease, transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: dragAreaOpen ? 'auto' : 'none',
        }}
      >
        <p style={{ fontSize: 10.5, fontWeight: 600, color: C.mutedFg, textAlign: 'center', letterSpacing: '0.01em' }}>
          {draggingId != null ? 'Drop the article into a bucket' : 'Drag an article to move it between buckets'}
        </p>
        <div className="flex items-stretch gap-2" style={{ minHeight: 58 }}>
          <div className="flex-1 flex gap-2">
            {dropTargets.map((key) => {
              const b = BUCKET_DEFS[key];
              const isHover = hoverBucket === key;
              const isDragActive = draggingId !== null;
              const sessionCount = sessionMoves[key];
              return (
                <div
                  key={key}
                  className="flex-1"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setHoverBucket(key);
                  }}
                  onDragLeave={() => {
                    if (hoverBucket === key) setHoverBucket(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData('text/plain');
                    setDraggingId(null);
                    setHoverBucket(null);
                    if (id) applyMove(id, key);
                  }}
                  style={{
                    minHeight: 58,
                    padding: '10px',
                    borderRadius: 10,
                    border: `${isHover ? 2 : 1.5}px dashed ${isHover ? b.color : b.bdr}`,
                    backgroundColor: isHover ? `${b.color}1A` : b.bg,
                    boxShadow: isHover ? `0 8px 22px ${b.color}33` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    transition:
                      'border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: isHover ? 'scale(1.03) translateY(-2px)' : 'scale(1)',
                    position: 'relative',
                  }}
                >
                  <ArrowDownToLine
                    size={16}
                    style={{ color: b.color, transition: 'transform 0.18s ease', transform: isHover ? 'translateY(2px)' : 'translateY(0)' }}
                  />
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: b.color,
                      lineHeight: 1.2,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      textAlign: 'center',
                    }}
                  >
                    {b.label}
                  </span>
                  <span style={{ fontSize: 9.5, color: C.mutedFg, textAlign: 'center', lineHeight: 1 }}>
                    {isHover ? 'Release to move' : b.sub}
                  </span>
                  {isDragActive && sessionCount > 0 ? (
                    <span
                      style={{
                        position: 'absolute',
                        top: -7,
                        right: -7,
                        minWidth: 20,
                        height: 20,
                        padding: '0 6px',
                        borderRadius: 10,
                        backgroundColor: b.color,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 2px 6px ${b.color}55, 0 0 0 2px ${C.page}`,
                      }}
                    >
                      {sessionCount}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* In-list move / undo / warning toast */}
      {listToast ? (
        <div
          className="absolute left-2 right-3 bottom-3 z-30 flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            backgroundColor: listToast.kind === 'warn' ? '#FEF3E0' : '#1F2937',
            color: listToast.kind === 'warn' ? '#7A5310' : '#fff',
            border: listToast.kind === 'warn' ? `1px solid ${C.amBdr}` : 'none',
            boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
          }}
        >
          {listToast.kind !== 'warn' ? <Check size={14} className="text-emerald-400 flex-shrink-0" strokeWidth={3} /> : null}
          <span className="flex-1 text-[12px] font-medium leading-snug">{listToast.msg}</span>
          {listToast.action ? (
            <button
              onClick={() => {
                listToast.action?.onClick();
                if (listToastTimer.current) clearTimeout(listToastTimer.current);
                setListToast(null);
              }}
              className="flex-shrink-0 text-[12px] font-bold underline underline-offset-2"
              style={{ color: listToast.kind === 'warn' ? '#7A5310' : '#fff' }}
            >
              {listToast.action.label}
            </button>
          ) : null}
          <button
            onClick={() => {
              if (listToastTimer.current) clearTimeout(listToastTimer.current);
              setListToast(null);
            }}
            aria-label="Dismiss"
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: listToast.kind === 'warn' ? '#7A5310' : '#fff' }}
          >
            <X size={13} />
          </button>
        </div>
      ) : null}

      {/* Per-row move menu — options depend on the article's current bucket (matches nutritionist) */}
      {rowMenu
        ? (() => {
            const menuArt = articles.find((a) => a.id === rowMenu.id);
            const current = menuArt ? bucketOf(menuArt.confidence) : 'amber';
            const opts: { key: Bucket; label: string }[] =
              current === 'amber'
                ? [
                    { key: 'high', label: 'Move to Ready To Cookbook' },
                    { key: 'low', label: 'Move to Fix' },
                  ]
                : [{ key: 'amber', label: 'Move to Review' }];
            return (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setRowMenu(null)} />
                <div
                  className="fixed z-50 w-60 rounded-xl py-1.5"
                  style={{
                    top: rowMenu.top,
                    right: rowMenu.right,
                    backgroundColor: C.card,
                    border: `1px solid ${C.border3}`,
                    boxShadow: '0 8px 16px rgba(26,26,26,0.12)',
                  }}
                >
                  {opts.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => applyMove(rowMenu.id, opt.key)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                      style={{ fontSize: 12.5, color: C.fg, fontWeight: 500, whiteSpace: 'nowrap' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.muted)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            );
          })()
        : null}
    </aside>
  );
}
