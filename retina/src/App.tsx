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
import { ROUTES, NUTRITIONIST_ROUTES, STORE_MANAGER_ROUTES, SHARED_ROUTES, ADMIN_ROUTES } from './router/routes';
import { AdminShell } from './components/admin/AdminShell';
import { DashboardScreen as AdminDashboard } from './components/admin/screens/DashboardScreen';
import { UsersListScreen as AdminUsersList } from './components/admin/screens/UsersListScreen';
import { NewUserScreen as AdminNewUser } from './components/admin/screens/NewUserScreen';
import { UserDetailScreen as AdminUserDetail } from './components/admin/screens/UserDetailScreen';
import { SitesScreen as AdminSites } from './components/admin/screens/SitesScreen';
import { ConfigScreen as AdminConfig } from './components/admin/screens/ConfigScreen';
import { UnifiedLoginScreen } from './components/shared/UnifiedLoginScreen';
import { RolePickerScreen } from './components/shared/RolePickerScreen';
import { NutritionistShell } from './components/nutritionist/NutritionistShell';
import { LoginScreen as NutritionistLogin } from './components/nutritionist/screens/LoginScreen';
import { DashboardScreen as NutritionistDashboard } from './components/nutritionist/screens/DashboardScreen';
import { QueueScreen as NutritionistQueue } from './components/nutritionist/screens/QueueScreen';
import { DetailScreen as NutritionistDetail } from './components/nutritionist/screens/DetailScreen';
import { ApprovedScreen as NutritionistApproved } from './components/nutritionist/screens/ApprovedScreen';
import { NotifScreen as NutritionistNotif } from './components/nutritionist/screens/NotifScreen';
import { StoreManagerShell } from './components/store-manager/StoreManagerShell';
import { StoreManagerLayout } from './components/store-manager/StoreManagerApp';
import { LoginScreen as StoreManagerLogin } from './components/store-manager/screens/LoginScreen';
import { SsoScreen as StoreManagerSso } from './components/store-manager/screens/SsoScreen';
import { ArticlesScreen as StoreManagerArticles } from './components/store-manager/screens/ArticlesScreen';
import { MarkIrrelevantScreen as StoreManagerMarkIrrelevant } from './components/store-manager/screens/MarkIrrelevantScreen';
import { BarcodeScreen as StoreManagerBarcode } from './components/store-manager/screens/BarcodeScreen';
import { CaptureScreen as StoreManagerCapture } from './components/store-manager/screens/CaptureScreen';
import { ReviewScreen as StoreManagerReview } from './components/store-manager/screens/ReviewScreen';
import { DoneScreen as StoreManagerDone } from './components/store-manager/screens/DoneScreen';
import { ProgressScreen as StoreManagerProgress } from './components/store-manager/screens/ProgressScreen';
import { RetryScreen as StoreManagerRetry } from './components/store-manager/screens/RetryScreen';
import { AccountScreen as StoreManagerAccount } from './components/store-manager/screens/AccountScreen';

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
          <Route path="/" element={<Navigate to={SHARED_ROUTES.login} replace />} />
          <Route path={SHARED_ROUTES.login} element={<UnifiedLoginScreen />} />
          <Route path={SHARED_ROUTES.index} element={<RolePickerScreen />} />
          <Route path={ROUTES.base} element={<Navigate to={ROUTES.review} replace />} />
          <Route element={<Shell />}>
            <Route path={ROUTES.review} element={<QueueScreen />} />
            <Route path={ROUTES.submitted} element={<QueueScreen variant="submitted" />} />
            <Route path={ROUTES.catalog} element={<CatalogScreen />} />
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />
            <Route path={ROUTES.approved} element={<ApprovedPage />} />
            <Route path={ROUTES.audit} element={<AuditLog />} />
            <Route path={ROUTES.settings} element={<PlaceholderPage title="Settings" />} />
          </Route>

          {/* Nutritionist flow — one route per screen, all under the shell + context provider */}
          <Route path={NUTRITIONIST_ROUTES.base} element={<Navigate to={NUTRITIONIST_ROUTES.login} replace />} />
          <Route element={<NutritionistShell />}>
            <Route path={NUTRITIONIST_ROUTES.login} element={<NutritionistLogin />} />
            <Route path={NUTRITIONIST_ROUTES.dashboard} element={<NutritionistDashboard />} />
            <Route path={NUTRITIONIST_ROUTES.queue} element={<NutritionistQueue />} />
            <Route path={NUTRITIONIST_ROUTES.queueArticle} element={<NutritionistQueue />} />
            <Route path={NUTRITIONIST_ROUTES.article} element={<NutritionistDetail />} />
            <Route path={NUTRITIONIST_ROUTES.approved} element={<NutritionistApproved />} />
            <Route path={NUTRITIONIST_ROUTES.notifications} element={<NutritionistNotif />} />
            {/* back-compat: old /nutritionist/home links redirect to /dashboard */}
            <Route path={NUTRITIONIST_ROUTES.home} element={<Navigate to={NUTRITIONIST_ROUTES.dashboard} replace />} />
          </Route>

          {/* Store Manager flow — one route per screen, all under the shell + context provider */}
          <Route path={STORE_MANAGER_ROUTES.base} element={<StoreManagerShell />}>
            <Route element={<StoreManagerLayout />}>
              <Route index element={<Navigate to={STORE_MANAGER_ROUTES.login} replace />} />
              <Route path={STORE_MANAGER_ROUTES.login} element={<StoreManagerLogin />} />
              <Route path={STORE_MANAGER_ROUTES.sso} element={<StoreManagerSso />} />
              <Route path={STORE_MANAGER_ROUTES.articles} element={<StoreManagerArticles />} />
              <Route path={STORE_MANAGER_ROUTES.markIrrelevant} element={<StoreManagerMarkIrrelevant />} />
              <Route path={STORE_MANAGER_ROUTES.barcode} element={<StoreManagerBarcode />} />
              <Route path={STORE_MANAGER_ROUTES.capture} element={<StoreManagerCapture />} />
              <Route path={STORE_MANAGER_ROUTES.review} element={<StoreManagerReview />} />
              <Route path={STORE_MANAGER_ROUTES.done} element={<StoreManagerDone />} />
              <Route path={STORE_MANAGER_ROUTES.progress} element={<StoreManagerProgress />} />
              <Route path={STORE_MANAGER_ROUTES.retry} element={<StoreManagerRetry />} />
              <Route path={STORE_MANAGER_ROUTES.account} element={<StoreManagerAccount />} />
            </Route>
            {/* back-compat: old /store-manager/home links redirect to /articles */}
            <Route path="home" element={<Navigate to={STORE_MANAGER_ROUTES.articles} replace />} />
          </Route>

          {/* Admin flow — sibling role tree under /admin/* */}
          <Route path={ADMIN_ROUTES.base} element={<Navigate to={ADMIN_ROUTES.dashboard} replace />} />
          <Route element={<AdminShell />}>
            <Route path={ADMIN_ROUTES.dashboard} element={<AdminDashboard />} />
            <Route path={ADMIN_ROUTES.users} element={<AdminUsersList />} />
            <Route path={ADMIN_ROUTES.newUser} element={<AdminNewUser />} />
            <Route path={ADMIN_ROUTES.userDetail} element={<AdminUserDetail />} />
            <Route path={ADMIN_ROUTES.sites} element={<AdminSites />} />
            <Route path={ADMIN_ROUTES.config} element={<AdminConfig />} />
          </Route>

          <Route path="*" element={<Navigate to={SHARED_ROUTES.login} replace />} />
        </Routes>
      </BrowserRouter>
      </ExpandProvider>
    </ReviewStoreProvider>
  );
}
