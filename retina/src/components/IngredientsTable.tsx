import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
'./Table';
import { Pencil, Trash2 } from 'lucide-react';
import type { Ingredient } from '../data/mockData';
import { useReviewStore } from '../stores/useReviewStore';

type IngredientsTableProps = {
  articleId: string;
  ingredients: Ingredient[];
};

type IngredientDraft = {
  extractedText: string;
  mappedIngredient: string;
  allergen: 'Yes' | 'No';
  allergenType: string;
  source: string;
};

export function IngredientsTable({ articleId, ingredients }: IngredientsTableProps) {
  const { editIngredientField, addIngredient, removeIngredient, state } = useReviewStore();
  const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<IngredientDraft | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);

  const latestPendingByField = React.useMemo(() => {
    const map = new Map<string, string>();
    state.editLog.forEach((entry) => {
      if (entry.articleId === articleId && entry.section === 'ingredients' && entry.status === 'pending') {
        map.set(entry.field, entry.oldValue);
      }
    });
    return map;
  }, [articleId, state.editLog]);

  const startEditing = (row: Ingredient) => {
    setEditingRowId(row.id);
    setIsAdding(false);
    setDraft({
      extractedText: row.extractedText,
      mappedIngredient: row.mappedIngredient,
      allergen: row.allergen,
      allergenType: row.allergenType,
      source: row.source,
    });
  };

  const startAdding = () => {
    setEditingRowId('new');
    setIsAdding(true);
    setDraft({
      extractedText: '',
      mappedIngredient: '',
      allergen: 'No',
      allergenType: '-',
      source: 'SME update',
    });
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
        mappedIngredient: draft.mappedIngredient || 'Unmapped',
        allergen: draft.allergen,
        allergenType: draft.allergenType || '-',
        confidence: 'Medium',
        source: draft.source,
      };
      addIngredient(articleId, newIngredient);
      cancelEditing();
      return;
    }

    (Object.keys(draft) as Array<keyof IngredientDraft>).forEach((field) => {
      const previous = row[field];
      const nextValue = draft[field];
      if (String(previous) !== String(nextValue)) {
        editIngredientField(articleId, row.id, field as keyof Ingredient, nextValue);
      }
    });
    cancelEditing();
  };

  return (
    <div>
      <div className="border border-border rounded-lg overflow-hidden shadow-soft bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={5} className="py-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs px-2.5 h-7 inline-flex items-center rounded-md border border-border hover:bg-muted/40 transition-colors"
                    onClick={startAdding}
                  >
                    Add ingredient
                  </button>
                </div>
              </TableHead>
            </TableRow>
            <TableRow className="bg-muted/40">
              <TableHead className="w-10 text-xs font-medium text-muted-foreground">
                #
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Extracted text
              </TableHead>

              <TableHead className="text-xs font-medium text-muted-foreground">
                Allergen type
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Source
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.map((row, index) => {
              const isEditing = editingRowId === row.id;
              const textFieldKey = `${row.mappedIngredient}.extractedText`;
              const allergenFieldKey = `${row.mappedIngredient}.allergenType`;
              return (
                <TableRow key={row.id} className={`hover:bg-muted/30 ${isEditing ? 'bg-muted/20' : ''}`}>
                <TableCell className="text-xs text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="text-sm text-foreground">
                  {isEditing && draft ? (
                    <input
                      className="w-full rounded border border-border px-2 py-1 text-sm bg-background"
                      value={draft.extractedText}
                      onChange={(event) => setDraft({ ...draft, extractedText: event.target.value })}
                    />
                  ) : (
                    <>
                      {row.extractedText}
                      {latestPendingByField.get(textFieldKey) ? (
                        <p className="text-[10px] text-muted-foreground">was: {latestPendingByField.get(textFieldKey)}</p>
                      ) : null}
                    </>
                  )}
                </TableCell>

                <TableCell className="text-sm text-foreground/90">
                  {isEditing && draft ? (
                    <input
                      className="w-full rounded border border-border px-2 py-1 text-sm bg-background"
                      value={draft.allergenType}
                      onChange={(event) => setDraft({ ...draft, allergenType: event.target.value })}
                    />
                  ) : (
                    <>
                      {row.allergenType}
                      {latestPendingByField.get(allergenFieldKey) ? (
                        <p className="text-[10px] text-muted-foreground">was: {latestPendingByField.get(allergenFieldKey)}</p>
                      ) : null}
                    </>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {isEditing && draft ? (
                    <div className="flex gap-1">
                      <select
                        className="rounded border border-border px-2 py-1 text-xs bg-background"
                        value={draft.allergen}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            allergen: event.target.value as IngredientDraft['allergen'],
                          })
                        }
                      >
                        <option value="Yes">Allergen: Yes</option>
                        <option value="No">Allergen: No</option>
                      </select>
                      <input
                        className="w-24 rounded border border-border px-2 py-1 text-xs bg-background"
                        value={draft.source}
                        onChange={(event) => setDraft({ ...draft, source: event.target.value })}
                      />
                    </div>
                  ) : (
                    row.source
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          className="px-2 py-1 text-xs rounded-md bg-primary text-primary-foreground"
                          onClick={() => saveRow(row)}
                        >
                          Save
                        </button>
                        <button
                          className="px-2 py-1 text-xs rounded-md border border-border"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="p-1 hover:bg-muted rounded-md transition-colors" onClick={() => startEditing(row)}>
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="p-1 hover:bg-muted rounded-md transition-colors"
                          onClick={() => removeIngredient(articleId, row.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
            {isAdding && draft ? (
              <TableRow className="bg-muted/20">
                <TableCell className="text-xs text-muted-foreground">{ingredients.length + 1}</TableCell>
                <TableCell>
                  <input
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background"
                    value={draft.extractedText}
                    onChange={(event) => setDraft({ ...draft, extractedText: event.target.value })}
                    placeholder="Extracted text"
                  />
                </TableCell>
                <TableCell>
                  <input
                    className="w-full rounded border border-border px-2 py-1 text-sm bg-background"
                    value={draft.allergenType}
                    onChange={(event) => setDraft({ ...draft, allergenType: event.target.value })}
                    placeholder="Allergen type"
                  />
                </TableCell>
                <TableCell>
                  <input
                    className="w-full rounded border border-border px-2 py-1 text-xs bg-background"
                    value={draft.source}
                    onChange={(event) => setDraft({ ...draft, source: event.target.value })}
                    placeholder="Source"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button className="px-2 py-1 text-xs rounded-md bg-primary text-primary-foreground" onClick={() => saveRow(null)}>
                      Save
                    </button>
                    <button className="px-2 py-1 text-xs rounded-md border border-border" onClick={cancelEditing}>
                      Cancel
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );

}