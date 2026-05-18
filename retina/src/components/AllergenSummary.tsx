import React from 'react';
import type { AllergenSummary as AllergenSummaryItem } from '../data/mockData';
import { useReviewStore } from '../stores/useReviewStore';

type AllergenSummaryProps = {
  articleId: string;
  allergens: AllergenSummaryItem[];
};

const COMMON_ALLERGENS = ['Dairy', 'Gluten', 'Nuts', 'Soy', 'Sesame', 'Egg'];

export function AllergenSummary({ articleId, allergens }: AllergenSummaryProps) {
  const { updateAllergens } = useReviewStore();
  const [input, setInput] = React.useState('');

  const removeAllergen = (id: string) => {
    updateAllergens(
      articleId,
      allergens.filter((item) => item.id !== id),
    );
  };

  const addAllergen = (name: string, level: 'contains' | 'may_contain') => {
    if (!name.trim()) {
      return;
    }
    if (allergens.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    updateAllergens(articleId, [
      ...allergens,
      {
        id: `${articleId}-allergen-${Date.now()}`,
        name,
        level,
      },
    ]);
    setInput('');
  };

  const contains = allergens.filter((item) => item.level === 'contains');
  const mayContain = allergens.filter((item) => item.level === 'may_contain');

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Contains</p>
        <div className="flex flex-wrap gap-2">
          {contains.length > 0 ? (
            contains.map((item) => (
              <button
                key={item.id}
                className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-700"
                onClick={() => removeAllergen(item.id)}
                title="Click to remove"
              >
                {item.name}
              </button>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No confirmed allergens</span>
          )}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">May contain</p>
        <div className="flex flex-wrap gap-2">
          {mayContain.length > 0 ? (
            mayContain.map((item) => (
              <button
                key={item.id}
                className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700"
                onClick={() => removeAllergen(item.id)}
                title="Click to remove"
              >
                {item.name}
              </button>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No trace allergens listed</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {COMMON_ALLERGENS.map((item) => (
          <button
            key={item}
            className="px-2 py-1 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground"
            onClick={() => addAllergen(item, 'may_contain')}
          >
            + {item}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Custom allergen"
          className="flex-1 rounded border border-border px-2 py-1.5 text-sm bg-background"
        />
        <button
          className="px-2 py-1.5 rounded-md bg-primary text-primary-foreground text-xs"
          onClick={() => addAllergen(input, 'contains')}
        >
          Add as contains
        </button>
      </div>
    </div>
  );
}
