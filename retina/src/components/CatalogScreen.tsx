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
    tab === 'ingredients' ? INGREDIENT_MASTER.length : tab === 'allergens' ? ALLERGEN_MASTER.length : NUTRIENT_MASTER.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-card">
      {/* Sub-header: tabs + search */}
      <div className="flex-shrink-0 grid grid-cols-3 items-stretch h-14 px-5 border-b border-border bg-card">
        <div className="flex items-center min-w-0 overflow-x-auto gap-1.5">
          <div className="flex items-center mr-2 shrink-0">
            <h2 className="text-[13px] font-semibold text-foreground">Catalog</h2>
          </div>
          {TABS.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 h-8 px-2.5 rounded-md transition-colors shrink-0 ${
                  isActive
                    ? 'bg-foreground/[0.06] text-foreground'
                    : 'text-foreground/85 hover:bg-foreground/[0.04]'
                }`}
              >
                <span className="text-[13px] font-medium">{t.label}</span>
                <span className="tabular-nums text-[11px] px-1.5 py-0.5 rounded bg-foreground/10 text-foreground/80 font-medium">
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-center min-w-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${tab} by code, name, or alias…`}
              className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-9 text-[13.5px] placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40"
              >
                ×
              </button>
            ) : (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 font-mono pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end min-w-0" aria-hidden />
      </div>

      {/* Table area */}
      <div className="flex-1 overflow-auto retina-thin-scroll">
        <div className="px-5 py-5 max-w-7xl mx-auto w-full">
          {results.kind === 'ingredients' ? (
            <IngredientsTable matches={results.matches} query={query} />
          ) : results.kind === 'allergens' ? (
            <AllergensTable matches={results.matches} query={query} />
          ) : (
            <NutrientsTable matches={results.matches} query={query} />
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            {results.matches.length} of {totalForTab} entries · read-only catalog
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
  return (
    <div className="rounded-md overflow-hidden">
      <div className="grid grid-cols-[9rem_2fr_5rem_2fr] gap-3 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/80 border-b border-border/70">
        <div>MOG Code</div>
        <div>Name</div>
        <div>UOM</div>
        <div>Aliases</div>
      </div>
      <ul className="divide-y divide-border/50">
        {matches.length === 0 ? (
          <li className="px-3 py-6 text-center text-muted-foreground text-[13px]">
            No matches for "{query}"
          </li>
        ) : (
          matches.map(({ item }) => (
            <li
              key={item.code}
              className="grid grid-cols-[9rem_2fr_5rem_2fr] gap-3 px-3 py-2 items-center text-[13px]"
            >
              <span className="font-mono text-[11.5px] text-foreground/80">{highlight(item.code, query)}</span>
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
  return (
    <div className="rounded-md overflow-hidden">
      <div className="grid grid-cols-[9rem_1fr] gap-3 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/80 border-b border-border/70">
        <div>Allergen Code</div>
        <div>Name</div>
      </div>
      <ul className="divide-y divide-border/50">
        {matches.length === 0 ? (
          <li className="px-3 py-6 text-center text-muted-foreground text-[13px]">
            No matches for "{query}"
          </li>
        ) : (
          matches.map(({ item }) => (
            <li
              key={item.code}
              className="grid grid-cols-[9rem_1fr] gap-3 px-3 py-2 items-center text-[13px]"
            >
              <span className="font-mono text-[11.5px] text-foreground/80">{highlight(item.code, query)}</span>
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
  return (
    <div className="rounded-md overflow-hidden">
      <div className="grid grid-cols-[9rem_1.5fr_5rem_6rem_4rem] gap-3 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/80 border-b border-border/70">
        <div>Nutrient Code</div>
        <div>Name</div>
        <div>UOM</div>
        <div>Group</div>
        <div className="text-right">Order</div>
      </div>
      <ul className="divide-y divide-border/50">
        {matches.length === 0 ? (
          <li className="px-3 py-6 text-center text-muted-foreground text-[13px]">
            No matches for "{query}"
          </li>
        ) : (
          matches.map(({ item }) => (
            <li
              key={item.code}
              className="grid grid-cols-[9rem_1.5fr_5rem_6rem_4rem] gap-3 px-3 py-2 items-center text-[13px]"
            >
              <span className="font-mono text-[11.5px] text-foreground/80">{highlight(item.code, query)}</span>
              <span className="text-foreground">{highlight(item.name, query)}</span>
              <span className="text-muted-foreground text-[12px]">{item.uom}</span>
              <span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-border text-foreground/70">
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
