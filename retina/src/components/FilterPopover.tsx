import React from 'react';
import { ListFilter, Search, X, Check } from 'lucide-react';

const CATEGORIES = [
  'Dairy',
  'Bakery',
  'Snacks',
  'Beverages',
  'Spices',
  'Frozen',
  'Sauces & Spreads',
  'Confectionery',
  'Cereals',
  'Dry Fruits & Nuts',
  'Oils & Ghee',
  'Pulses & Grains',
  'Ready to Eat',
  'Pickles',
  'Tea & Coffee',
  'Detergents',
  'Personal Care',
];

type FilterPopoverProps = {
  /** Optional element to anchor the popover to. When provided, the panel
   *  spans the anchor's full width (e.g. the article-list search row),
   *  so the dropdown matches the sidebar instead of hanging off the trigger. */
  anchorRef?: React.RefObject<HTMLElement | null>;
};

export function FilterPopover({ anchorRef }: FilterPopoverProps = {}) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState('');
  const ref = React.useRef<HTMLDivElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);

  // Track anchor's screen position so the panel can mirror its width.
  React.useLayoutEffect(() => {
    if (!open || !anchorRef?.current) {
      setAnchorRect(null);
      return;
    }
    const update = () => {
      if (anchorRef.current) setAnchorRect(anchorRef.current.getBoundingClientRect());
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideTrigger = ref.current && ref.current.contains(target);
      const insidePanel = panelRef.current && panelRef.current.contains(target);
      if (!insideTrigger && !insidePanel) {
        setOpen(false);
      }
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const toggle = (option: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }
      return next;
    });
  };

  const clear = () => {
    setSelected(new Set());
    setSearch('');
  };

  const filtered = React.useMemo(() => {
    if (!search.trim()) {
      return CATEGORIES;
    }
    const lower = search.toLowerCase();
    return CATEGORIES.filter((c) => c.toLowerCase().includes(lower));
  }, [search]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Filter"
        title="Filter by category"
        className={`relative inline-flex items-center justify-center w-9 h-9 rounded-md border transition-colors shrink-0 ${
          selected.size > 0
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'
        }`}
      >
        <ListFilter className="w-3.5 h-3.5" />
        {selected.size > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center tabular-nums">
            {selected.size}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          className={`rounded-lg border border-border bg-card shadow-soft z-50 overflow-hidden ${
            anchorRect ? 'fixed' : 'absolute right-auto left-0 top-[calc(100%+6px)] w-80'
          }`}
          style={
            anchorRect
              ? {
                  top: anchorRect.bottom + 6,
                  left: anchorRect.left + 4,
                  width: anchorRect.width - 8,
                }
              : undefined
          }
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/70">
            <div className="text-[12.5px] font-semibold text-foreground">Filter by category</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close filters"
              className="inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories"
                className="h-8 w-full rounded-md border border-border bg-transparent pl-8 pr-3 text-[12.5px] placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="max-h-[280px] overflow-y-auto retina-thin-scroll px-2 pb-2">
            {filtered.length === 0 ? (
              <p className="px-2 py-4 text-center text-[12px] text-muted-foreground">
                No categories match "{search}"
              </p>
            ) : (
              filtered.map((option) => {
                const isActive = selected.has(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggle(option)}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] text-left transition-colors ${
                      isActive ? 'bg-primary/10 text-foreground font-medium' : 'text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <span
                      className={`shrink-0 w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                        isActive
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-card border-border'
                      }`}
                    >
                      {isActive ? <Check className="w-3 h-3" /> : null}
                    </span>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border/70 bg-muted/30">
            <button
              type="button"
              onClick={clear}
              disabled={selected.size === 0}
              className="h-8 px-2.5 rounded-md text-[12px] font-medium text-rose-700 hover:bg-rose-50 transition-colors disabled:text-muted-foreground/50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              Clear filters
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 px-3 rounded-md text-[12.5px] font-semibold bg-primary text-primary-foreground hover:bg-primary-hover transition-colors inline-flex items-center gap-1.5"
            >
              {selected.size > 0 ? (
                <>
                  Apply
                  <span className="tabular-nums text-[11px] px-1.5 py-px rounded bg-white/20">
                    {selected.size}
                  </span>
                </>
              ) : (
                'Done'
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
