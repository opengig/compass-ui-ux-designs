import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReviewStore } from '../stores/useReviewStore';
import { useQueueFilter } from '../hooks/useQueueFilter';
import { QueueHeader } from './QueueHeader';
import { ProductDetail } from './ProductDetail';
import { ProductImagePanel } from './ProductImagePanel';
import { ProductList } from './ProductList';
import { Resizer, usePersistedWidth } from './Resizer';

const MIN_LIST_WIDTH = 220;
const MAX_LIST_WIDTH = 700;
const MIN_IMAGE_WIDTH = 280;
const MAX_IMAGE_WIDTH = 1100;

export function QueueScreen() {
  const { articles, getArticleById } = useReviewStore();
  const { filteredArticles, queueTab } = useQueueFilter(articles);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProductId = searchParams.get('article');

  // Defaults: 25% APL list, 30% image, ~45% detail
  const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const defaultListWidth = Math.max(MIN_LIST_WIDTH, Math.min(MAX_LIST_WIDTH, Math.round(viewportWidth * 0.25)));
  const defaultImageWidth = Math.max(MIN_IMAGE_WIDTH, Math.min(MAX_IMAGE_WIDTH, Math.round(viewportWidth * 0.30)));

  const [listWidth, setListWidth, persistListWidth] = usePersistedWidth('list-v4', defaultListWidth);
  const [imageWidth, setImageWidth, persistImageWidth] = usePersistedWidth('image-v4', defaultImageWidth);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [imageExpanded, setImageExpanded] = React.useState(false);

  // Drop selection when filter changes
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [queueTab]);

  // ESC collapses the expanded image viewer
  React.useEffect(() => {
    if (!imageExpanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setImageExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imageExpanded]);

  const onSelectProduct = (productId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('article', productId);
    setSearchParams(next, { replace: true });
  };

  const toggleSelected = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === filteredArticles.length ? new Set() : new Set(filteredArticles.map((article) => article.id)),
    );
  };

  const selectedVisibleArticleId =
    filteredArticles.find((item) => item.id === selectedProductId)?.id ??
    filteredArticles[0]?.id ??
    null;
  const activeArticle = getArticleById(selectedVisibleArticleId) ?? articles[0] ?? null;

  const onListResize = (delta: number) => {
    setListWidth((prev) => Math.min(MAX_LIST_WIDTH, Math.max(MIN_LIST_WIDTH, prev + delta)));
  };

  const onImageResize = (delta: number) => {
    setImageWidth((prev) => Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, prev + delta)));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      <QueueHeader />
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {!imageExpanded ? (
          <>
            <ProductList
              selectedProductId={selectedVisibleArticleId}
              onSelectProduct={onSelectProduct}
              visibleArticleIds={filteredArticles.map((item) => item.id)}
              width={listWidth}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelected}
              onToggleSelectAll={toggleSelectAll}
              onClearSelection={() => setSelectedIds(new Set())}
            />
            <Resizer
              onResize={onListResize}
              onResizeEnd={() => persistListWidth(listWidth)}
              ariaLabel="Resize article list"
            />
          </>
        ) : null}
        {activeArticle ? (
          <>
            <ProductImagePanel
              key={`image-${activeArticle.id}`}
              article={activeArticle}
              width={imageExpanded ? listWidth + 4 + imageWidth : imageWidth}
              expanded={imageExpanded}
              onToggleExpand={() => setImageExpanded((prev) => !prev)}
            />
            <Resizer
              onResize={onImageResize}
              onResizeEnd={() => persistImageWidth(imageWidth)}
              ariaLabel="Resize image panel"
            />
            <ProductDetail
              key={`detail-${activeArticle.id}`}
              selectedArticleId={selectedVisibleArticleId}
              queueTab={queueTab}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            No articles match this filter
          </div>
        )}
      </div>
    </div>
  );
}
