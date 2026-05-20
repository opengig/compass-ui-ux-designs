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

export function FilterPopover() {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState('');
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const onDocClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
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
        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-[12.5px] font-medium transition-colors ${
          selected.size > 0
            ? 'border-primary/40 bg-primary/10 text-foreground'
            : 'border-border bg-muted/60 text-foreground hover:bg-muted hover:border-foreground/20'
        }`}
      >
        <ListFilter className="w-3.5 h-3.5" />
        Filter
        {selected.size > 0 ? (
          <span className="tabular-nums text-[10.5px] px-1.5 py-px rounded bg-primary text-primary-foreground">
            {selected.size}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-auto left-0 top-[calc(100%+6px)] w-80 rounded-lg border border-border bg-card shadow-soft z-50 overflow-hidden">
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

          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border/70">
            <p className="text-[11.5px] text-muted-foreground">
              {selected.size === 0 ? (
                'No filters selected'
              ) : (
                <span>
                  <span className="font-semibold text-foreground tabular-nums">{selected.size}</span>{' '}
                  selected
                </span>
              )}
            </p>
            {selected.size > 0 ? (
              <button
                type="button"
                onClick={clear}
                className="h-7 px-2.5 rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
