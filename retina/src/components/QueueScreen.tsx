import { useSearchParams } from 'react-router-dom';
import { useReviewStore } from '../stores/useReviewStore';
import { useQueueFilter } from '../hooks/useQueueFilter';
import { QueueHeader } from './QueueHeader';
import { ProductDetail } from './ProductDetail';
import { ProductList } from './ProductList';
import { Resizer, usePersistedWidth } from './Resizer';

const MIN_LIST_WIDTH = 220;
const MAX_LIST_WIDTH = 700;

export function QueueScreen({ variant = 'inbox' }: { variant?: 'inbox' | 'submitted' } = {}) {
  const { articles, getArticleById } = useReviewStore();
  const { filteredArticles, queueTab } = useQueueFilter(
    articles,
    variant === 'submitted' ? 'submitted' : undefined,
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProductId = searchParams.get('article');

  // Default: 25% APL list, detail fills the rest
  const viewportWidth = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const defaultListWidth = Math.max(MIN_LIST_WIDTH, Math.min(MAX_LIST_WIDTH, Math.round(viewportWidth * 0.25)));

  const [listWidth, setListWidth, persistListWidth] = usePersistedWidth('list-v4', defaultListWidth);

  const onSelectProduct = (productId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('article', productId);
    setSearchParams(next, { replace: true });
  };

  const selectedVisibleArticleId =
    filteredArticles.find((item) => item.id === selectedProductId)?.id ??
    filteredArticles[0]?.id ??
    null;
  const activeArticle = getArticleById(selectedVisibleArticleId) ?? articles[0] ?? null;

  const onListResize = (delta: number) => {
    setListWidth((prev) => Math.min(MAX_LIST_WIDTH, Math.max(MIN_LIST_WIDTH, prev + delta)));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      <QueueHeader variant={variant} />
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        <ProductList
          selectedProductId={selectedVisibleArticleId}
          onSelectProduct={onSelectProduct}
          visibleArticleIds={filteredArticles.map((item) => item.id)}
          width={listWidth}
          readOnly={variant === 'submitted'}
        />
        <Resizer
          onResize={onListResize}
          onResizeEnd={() => persistListWidth(listWidth)}
          ariaLabel="Resize article list"
        />
        {activeArticle ? (
          <ProductDetail
            key={`detail-${activeArticle.id}`}
            selectedArticleId={selectedVisibleArticleId}
            queueTab={queueTab}
            visibleArticleIds={filteredArticles.map((item) => item.id)}
            onSelectArticle={onSelectProduct}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            No articles match this filter
          </div>
        )}
      </div>
    </div>
  );
}
