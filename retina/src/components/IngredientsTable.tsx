import React from 'react';
import { Pencil, Plus, Trash2, X, Check } from 'lucide-react';
import type { Ingredient } from '../data/mockData';
import { useReviewStore } from '../stores/useReviewStore';

type IngredientsTableProps = {
  articleId: string;
  ingredients: Ingredient[];
};

type IngredientDraft = {
  extractedText: string;
  allergenType: string;
};

const COLS = 'grid-cols-[2rem_1.7fr_1fr_4.5rem]';

function AllergenChip({ allergen }: { allergen: string }) {
  if (!allergen || allergen === '-') {
    return <span className="text-[11px] text-muted-foreground/40">—</span>;
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border border-rose-300 text-rose-700">
      {allergen}
    </span>
  );
}

export function IngredientsTable({ articleId, ingredients }: IngredientsTableProps) {
  const { editIngredientField, addIngredient, removeIngredient } = useReviewStore();
  const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<IngredientDraft | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);

  const startEditing = (row: Ingredient) => {
    setEditingRowId(row.id);
    setIsAdding(false);
    setDraft({ extractedText: row.extractedText, allergenType: row.allergenType });
  };

  const startAdding = () => {
    setEditingRowId('new');
    setIsAdding(true);
    setDraft({ extractedText: '', allergenType: '-' });
  };

  const cancelEditing = () => {
    setEditingRowId(null);
    setDraft(null);
    setIsAdding(false);
  };

  const saveRow = (row: Ingredient | null) => {
    if (!draft) {
      return;
    }
    if (isAdding || !row) {
      const newIngredient: Ingredient = {
        id: `new-ing-${Date.now()}`,
        extractedText: draft.extractedText || 'New ingredient',
        mappedIngredient: draft.extractedText || 'Unmapped',
        allergen: draft.allergenType && draft.allergenType !== '-' ? 'Yes' : 'No',
        allergenType: draft.allergenType || '-',
        confidence: 'Medium',
        source: 'SME update',
      };
      addIngredient(articleId, newIngredient);
      cancelEditing();
      return;
    }
    if (row.extractedText !== draft.extractedText) {
      editIngredientField(articleId, row.id, 'extractedText', draft.extractedText);
    }
    cancelEditing();
  };

  return (
    <div>
      <div className="rounded-md overflow-hidden">
        <div
          className={`grid ${COLS} gap-3 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/80 border-b border-border/70`}
        >
          <div>#</div>
          <div>Ingredient</div>
          <div>Allergen</div>
          <div className="text-right">Actions</div>
        </div>
        <ul className="divide-y divide-border/50">
          {ingredients.map((row, index) => {
            const isEditing = editingRowId === row.id;
            return (
              <li
                key={row.id}
                className={`grid ${COLS} gap-3 px-3 py-2 items-center transition-colors ${
                  isEditing ? 'bg-muted/30' : ''
                }`}
              >
                <span className="text-[12px] text-muted-foreground tabular-nums">{index + 1}</span>
                {isEditing && draft ? (
                  <input
                    autoFocus
                    className="rounded bg-card border border-border px-2 py-1 text-[13px] outline-none focus:ring-2 focus:ring-primary/25"
                    value={draft.extractedText}
                    onChange={(event) => setDraft({ ...draft, extractedText: event.target.value })}
                  />
                ) : (
                  <span className="text-[13px] text-foreground leading-tight">{row.extractedText}</span>
                )}
                <AllergenChip allergen={row.allergenType} />
                <div className="flex items-center justify-end gap-0.5">
                  {isEditing ? (
                    <>
                      <button
                        title="Save"
                        className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground hover:bg-primary-hover"
                        onClick={() => saveRow(row)}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        title="Cancel"
                        className="inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        onClick={cancelEditing}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        title="Edit"
                        className="inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        onClick={() => startEditing(row)}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        title="Remove"
                        className="inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => removeIngredient(articleId, row.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
          {isAdding && draft ? (
            <li className={`grid ${COLS} gap-3 px-3 py-2 items-center bg-muted/30`}>
              <span className="text-[12px] text-muted-foreground tabular-nums">{ingredients.length + 1}</span>
              <input
                autoFocus
                placeholder="Ingredient name"
                className="rounded bg-card border border-border px-2 py-1 text-[13px] outline-none focus:ring-2 focus:ring-primary/25"
                value={draft.extractedText}
                onChange={(event) => setDraft({ ...draft, extractedText: event.target.value })}
              />
              <span className="text-[11px] text-muted-foreground italic">auto-derived</span>
              <div className="flex items-center justify-end gap-0.5">
                <button
                  title="Add"
                  className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground hover:bg-primary-hover"
                  onClick={() => saveRow(null)}
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  title="Cancel"
                  className="inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  onClick={cancelEditing}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </li>
          ) : null}
        </ul>
      </div>

      {!isAdding ? (
        <button
          type="button"
          onClick={startAdding}
          className="mt-2 inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[12px] text-foreground/85 border border-border hover:border-foreground/30 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add ingredient
        </button>
      ) : null}
    </div>
  );
}
