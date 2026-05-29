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

interface SubmissionRecord {
  comment: string;
  submittedAt: string;
  submittedBy: string;
}

interface ReviewState {
  articles: Record<string, ArticleData>;
  editLog: EditLogEntry[];
  undoStacks: Record<string, ArticleData[]>;
  redoStacks: Record<string, ArticleData[]>;
  submissions: Record<string, SubmissionRecord>;
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
  | { type: 'UPDATE_ARTICLE'; payload: { article: ArticleData; recordSnapshot?: boolean } }
  | { type: 'SAVE_CHANGES'; payload: { articleId: string } }
  | { type: 'UNDO'; payload: { articleId: string } }
  | { type: 'REDO'; payload: { articleId: string } }
  | { type: 'SUBMIT_ARTICLE'; payload: { articleId: string; comment: string; submittedBy?: string } }
  | { type: 'MOVE_TO_LOW'; payload: { articleId: string; editedBy?: string } }
  | { type: 'MOVE_TO_BUCKET'; payload: { articleId: string; bucket: 'high' | 'amber' | 'low'; editedBy?: string } }
  | { type: 'MARK_NEEDS_REVIEW'; payload: { articleId: string; editedBy?: string } }
  | { type: 'BULK_SET_CONFIDENCE'; payload: { articleIds: string[]; confidence: number; editedBy?: string } };

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
  submitArticle: (articleId: string, comment: string) => void;
  undo: (articleId: string) => void;
  redo: (articleId: string) => void;
  moveToLow: (articleId: string) => void;
  moveToBucket: (articleId: string, bucket: 'high' | 'amber' | 'low') => void;
  markNeedsReview: (articleId: string) => void;
  bulkSetConfidence: (articleIds: string[], confidence: number) => void;
  getArticleById: (articleId: string | null) => ArticleData | null;
  getUnsavedEditCount: (articleId: string) => number;
  getCanUndo: (articleId: string) => boolean;
  getCanRedo: (articleId: string) => boolean;
  getSubmission: (articleId: string) => SubmissionRecord | null;
  isSubmitted: (articleId: string) => boolean;
  getArticleEditLog: (articleId: string) => EditLogEntry[];
}

// A few articles start out already submitted to the nutritionist so the
// "Submitted" page shows a populated list by default (instead of being empty).
const SEED_SUBMISSIONS: Record<string, SubmissionRecord> = {
  'APL-00100': {
    comment: 'Allergen mapping verified against back label.',
    submittedAt: '16 May 2025, 10:24 AM',
    submittedBy: 'Priya Sharma',
  },
  'APL-00101': {
    comment: 'Nutrition values rechecked — submitting for approval.',
    submittedAt: '16 May 2025, 11:05 AM',
    submittedBy: 'Priya Sharma',
  },
  'APL-00102': {
    comment: 'Ingredient list confirmed.',
    submittedAt: '16 May 2025, 02:18 PM',
    submittedBy: 'Rahul Verma',
  },
  'APL-00103': {
    comment: '',
    submittedAt: '16 May 2025, 03:47 PM',
    submittedBy: 'Priya Sharma',
  },
};

function buildInitialState(): ReviewState {
  const articles: Record<string, ArticleData> = {};
  ARTICLE_DATA.forEach((article) => {
    articles[article.id] = article;
  });
  // Reflect the seeded submissions on the article records too, so reviewer /
  // submitted-at metadata is consistent with the submission entries above.
  Object.entries(SEED_SUBMISSIONS).forEach(([articleId, submission]) => {
    const article = articles[articleId];
    if (article) {
      articles[articleId] = {
        ...article,
        reviewer: submission.submittedBy,
        approvedAt: submission.submittedAt,
      };
    }
  });
  return {
    articles,
    editLog: [],
    undoStacks: {},
    redoStacks: {},
    submissions: { ...SEED_SUBMISSIONS },
  };
}

