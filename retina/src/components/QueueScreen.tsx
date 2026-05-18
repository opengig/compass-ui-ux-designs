import { Camera } from 'lucide-react';
import type { ArticleData } from '../data/mockData';
import type { QueueTab } from '../hooks/useQueueFilter';
import { LabelPanel } from './LabelPanel';
import { ProductDetail } from './ProductDetail';
import { ProductList } from './ProductList';
import { queueTheme } from '../styles/queueTheme';

type QueueScreenProps = {
  selectedProductId: string | null;
  onSelectProduct: (productId: string) => void;
  filteredArticles: ArticleData[];
  isLabelPanelVisible: boolean;
  setIsLabelPanelVisible: (visible: boolean) => void;
  queueTab: QueueTab;
};

export function QueueScreen({
  selectedProductId,
  onSelectProduct,
  filteredArticles,
  isLabelPanelVisible,
  setIsLabelPanelVisible,
  queueTab,
}: QueueScreenProps) {
  const selectedVisibleArticleId =
    filteredArticles.find((item) => item.id === selectedProductId)?.id ?? filteredArticles[0]?.id ?? null;

  return (
    <div className={`relative flex flex-1 min-h-0 overflow-hidden ${queueTheme.queueCanvas}`}>
      <ProductList
        selectedProductId={selectedProductId}
        onSelectProduct={onSelectProduct}
        visibleArticleIds={filteredArticles.map((item) => item.id)}
      />
      <ProductDetail selectedArticleId={selectedVisibleArticleId} queueTab={queueTab} />
      {!isLabelPanelVisible ? (
        <button
          type="button"
          onClick={() => setIsLabelPanelVisible(true)}
          className={`absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium tracking-wide shadow-soft transition-colors ${queueTheme.ctaButton}`}
          aria-label="Open photos panel"
        >
          <Camera className="w-3.5 h-3.5 opacity-80" />
          <span>Photos</span>
        </button>
      ) : null}
      {isLabelPanelVisible ? (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20 xl:hidden"
            onClick={() => setIsLabelPanelVisible(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close label panel overlay"
          />
          <div className="fixed right-0 inset-y-0 z-30 xl:static xl:inset-auto xl:z-auto flex-shrink-0">
            <LabelPanel onClose={() => setIsLabelPanelVisible(false)} />
          </div>
        </>
      ) : null}
    </div>
  );
}
