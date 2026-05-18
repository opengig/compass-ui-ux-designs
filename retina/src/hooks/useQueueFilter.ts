import { useMemo, useState } from 'react';
import type { ArticleData } from '../data/mockData';

export type QueueTab = 'all' | 'high' | 'amber' | 'low' | 'sme';

export type QueueFilterTab = {
  label: string;
  count: number;
  tab: QueueTab;
  color?: string;
};

export function useQueueFilter(articles: ArticleData[]) {
  const [queueTab, setQueueTab] = useState<QueueTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const tabMatch =
        queueTab === 'all' ||
        (queueTab === 'high' && article.confidence >= 90) ||
        (queueTab === 'amber' && article.status !== 'approved') ||
        (queueTab === 'low' && article.confidence < 80) ||
        (queueTab === 'sme' && (article.status === 'needs_changes' || article.status === 'in_review'));

      const searchMatch =
        searchQuery.length === 0 ||
        [article.name, article.aplCode, article.site].join(' ').toLowerCase().includes(searchQuery.toLowerCase());

      return tabMatch && searchMatch;
    });
  }, [articles, queueTab, searchQuery]);

  const filterTabs = useMemo<QueueFilterTab[]>(
    () => [
      { label: 'All', count: articles.length, tab: 'all' },
      { label: 'Matches', count: articles.filter((item) => item.confidence >= 90).length, tab: 'high', color: '#22c55e' },
      { label: 'Review', count: articles.filter((item) => item.status !== 'approved').length, tab: 'amber', color: '#f59e0b' },
      { label: 'No Matches', count: articles.filter((item) => item.confidence < 80).length, tab: 'low', color: '#ef4444' },
      {
        label: 'From SME',
        count: articles.filter((item) => item.status === 'needs_changes' || item.status === 'in_review').length,
        tab: 'sme',
      },
    ],
    [articles],
  );

  return {
    queueTab,
    setQueueTab,
    searchQuery,
    setSearchQuery,
    filteredArticles,
    filterTabs,
  };
}
