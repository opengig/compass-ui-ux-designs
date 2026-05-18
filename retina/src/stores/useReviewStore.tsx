import React, { createContext, useContext, useMemo, useReducer } from 'react';
import {
  ARTICLE_DATA,
  type AllergenSummary,
  type ArticleData,
  type ArticleStatus,
  type EditLogEntry,
  type Ingredient,
  type NutrientRow,
  type ReviewSection,
} from '../data/mockData';

interface ReviewState {
  articles: Record<string, ArticleData>;
  editLog: EditLogEntry[];
  unsavedEdits: Record<string, number>;
}

type ReviewAction =
  | {
      type: 'EDIT_FIELD';
      payload: {
        articleId: string;
        section: ReviewSection;
        field: string;
        oldValue: string;
        newValue: string;
        editedBy?: string;
      };
    }
  | { type: 'UPDATE_ARTICLE'; payload: { article: ArticleData } }
  | { type: 'SAVE_CHANGES'; payload: { articleId: string } }
  | { type: 'APPROVE_ARTICLE'; payload: { articleId: string; comment?: string; editedBy?: string } }
  | { type: 'REJECT_ARTICLE'; payload: { articleId: string; reason: string; editedBy?: string } }
  | { type: 'MOVE_TO_LOW'; payload: { articleId: string; editedBy?: string } }
  | { type: 'MARK_NEEDS_REVIEW'; payload: { articleId: string; editedBy?: string } };

interface ReviewStoreContextValue {
  state: ReviewState;
  articles: ArticleData[];
  editIngredientField: (articleId: string, ingredientId: string, field: keyof Ingredient, value: string) => void;
  editNutritionField: (articleId: string, nutrientId: string, field: keyof NutrientRow, value: string) => void;
  addIngredient: (articleId: string, ingredient: Ingredient) => void;
  removeIngredient: (articleId: string, ingredientId: string) => void;
  updateAllergens: (articleId: string, allergens: AllergenSummary[]) => void;
  updateArticleStatus: (articleId: string, status: ArticleStatus) => void;
  saveChanges: (articleId: string) => void;
  approveArticle: (articleId: string, comment?: string) => void;
  rejectArticle: (articleId: string, reason: string) => void;
  moveToLow: (articleId: string) => void;
  markNeedsReview: (articleId: string) => void;
  getArticleById: (articleId: string | null) => ArticleData | null;
  getUnsavedEditCount: (articleId: string) => number;
}

function buildInitialState(): ReviewState {
  const articles: Record<string, ArticleData> = {};
  ARTICLE_DATA.forEach((article) => {
    articles[article.id] = article;
  });
  return { articles, editLog: [], unsavedEdits: {} };
}

const initialState: ReviewState = buildInitialState();

function makeLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