const initialState: ReviewState = buildInitialState();
const MAX_UNDO = 50;
const DEFAULT_USER = 'Priya Sharma';

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
        editedBy: editedBy ?? DEFAULT_USER,
        editedAt: nowLabel(),
        status: 'pending',
      };
      return {
        ...state,
        editLog: [logEntry, ...state.editLog],
      };
    }
    case 'UPDATE_ARTICLE': {
      const { article, recordSnapshot } = action.payload;
      const previous = state.articles[article.id];
      let undoStacks = state.undoStacks;
      let redoStacks = state.redoStacks;
      if (recordSnapshot && previous) {
        const prevStack = state.undoStacks[article.id] ?? [];
        undoStacks = {
          ...state.undoStacks,
          [article.id]: [...prevStack, previous].slice(-MAX_UNDO),
        };
        redoStacks = { ...state.redoStacks, [article.id]: [] };
      }
      return {
        ...state,
        articles: { ...state.articles, [article.id]: article },
        undoStacks,
        redoStacks,
      };
    }
    case 'SAVE_CHANGES': {
      const articleId = action.payload.articleId;
      return {
        ...state,
        undoStacks: { ...state.undoStacks, [articleId]: [] },
        redoStacks: { ...state.redoStacks, [articleId]: [] },
        editLog: state.editLog.map((entry) =>
          entry.articleId === articleId && entry.status === 'pending'
            ? { ...entry, status: 'applied' }
            : entry,
        ),
      };
    }
    case 'UNDO': {
      const { articleId } = action.payload;
      const undoStack = state.undoStacks[articleId] ?? [];
      const current = state.articles[articleId];
      if (undoStack.length === 0 || !current) {
        return state;
      }
      const previous = undoStack[undoStack.length - 1];
      const newUndo = undoStack.slice(0, -1);
      const redoStack = state.redoStacks[articleId] ?? [];
      return {
        ...state,
        articles: { ...state.articles, [articleId]: previous },
        undoStacks: { ...state.undoStacks, [articleId]: newUndo },
        redoStacks: { ...state.redoStacks, [articleId]: [...redoStack, current] },
      };
    }
    case 'REDO': {
      const { articleId } = action.payload;
      const redoStack = state.redoStacks[articleId] ?? [];
      const current = state.articles[articleId];
      if (redoStack.length === 0 || !current) {
        return state;
      }
      const next = redoStack[redoStack.length - 1];
      const newRedo = redoStack.slice(0, -1);
      const undoStack = state.undoStacks[articleId] ?? [];
      return {
        ...state,
        articles: { ...state.articles, [articleId]: next },
        redoStacks: { ...state.redoStacks, [articleId]: newRedo },
        undoStacks: { ...state.undoStacks, [articleId]: [...undoStack, current] },
      };
    }
    case 'SUBMIT_ARTICLE': {
      const { articleId, comment, submittedBy } = action.payload;
      const article = state.articles[articleId];
      if (!article) {
        return state;
      }
      const submission: SubmissionRecord = {
        comment,
        submittedAt: nowLabel(),
        submittedBy: submittedBy ?? DEFAULT_USER,
      };
      const entry: EditLogEntry = {
        id: makeLogId(),
        articleId,
        section: 'claims',
        field: 'submission',
        oldValue: article.status,
        newValue: comment ? `submitted — ${comment}` : 'submitted',
        editedBy: submittedBy ?? DEFAULT_USER,
        editedAt: nowLabel(),
        status: 'applied',
      };
      const updatedArticle: ArticleData = {
        ...article,
        reviewer: submittedBy ?? DEFAULT_USER,
        approvedAt: submission.submittedAt,
      };
      return {
        ...state,
        articles: { ...state.articles, [articleId]: updatedArticle },
        submissions: { ...state.submissions, [articleId]: submission },
        undoStacks: { ...state.undoStacks, [articleId]: [] },
        redoStacks: { ...state.redoStacks, [articleId]: [] },
        editLog: [
          entry,
          ...state.editLog.map<EditLogEntry>((logEntry) =>
            logEntry.articleId === articleId && logEntry.status === 'pending'
              ? { ...logEntry, status: 'applied' }
              : logEntry,
          ),
        ],
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
        editedBy: editedBy ?? DEFAULT_USER,
        editedAt: nowLabel(),
        status: 'applied',
      };
      return {
        ...state,
        articles: { ...state.articles, [articleId]: updatedArticle },
        editLog: [entry, ...state.editLog],
      };
    }
    case 'MOVE_TO_BUCKET': {
      const { articleId, bucket, editedBy } = action.payload;
      const article = state.articles[articleId];
      if (!article) return state;
      // Bucket boundaries mirror useQueueFilter: high ≥ 90, amber 80-89, low < 80.
      const target =
        bucket === 'high'  ? { confidence: 95, status: 'in_review' as ArticleStatus, label: 'Match' } :
        bucket === 'amber' ? { confidence: 85, status: 'in_review' as ArticleStatus, label: 'Review' } :
                             { confidence: 50, status: 'rejected' as ArticleStatus,  label: 'Fix' };
      const updatedArticle: ArticleData = { ...article, confidence: target.confidence, status: target.status };
      const entry: EditLogEntry = {
        id: makeLogId(),
        articleId,
        section: 'claims',
        field: 'decision',
        oldValue: `${article.status} (confidence ${article.confidence}%)`,
        newValue: `moved to ${target.label} (${target.confidence}%)`,
        editedBy: editedBy ?? DEFAULT_USER,
        editedAt: nowLabel(),
        status: 'applied',
      };
      return {
        ...state,
        articles: { ...state.articles, [articleId]: updatedArticle },
        editLog: [entry, ...state.editLog],
      };
    }
    case 'BULK_SET_CONFIDENCE': {
      const { articleIds, confidence, editedBy } = action.payload;
      const newArticles = { ...state.articles };
      const newLogEntries: EditLogEntry[] = [];
      for (const articleId of articleIds) {
        const article = newArticles[articleId];
        if (!article || article.confidence === confidence) {
          continue;
        }
        newArticles[articleId] = { ...article, confidence };
        newLogEntries.push({
          id: makeLogId(),
          articleId,
          section: 'claims',
          field: 'confidence',
          oldValue: String(article.confidence),
          newValue: String(confidence),
          editedBy: editedBy ?? DEFAULT_USER,
          editedAt: nowLabel(),
          status: 'applied',
        });
      }
      return {
        ...state,
        articles: newArticles,
        editLog: [...newLogEntries, ...state.editLog],
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
        editedBy: editedBy ?? DEFAULT_USER,
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

    const updateArticle = (article: ArticleData, recordSnapshot = true) => {
      dispatch({ type: 'UPDATE_ARTICLE', payload: { article, recordSnapshot } });
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
            newValue: ingredient.mappedIngredient || ingredient.extractedText,
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
        dispatch({ type: 'UPDATE_ARTICLE', payload: { article: { ...article, status }, recordSnapshot: false } });
      },
      saveChanges: (articleId) => dispatch({ type: 'SAVE_CHANGES', payload: { articleId } }),
      submitArticle: (articleId, comment) =>
        dispatch({ type: 'SUBMIT_ARTICLE', payload: { articleId, comment } }),
      undo: (articleId) => dispatch({ type: 'UNDO', payload: { articleId } }),
      redo: (articleId) => dispatch({ type: 'REDO', payload: { articleId } }),
      moveToLow: (articleId) => dispatch({ type: 'MOVE_TO_LOW', payload: { articleId } }),
      moveToBucket: (articleId, bucket) => dispatch({ type: 'MOVE_TO_BUCKET', payload: { articleId, bucket } }),
      markNeedsReview: (articleId) => dispatch({ type: 'MARK_NEEDS_REVIEW', payload: { articleId } }),
      bulkSetConfidence: (articleIds, confidence) =>
        dispatch({ type: 'BULK_SET_CONFIDENCE', payload: { articleIds, confidence } }),
      getArticleById: (articleId) => (articleId ? state.articles[articleId] ?? null : null),
      getUnsavedEditCount: (articleId) => state.undoStacks[articleId]?.length ?? 0,
      getCanUndo: (articleId) => (state.undoStacks[articleId]?.length ?? 0) > 0,
      getCanRedo: (articleId) => (state.redoStacks[articleId]?.length ?? 0) > 0,
      getSubmission: (articleId) => state.submissions[articleId] ?? null,
      isSubmitted: (articleId) => Boolean(state.submissions[articleId]),
      getArticleEditLog: (articleId) => state.editLog.filter((entry) => entry.articleId === articleId),
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
