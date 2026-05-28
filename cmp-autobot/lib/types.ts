// Domain types for the CMP Autobot prototype.
// Mirrors the entities described in Product.md sections 2, 4, and 5.

export type Queue = "green" | "amber" | "red" | "blue";

export type BlueSubCase = "case1" | "case2-green" | "case2-amber" | "case2-red" | "case3";

export type DecisionStatus =
  | "pending"
  | "confirmed"
  | "corrected"
  | "investigated"
  | "planned"
  | "escalated"
  | "entered";

export interface Site {
  id: string;
  code: string;
  name: string;
  city: string;
  region: string;
  status: "active" | "inactive";
}

export type UserRole = "admin" | "mapper";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** IDs of sites this user can access. Empty array = no site restriction (admin). */
  siteIds: string[];
  isActive: boolean;
}

export interface APL {
  id: string;
  genericName: string;
  characteristic: string;
  brand: string; // "UB" for unbranded
  packSize: string;
  costPerUnit: number;
  currency: "INR";
  siteId: string;
  status: "active" | "inactive";
  inactiveSince?: string;
  lastModified: string;
  /** Category Name — distinct from `category` on MOG (which
   *  drives the L3 hierarchy node). This is the article's own
   *  retail/sourcing classification, e.g. "Spices", "Dairy". */
  categoryName?: string;
  /** Shelf Life Category — typically "Perishables" or
   *  "Non-Perishables". Surfaced in the article drawer's
   *  Category section as a muted badge. */
  shelfLifeCategory?: string;
  dataQuality: {
    complete: boolean;
    missingFields: string[];
  };
}

export type MOGType = "elementary" | "composite";

export interface MOG {
  id: string;
  name: string;
  type: MOGType;
  genericIngredient: string;
  category: string;
  scopeOrigin: "original" | "incremental";
  scopeAddedOn?: string;
}

export type AplMatchStatus = "previously-mapped" | "new-candidate";

export interface AplMatch {
  aplId: string;
  /** 0–100 — bot's confidence the APL belongs to the MOG. */
  confidence: number;
  matchedAt: string;
  status: AplMatchStatus;
  /** Per-APL one-liner summarising why this APL was matched (or why it's preserved). */
  reasoning?: string;
}

export interface MappingDecision {
  id: string;
  mogId: string;
  siteId: string;
  queue: Queue;
  blueSubCase?: BlueSubCase;
  candidateAplIds: string[];
  /** Optional richer per-candidate metadata. When present, supersedes flat candidateAplIds for display. */
  aplMatches?: AplMatch[];
  /** APL ids the user has rejected on this decision (kept for audit/UX, not re-shown as candidates). */
  rejectedAplIds?: string[];
  /**
   * APL ids the user actually mapped during confirm. Populated when the
   * decision was confirmed via the partial-mapping flow (Worklist amber
   * Confirm Mapping). When undefined the decision was auto-confirmed
   * (e.g., bulk green) and every candidate is treated as mapped — see
   * MappedDetail's fallback. The rest become "Other suggestions"
   * (the user passed over them during mapping).
   */
  mappedAplIds?: string[];
  retiredAplId?: string; // Blue only
  /** APL ids the user has chosen as defaults for costing. Multi-select —
   *  zero or more entries allowed. Empty/undefined = no default chosen yet. */
  defaultAplIds?: string[];
  explanation: string; // human-readable substantiation
  signals: string[]; // bullet points the bot considered
  costDeltaPct?: number; // for "cost change significant" cases (UC-05)
  generatedAt: string;
  status: DecisionStatus;
  actionedBy?: string;
  actionedAt?: string;
  correctionNotes?: string;
}

export type ExceptionType = "mam-a" | "mam-b" | "quarantine";

export type OrphanResolutionPath = "linked" | "requested-mog" | "retire-requested";

export type ExceptionStatus =
  | "open"
  | "linked"
  | "pending-culinary"
  | "pending-procurement"
  | "resolved";

export interface ExceptionRecord {
  id: string;
  type: ExceptionType;
  mogId?: string;
  aplId?: string;
  siteId?: string;
  raisedOn: string;
  details: string;
  status: ExceptionStatus;
  resolutionPath?: OrphanResolutionPath;
  linkedMogId?: string;
  resolutionNote?: string;
  pendingOwner?: "culinary" | "procurement";
  resolvedAt?: string;
  resolvedBy?: string;
  /** Timestamp the user clicked "Notify SAP team" on a quarantine
   *  exception. Drives the in-place state swap on the detail panel
   *  (Notify CTA → "Notified Xh ago" + Remind button). Optional
   *  notifiedRemindedAt records the most recent reminder so the
   *  Remind button can throttle / show its own timestamp. */
  notifiedAt?: string;
  notifiedRemindedAt?: string;
}

export type AuditAction =
  | "queue.assigned"
  | "decision.confirmed"
  | "decision.corrected"
  | "decision.investigated"
  | "decision.planned"
  | "decision.escalated"
  | "decision.cookbook-entered"
  | "decision.apl-rejected"
  | "decision.apl-added"
  | "exception.raised"
  | "exception.linked-to-mog"
  | "exception.new-mog-requested"
  | "exception.retire-requested"
  | "exception.sap-notified"
  | "exception.sap-reminded"
  | "scope.incremental.detected"
  | "ods.refresh.completed";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: "autobot" | string; // userId or "autobot"
  action: AuditAction;
  entityType: "decision" | "exception" | "scope" | "system";
  entityId: string;
  before?: string;
  after?: string;
  explanation?: string;
}

export interface ProgressTarget {
  /** Global default target date (YYYY-MM-DD). Used when no per-site override applies. */
  targetDate: string;
  exerciseStartedOn: string;
  /** Optional per-site overrides keyed by site id. Missing key → falls back to global targetDate. */
  siteTargetDates?: Record<string, string>;
}

export interface MockState {
  sites: Site[];
  users: AppUser[];
  mogs: MOG[];
  apls: APL[];
  decisions: MappingDecision[];
  exceptions: ExceptionRecord[];
  audit: AuditEntry[];
  target: ProgressTarget;
  lastRefreshAt: string;
  /** Global site filter — applies to Worklist (and other surfaces opting in). "all" = no filter. */
  siteFilter: string;
}
