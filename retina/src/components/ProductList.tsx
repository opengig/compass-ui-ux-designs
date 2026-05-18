import React from 'react';
import { Checkbox } from './Checkbox';
import { ScrollArea } from './ScrollArea';
import {
  ChevronDown,
  ChevronRight,
  ChevronsRight,
  ArrowUpDown } from
'lucide-react';
import { useReviewStore } from '../stores/useReviewStore';
import type { ArticleStatus } from '../data/mockData';
import { queueTheme } from '../styles/queueTheme';

type ProductListProps = {
  selectedProductId: string | null;
  onSelectProduct: (productId: string) => void;
  visibleArticleIds?: string[];
};

function getStatusColor(status: ArticleStatus): string {
  if (status === 'approved') {
    return 'bg-emerald-500';
  }
  if (status === 'rejected') {
    return 'bg-rose-500';
  }
  return 'bg-amber-500';
}

export function ProductList({
  selectedProductId,
  onSelectProduct,
  visibleArticleIds,
}: ProductListProps) {
  const { articles, getUnsavedEditCount } = useReviewStore();
  const visibleArticles = visibleArticleIds?.length
    ? articles.filter((article) => visibleArticleIds.includes(article.id))
    : articles;

  return (
    <aside className="hidden md:flex md:w-[clamp(220px,22vw,280px)] md:min-w-[220px] md:max-w-[280px] flex-col min-h-0 border-r border-border bg-background">
      {/* Select All Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Checkbox />
          <span className="text-sm text-foreground">Select all</span>
        </div>
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <span>Newest first</span>
          <ArrowUpDown className="w-3 h-3" />
        </button>
      </div>

      {/* Product Items */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {visibleArticles.map((product, index) => {
            const isActive = selectedProductId ? selectedProductId === product.id : index === 0;
            const unsavedCount = getUnsavedEditCount(product.id);

            return (
              <div
                key={product.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectProduct(product.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectProduct(product.id);
                  }
                }}
                className={`group flex items-start gap-2 px-4 py-3 border-b border-border cursor-pointer transition-colors ${
                  isActive ? queueTheme.selectedRow : queueTheme.rowHover
                }`}
              >
                <Checkbox className="mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(product.status)}`} />
                    <p className={`text-sm truncate ${isActive ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                      {product.name}
                    </p>
                    {unsavedCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 font-medium">
                        {unsavedCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 pl-[14px]">{product.aplCode}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Pagination */}
      <div className="px-3 py-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>1–{Math.min(25, visibleArticles.length)} of {visibleArticles.length}</span>
          <div className="flex items-center gap-0.5">
            <button className="w-5 h-5 flex items-center justify-center rounded bg-primary text-primary-foreground text-[10px] font-medium">
              1
            </button>
            <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted text-[10px] transition-colors">
              2
            </button>
            <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted text-[10px] transition-colors">
              3
            </button>
            <button className="w-4 h-4 flex items-center justify-center hover:bg-muted rounded transition-colors">
              <ChevronRight className="w-3 h-3" />
            </button>
            <button className="w-4 h-4 flex items-center justify-center hover:bg-muted rounded transition-colors">
              <ChevronsRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <span>25 / pg</span>
            <ChevronDown className="w-3 h-3" />
          </div>
        </div>
      </div>
    </aside>
  );

}