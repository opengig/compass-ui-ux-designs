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

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
