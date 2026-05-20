import React from 'react';
import { Search } from 'lucide-react';
import {
  ALLERGEN_MASTER,
  INGREDIENT_MASTER,
  NUTRIENT_MASTER,
  fuzzySearchAllergens,
  fuzzySearchIngredients,
  fuzzySearchNutrients,
} from '../data/masterData';

type CatalogTab = 'ingredients' | 'allergens' | 'nutrients';

const TABS: { key: CatalogTab; label: string; count: number }[] = [
  { key: 'ingredients', label: 'Ingredients', count: INGREDIENT_MASTER.length },
  { key: 'allergens', label: 'Allergens', count: ALLERGEN_MASTER.length },
  { key: 'nutrients', label: 'Nutrients', count: NUTRIENT_MASTER.length },
];

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) {
    return text;
  }
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-transparent text-primary font-medium underline decoration-primary/40 underline-offset-2">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

export function CatalogScreen() {
  const [tab, setTab] = React.useState<CatalogTab>('ingredients');
  const [query, setQuery] = React.useState('');

  const results = React.useMemo(() => {
    if (tab === 'ingredients') {
      const matches = fuzzySearchIngredients(query, 500);
      return { kind: 'ingredients' as const, matches };
    }
    if (tab === 'allergens') {
      return { kind: 'allergens' as const, matches: fuzzySearchAllergens(query) };
    }
    return { kind: 'nutrients' as const, matches: fuzzySearchNutrients(query) };
  }, [tab, query]);

  const totalForTab =
    tab === 'ingredients'
      ? INGREDIENT_MASTER.length
      : tab === 'allergens'
        ? ALLERGEN_MASTER.length
        : NUTRIENT_MASTER.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Sub-header — screen title + tab control left, search centered */}
      <header className="flex-shrink-0 h-12 border-b border-border bg-card flex items-center gap-3 px-3 relative">
        <h1 className="text-[14px] font-semibold text-foreground tracking-tight shrink-0">
          Catalog
        </h1>
        <span className="h-5 w-px bg-border shrink-0" aria-hidden />
        <nav className="inline-flex items-center bg-stone-200/70 rounded-lg p-1 gap-0.5 shrink min-w-0 overflow-x-auto">
          {TABS.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 h-7 px-2.5 rounded-md transition-all shrink-0 ${
                  isActive
                    ? 'bg-card text-foreground font-semibold shadow-soft'
                    : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                <span className="text-[12.5px]">{t.label}</span>
                <span
                  className={`tabular-nums text-[11px] px-1.5 py-0.5 rounded font-semibold ${
                    isActive
                      ? 'bg-foreground/10 text-foreground/85'
                      : 'bg-stone-300/60 text-muted-foreground/90'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="absolute left-1/2 -translate-x-1/2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${tab}`}
              className="h-8 w-72 rounded-md border border-border bg-card pl-8 pr-8 text-[12.5px] placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Table area */}
      <div className="flex-1 overflow-auto retina-thin-scroll">
        <div className="px-5 py-5 w-full">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {results.kind === 'ingredients' ? (
              <IngredientsTable matches={results.matches} query={query} />
            ) : results.kind === 'allergens' ? (
              <AllergensTable matches={results.matches} query={query} />
            ) : (
              <NutrientsTable matches={results.matches} query={query} />
            )}
          </div>
          <p className="mt-3 text-[11.5px] text-muted-foreground/80">
            Showing{' '}
            <span className="font-medium text-foreground/80 tabular-nums">{results.matches.length}</span>{' '}
            of <span className="tabular-nums">{totalForTab}</span> entries · read-only catalog
          </p>
        </div>
      </div>
    </div>
  );
}

function IngredientsTable({
  matches,
  query,
}: {
  matches: { item: { code: string; name: string; uom: string; alias: string } }[];
  query: string;
}) {
  const COLS = 'grid-cols-[10rem_2fr_5rem_2fr]';
  return (
    <div>
      <div
        className={`grid ${COLS} gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground/80 bg-muted/30 sticky top-0 z-10 border-b border-border`}
      >
        <div>MOG Code</div>
        <div>Name</div>
        <div>UOM</div>
        <div>Aliases</div>
      </div>
      <ul className="divide-y divide-border/60">
        {matches.length === 0 ? (
          <li className="px-4 py-8 text-center text-muted-foreground text-[13px]">
            No matches for &ldquo;{query}&rdquo;
          </li>
        ) : (
          matches.map(({ item }) => (
            <li
              key={item.code}
              className={`grid ${COLS} gap-3 px-4 py-2.5 items-center text-[13px] hover:bg-muted/20 transition-colors`}
            >
              <span className="font-mono text-[11.5px] text-foreground/80">
                {highlight(item.code, query)}
              </span>
              <span className="text-foreground">{highlight(item.name, query)}</span>
              <span className="text-muted-foreground text-[12px]">{item.uom}</span>
              <span className="text-muted-foreground text-[12px]">
                {item.alias ? highlight(item.alias, query) : <span className="text-muted-foreground/40">—</span>}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function AllergensTable({
  matches,
  query,
}: {
  matches: { item: { code: string; name: string } }[];
  query: string;
}) {
  const COLS = 'grid-cols-[10rem_1fr]';
  return (
    <div>
      <div
        className={`grid ${COLS} gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground/80 bg-muted/30 sticky top-0 z-10 border-b border-border`}
      >
        <div>Allergen Code</div>
        <div>Name</div>
      </div>
      <ul className="divide-y divide-border/60">
        {matches.length === 0 ? (
          <li className="px-4 py-8 text-center text-muted-foreground text-[13px]">
            No matches for &ldquo;{query}&rdquo;
          </li>
        ) : (
          matches.map(({ item }) => (
            <li
              key={item.code}
              className={`grid ${COLS} gap-3 px-4 py-2.5 items-center text-[13px] hover:bg-muted/20 transition-colors`}
            >
              <span className="font-mono text-[11.5px] text-foreground/80">
                {highlight(item.code, query)}
              </span>
              <span className="text-foreground">{highlight(item.name, query)}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function NutrientsTable({
  matches,
  query,
}: {
  matches: { item: { code: string; name: string; uom: string; group: string; order: number } }[];
  query: string;
}) {
  const COLS = 'grid-cols-[10rem_1.5fr_5rem_6rem_4rem]';
  return (
    <div>
      <div
        className={`grid ${COLS} gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground/80 bg-muted/30 sticky top-0 z-10 border-b border-border`}
      >
        <div>Nutrient Code</div>
        <div>Name</div>
        <div>UOM</div>
        <div>Group</div>
        <div className="text-right">Order</div>
      </div>
      <ul className="divide-y divide-border/60">
        {matches.length === 0 ? (
          <li className="px-4 py-8 text-center text-muted-foreground text-[13px]">
            No matches for &ldquo;{query}&rdquo;
          </li>
        ) : (
          matches.map(({ item }) => (
            <li
              key={item.code}
              className={`grid ${COLS} gap-3 px-4 py-2.5 items-center text-[13px] hover:bg-muted/20 transition-colors`}
            >
              <span className="font-mono text-[11.5px] text-foreground/80">
                {highlight(item.code, query)}
              </span>
              <span className="text-foreground">{highlight(item.name, query)}</span>
              <span className="text-muted-foreground text-[12px]">{item.uom}</span>
              <span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-border text-foreground/70 bg-card">
                  {item.group}
                </span>
              </span>
              <span className="text-right text-muted-foreground tabular-nums">{item.order}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
