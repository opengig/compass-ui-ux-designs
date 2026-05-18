import React from 'react';
import { IngredientsTable } from './IngredientsTable';
import { NutritionTable } from './NutritionTable';
import { BottomActionBar } from './BottomActionBar';
import { ChevronDown, Pencil } from 'lucide-react';
import { useReviewStore } from '../stores/useReviewStore';
import { AllergenSummary } from './AllergenSummary';
import { AccordionSection } from './AccordionSection';
import type { QueueTab } from '../hooks/useQueueFilter';

type ProductDetailProps = {
  selectedArticleId: string | null;
  queueTab: QueueTab;
};

function getStatusBadgeClass(status: string): string {
  if (status === 'approved') {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (status === 'rejected') {
    return 'bg-rose-100 text-rose-700';
  }
  return 'bg-amber-100 text-amber-700';
}

export function ProductDetail({ selectedArticleId, queueTab }: ProductDetailProps) {
  const { articles, getArticleById } = useReviewStore();
  const article = getArticleById(selectedArticleId) ?? articles[0] ?? null;

  if (!article) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        No article selected
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-[320px] h-full bg-white">
      <div className="flex-1 overflow-auto">
        <div className="px-4 md:px-6 pt-0.5 pb-2 md:pt-3 md:pb-6 space-y-3">
          {/* Product Header */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold text-foreground">
                {article.name}
              </h1>
              <span className="inline-flex bg-emerald-100 text-emerald-700 text-xs font-medium rounded-md px-2 py-0.5">
                {article.confidence}% confidence
              </span>
              <span className={`inline-flex ${getStatusBadgeClass(article.status)} text-xs font-medium capitalize rounded-md px-2 py-0.5`}>
                {article.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>{article.aplCode}</span>
              <span className="text-border">|</span>
              <span>Barcode: {article.barcode}</span>
              <span className="text-border">|</span>
              <span>Extracted on: {article.extractedAt}</span>
              <span className="text-border">|</span>
            </div>
          </div>

          <AccordionSection
            title="1. Ingredients & Allergen Review"
            defaultOpen
            badge={
              <span className="inline-flex bg-emerald-100 text-emerald-700 text-xs font-medium rounded-md px-2 py-0.5">
                {article.ingredients.length} / {article.ingredients.length} mapped
              </span>
            }
          >
            <IngredientsTable articleId={article.id} ingredients={article.ingredients} />
          </AccordionSection>

          <AccordionSection
            title="Allergen Summary"
            badge={<span className="text-xs text-muted-foreground">{article.allergens.length} tags</span>}
          >
            <AllergenSummary articleId={article.id} allergens={article.allergens} />
          </AccordionSection>

          <AccordionSection
            title="2. Nutrition Facts Review"
            badge={
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                Per 100g
                <ChevronDown className="w-3 h-3" />
              </span>
            }
          >
            <NutritionTable articleId={article.id} nutritionData={article.nutrition} />
          </AccordionSection>

          {/* Section 3: Claims & Warnings */}
          {/* <div className="border border-border rounded-lg shadow-soft">
            <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold text-foreground">
                  3. Claims, Warnings & Other Information
                </h2>
                <span className="inline-flex bg-amber-100 text-amber-700 text-xs font-medium rounded-md px-2 py-0.5">
                  2 found
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div> */}

          {/* <EditHistory articleId={article.id} /> */}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <BottomActionBar articleId={article.id} queueTab={queueTab} />
    </div>
  );

}