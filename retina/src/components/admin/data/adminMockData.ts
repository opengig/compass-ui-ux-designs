/**
 * Admin flow mock data — mirrors the type shapes from the source prototype's
 * `useAdminApi.ts` so the screens look real without any backend calls.
 */

export type UserRole =
  | 'NUTRITIONIST'
  | 'ARTICLE_SME'
  | 'STORE_MANAGER'
  | 'APPLICATION_ADMIN'
  | 'SUPER_ADMIN';

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  APPLICATION_ADMIN: 'App Admin',
  STORE_MANAGER: 'Store Manager',
  NUTRITIONIST: 'Nutritionist',
  ARTICLE_SME: 'Article SME',
};

/** Tailwind chip classes per role. Kept in source palette (purple/indigo/etc.)
 *  rather than brand amber — these are categorical, not action colors. */
export const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  APPLICATION_ADMIN: 'bg-indigo-100 text-indigo-700',
  STORE_MANAGER: 'bg-sky-100 text-sky-700',
  NUTRITIONIST: 'bg-emerald-100 text-emerald-700',
  ARTICLE_SME: 'bg-stone-100 text-stone-700',
};

export type AdminSite = {
  siteId: string;
  siteName: string;
  userCount: number;
  createdAt: string;
};

export type AdminUser = {
  userId: string;
  userName: string;
  userEmail: string;
  userType: UserRole;
  sites: { siteId: string; siteName: string }[];
  createdAt: string;
};

export type SysParam = {
  paramKey: string;
  paramValue: string | null;
  paramNum: number | null;
  paramDate: string | null;
  paramType: 'VALUE' | 'NUMBER' | 'DATE';
  description: string | null;
  updatedAt: string;
};

export const MOCK_SITES: AdminSite[] = [
  { siteId: 'bck-001', siteName: 'Bengaluru Central Kitchen', userCount: 6, createdAt: '2025-08-12T09:12:00Z' },
  { siteId: 'wfd-002', siteName: 'Whitefield Kitchen',         userCount: 4, createdAt: '2025-08-15T11:30:00Z' },
  { siteId: 'ecy-003', siteName: 'Electronic City Kitchen',    userCount: 3, createdAt: '2025-09-02T14:45:00Z' },
  { siteId: 'kor-004', siteName: 'Koramangala Kitchen',        userCount: 2, createdAt: '2025-09-22T10:00:00Z' },
  { siteId: 'hsr-005', siteName: 'HSR Layout Kitchen',         userCount: 5, createdAt: '2025-10-05T08:20:00Z' },
  { siteId: 'mum-006', siteName: 'Mumbai Andheri Kitchen',     userCount: 4, createdAt: '2025-11-11T13:00:00Z' },
  { siteId: 'del-007', siteName: 'Delhi Gurgaon Kitchen',      userCount: 3, createdAt: '2025-12-01T09:00:00Z' },
];

const SITE = (id: string) => {
  const s = MOCK_SITES.find((x) => x.siteId === id)!;
  return { siteId: s.siteId, siteName: s.siteName };
};

