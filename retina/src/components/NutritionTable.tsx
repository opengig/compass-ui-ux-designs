import type { NutrientRow } from '../data/mockData';

type NutritionTableProps = {
  articleId: string;
  nutritionData: NutrientRow[];
};

const COLS = 'grid-cols-[2rem_1.7fr_1fr_0.8fr_0.6fr]';

export function NutritionTable({ nutritionData }: NutritionTableProps) {
  return (
    <div className="rounded-md overflow-hidden">
      <div
        className={`grid ${COLS} gap-3 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/80 border-b border-border/70`}
      >
        <div>#</div>
        <div>Nutrient</div>
        <div>Serving</div>
        <div className="text-right">Value</div>
        <div>Unit</div>
      </div>
      <ul className="divide-y divide-border/50">
        {nutritionData.map((row, index) => (
          <li
            key={row.id}
            className={`grid ${COLS} gap-3 px-3 py-2 items-center text-[13px]`}
          >
            <span className="text-[12px] text-muted-foreground tabular-nums">{index + 1}</span>
            <span className="text-foreground">{row.nutrient}</span>
            <span className="text-muted-foreground font-mono text-[12px]">per_100g</span>
            <span className="text-right tabular-nums font-medium text-foreground">
              {row.extractedValue}
            </span>
            <span className="text-muted-foreground text-[12px]">{row.unit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
