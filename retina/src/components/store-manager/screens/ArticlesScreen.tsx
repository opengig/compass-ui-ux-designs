import { useEffect, useMemo, useState } from 'react';
import {
  SlidersHorizontal,
  Search,
  X,
  ChevronDown,
  MapPin,
  Filter,
  MoreVertical,
  Check,
  RefreshCw,
  SearchX,
  List,
  BarChart3,
  UserCircle,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { STORE_MANAGER_ROUTES } from '../../../router/routes';
import { useStoreManager } from '../StoreManagerContext';
import {
  TO_SCAN_ARTICLES,
  MAPPED_ARTICLES,
  LOOSE_ARTICLES,
  FILTER_DEFS,
  GTIN_MAP,
  INITIAL_FILTERS,
  type ArticleTab,
  type Article,
  type LooseArticle,
  type MappedArticle,
} from '../data/storeManagerMockData';

/* ------------------------------------------------------------------ */
/* Shared status colour map — keeps card colour-coding centralised.   */
/* ------------------------------------------------------------------ */

const RetinaLogo = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M7 22 C 5 13, 16 8, 26 9 C 33 9.5, 36 13, 34 17 C 32 21, 26 20, 22 18 C 14 14, 10 16, 8 21 C 7 23, 6 24, 7 22 Z"
      fill="#44403C"
      opacity=".55"
    />
    <ellipse cx="21" cy="9" rx="2" ry="2.6" fill="#44403C" />
    <path d="M19 14 C 17 17, 20 23, 24 21 C 27 19.5, 25 14, 21 14 Z" fill="#44403C" />
    <path d="M22 23 L 24.5 33 L 21 34.5 L 20 25 Z" fill="#44403C" />
  </svg>
);

type AnyArticle = Article | MappedArticle | LooseArticle;

type StatusKind = 'failed' | 'done' | 'todo' | 'mapped';
const STATUS_PILL: Record<StatusKind, { label: string; bg: string; color: string }> = {
  failed: { label: 'FAILED',  bg: '#FDE7E7', color: '#A32D2D' },
  done:   { label: 'DONE',    bg: '#E2EFC8', color: '#3B6D11' },
  todo:   { label: 'TO SCAN', bg: '#ECECEB', color: '#71717A' },
  mapped: { label: 'MAPPED',  bg: '#E2EFC8', color: '#3B6D11' },
};

