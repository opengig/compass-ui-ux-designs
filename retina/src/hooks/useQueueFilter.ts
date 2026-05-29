import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ArticleData } from '../data/mockData';
import { useReviewStore } from '../stores/useReviewStore';

export type QueueTab = 'all' | 'high' | 'amber' | 'low' | 'submitted' | 'approved';

export type QueueSort = 'newest' | 'oldest' | 'name' | 'confLow' | 'confHigh';

const VALID_SORTS: QueueSort[] = ['newest', 'oldest', 'name', 'confLow', 'confHigh'];

export type QueueFilterTab = {
  label: string;
  count: number;
  tab: QueueTab;
  color?: string;
};

const VALID_TABS: QueueTab[] = ['all', 'high', 'amber', 'low', 'submitted', 'approved'];

function parseTab(value: string | null): QueueTab {
  if (value && (VALID_TABS as string[]).includes(value)) {
    return value as QueueTab;
  }
  return 'all';
}

export function useQueueFilter(articles: ArticleData[], forcedTab?: QueueTab) {
  const { isSubmitted } = useReviewStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const queueTab = forcedTab ?? parseTab(searchParams.get('tab'));
  const searchQuery = searchParams.get('q') ?? '';
  const categories = (searchParams.get('cat') ?? '').split(',').filter(Boolean);
  const sortBy: QueueSort = (() => {
    const v = searchParams.get('sort');
    return v && (VALID_SORTS as string[]).includes(v) ? (v as QueueSort) : 'newest';
  })();

  const setCategories = (next: string[]) => {
    const params = new URLSearchParams(searchParams);
    if (next.length === 0) {
      params.delete('cat');
    } else {
      params.set('cat', next.join(','));
    }
    setSearchParams(params, { replace: true });
  };

  const setSortBy = (sort: QueueSort) => {
    const params = new URLSearchParams(searchParams);
    if (sort === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', sort);
    }
    setSearchParams(params, { replace: true });
  };

  const setQueueTab = (tab: QueueTab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'all') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    setSearchParams(next, { replace: true });
  };

  const setSearchQuery = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete('q');
    } else {
      next.set('q', value);
    }
    setSearchParams(next, { replace: true });
  };

  const pendingArticles = useMemo(
    () => articles.filter((article) => !isSubmitted(article.id) && article.status !== 'approved'),
    [articles, isSubmitted],
  );

  const submittedArticles = useMemo(
    () => articles.filter((article) => isSubmitted(article.id)),
    [articles, isSubmitted],
  );

  const approvedArticles = useMemo(
    () => articles.filter((article) => article.status === 'approved'),
    [articles],
  );

  const filteredArticles = useMemo(() => {
    const pool =
      queueTab === 'submitted'
        ? submittedArticles
        : queueTab === 'approved'
          ? approvedArticles
          : pendingArticles;

    const matched = pool.filter((article) => {
      const tabMatch =
        queueTab === 'all' ||
        queueTab === 'submitted' ||
        queueTab === 'approved' ||
        (queueTab === 'high' && article.confidence >= 90) ||
        (queueTab === 'amber' && article.confidence >= 80 && article.confidence < 90) ||
        (queueTab === 'low' && article.confidence < 80);

      const searchMatch =
        searchQuery.length === 0 ||
        [article.name, article.aplCode].join(' ').toLowerCase().includes(searchQuery.toLowerCase());

      const categoryMatch = categories.length === 0 || categories.includes(article.category);

      return tabMatch && searchMatch && categoryMatch;
    });

    const order = matched.map((article, index) => ({ article, index }));
    order.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return b.index - a.index;
        case 'name':
          return a.article.name.localeCompare(b.article.name);
        case 'confLow':
          return a.article.confidence - b.article.confidence;
        case 'confHigh':
          return b.article.confidence - a.article.confidence;
        default:
          return a.index - b.index; // newest first = insertion order
      }
    });
    return order.map((entry) => entry.article);
  }, [pendingArticles, submittedArticles, approvedArticles, queueTab, searchQuery, categories.join(','), sortBy]);

  const filterTabs = useMemo<QueueFilterTab[]>(
    () => [
      { label: 'Inbox', count: pendingArticles.length, tab: 'all' },
      { label: 'High Confidence', count: pendingArticles.filter((item) => item.confidence >= 90).length, tab: 'high', color: '#10b981' },
      { label: 'Medium Confidence', count: pendingArticles.filter((item) => item.confidence >= 80 && item.confidence < 90).length, tab: 'amber', color: '#f59e0b' },
      { label: 'Low Confidence', count: pendingArticles.filter((item) => item.confidence < 80).length, tab: 'low', color: '#f43f5e' },
      { label: 'Submitted', count: submittedArticles.length, tab: 'submitted', color: '#78716c' },
      { label: 'Approved', count: approvedArticles.length, tab: 'approved', color: '#0ea5e9' },
    ],
    [pendingArticles, submittedArticles, approvedArticles],
  );

  return {
    queueTab,
    setQueueTab,
    searchQuery,
    setSearchQuery,
    categories,
    setCategories,
    sortBy,
    setSortBy,
    filteredArticles,
    filterTabs,
  };
}