export const MOCK_USERS: AdminUser[] = [
  {
    userId: 'u-001', userName: 'Priya Sharma', userEmail: 'priya.sharma@compass-group.com',
    userType: 'ARTICLE_SME', sites: [SITE('bck-001'), SITE('wfd-002')], createdAt: '2025-09-01T09:00:00Z',
  },
  {
    userId: 'u-002', userName: 'Anjali Mehta', userEmail: 'anjali.mehta@compass-group.com',
    userType: 'NUTRITIONIST', sites: [SITE('bck-001'), SITE('ecy-003'), SITE('hsr-005')], createdAt: '2025-09-10T10:30:00Z',
  },
  {
    userId: 'u-003', userName: 'Ravi Kumar', userEmail: 'ravi.kumar@compass-group.com',
    userType: 'STORE_MANAGER', sites: [SITE('bck-001')], createdAt: '2025-09-15T08:15:00Z',
  },
  {
    userId: 'u-004', userName: 'Vikram Singh', userEmail: 'vikram.singh@compass-group.com',
    userType: 'STORE_MANAGER', sites: [SITE('wfd-002')], createdAt: '2025-09-20T11:00:00Z',
  },
  {
    userId: 'u-005', userName: 'Sneha Patel', userEmail: 'sneha.patel@compass-group.com',
    userType: 'STORE_MANAGER', sites: [SITE('ecy-003')], createdAt: '2025-09-25T14:00:00Z',
  },
  {
    userId: 'u-006', userName: 'Arjun Reddy', userEmail: 'arjun.reddy@compass-group.com',
    userType: 'NUTRITIONIST', sites: [SITE('mum-006')], createdAt: '2025-10-01T09:30:00Z',
  },
  {
    userId: 'u-007', userName: 'Kavya Iyer', userEmail: 'kavya.iyer@compass-group.com',
    userType: 'ARTICLE_SME', sites: [SITE('del-007')], createdAt: '2025-10-10T12:00:00Z',
  },
  {
    userId: 'u-008', userName: 'Mohan Das', userEmail: 'mohan.das@compass-group.com',
    userType: 'APPLICATION_ADMIN', sites: [], createdAt: '2025-07-15T08:00:00Z',
  },
  {
    userId: 'u-009', userName: 'Aditi Verma', userEmail: 'aditi.verma@compass-group.com',
    userType: 'SUPER_ADMIN', sites: [], createdAt: '2025-06-01T08:00:00Z',
  },
  {
    userId: 'u-010', userName: 'Rohan Joshi', userEmail: 'rohan.joshi@compass-group.com',
    userType: 'STORE_MANAGER', sites: [SITE('hsr-005')], createdAt: '2025-10-20T10:00:00Z',
  },
  {
    userId: 'u-011', userName: 'Nisha Pillai', userEmail: 'nisha.pillai@compass-group.com',
    userType: 'NUTRITIONIST', sites: [SITE('bck-001'), SITE('kor-004')], createdAt: '2025-11-02T09:00:00Z',
  },
  {
    userId: 'u-012', userName: 'Sanjay Gupta', userEmail: 'sanjay.gupta@compass-group.com',
    userType: 'STORE_MANAGER', sites: [SITE('mum-006')], createdAt: '2025-11-15T11:30:00Z',
  },
];

export const MOCK_PARAMS: SysParam[] = [
  {
    paramKey: 'feature.barcode_scan_v2',
    paramValue: 'true', paramNum: null, paramDate: null, paramType: 'VALUE',
    description: 'New camera-based barcode scanner for store managers',
    updatedAt: '2025-12-10T08:00:00Z',
  },
  {
    paramKey: 'feature.nutrition_llm_review',
    paramValue: 'true', paramNum: null, paramDate: null, paramType: 'VALUE',
    description: 'LLM-assisted nutrition data review for nutritionists',
    updatedAt: '2025-12-15T10:00:00Z',
  },
  {
    paramKey: 'feature.auto_approve_high_conf',
    paramValue: 'false', paramNum: null, paramDate: null, paramType: 'VALUE',
    description: 'Auto-approve profiles when confidence > 95%',
    updatedAt: '2025-11-20T12:00:00Z',
  },
  {
    paramKey: 'feature.bulk_actions',
    paramValue: 'true', paramNum: null, paramDate: null, paramType: 'VALUE',
    description: 'Enable bulk select / bulk update in queue screens',
    updatedAt: '2025-12-01T09:00:00Z',
  },
  {
    paramKey: 'pipeline.confidence_threshold',
    paramValue: '80', paramNum: 80, paramDate: null, paramType: 'NUMBER',
    description: 'Minimum confidence % to mark a profile GREEN',
    updatedAt: '2025-12-08T14:00:00Z',
  },
  {
    paramKey: 'pipeline.amber_threshold',
    paramValue: '60', paramNum: 60, paramDate: null, paramType: 'NUMBER',
    description: 'Minimum confidence % to mark a profile AMBER (below = RED)',
    updatedAt: '2025-12-08T14:00:00Z',
  },
  {
    paramKey: 'pipeline.llm_model',
    paramValue: 'claude-opus-4-7', paramNum: null, paramDate: null, paramType: 'VALUE',
    description: 'Anthropic model used for nutrition review',
    updatedAt: '2026-01-12T11:00:00Z',
  },
  {
    paramKey: 'pipeline.batch_size',
    paramValue: '25', paramNum: 25, paramDate: null, paramType: 'NUMBER',
    description: 'Default page size for queue / approved tables',
    updatedAt: '2025-10-15T09:00:00Z',
  },
  {
    paramKey: 'storage.image_url_prefix',
    paramValue: 'https://images.compass-group.com/retina/', paramNum: null, paramDate: null, paramType: 'VALUE',
    description: 'CDN prefix for product images',
    updatedAt: '2025-09-01T08:00:00Z',
  },
];
