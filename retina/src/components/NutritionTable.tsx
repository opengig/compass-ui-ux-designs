import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
'./Table';
import { Pencil } from 'lucide-react';
import type { NutrientRow } from '../data/mockData';
import { useReviewStore } from '../stores/useReviewStore';

type NutritionTableProps = {
  articleId: string;
  nutritionData: NutrientRow[];
};

type NutritionDraft = {
  extractedValue: string;
  unit: string;
  rdaPercent: string;
  status: 'OK' | 'Review';
};

export function NutritionTable({ articleId, nutritionData }: NutritionTableProps) {
  const { editNutritionField, state } = useReviewStore();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<NutritionDraft | null>(null);

  const latestPendingByField = React.useMemo(() => {
    const map = new Map<string, string>();
    state.editLog.forEach((entry) => {
      if (entry.articleId === articleId && entry.section === 'nutrition' && entry.status === 'pending') {
        map.set(entry.field, entry.oldValue);
      }
    });
    return map;
  }, [articleId, state.editLog]);

  const onEdit = (row: NutrientRow) => {
    setEditingId(row.id);
    setDraft({
      extractedValue: row.extractedValue,
      unit: row.unit,
      rdaPercent: row.rdaPercent,
      status: row.status,
    });
  };

  const onSave = (row: NutrientRow) => {
    if (!draft) {
      return;
    }
    if (row.extractedValue !== draft.extractedValue) {
      editNutritionField(articleId, row.id, 'extractedValue', draft.extractedValue);
    }
    if (row.unit !== draft.unit) {
      editNutritionField(articleId, row.id, 'unit', draft.unit);
    }
    if (row.rdaPercent !== draft.rdaPercent) {
      editNutritionField(articleId, row.id, 'rdaPercent', draft.rdaPercent);
    }
    if (row.status !== draft.status) {
      editNutritionField(articleId, row.id, 'status', draft.status);
    }
    setEditingId(null);
    setDraft(null);
  };

  return (
    <div>
      <div className="border border-border rounded-lg overflow-hidden shadow-soft bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs font-medium text-muted-foreground">
                Nutrient
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Extracted value
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Unit
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                %RDA / 100g
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Status
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
            {nutritionData.map((row) => {
              const isEditing = editingId === row.id;
              const valueField = `${row.nutrient}.extractedValue`;
              return (
                <TableRow key={row.id} className={`hover:bg-muted/30 ${isEditing ? 'bg-muted/20' : ''}`}>
                <TableCell className="text-sm text-foreground font-medium">
                  {row.nutrient}
                </TableCell>
                <TableCell className="text-sm text-foreground/90">
                  {isEditing && draft ? (
                    <input
                      className="w-20 rounded border border-border px-2 py-1 text-sm bg-background"
                      value={draft.extractedValue}
                      onChange={(event) => setDraft({ ...draft, extractedValue: event.target.value })}
                    />
                  ) : (
                    <>
                      {row.extractedValue}
                      {latestPendingByField.get(valueField) ? (
                        <p className="text-[10px] text-muted-foreground">was: {latestPendingByField.get(valueField)}</p>
                      ) : null}
                    </>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {isEditing && draft ? (
                    <input
                      className="w-14 rounded border border-border px-2 py-1 text-sm bg-background"
                      value={draft.unit}
                      onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
                    />
                  ) : (
                    row.unit
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {isEditing && draft ? (
                    <input
                      className="w-16 rounded border border-border px-2 py-1 text-sm bg-background"
                      value={draft.rdaPercent}
                      onChange={(event) => setDraft({ ...draft, rdaPercent: event.target.value })}
                    />
                  ) : (
                    row.rdaPercent
                  )}
                </TableCell>
                <TableCell>
                  {isEditing && draft ? (
                    <select
                      className="rounded border border-border px-2 py-1 text-xs bg-background"
                      value={draft.status}
                      onChange={(event) =>
                        setDraft({ ...draft, status: event.target.value as NutritionDraft['status'] })
                      }
                    >
                      <option value="OK">OK</option>
                      <option value="Review">Review</option>
                    </select>
                  ) : row.status === 'OK' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                      OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
                      Review
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.source}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <button className="px-2 py-1 text-xs rounded-md bg-primary text-primary-foreground" onClick={() => onSave(row)}>
                        Save
                      </button>
                      <button className="px-2 py-1 text-xs rounded-md border border-border" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className="p-1 hover:bg-muted rounded-md transition-colors" onClick={() => onEdit(row)}>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );

}