function nowLabel(): string {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function reviewStoreReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case 'EDIT_FIELD': {
      const { articleId, section, field, oldValue, newValue, editedBy } = action.payload;
      if (oldValue === newValue) {
        return state;
      }

      const logEntry: EditLogEntry = {
        id: makeLogId(),
        articleId,
        section,
        field,
        oldValue,
        newValue,
        editedBy: editedBy ?? 'Priya Sharma',
        editedAt: nowLabel(),
        status: 'pending',
      };

      return {
        ...state,
        editLog: [logEntry, ...state.editLog],
        unsavedEdits: {
          ...state.unsavedEdits,
          [articleId]: (state.unsavedEdits[articleId] ?? 0) + 1,
        },
      };
    }
    case 'UPDATE_ARTICLE': {
      return {
        ...state,
        articles: {
          ...state.articles,
          [action.payload.article.id]: action.payload.article,
        },
      };
    }
    case 'SAVE_CHANGES': {
      const articleId = action.payload.articleId;
      return {
        ...state,
        unsavedEdits: {
          ...state.unsavedEdits,
          [articleId]: 0,
        },
        editLog: state.editLog.map((entry) =>
          entry.articleId === articleId && entry.status === 'pending'
            ? { ...entry, status: 'applied' }
            : entry,
        ),
      };
    }
    case 'APPROVE_ARTICLE': {
      const { articleId, comment, editedBy } = action.payload;
      const article = state.articles[articleId];
      if (!article) {
        return state;
      }

      const updatedArticle: ArticleData = {
        ...article,
        status: 'approved',
        reviewer: editedBy ?? 'Priya Sharma',
        approvedAt: nowLabel(),
      };

      const approvalEntry: EditLogEntry = {
        id: makeLogId(),
        articleId,
        section: 'claims',
        field: 'approval',
        oldValue: article.status,
        newValue: comment ? `approved - ${comment}` : 'approved',
        editedBy: editedBy ?? 'Priya Sharma',
        editedAt: nowLabel(),
        status: 'applied',
      };

      return {
        ...state,
        articles: {
          ...state.articles,
          [articleId]: updatedArticle,
        },
        unsavedEdits: {
          ...state.unsavedEdits,
          [articleId]: 0,
        },
        editLog: [approvalEntry, ...state.editLog],
      };
    }
    case 'REJECT_ARTICLE': {
      const { articleId, reason, editedBy } = action.payload;
      const article = state.articles[articleId];
      if (!article) {
        return state;
      }

      const updatedArticle: ArticleData = {
        ...article,
        status: 'needs_changes',
      };

      const rejectEntry: EditLogEntry = {
        id: makeLogId(),
        articleId,
        section: 'claims',
        field: 'decision',
        oldValue: article.status,
        newValue: `needs_changes - ${reason}`,
        editedBy: editedBy ?? 'Priya Sharma',
        editedAt: nowLabel(),
        status: 'applied',
      };

      return {
        ...state,
        articles: {
          ...state.articles,
          [articleId]: updatedArticle,
        },
        editLog: [rejectEntry, ...state.editLog],
      };
    }
    case 'MOVE_TO_LOW': {
      const { articleId, editedBy } = action.payload;
      const article = state.articles[articleId];
      if (!article) {
        return state;
      }

      const updatedArticle: ArticleData = {
        ...article,
        confidence: 50,
        status: 'rejected',
      };

      const entry: EditLogEntry = {
        id: makeLogId(),
        articleId,
        section: 'claims',
        field: 'decision',
        oldValue: `${article.status} (confidence ${article.confidence}%)`,
        newValue: 'rejected — moved to Low',
        editedBy: editedBy ?? 'Priya Sharma',
        editedAt: nowLabel(),
        status: 'applied',
      };

      return {
        ...state,
        articles: { ...state.articles, [articleId]: updatedArticle },
        unsavedEdits: { ...state.unsavedEdits, [articleId]: 0 },
        editLog: [entry, ...state.editLog],
      };
    }
    case 'MARK_NEEDS_REVIEW': {
      const { articleId, editedBy } = action.payload;
      const article = state.articles[articleId];
      if (!article) {
        return state;
      }

      const updatedArticle: ArticleData = {
        ...article,
        status: 'in_review',
      };

      const entry: EditLogEntry = {
        id: makeLogId(),
        articleId,
        section: 'claims',
        field: 'status',
        oldValue: article.status,
        newValue: 'in_review — flagged for review',
        editedBy: editedBy ?? 'Priya Sharma',
        editedAt: nowLabel(),
        status: 'applied',
      };

      return {
        ...state,
        articles: { ...state.articles, [articleId]: updatedArticle },
        editLog: [entry, ...state.editLog],
      };
    }
    default:
      return state;
  }
}

const ReviewStoreContext = createContext<ReviewStoreContextValue | null>(null);