function StatusPill({ kind }: { kind: StatusKind }) {
  const s = STATUS_PILL[kind];
  return (
    <span
      className="inline-flex items-center font-semibold tracking-wide"
      style={{
        background: s.bg,
        color: s.color,
        fontSize: '9.5px',
        padding: '2px 6px',
        borderRadius: '4px',
        lineHeight: 1.2,
        letterSpacing: '0.04em',
      }}
    >
      {s.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Action-sheet & filter state types                                  */
/* ------------------------------------------------------------------ */

type ActionSheetState = {
  open: boolean;
  title: string;
};

const TABS: readonly ArticleTab[] = ['scan', 'mapped', 'loose'] as const;

function parseTab(raw: string | null): ArticleTab {
  return TABS.includes((raw ?? '') as ArticleTab) ? (raw as ArticleTab) : 'scan';
}

export function ArticlesScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    paneerScanned,
    paneerExcluded,
    setCapture,
    setExcludeLoose,
    setPaneerExcluded,
    showToast,
  } = useStoreManager();

  // ----- URL-driven state (tab / q / cat) -----
  const currentTab = parseTab(searchParams.get('tab'));
  const onChangeTab = (t: ArticleTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (t === 'scan') next.delete('tab');
        else next.set('tab', t);
        return next;
      },
      { replace: true },
    );
  };

  const urlQ = searchParams.get('q') ?? '';
  const [searchQuery, setSearchQuery] = useState(urlQ);
  const [searchOpen, setSearchOpen] = useState(urlQ.length > 0);
  // Write search query back to URL (debounced via effect — keeps typing snappy).
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (searchQuery) next.set('q', searchQuery);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // ----- Filter selections — local state seeded from URL on first mount -----
  // Each tab keeps its own selection set, seeded from INITIAL_FILTERS when no
  // ?cat=… is present so the existing data flow / "Dairy, Frozen, Spices"
  // preselection on the scan tab stays intact.
  const [filterSelections, setFilterSelectionsState] = useState<Record<ArticleTab, Set<string>>>(
    () => {
      const seeded: Record<ArticleTab, Set<string>> = {
        scan: new Set(INITIAL_FILTERS.scan),
        mapped: new Set(INITIAL_FILTERS.mapped),
        loose: new Set(INITIAL_FILTERS.loose),
      };
      // If the URL has ?cat=… on first mount, that overrides the seed for the
      // *current* tab (other tabs keep their seed; filters are per-tab).
      const initialCat = searchParams.get('cat');
      if (initialCat !== null) {
        const initialTab = parseTab(searchParams.get('tab'));
        seeded[initialTab] = new Set(
          initialCat
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        );
      }
      return seeded;
    },
  );

  // When the current tab's selection changes, mirror it into ?cat=.
  const writeCatToUrl = (cats: Set<string>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (cats.size === 0) next.delete('cat');
        else next.set('cat', Array.from(cats).join(','));
        return next;
      },
      { replace: true },
    );
  };

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [actionSheet, setActionSheet] = useState<ActionSheetState>({ open: false, title: '' });

  const selectedSet = filterSelections[currentTab];
  const filterDefs = FILTER_DEFS[currentTab];

  // ----- Cross-screen navigation handlers (replace prop callbacks) -----
  const onStartScan = (article: Article) => {
    setCapture({
      mode: 'barcode',
      barcode: false,
      front: false,
      back: false,
      more: 0,
      active: 'barcode',
      title: article.name,
      code: article.code,
      gtin: GTIN_MAP[article.code] ?? '—',
      category: article.category,
    });
    navigate(STORE_MANAGER_ROUTES.barcode);
  };
  const onStartLooseScan = (article: LooseArticle) => {
    setCapture({
      mode: 'loose',
      barcode: false,
      front: false,
      back: false,
      more: 0,
      active: 'front',
      title: article.name,
      code: article.code,
      gtin: '—',
      category: article.category,
    });
    navigate(STORE_MANAGER_ROUTES.capture);
  };
  const onOpenAccount = () => navigate(STORE_MANAGER_ROUTES.account);
  const onOpenProgress = () => navigate(STORE_MANAGER_ROUTES.progress);
  const onOpenRetry = () => navigate(STORE_MANAGER_ROUTES.retry);
  const onRequestExclude = (loose: boolean) => {
    setExcludeLoose(loose);
    navigate(`${STORE_MANAGER_ROUTES.markIrrelevant}${loose ? '?loose=1' : ''}`);
  };
  const onRestorePaneer = () => {
    setPaneerExcluded(false);
    showToast('Restored to scan list');
  };

  // Apply filter + search to the current tab's articles
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const items: AnyArticle[] =
      currentTab === 'scan'
        ? TO_SCAN_ARTICLES
        : currentTab === 'mapped'
          ? MAPPED_ARTICLES
          : LOOSE_ARTICLES;
    return items.filter((c) => {
      const catOk = selectedSet.size === 0 || selectedSet.has(c.categoryKey);
      const text = `${c.name} ${c.weight} ${c.categoryKey}`.toLowerCase();
      const qOk = !q || text.includes(q);
      return catOk && qOk;
    });
  }, [currentTab, selectedSet, searchQuery]);

  const selectedChips = filterDefs.filter((d) => selectedSet.has(d.cat));

  const toggleFilterCat = (cat: string) => {
    const next: Record<ArticleTab, Set<string>> = {
      scan: new Set(filterSelections.scan),
      mapped: new Set(filterSelections.mapped),
      loose: new Set(filterSelections.loose),
    };
    if (next[currentTab].has(cat)) next[currentTab].delete(cat);
    else next[currentTab].add(cat);
    setFilterSelectionsState(next);
    writeCatToUrl(next[currentTab]);
  };

  const clearFilters = () => {
    const next: Record<ArticleTab, Set<string>> = {
      scan: new Set(filterSelections.scan),
      mapped: new Set(filterSelections.mapped),
      loose: new Set(filterSelections.loose),
    };
    next[currentTab].clear();
    setFilterSelectionsState(next);
    writeCatToUrl(next[currentTab]);
  };

  const openActions = (article: AnyArticle) => {
    const qty = article.weight.split('·')[0]?.trim() ?? '';
    setActionSheet({ open: true, title: qty ? `${article.name} · ${qty}` : article.name });
  };

  const hideActions = () => setActionSheet({ open: false, title: '' });

  // ------------------------------------------------------------------
  // Card list rendering — tab determines source + presentation
  // ------------------------------------------------------------------

  const renderScanCards = () => {
    return filteredArticles.map((article) => {
      const a = article as Article;
      const isPaneer = a.id === 'paneer-amul';

      // Excluded paneer card — special "Not in store" rendering
      if (isPaneer && paneerExcluded) {
        return (
          <div
            key={a.id}
            className="rounded-[10px] p-[12px_13px] flex items-center gap-[10px]"
            style={{
              background: '#F5F5F4',
              border: '1px solid #ECECEB',
              opacity: 0.78,
            }}
          >
            <div className="flex-1 min-w-0">
              <span
                className="inline-flex items-center font-semibold tracking-wide"
                style={{
                  background: '#ECECEB',
                  color: '#71717A',
                  fontSize: '9.5px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  lineHeight: 1.2,
                  letterSpacing: '0.04em',
                }}
              >
                NOT IN STORE
              </span>
              <div
                className="text-[13.5px] leading-[1.3] mt-[5px]"
                style={{ color: '#71717A', fontWeight: 400 }}
              >
                Amul Paneer
              </div>
              <div
                className="text-[11.5px] mt-[3px]"
                style={{ color: '#A1A1AA' }}
              >
                ART-10234
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRestorePaneer();
              }}
              className="text-[11.5px] font-medium flex items-center gap-1 flex-shrink-0 active:opacity-80"
              style={{
                color: '#1F1611',
                padding: '8px 11px',
                border: '1px solid #E5E5E4',
                borderRadius: '6px',
                background: '#fff',
                minHeight: '36px',
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore
            </button>
          </div>
        );
      }

      // Mark paneer as scanned (green/done) once the demo flow completes
      const effectiveStatus =
        isPaneer && paneerScanned ? 'done' : a.status;

      if (effectiveStatus === 'failed') {
        return (
          <div
            key={a.id}
            onClick={onOpenRetry}
            className="rounded-[10px] p-[12px_13px] flex items-center gap-[10px] cursor-pointer relative active:opacity-90"
            style={{ background: '#FFF5F5', border: '1px solid #F09595' }}
          >
            <div className="flex-1 min-w-0">
              <StatusPill kind="failed" />
              <div
                className="text-[13.5px] font-medium leading-[1.3] mt-[5px]"
                style={{
                  color: '#1F1611',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {a.name}
              </div>
              <div className="text-[11.5px] mt-[3px]" style={{ color: '#A32D2D' }}>
                {a.weight}
              </div>
            </div>
            <RefreshCw className="w-[18px] h-[18px] flex-shrink-0" style={{ color: '#A32D2D' }} />
          </div>
        );
      }

      if (effectiveStatus === 'done') {
        return (
          <div
            key={a.id}
            className="rounded-[10px] p-[12px_13px] flex items-center gap-[10px] relative"
            style={{ background: '#F2F8E8', border: '1px solid #D9E8C0' }}
          >
            <div className="flex-1 min-w-0">
              <StatusPill kind="done" />
              <div
                className="text-[13.5px] font-medium leading-[1.3] mt-[5px]"
                style={{
                  color: '#1F1611',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {a.name}
              </div>
              <div className="text-[11.5px] mt-[3px]" style={{ color: '#71717A' }}>
                {a.weight}
              </div>
            </div>
            <Check className="w-[18px] h-[18px] flex-shrink-0" style={{ color: '#5A8C1A' }} />
          </div>
        );
      }

      // todo
      return (
        <div
          key={a.id}
          onClick={() => onStartScan(a)}
          className="bg-white rounded-[10px] p-[12px_13px] flex items-center gap-[10px] cursor-pointer relative active:bg-[#F5F5F4]"
          style={{ border: '1px solid #E5E5E4' }}
        >
          <div className="flex-1 min-w-0">
            <div
              className="text-[13.5px] font-medium leading-[1.3]"
              style={{
                color: '#1F1611',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {a.name}
            </div>
            <div
              className="text-[11.5px] mt-[3px] truncate"
              style={{ color: '#71717A' }}
            >
              {a.weight}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openActions(a);
              }}
              aria-label="More actions"
              className="active:opacity-70"
              style={{
                background: 'transparent',
                borderRadius: '6px',
                padding: '7px',
                border: 'none',
                cursor: 'pointer',
                minWidth: '32px',
                minHeight: '32px',
              }}
            >
              <MoreVertical className="w-4 h-4" style={{ color: '#C68A1E' }} />
            </button>
          </div>
        </div>
      );
    });
  };

  const renderMappedCards = () => {
    // For paneer "mark scanned" demo — append to mapped tab
    const extras: MappedArticle[] = paneerScanned
      ? [
          {
            id: 'm-paneer-amul',
            name: 'Paneer, Amul, Fresh Block',
            weight: '1 kg · Dairy · ART-10234',
            category: 'Dairy',
            categoryKey: 'dairy',
            code: 'ART-10234',
          },
        ]
      : [];
    const q = searchQuery.trim().toLowerCase();
    const all = [...MAPPED_ARTICLES, ...extras].filter((c) => {
      const catOk = selectedSet.size === 0 || selectedSet.has(c.categoryKey);
      const text = `${c.name} ${c.weight} ${c.categoryKey}`.toLowerCase();
      const qOk = !q || text.includes(q);
      return catOk && qOk;
    });
    return all.map((article) => (
      <div
        key={article.id}
        className="rounded-[10px] p-[12px_13px] flex items-center gap-[10px] relative"
        style={{ background: '#F2F8E8', border: '1px solid #D9E8C0' }}
      >
        <div className="flex-1 min-w-0">
          <StatusPill kind="mapped" />
          <div
            className="text-[13.5px] font-medium leading-[1.3] mt-[5px]"
            style={{
              color: '#1F1611',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.name}
          </div>
          <div className="text-[11.5px] mt-[3px]" style={{ color: '#71717A' }}>
            {article.weight}
          </div>
        </div>
        <Check className="w-[18px] h-[18px] flex-shrink-0" style={{ color: '#5A8C1A' }} />
      </div>
    ));
  };

  const renderLooseCards = () => {
    return filteredArticles.map((article) => {
      const a = article as LooseArticle;
      return (
        <div
          key={a.id}
          onClick={() => onStartLooseScan(a)}
          className="bg-white rounded-[10px] p-[12px_13px] flex items-center gap-[10px] cursor-pointer relative active:bg-[#F5F5F4]"
          style={{ border: '1px solid #E5E5E4' }}
        >
          <div className="flex-1 min-w-0">
            <div
              className="text-[13.5px] font-medium leading-[1.3]"
              style={{
                color: '#1F1611',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {a.name}
            </div>
            <div className="text-[11.5px] mt-[3px] truncate" style={{ color: '#71717A' }}>
              {a.weight}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openActions(a);
              }}
              aria-label="More actions"
              className="active:opacity-70"
              style={{
                background: 'transparent',
                borderRadius: '6px',
                padding: '7px',
                border: 'none',
                cursor: 'pointer',
                minWidth: '32px',
                minHeight: '32px',
              }}
            >
              <MoreVertical className="w-4 h-4" style={{ color: '#C68A1E' }} />
            </button>
          </div>
        </div>
      );
    });
  };

  // Tab counts react to paneer demo state
  const scanCount = TO_SCAN_ARTICLES.length - (paneerScanned ? 1 : 0);
  const mappedCount = MAPPED_ARTICLES.length + (paneerScanned ? 1 : 0);

  const isLooseAction = currentTab === 'loose';

  return (
    <>
      {/* Header: title + filter & search icons */}
      <div
        style={{
          background: '#fff',
          padding: '10px 16px 0',
          paddingTop: 'max(10px, env(safe-area-inset-top))',
          flexShrink: 0,
        }}
      >
        <div
          className="flex items-center gap-1.5"
          style={{ marginBottom: '8px' }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center" style={{ gap: '7px' }}>
              <RetinaLogo />
              <span
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#1F1611',
                  letterSpacing: '-0.1px',
                }}
              >
                My Articles
              </span>
            </div>
            <div
              className="text-[11.5px] flex items-center gap-[3px] mt-[2px]"
              style={{ color: '#71717A', paddingLeft: '23px' }}
            >
              <MapPin className="w-[12px] h-[12px]" />
              Bengaluru Central Kitchen
              <ChevronDown
                className="w-[11px] h-[11px] cursor-pointer"
                onClick={onOpenAccount}
              />
            </div>
          </div>
          <button
            type="button"
            className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 hover:bg-[#ECECEB] active:bg-[#E5E5E4]"
            onClick={() => setFilterSheetOpen(true)}
            aria-label="Filters"
          >
            <SlidersHorizontal
              className="w-[20px] h-[20px]"
              style={{ color: selectedChips.length > 0 ? '#C68A1E' : '#1F1611' }}
            />
            {selectedChips.length > 0 && (
              <div
                className="absolute"
                style={{
                  top: '6px',
                  right: '6px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#C68A1E',
                  border: '1.5px solid #fff',
                }}
              />
            )}
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 hover:bg-[#ECECEB] active:bg-[#E5E5E4]"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="w-[20px] h-[20px]" style={{ color: '#1F1611' }} />
          </button>
        </div>

        {/* Search row */}
        {searchOpen && (
          <div className="flex items-center gap-2" style={{ padding: '4px 0 8px' }}>
            <div
              className="flex-1 flex items-center gap-[7px]"
              style={{
                background: '#F9F4EA',
                borderRadius: '8px',
                padding: '7px 10px',
              }}
            >
              <Search className="w-[15px] h-[15px]" style={{ color: '#71717A' }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, category, ART code"
                className="flex-1 min-w-0 outline-none text-[14px] bg-transparent"
                style={{ color: '#1F1611', border: 'none', fontFamily: 'inherit' }}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="w-6 h-6 flex items-center justify-center active:opacity-70"
                >
                  <X
                    className="w-[15px] h-[15px]"
                    style={{ color: '#71717A' }}
                  />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              className="text-[13px] font-medium cursor-pointer flex-shrink-0 active:opacity-70"
              style={{ color: '#71717A', padding: '8px 4px' }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex flex-shrink-0"
          style={{ background: '#fff', borderBottom: '1px solid #E5E5E4' }}
        >
          {(
            [
              { id: 'scan', label: 'To scan', count: scanCount, cls: 'dark' },
              { id: 'mapped', label: 'Mapped', count: mappedCount, cls: 'green' },
              { id: 'loose', label: 'Loose Items', count: 8, cls: 'dark' },
            ] as const
          ).map((t) => {
            const active = currentTab === t.id;
            return (
              <div
                key={t.id}
                onClick={() => onChangeTab(t.id)}
                className="flex-1 flex items-center justify-center cursor-pointer gap-1 active:bg-[#F5F5F4]"
                style={{
                  height: '44px',
                  borderBottom: active ? '2px solid #C68A1E' : '2px solid transparent',
                  fontSize: '12.5px',
                  color: active ? '#1F1611' : '#71717A',
                  fontWeight: active ? 600 : 400,
                  padding: '0 4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
                <span
                  style={{
                    fontSize: '10.5px',
                    padding: '1px 6px',
                    borderRadius: '99px',
                    background: t.cls === 'green' ? '#EAF3DE' : '#C68A1E',
                    color: t.cls === 'green' ? '#3B6D11' : '#fff',
                    fontWeight: 600,
                  }}
                >
                  {t.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Active filter chips strip */}
        {selectedChips.length > 0 && (
          <div
            className="sm-filter-strip flex items-center gap-2 cursor-pointer min-w-0"
            onClick={() => setFilterSheetOpen(true)}
            style={{ padding: '9px 0 10px', borderTop: '1px solid #ECECEB' }}
          >
            <Filter
              className="w-[14px] h-[14px] flex-shrink-0"
              style={{ color: '#71717A' }}
            />
            <div
              className="flex gap-[5px] flex-1 min-w-0 flex-nowrap overflow-hidden items-center"
            >
              {selectedChips.slice(0, 3).map((s) => (
                <span key={s.cat} className="sm-fchip">
                  {s.label}
                </span>
              ))}
              {selectedChips.length > 3 && (
                <span className="sm-fchip sm-fchip-more">
                  +{selectedChips.length - 3}
                </span>
              )}
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              className="text-[11px] cursor-pointer flex-shrink-0"
              style={{ color: '#71717A', padding: '2px' }}
            >
              Clear all
            </span>
          </div>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {currentTab === 'scan' && (
          <div
            className="flex-1 overflow-y-auto flex flex-col gap-1.5"
            style={{ padding: '8px 14px 16px', background: '#FCF8F0' }}
          >
            {filteredArticles.length === 0 ? (
              <div
                style={{ padding: '36px 12px', textAlign: 'center', color: '#71717A' }}
              >
                <SearchX
                  className="mx-auto"
                  style={{
                    width: '30px',
                    height: '30px',
                    color: '#A1A1AA',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                />
                <div className="text-[13.5px] font-medium" style={{ color: '#71717A' }}>
                  No matching articles found
                </div>
                <div className="text-[11.5px] mt-[3px]" style={{ color: '#71717A' }}>
                  Try a different keyword or clear filters
                </div>
              </div>
            ) : (
              renderScanCards()
            )}
          </div>
        )}

        {currentTab === 'mapped' && (
          <div
            className="flex-1 overflow-y-auto flex flex-col gap-1.5"
            style={{ padding: '8px 14px 16px', background: '#FCF8F0' }}
          >
            <div className="text-[11.5px]" style={{ color: '#71717A', padding: '2px 0 4px' }}>
              Scanned by your site or another store
            </div>
            {renderMappedCards()}
          </div>
        )}

        {currentTab === 'loose' && (
          <div
            className="flex-1 overflow-y-auto flex flex-col gap-1.5"
            style={{ padding: '8px 14px 16px', background: '#FCF8F0' }}
          >
            <div className="text-[11.5px]" style={{ color: '#71717A', padding: '2px 0 4px' }}>
              Items without barcodes — capture images directly
            </div>
            {renderLooseCards()}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div
        className="flex flex-shrink-0"
        style={{
          background: '#fff',
          borderTop: '1px solid #E5E5E4',
          padding: '6px 0 0',
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-2 active:bg-[#F5F5F4]">
          <div
            style={{ width: '32px', height: '3px', borderRadius: '2px', background: '#C68A1E', marginBottom: '1px' }}
          />
          <List className="w-[22px] h-[22px]" style={{ color: '#C68A1E' }} />
          <span className="text-[10.5px] font-medium" style={{ color: '#C68A1E' }}>
            Articles
          </span>
        </div>
        <div
          className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-2 active:bg-[#F5F5F4]"
          onClick={onOpenProgress}
        >
          <div
            style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'transparent', marginBottom: '1px' }}
          />
          <BarChart3 className="w-[22px] h-[22px]" style={{ color: '#71717A' }} />
          <span className="text-[10.5px]" style={{ color: '#71717A' }}>
            Progress
          </span>
        </div>
        <div
          className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-2 active:bg-[#F5F5F4]"
          onClick={onOpenAccount}
        >
          <div
            style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'transparent', marginBottom: '1px' }}
          />
          <UserCircle className="w-[22px] h-[22px]" style={{ color: '#71717A' }} />
          <span className="text-[10.5px]" style={{ color: '#71717A' }}>
            Account
          </span>
        </div>
      </div>

      {/* Filter sheet */}
      {filterSheetOpen && (
        <>
          <div className="sm-overlay" onClick={() => setFilterSheetOpen(false)} />
          <div className="sm-sheet" style={{ maxHeight: '82%' }}>
            <div className="sm-handle" />
            <div className="flex items-center gap-3" style={{ padding: '12px 16px 8px' }}>
              <span
                className="flex-1 font-semibold"
                style={{ fontSize: '16px', color: '#1F1611' }}
              >
                Filter by category
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-[12.5px] font-medium cursor-pointer active:opacity-70"
                style={{ color: '#A32D2D', padding: '6px 4px' }}
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center -mr-2 active:bg-[#ECECEB] rounded-full"
              >
                <X className="w-[19px] h-[19px]" style={{ color: '#71717A' }} />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ paddingBottom: '8px' }}>
              {filterDefs.map((d) => {
                const on = selectedSet.has(d.cat);
                return (
                  <div
                    key={d.cat}
                    onClick={() => toggleFilterCat(d.cat)}
                    className="flex items-center gap-[10px] cursor-pointer active:bg-[#F5F5F4]"
                    style={{
                      padding: '12px 16px',
                      minHeight: '48px',
                      borderBottom: '1px solid #ECECEB',
                    }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: '1.5px solid #A1A1AA',
                        background: on ? '#C68A1E' : 'transparent',
                        borderColor: on ? '#C68A1E' : '#A1A1AA',
                      }}
                    >
                      {on && (
                        <Check className="w-[12px] h-[12px]" style={{ color: '#fff' }} />
                      )}
                    </div>
                    <span
                      className="flex-1 text-[13.5px]"
                      style={{ color: '#1F1611' }}
                    >
                      {d.label}
                    </span>
                    <span className="text-[11.5px]" style={{ color: '#71717A' }}>
                      {d.count}
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                padding: '10px 16px',
                paddingBottom: 'max(1.125rem, calc(env(safe-area-inset-bottom) + 0.5rem))',
                background: '#fff',
                borderTop: '1px solid #E5E5E4',
              }}
            >
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 text-[14px] font-medium active:opacity-90"
                style={{
                  background: '#C68A1E',
                  color: '#fff',
                  border: '1px solid #C68A1E',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  minHeight: '48px',
                }}
              >
                Apply · {selectedChips.length} selected
              </button>
            </div>
          </div>
        </>
      )}

      {/* Action sheet */}
      {actionSheet.open && (
        <>
          <div className="sm-overlay" onClick={hideActions} />
          <div
            className="sm-sheet"
            style={{
              paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom) + 8px))',
            }}
          >
            <div className="sm-handle" />
            <div
              style={{
                padding: '12px 20px 6px',
                fontSize: '13.5px',
                fontWeight: 500,
                color: '#1F1611',
              }}
            >
              {actionSheet.title}
            </div>
            <div
              className="flex items-center gap-3 cursor-pointer active:bg-[#F5F5F4]"
              style={{
                padding: '14px 20px',
                minHeight: '56px',
                borderBottom: '1px solid #ECECEB',
              }}
              onClick={() => {
                hideActions();
                onRequestExclude(isLooseAction);
              }}
            >
              <EyeOff className="w-[19px] h-[19px] flex-shrink-0" style={{ color: '#44403C' }} />
              <div className="min-w-0">
                <div className="text-[13.5px]" style={{ color: '#44403C' }}>
                  {isLooseAction ? 'Not available today' : 'Mark as not in my store'}
                </div>
                <div className="text-[11.5px] mt-[1px]" style={{ color: '#71717A' }}>
                  {isLooseAction
                    ? 'This item was not received or is unavailable today.'
                    : "This article doesn't exist at this site"}
                </div>
              </div>
            </div>
            <div
              className="flex items-center gap-3 cursor-pointer active:bg-[#F5F5F4]"
              style={{ padding: '14px 20px', minHeight: '48px' }}
              onClick={hideActions}
            >
              <X className="w-[19px] h-[19px] flex-shrink-0" style={{ color: '#71717A' }} />
              <div className="text-[13.5px]" style={{ color: '#71717A' }}>
                Cancel
              </div>
            </div>
          </div>
        </>
      )}

    </>
  );
}
