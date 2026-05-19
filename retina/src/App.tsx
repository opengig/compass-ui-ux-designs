import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Shell } from './components/Shell';
import { QueueScreen } from './components/QueueScreen';
import { CatalogScreen } from './components/CatalogScreen';
import { Dashboard } from './components/Dashboard';
import { ApprovedList } from './components/ApprovedList';
import { AuditLog } from './components/AuditLog';
import { SITES } from './data/mockData';
import { ReviewStoreProvider } from './stores/useReviewStore';
import { ExpandProvider } from './stores/ExpandSections';
import { ROUTES } from './router/routes';

function DashboardPage() {
  // Dashboard expects goApp + setQueueTab + selectedSites; pass URL-aware shims.
  return (
    <Dashboard
      goApp={() => {}}
      setQueueTab={() => {}}
      selectedSites={SITES}
      setHighlightArtIds={() => {}}
    />
  );
}

function ApprovedPage() {
  const navigate = useNavigate();
  return (
    <ApprovedList
      onOpenArticle={(articleId) => {
        navigate(`${ROUTES.review}?article=${encodeURIComponent(articleId)}`);
      }}
    />
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
      {title} — coming soon
    </div>
  );
}

export function App() {
  return (
    <ReviewStoreProvider>
      <ExpandProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={ROUTES.review} replace />} />
          <Route path={ROUTES.base} element={<Navigate to={ROUTES.review} replace />} />
          <Route element={<Shell />}>
            <Route path={ROUTES.review} element={<QueueScreen />} />
            <Route
              path={ROUTES.submitted}
              element={<Navigate to={`${ROUTES.review}?tab=submitted`} replace />}
            />
            <Route path={ROUTES.catalog} element={<CatalogScreen />} />
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />
            <Route path={ROUTES.approved} element={<ApprovedPage />} />
            <Route path={ROUTES.audit} element={<AuditLog />} />
            <Route path={ROUTES.settings} element={<PlaceholderPage title="Settings" />} />
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.review} replace />} />
        </Routes>
      </BrowserRouter>
      </ExpandProvider>
    </ReviewStoreProvider>
  );
}