export function ReviewStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reviewStoreReducer, initialState);

  const value: ReviewStoreContextValue = useMemo(() => {
    const articles = Object.values(state.articles);

    const updateArticle = (article: ArticleData) => {
      dispatch({ type: 'UPDATE_ARTICLE', payload: { article } });
    };

    return {
      state,
      articles,
      editIngredientField: (articleId, ingredientId, field, value) => {
        const article = state.articles[articleId];
        if (!article) {
          return;
        }

        const ingredients = article.ingredients.map((item) => {
          if (item.id !== ingredientId) {
            return item;
          }
          const oldValue = String(item[field] ?? '');
          dispatch({
            type: 'EDIT_FIELD',
            payload: {
              articleId,
              section: 'ingredients',
              field: `${item.mappedIngredient}.${String(field)}`,
              oldValue,
              newValue: value,
            },
          });

          return { ...item, [field]: value };
        });

        updateArticle({ ...article, ingredients });
      },
      editNutritionField: (articleId, nutrientId, field, value) => {
        const article = state.articles[articleId];
        if (!article) {
          return;
        }

        const nutrition = article.nutrition.map((item) => {
          if (item.id !== nutrientId) {
            return item;
          }
          const oldValue = String(item[field] ?? '');
          dispatch({
            type: 'EDIT_FIELD',
            payload: {
              articleId,
              section: 'nutrition',
              field: `${item.nutrient}.${String(field)}`,
              oldValue,
              newValue: value,
            },
          });
          return { ...item, [field]: value };
        });

        updateArticle({ ...article, nutrition });
      },
      addIngredient: (articleId, ingredient) => {
        const article = state.articles[articleId];
        if (!article) {
          return;
        }
        dispatch({
          type: 'EDIT_FIELD',
          payload: {
            articleId,
            section: 'ingredients',
            field: 'ingredient.add',
            oldValue: '-',
            newValue: ingredient.mappedIngredient,
          },
        });
        updateArticle({ ...article, ingredients: [...article.ingredients, ingredient] });
      },
      removeIngredient: (articleId, ingredientId) => {
        const article = state.articles[articleId];
        if (!article) {
          return;
        }
        const ingredient = article.ingredients.find((item) => item.id === ingredientId);
        if (!ingredient) {
          return;
        }
        dispatch({
          type: 'EDIT_FIELD',
          payload: {
            articleId,
            section: 'ingredients',
            field: 'ingredient.delete',
            oldValue: ingredient.mappedIngredient,
            newValue: 'Removed',
          },
        });
        updateArticle({
          ...article,
          ingredients: article.ingredients.filter((item) => item.id !== ingredientId),
        });
      },
      updateAllergens: (articleId, allergens) => {
        const article = state.articles[articleId];
        if (!article) {
          return;
        }
        dispatch({
          type: 'EDIT_FIELD',
          payload: {
            articleId,
            section: 'allergens',
            field: 'allergen.summary',
            oldValue: article.allergens.map((item) => item.name).join(', ') || '-',
            newValue: allergens.map((item) => item.name).join(', ') || '-',
          },
        });
        updateArticle({ ...article, allergens });
      },
      updateArticleStatus: (articleId, status) => {
        const article = state.articles[articleId];
        if (!article) {
          return;
        }
        dispatch({
          type: 'EDIT_FIELD',
          payload: {
            articleId,
            section: 'claims',
            field: 'status',
            oldValue: article.status,
            newValue: status,
          },
        });
        updateArticle({ ...article, status });
      },
      saveChanges: (articleId) => dispatch({ type: 'SAVE_CHANGES', payload: { articleId } }),
      approveArticle: (articleId, comment) =>
        dispatch({ type: 'APPROVE_ARTICLE', payload: { articleId, comment } }),
      rejectArticle: (articleId, reason) =>
        dispatch({ type: 'REJECT_ARTICLE', payload: { articleId, reason } }),
      moveToLow: (articleId) =>
        dispatch({ type: 'MOVE_TO_LOW', payload: { articleId } }),
      markNeedsReview: (articleId) =>
        dispatch({ type: 'MARK_NEEDS_REVIEW', payload: { articleId } }),
      getArticleById: (articleId) => (articleId ? state.articles[articleId] ?? null : null),
      getUnsavedEditCount: (articleId) => state.unsavedEdits[articleId] ?? 0,
    };
  }, [state]);

  return <ReviewStoreContext.Provider value={value}>{children}</ReviewStoreContext.Provider>;
}

export function useReviewStore() {
  const context = useContext(ReviewStoreContext);
  if (!context) {
    throw new Error('useReviewStore must be used inside ReviewStoreProvider');
  }
  return context;
}
