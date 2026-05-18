import React, { useState } from 'react';
import { IconNavRail } from './components/IconNavRail';
import { Dashboard } from './components/Dashboard';
import { SITES } from './data/mockData';
import { ReviewStoreProvider, useReviewStore } from './stores/useReviewStore';
import { ApprovedList } from './components/ApprovedList';
import { AuditLog } from './components/AuditLog';
import { useQueueFilter, type QueueTab } from './hooks/useQueueFilter';
import { QueueHeader } from './components/QueueHeader';
import { QueueScreen } from './components/QueueScreen';
import type { Screen } from './types';
import { queueTheme } from './styles/queueTheme';

function AppContent() {
  const { articles } = useReviewStore();

  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLabelPanelVisible, setIsLabelPanelVisible] = useState(false);
  const { queueTab, setQueueTab, searchQuery, setSearchQuery, filteredArticles, filterTabs } =
    useQueueFilter(articles);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    setIsLabelPanelVisible(true);
  };

  const goApp = (screen: string) => {
    setActiveScreen(screen as Screen);
  };

  const isQueueScreen = activeScreen === 'queue';

  return (
    <div className="flex w-full h-screen bg-background font-heading text-foreground">
      <IconNavRail activeScreen={activeScreen} onNavigate={setActiveScreen} />

      <div className={`flex-1 flex flex-col min-w-0 h-full ${queueTheme.appShell}`}>

        {/* Header — only visible on queue / task screens */}
        {isQueueScreen ? (
          <QueueHeader
            filterTabs={filterTabs}
            queueTab={queueTab}
            onQueueTabChange={setQueueTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        ) : null}

        {/* Main content */}
        {activeScreen === 'dashboard' ? (
          <Dashboard
            goApp={goApp}
            setQueueTab={(tab) => setQueueTab(tab as QueueTab)}
            selectedSites={SITES}
            setHighlightArtIds={() => {}}
          />
        ) : isQueueScreen ? (
          <QueueScreen
            selectedProductId={selectedProductId}
            onSelectProduct={handleProductSelect}
            filteredArticles={filteredArticles}
            isLabelPanelVisible={isLabelPanelVisible}
            setIsLabelPanelVisible={setIsLabelPanelVisible}
            queueTab={queueTab}
          />
        ) : activeScreen === 'approved' ? (
          <ApprovedList
            onOpenArticle={(articleId) => {
              setSelectedProductId(articleId);
              setActiveScreen('queue');
            }}
          />
        ) : activeScreen === 'audit' ? (
          <AuditLog />
        ) : (
          /* Placeholder for other screens */
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            {activeScreen.charAt(0).toUpperCase() + activeScreen.slice(1)} — coming soon
          </div>
        )}
      </div>
    </div>
  );
}

export function App() {
  return (
    <ReviewStoreProvider>
      <AppContent />
    </ReviewStoreProvider>
  );
}
