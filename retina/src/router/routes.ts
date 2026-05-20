// Shared (cross-role) entry points.
// `/login` is the unified SSO landing; `/index` is the role picker shown after sign-in.
export const SHARED_ROUTES = {
  login: '/login',
  index: '/index',
} as const;

export const ROUTES = {
  base: '/article-sme',
  review: '/article-sme/review',
  submitted: '/article-sme/submitted',
  catalog: '/article-sme/catalog',
  dashboard: '/article-sme/dashboard',
  approved: '/article-sme/approved',
  audit: '/article-sme/audit',
  settings: '/article-sme/settings',
} as const;

// Nutritionist flow — sibling role tree under /nutritionist/*
// Each screen is its own route (deep-linkable, back/forward works, SideNav uses <Link>).
// :articleId is the numeric ARTS id when present.
export const NUTRITIONIST_ROUTES = {
  base: '/nutritionist',
  login: '/nutritionist/login',
  dashboard: '/nutritionist/dashboard',
  queue: '/nutritionist/queue',
  queueArticle: '/nutritionist/queue/:articleId',
  article: '/nutritionist/article/:articleId',
  approved: '/nutritionist/approved',
  audit: '/nutritionist/audit',
  notifications: '/nutritionist/notifications',
  // legacy entry point — App.tsx redirects this to /dashboard for back-compat
  home: '/nutritionist/home',
} as const;

// Store Manager flow — sibling role tree under /store-manager/*
// Each screen is its own route (deep-linkable, back/forward works, Articles
// tab/search/filter live in query params: ?tab=, ?q=, ?cat=).
export const STORE_MANAGER_ROUTES = {
  base: '/store-manager',
  login: '/store-manager/login',
  sso: '/store-manager/sso',
  articles: '/store-manager/articles',
  markIrrelevant: '/store-manager/mark-irrelevant',
  barcode: '/store-manager/barcode',
  capture: '/store-manager/capture',
  review: '/store-manager/review',
  done: '/store-manager/done',
  progress: '/store-manager/progress',
  retry: '/store-manager/retry',
  account: '/store-manager/account',
  // legacy entry point — App.tsx redirects this to /articles for back-compat
  home: '/store-manager/home',
} as const;

// Admin flow — sibling role tree under /admin/*
// Each screen is its own route (deep-linkable, back/forward works, AdminShell
// uses <NavLink> for active state). :userId is the AdminUser.userId.
export const ADMIN_ROUTES = {
  base: '/admin',
  dashboard: '/admin/dashboard',
  users: '/admin/users',
  newUser: '/admin/users/new',
  userDetail: '/admin/users/:userId',
  sites: '/admin/sites',
  config: '/admin/config',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
