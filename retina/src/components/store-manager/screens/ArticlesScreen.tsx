import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
  Barcode,
  Camera,
  List,
  BarChart3,
  UserCircle,
  EyeOff,
  ArrowLeftRight,
  RotateCw,
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
  SITES,
  type ArticleTab,
  type Article,
  type LooseArticle,
  type MappedArticle,
} from '../data/storeManagerMockData';

type AnyArticle = Article | MappedArticle | LooseArticle;

/* ------------------------------------------------------------------ */
/* Action-sheet & filter state types                                  */
/* ------------------------------------------------------------------ */

type ActionSheetState = {
  open: boolean;
  article: AnyArticle | null;
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
    siteId,
    setSiteId,
  } = useStoreManager();
  const currentSite = SITES.find((s) => s.id === siteId) ?? SITES[0];
  const [siteSheetOpen, setSiteSheetOpen] = useState(false);
  const selectSite = (id: string) => {
    const s = SITES.find((x) => x.id === id);
    setSiteId(id);
    setSiteSheetOpen(false);
    if (s) showToast(`Site switched to ${s.name}`);
  };

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
  const [filterSelections, setFilterSelectionsState] = useState<Record<ArticleTab, Set<string>>>(
    () => {
      const seeded: Record<ArticleTab, Set<string>> = {
        scan: new Set(INITIAL_FILTERS.scan),
        mapped: new Set(INITIAL_FILTERS.mapped),
        loose: new Set(INITIAL_FILTERS.loose),
      };
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
  const [actionSheet, setActionSheet] = useState<ActionSheetState>({ open: false, article: null });

  // ----- Move-between-lists demo state (Scan ⇄ Loose) -----
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [movedToLoose, setMovedToLoose] = useState<LooseArticle[]>([]);
  const [movedToScan, setMovedToScan] = useState<Article[]>([]);

  const selectedSet = filterSelections[currentTab];
  const filterDefs = FILTER_DEFS[currentTab];

  // Effective source lists (account for Scan ⇄ Loose moves)
  const scanSource: Article[] = useMemo(
    () => [...TO_SCAN_ARTICLES.filter((a) => !hiddenIds.has(a.id)), ...movedToScan],
    [hiddenIds, movedToScan],
  );
  const looseSource: LooseArticle[] = useMemo(
    () => [...LOOSE_ARTICLES.filter((a) => !hiddenIds.has(a.id)), ...movedToLoose],
    [hiddenIds, movedToLoose],
  );

  // ----- Cross-screen navigation handlers -----
  const onStartScan = (article: Article) => {
    setCapture({
      mode: 'barcode',
      barcode: false,
      front: false,
      back: false,
      more: 0,
      active: 'front',
      title: article.name,
      code: article.code,
      gtin: GTIN_MAP[article.code] ?? '—',
      category: article.category,
    });
    navigate(STORE_MANAGER_ROUTES.capture);
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

  // Apply filter + search to a list of articles
  const applyFilter = (items: AnyArticle[]) => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((c) => {
      const catOk = selectedSet.size === 0 || selectedSet.has(c.categoryKey);
      const text = `${c.name} ${c.weight} ${c.categoryKey}`.toLowerCase();
      const qOk = !q || text.includes(q);
      return catOk && qOk;
    });
  };

  const filteredScan = useMemo(
    () => applyFilter(scanSource),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scanSource, selectedSet, searchQuery],
  );
  const filteredLoose = useMemo(
    () => applyFilter(looseSource),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [looseSource, selectedSet, searchQuery],
  );

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

  const openActions = (article: AnyArticle) => setActionSheet({ open: true, article });
  const hideActions = () => setActionSheet({ open: false, article: null });

  const confirmMove = () => {
    const article = actionSheet.article;
    if (!article) return hideActions();
    if (currentTab === 'scan') {
      setHiddenIds((prev) => new Set(prev).add(article.id));
      setMovedToLoose((prev) => [...prev, article as LooseArticle]);
      showToast('Moved to Loose Items');
    } else if (currentTab === 'loose') {
      setHiddenIds((prev) => new Set(prev).add(article.id));
      setMovedToScan((prev) => [...prev, { ...(article as Article), status: 'todo' }]);
      showToast('Moved to To Scan');
    }
    hideActions();
  };

  const actionTitle = (() => {
    const a = actionSheet.article;
    if (!a) return '';
    const qty = a.weight.split('·')[0]?.trim() ?? '';
    return qty ? `${a.name} · ${qty}` : a.name;
  })();

  // ------------------------------------------------------------------
  // Shared card pieces
  // ------------------------------------------------------------------

  const CardName = ({ children, color = '#2B2A26' }: { children: ReactNode; color?: string }) => (
    <div
      className="text-[13px] font-medium leading-[1.25]"
      style={{
        color,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        wordBreak: 'break-word',
      }}
    >
      {children}
    </div>
  );

  // The barcode/camera "scan-hint" + ⋮ menu cluster (To scan + Loose tabs).
  const IndicatorCluster = ({
    article,
    icon,
  }: {
    article: AnyArticle;
    icon: 'barcode' | 'camera';
  }) => (
    <div className="flex items-center flex-shrink-0" style={{ gap: '8px' }}>
      {icon === 'barcode' ? (
        <Barcode className="w-[15px] h-[15px]" style={{ color: '#D4C2A1', opacity: 0.7 }} />
      ) : (
        <Camera className="w-[15px] h-[15px]" style={{ color: '#D4C2A1', opacity: 0.7 }} />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openActions(article);
        }}
        aria-label="More actions"
        className="active:opacity-70"
        style={{ padding: '6px', margin: '-6px', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <MoreVertical className="w-[14px] h-[14px]" style={{ color: '#9C9B94' }} />
      </button>
    </div>
  );

  // ------------------------------------------------------------------
  // Card renderers
  // ------------------------------------------------------------------

  const renderScanCards = () =>
    filteredScan.map((article) => {
      const a = article as Article;
      const isPaneer = a.id === 'paneer-amul';

      // Excluded paneer — "Not in store" rendering
      if (isPaneer && paneerExcluded) {
        return (
          <div
            key={a.id}
            className="rounded-[10px] flex items-center gap-[10px]"
            style={{ background: '#F6F2E8', border: '1px solid #EAE3D0', opacity: 0.82, padding: '10px 13px' }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[13px] leading-[1.25]" style={{ color: '#8A8275', fontWeight: 400 }}>
                Paneer, Amul, Fresh Block
              </div>
              <div className="flex items-center mt-[3px]" style={{ gap: '6px' }}>
                <span
                  className="font-medium"
                  style={{ fontSize: '10px', color: '#8A6A1E', background: '#F1E6CB', padding: '2px 7px', borderRadius: '99px' }}
                >
                  Not in store
                </span>
                <span className="text-[11px]" style={{ color: '#B0AFA8' }}>
                  ART-10234
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRestorePaneer();
              }}
              className="text-[11px] font-medium flex items-center gap-1 flex-shrink-0 active:opacity-80"
              style={{ color: '#B9831F', padding: '4px 9px', border: '1px solid #E0CB97', borderRadius: '6px', background: '#fff' }}
            >
              <RotateCw className="w-3 h-3" />
              Restore
            </button>
          </div>
        );
      }

      const effectiveStatus = isPaneer && paneerScanned ? 'done' : a.status;

      if (effectiveStatus === 'failed') {
        return (
          <div
            key={a.id}
            onClick={onOpenRetry}
            className="rounded-[10px] flex items-center gap-[10px] cursor-pointer relative active:scale-[0.985]"
            style={{ background: '#FFFBFB', border: '1px solid #F09595', padding: '10px 13px' }}
          >
            <div className="flex-1 min-w-0">
              <CardName>{a.name}</CardName>
              <div className="text-[11px] mt-[2px]" style={{ color: '#A32D2D' }}>
                {a.weight}
              </div>
            </div>
            <RefreshCw className="w-[16px] h-[16px] flex-shrink-0" style={{ color: '#A32D2D' }} />
          </div>
        );
      }

      if (effectiveStatus === 'done') {
        return (
          <div
            key={a.id}
            className="bg-white rounded-[10px] flex items-center gap-[10px] relative"
            style={{ border: '1px solid #F1ECDD', padding: '10px 13px' }}
          >
            <div className="flex-1 min-w-0">
              <CardName color="#0F6B3D">{a.name}</CardName>
              <div className="text-[11px] mt-[2px]" style={{ color: '#9C9B94' }}>
                {a.weight}
              </div>
            </div>
            <Check className="w-[16px] h-[16px] flex-shrink-0" style={{ color: '#14874E' }} />
          </div>
        );
      }

      // todo
      return (
        <div
          key={a.id}
          onClick={() => onStartScan(a)}
          className="bg-white rounded-[10px] flex items-center gap-[10px] cursor-pointer relative active:scale-[0.985] active:bg-[#FBF6E7]"
          style={{ border: '1px solid #F1ECDD', padding: '10px 13px' }}
        >
          <div className="flex-1 min-w-0">
            <CardName>{a.name}</CardName>
            <div className="text-[11px] mt-[2px] truncate" style={{ color: '#9C9B94' }}>
              {a.weight}
            </div>
          </div>
          <IndicatorCluster article={a} icon="barcode" />
        </div>
      );
    });

  const renderMappedCards = () => {
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
    return applyFilter([...MAPPED_ARTICLES, ...extras]).map((article) => (
      <div
        key={article.id}
        className="bg-white rounded-[10px] flex items-center gap-[10px] relative"
        style={{ border: '1px solid #F1ECDD', padding: '10px 13px' }}
      >
        <div className="flex-1 min-w-0">
          <CardName color="#0F6B3D">{article.name}</CardName>
          <div className="text-[11px] mt-[2px]" style={{ color: '#9C9B94' }}>
            {article.weight}
          </div>
        </div>
        <Check className="w-[16px] h-[16px] flex-shrink-0" style={{ color: '#14874E' }} />
      </div>
    ));
  };

  const renderLooseCards = () =>
    filteredLoose.map((article) => {
      const a = article as LooseArticle;
      return (
        <div
          key={a.id}
          onClick={() => onStartLooseScan(a)}
          className="bg-white rounded-[10px] flex items-center gap-[10px] cursor-pointer relative active:scale-[0.985] active:bg-[#FBF6E7]"
          style={{ border: '1px solid #F1ECDD', padding: '10px 13px' }}
        >
          <div className="flex-1 min-w-0">
            <CardName>{a.name}</CardName>
            <div className="text-[11px] mt-[2px] truncate" style={{ color: '#9C9B94' }}>
              {a.weight}
            </div>
          </div>
          <IndicatorCluster article={a} icon="camera" />
        </div>
      );
    });

  // Tab counts (reflect moves + paneer demo)
  const scanCount = filteredScan.length || scanSource.length;
  const mappedCount = MAPPED_ARTICLES.length + (paneerScanned ? 1 : 0);
  const looseCount = looseSource.length;

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
        <div className="flex items-center gap-1.5" style={{ marginBottom: '8px' }}>
          <div className="flex-1 min-w-0">
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#2B2A26' }}>My Articles</span>
            <div
              className="text-[11px] inline-flex items-center gap-[3px] mt-[1px] cursor-pointer"
              style={{ color: '#9C9B94' }}
              onClick={() => setSiteSheetOpen(true)}
            >
              <MapPin className="w-[11px] h-[11px]" />
              {currentSite.name}
              <ChevronDown className="w-[10px] h-[10px]" />
            </div>
          </div>
          <button
            type="button"
            className="relative w-9 h-9 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 hover:bg-[#F9F4EA] active:bg-[#F1ECDD]"
            onClick={() => setFilterSheetOpen(true)}
            aria-label="Filters"
          >
            <SlidersHorizontal className="w-[19px] h-[19px]" style={{ color: '#2B2A26' }} />
            {selectedChips.length > 0 && (
              <div
                className="absolute"
                style={{
                  top: '6px',
                  right: '6px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#C9A96E',
                  border: '1.5px solid #fff',
                }}
              />
            )}
          </button>
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 hover:bg-[#F9F4EA] active:bg-[#F1ECDD]"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="w-[19px] h-[19px]" style={{ color: '#2B2A26' }} />
          </button>
        </div>

        {/* Search row */}
        {searchOpen && (
          <div className="flex items-center gap-2" style={{ padding: '4px 0 8px' }}>
            <div
              className="flex-1 flex items-center gap-[7px]"
              style={{ background: '#F9F4EA', borderRadius: '8px', padding: '7px 10px' }}
            >
              <Search className="w-[14px] h-[14px]" style={{ color: '#9C9B94' }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, category, ART code"
                className="flex-1 min-w-0 outline-none text-[13px] bg-transparent"
                style={{ color: '#2B2A26', border: 'none', fontFamily: 'inherit' }}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="w-5 h-5 flex items-center justify-center active:opacity-70"
                >
                  <X className="w-[14px] h-[14px]" style={{ color: '#9C9B94' }} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              className="text-[12px] font-medium cursor-pointer flex-shrink-0 active:opacity-70"
              style={{ color: '#6B6A64', padding: '8px 4px' }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-shrink-0" style={{ background: '#fff', borderBottom: '1px solid #F1ECDD' }}>
          {(
            [
              { id: 'scan', label: 'To scan', count: scanCount, green: false },
              { id: 'mapped', label: 'Mapped', count: mappedCount, green: true },
              { id: 'loose', label: 'Loose Items', count: looseCount, green: false },
            ] as const
          ).map((t) => {
            const active = currentTab === t.id;
            return (
              <div
                key={t.id}
                onClick={() => onChangeTab(t.id)}
                className="flex-1 flex items-center justify-center cursor-pointer gap-1 active:bg-[#F9F4EA]"
                style={{
                  height: '40px',
                  borderBottom: active ? '2px solid #C68A1E' : '2px solid transparent',
                  fontSize: '12px',
                  color: active ? '#C68A1E' : '#9C9B94',
                  fontWeight: active ? 600 : 400,
                  padding: '0 4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '99px',
                    background: t.green ? '#E0F0E7' : '#C68A1E',
                    color: t.green ? '#0F6B3D' : '#fff',
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
            style={{ padding: '9px 0 10px', borderTop: '1px solid #F9F4EA' }}
          >
            <Filter className="w-[14px] h-[14px] flex-shrink-0" style={{ color: '#9C9B94' }} />
            <div className="flex gap-[5px] flex-1 min-w-0 flex-nowrap overflow-hidden items-center">
              {selectedChips.slice(0, 3).map((s) => (
                <span key={s.cat} className="sm-fchip">
                  {s.label}
                </span>
              ))}
              {selectedChips.length > 3 && (
                <span className="sm-fchip sm-fchip-more">+{selectedChips.length - 3}</span>
              )}
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              className="text-[11px] cursor-pointer flex-shrink-0"
              style={{ color: '#6B6A64', padding: '2px' }}
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
            style={{ padding: '8px 14px 16px', background: '#FBF8F0' }}
          >
            {filteredScan.length === 0 ? (
              <div style={{ padding: '36px 12px', textAlign: 'center', color: '#9C9B94' }}>
                <SearchX
                  className="mx-auto"
                  style={{ width: '30px', height: '30px', color: '#C5C4BC', display: 'block', marginBottom: '8px' }}
                />
                <div className="text-[13px] font-medium" style={{ color: '#6B6A64' }}>
                  No matching articles found
                </div>
                <div className="text-[11px] mt-[3px]" style={{ color: '#9C9B94' }}>
                  Try a different keyword or clear filters
                </div>
              </div>
            ) : (
              <>
                {/* Status legend + hint */}
                <div
                  className="sticky flex items-center justify-between gap-[10px]"
                  style={{
                    top: '-1px',
                    zIndex: 5,
                    background: '#FBF8F0',
                    padding: '6px 0',
                    borderBottom: '1px solid #F1ECDD',
                    marginBottom: '4px',
                  }}
                >
                  <div className="flex items-center gap-[6px] flex-shrink-0">
                    <div className="flex items-center gap-[3px] text-[10px]" style={{ color: '#9C9B94' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E24B4A' }} />
                      Failed
                    </div>
                    <div className="flex items-center gap-[3px] text-[10px]" style={{ color: '#9C9B94' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C5C4BC' }} />
                      To scan
                    </div>
                  </div>
                  <div className="text-[10.5px] whitespace-nowrap" style={{ color: '#9C9B94' }}>
                    Tap an article to start scanning
                  </div>
                </div>
                {renderScanCards()}
              </>
            )}
          </div>
        )}

        {currentTab === 'mapped' && (
          <div
            className="flex-1 overflow-y-auto flex flex-col gap-1.5"
            style={{ padding: '8px 14px 16px', background: '#FBF8F0' }}
          >
            <div className="text-[11px]" style={{ color: '#9C9B94', padding: '2px 0 4px' }}>
              Completed scans
            </div>
            {renderMappedCards()}
          </div>
        )}

        {currentTab === 'loose' && (
          <div
            className="flex-1 overflow-y-auto flex flex-col gap-1.5"
            style={{ padding: '8px 14px 16px', background: '#FBF8F0' }}
          >
            <div className="text-[11px]" style={{ color: '#9C9B94', padding: '2px 0 4px' }}>
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
          borderTop: '1px solid #F1ECDD',
          padding: '6px 0 0',
          paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-1 active:bg-[#F5F5F4]">
          <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: '#C68A1E', marginBottom: '1px' }} />
          <List className="w-[22px] h-[22px]" style={{ color: '#C68A1E' }} />
          <span className="text-[10px] font-medium" style={{ color: '#C68A1E' }}>
            Articles
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-1 active:bg-[#F5F5F4]" onClick={onOpenProgress}>
          <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'transparent', marginBottom: '1px' }} />
          <BarChart3 className="w-[22px] h-[22px]" style={{ color: '#9C9B94' }} />
          <span className="text-[10px]" style={{ color: '#9C9B94' }}>
            Progress
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-[2px] cursor-pointer py-1 active:bg-[#F5F5F4]" onClick={onOpenAccount}>
          <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: 'transparent', marginBottom: '1px' }} />
          <UserCircle className="w-[22px] h-[22px]" style={{ color: '#9C9B94' }} />
          <span className="text-[10px]" style={{ color: '#9C9B94' }}>
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
              <span className="flex-1 font-semibold" style={{ fontSize: '15px', color: '#2B2A26' }}>
                Filter by category
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-[12px] font-medium cursor-pointer active:opacity-70"
                style={{ color: '#A32D2D', padding: '6px 4px' }}
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center -mr-2 active:bg-[#F9F4EA] rounded-full"
              >
                <X className="w-[18px] h-[18px]" style={{ color: '#6B6A64' }} />
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
                    style={{ padding: '10px 16px', minHeight: '44px', borderBottom: '1px solid #F9F4EA' }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '3px',
                        border: '1.5px solid',
                        background: on ? '#C68A1E' : 'transparent',
                        borderColor: on ? '#C68A1E' : '#C5C4BC',
                      }}
                    >
                      {on && <Check className="w-[11px] h-[11px]" style={{ color: '#fff' }} />}
                    </div>
                    <span className="flex-1 text-[13px]" style={{ color: '#2B2A26' }}>
                      {d.label}
                    </span>
                    <span className="text-[11px]" style={{ color: '#9C9B94' }}>
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
                borderTop: '1px solid #F1ECDD',
              }}
            >
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 text-[13px] font-medium active:opacity-90"
                style={{
                  background: '#C68A1E',
                  color: '#fff',
                  border: '1px solid #C68A1E',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  minHeight: '44px',
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
            style={{ paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom) + 8px))' }}
          >
            <div className="sm-handle" />
            <div style={{ padding: '12px 20px 6px', fontSize: '13px', fontWeight: 500, color: '#2B2A26' }}>
              {actionTitle}
            </div>
            {/* Mark as not in store / not available today */}
            <div
              className="flex items-center gap-3 cursor-pointer active:bg-[#F5F5F4]"
              style={{ padding: '13px 20px', borderBottom: '1px solid #F9F4EA' }}
              onClick={() => {
                hideActions();
                onRequestExclude(isLooseAction);
              }}
            >
              <EyeOff className="w-[18px] h-[18px] flex-shrink-0" style={{ color: '#BA7517' }} />
              <div className="min-w-0">
                <div className="text-[13px]" style={{ color: '#BA7517' }}>
                  {isLooseAction ? 'Not available today' : 'Mark as not in my store'}
                </div>
                <div className="text-[11px] mt-[1px]" style={{ color: '#9C9B94' }}>
                  {isLooseAction
                    ? 'This item was not received or is unavailable today.'
                    : "This article doesn't exist at this site"}
                </div>
              </div>
            </div>
            {/* Move between Scan ⇄ Loose */}
            <div
              className="flex items-center gap-3 cursor-pointer active:bg-[#F5F5F4]"
              style={{ padding: '13px 20px', borderBottom: '1px solid #F9F4EA' }}
              onClick={confirmMove}
            >
              <ArrowLeftRight className="w-[18px] h-[18px] flex-shrink-0" style={{ color: '#2B6CB0' }} />
              <div className="min-w-0">
                <div className="text-[13px]" style={{ color: '#2B6CB0' }}>
                  {isLooseAction ? 'Move to To Scan' : 'Move to Loose Items'}
                </div>
                <div className="text-[11px] mt-[1px]" style={{ color: '#9C9B94' }}>
                  {isLooseAction
                    ? 'Reclassify this item into the To Scan list'
                    : 'Reclassify this article into the Loose Items list'}
                </div>
              </div>
            </div>
            {/* Cancel */}
            <div
              className="flex items-center gap-3 cursor-pointer active:bg-[#F5F5F4]"
              style={{ padding: '13px 20px' }}
              onClick={hideActions}
            >
              <X className="w-[18px] h-[18px] flex-shrink-0" style={{ color: '#9C9B94' }} />
              <div className="text-[13px]" style={{ color: '#9C9B94' }}>
                Cancel
              </div>
            </div>
          </div>
        </>
      )}

      {/* Switch-site bottom sheet */}
      {siteSheetOpen && (
        <>
          <div className="sm-overlay" onClick={() => setSiteSheetOpen(false)} />
          <div className="sm-sheet" style={{ maxHeight: '70%' }}>
            <div className="sm-handle" />
            <div className="flex items-center justify-between" style={{ padding: '12px 18px 4px' }}>
              <span className="font-semibold" style={{ fontSize: '15px', color: '#2B2A26' }}>
                Switch site
              </span>
              <button
                type="button"
                onClick={() => setSiteSheetOpen(false)}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center -mr-2 active:bg-[#F9F4EA] rounded-full"
              >
                <X className="w-[18px] h-[18px]" style={{ color: '#6B6A64' }} />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ padding: '8px 14px 18px' }}>
              {SITES.map((s) => {
                const on = s.id === siteId;
                return (
                  <div
                    key={s.id}
                    onClick={() => selectSite(s.id)}
                    className="flex items-center gap-[10px] cursor-pointer active:opacity-90"
                    style={{
                      padding: '12px 14px',
                      border: `1px solid ${on ? '#C68A1E' : '#F1ECDD'}`,
                      borderRadius: '10px',
                      marginBottom: '6px',
                      background: on ? '#FBF6EC' : '#fff',
                    }}
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: on ? '#C68A1E' : '#6B6A64' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px]" style={{ color: '#2B2A26', fontWeight: on ? 600 : 500 }}>
                        {s.name}
                      </div>
                      <div className="text-[11px] mt-[1px]" style={{ color: '#9C9B94' }}>
                        {s.meta}
                      </div>
                    </div>
                    {on && <Check className="w-[16px] h-[16px]" style={{ color: '#C68A1E' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
