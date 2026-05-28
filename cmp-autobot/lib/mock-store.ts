"use client";

import { create } from "zustand";
import { INITIAL_STATE } from "@/data/seed";
import type {
  AppUser,
  AuditAction,
  AuditEntry,
  DecisionStatus,
  ExceptionRecord,
  MockState,
} from "./types";

const CURRENT_USER = "Aman Verma"; // demo persona

let auditCounter = INITIAL_STATE.audit.length + 1;
function nextAuditId() {
  return `aud-${(auditCounter++).toString().padStart(3, "0")}`;
}

interface MockStoreActions {
  /**
   * Confirm a decision — partial-mapping flow.
   *
   * Each call appends `selectedAplIds` to the persisted `mappedAplIds`
   * on the decision (de-duped, restricted to actual candidates). The
   * decision only flips to `"confirmed"` (= leaves the Worklist) when
   * every candidate has been either mapped or rejected. Until then the
   * MOG stays in the Worklist with reduced visible candidates and the
   * row count shows "X remaining (Y mapped)".
   *
   * When `selectedAplIds` is omitted (bulk green / legacy), every
   * candidate is treated as mapped in one shot — equivalent to a
   * single batch confirming the full set.
   */
  confirmDecision: (decisionId: string, selectedAplIds?: string[]) => void;
  /**
   * Reverse a confirmation — flips a previously-confirmed decision back to
   * "pending" so the user can edit and re-confirm. Used by the "Remap"
   * action on the Mapped Items page.
   */
  unconfirmDecision: (decisionId: string) => void;
  /**
   * Undo a single-APL confirmation — removes `aplId` from `mappedAplIds`.
   * Resets decision status to "pending" if no mapped APLs remain after removal.
   */
  undoConfirmApl: (decisionId: string, aplId: string) => void;
  /**
   * Toggle an APL's membership in `defaultAplIds` for the decision.
   * Multi-select semantics — zero or more APLs may be marked default.
   * No-op if `aplId` isn't an actual candidate. Status stays unchanged
   * so the decision keeps its current placement (Worklist or Mapped).
   */
  toggleDecisionDefault: (decisionId: string, aplId: string) => void;
  correctDecision: (decisionId: string, notes: string) => void;
  markInvestigated: (decisionId: string) => void;
  markPlanned: (decisionId: string) => void;
  escalateToException: (decisionId: string) => void;
  /**
   * Lighter escalation than `escalateToException` — marks the decision as
   * escalated and writes an audit entry, but does NOT create a MAM Type A
   * exception record. Used by the Red queue's direct "Escalate to
   * Procurement" CTA so we don't duplicate the missing-APL problem in two
   * places (queue + exception list).
   */
  escalateDecisionToProcurement: (decisionId: string) => void;
  markCookbookEntered: (decisionId: string) => void;
  /**
   * Re-categorise a decision into a different queue (e.g. amber → green
   * after a user confirms a likely match). Used by the worklist UI to
   * model queue transitions independent of decision status.
   */
  recategorizeDecision: (decisionId: string, queue: import("./types").Queue) => void;
  rejectAplMatch: (decisionId: string, aplId: string, reason: string) => void;
  undoRejectAplMatch: (decisionId: string, aplId: string) => void;
  addAplToDecision: (
    decisionId: string,
    aplId: string,
    opts?: { autoConfirm?: boolean; manuallyAdded?: boolean }
  ) => void;
  bulkConfirmGreen: (decisionIds: string[]) => void;
  bulkPlanBlue: (decisionIds: string[]) => void;
  resolveException: (exceptionId: string) => void;
  /**
   * Mark a MAM-A (or any) exception as resolved-by-link — the user picked
   * an existing APL and linked it to the MOG. Distinct from generic
   * resolveException so the audit trail captures intent.
   */
  markExceptionLinked: (exceptionId: string) => void;
  /**
   * Mark an exception as escalated to Procurement. Re-uses the existing
   * "pending-procurement" status so it shows up correctly in status filters
   * across the app.
   */
  markExceptionEscalated: (exceptionId: string) => void;
  /**
   * Quarantine-only: stamp the exception with a notifiedAt timestamp
   * so the detail panel can swap the "Notify SAP team" CTA for an
   * in-place "Notified Xh ago" status. Status itself stays "open"
   * — only the SAP master-data team can move the record to resolved
   * by correcting the underlying data at source.
   */
  notifyExceptionSAP: (exceptionId: string) => void;
  /**
   * Quarantine-only: stamps notifiedRemindedAt on a previously-
   * notified exception so the user can chase SAP again without
   * losing the original notify timestamp.
   */
  remindExceptionSAP: (exceptionId: string) => void;
  linkOrphanToMog: (exceptionId: string, mogId: string) => void;
  requestNewMog: (exceptionId: string, note: string) => void;
  retireOrphanApl: (exceptionId: string) => void;
  setTargetDate: (iso: string) => void;
  setSiteTargetDate: (siteId: string, iso: string) => void;
  clearSiteTargetDate: (siteId: string) => void;
  setSiteFilter: (siteId: string) => void;
  simulateOdsRefresh: () => void;
  // ── User management ───────────────────────────────────────────────────────
  addUser: (user: Omit<AppUser, "id">) => void;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, patch: Partial<Omit<AppUser, "id">>) => void;
  // ── Site management ───────────────────────────────────────────────────────
  toggleSiteStatus: (siteId: string) => void;
}

type Store = MockState & MockStoreActions;

function appendAudit(state: MockState, partial: Omit<AuditEntry, "id" | "timestamp">): AuditEntry {
  const entry: AuditEntry = {
    id: nextAuditId(),
    timestamp: new Date().toISOString(),
    ...partial,
  };
  state.audit = [entry, ...state.audit];
  return entry;
}

export const useMockStore = create<Store>((set, get) => ({
  ...INITIAL_STATE,

  confirmDecision: (decisionId, selectedAplIds) => {
    const dec = get().decisions.find((d) => d.id === decisionId);
    if (!dec) return;

    // Append-only model. Each call adds new ids to the existing
    // mappedAplIds; bad callers can't smuggle in unrelated APLs
    // (filter to actual candidates) or double-add. When the caller
    // omits selectedAplIds, treat as "confirm everything" — used by
    // bulk green / cookbook entry / legacy paths.
    const previouslyMapped = dec.mappedAplIds ?? [];
    const additions =
      selectedAplIds === undefined
        ? dec.candidateAplIds.filter((id) => !previouslyMapped.includes(id))
        : selectedAplIds.filter(
            (id) =>
              dec.candidateAplIds.includes(id) &&
              !previouslyMapped.includes(id)
          );
    const mappedAplIds = [...previouslyMapped, ...additions];

    // Decision is finished when every candidate is either mapped or
    // rejected. Only then does status flip → MOG leaves the Worklist
    // and shows up under Mapped Items.
    const rejected = new Set(dec.rejectedAplIds ?? []);
    const mappedSet = new Set(mappedAplIds);
    const finalised = dec.candidateAplIds.every(
      (id) => mappedSet.has(id) || rejected.has(id)
    );

    set((s) => {
      const next = { ...s };
      next.decisions = s.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              mappedAplIds,
              ...(finalised
                ? {
                    status: "confirmed" as DecisionStatus,
                    actionedBy: CURRENT_USER,
                    actionedAt: new Date().toISOString(),
                  }
                : {}),
            }
          : d
      );
      const action: AuditAction = "decision.confirmed";
      const batchCount = additions.length;
      appendAudit(next, {
        actor: CURRENT_USER,
        action,
        entityType: "decision",
        entityId: decisionId,
        before: dec.status,
        after: finalised ? "confirmed" : dec.status,
        explanation: finalised
          ? `Confirmed ${dec.queue} decision with ${mappedAplIds.length} APL${
              mappedAplIds.length === 1 ? "" : "s"
            } mapped. Awaiting CookBook entry.`
          : `Mapped ${batchCount} APL${
              batchCount === 1 ? "" : "s"
            } (${mappedAplIds.length}/${dec.candidateAplIds.length} total). MOG now visible in BOTH Worklist (remaining) and Mapped Items (confirmed) — partially mapped.`,
      });

      // Persistence-layer debug log. Independent of who called the
      // store — fires for both Worklist confirms AND any future
      // surface that mutates a decision through the same action. Use
      // it to verify the store mutation actually landed.
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.log(
          `[CMP store] confirmDecision · ${decisionId} ` +
            `(+${batchCount}) · status: ${dec.status} → ${
              finalised ? "confirmed" : dec.status
            }`,
          {
            mappedAplIds,
            rejectedAplIds: dec.rejectedAplIds ?? [],
            candidateAplIds: dec.candidateAplIds,
            finalised,
          }
        );
      }
      return next;
    });
  },

  unconfirmDecision: (decisionId) => {
    const dec = get().decisions.find((d) => d.id === decisionId);
    if (!dec) return;
    set((s) => {
      const next = { ...s };
      const before = dec.status;
      next.decisions = s.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              status: "pending" as DecisionStatus,
              actionedBy: undefined,
              actionedAt: undefined,
            }
          : d
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "queue.assigned",
        entityType: "decision",
        entityId: decisionId,
        before,
        after: "pending",
        explanation: `Re-opened mapping for editing (Remap from Mapped Items).`,
      });
      return next;
    });
  },

  undoConfirmApl: (decisionId, aplId) => {
    const dec = get().decisions.find((d) => d.id === decisionId);
    if (!dec) return;
    const nextMapped = (dec.mappedAplIds ?? []).filter((id) => id !== aplId);
    set((s) => {
      const next = { ...s };
      next.decisions = s.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              mappedAplIds: nextMapped,
              // Reset to pending when no APLs remain mapped
              ...(nextMapped.length === 0
                ? {
                    status: "pending" as DecisionStatus,
                    actionedBy: undefined,
                    actionedAt: undefined,
                  }
                : {}),
            }
          : d
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "queue.assigned",
        entityType: "decision",
        entityId: decisionId,
        before: dec.status,
        after: nextMapped.length === 0 ? "pending" : dec.status,
        explanation: `Undid confirmation of APL ${aplId}.`,
      });
      return next;
    });
  },

  toggleDecisionDefault: (decisionId, aplId) => {
    const dec = get().decisions.find((d) => d.id === decisionId);
    if (!dec) return;
    if (!dec.candidateAplIds.includes(aplId)) return;
    const current = dec.defaultAplIds ?? [];
    const willAdd = !current.includes(aplId);
    const nextDefaults = willAdd
      ? [...current, aplId]
      : current.filter((id) => id !== aplId);
    set((s) => {
      const next = { ...s };
      const before = current.join(",") || "—";
      next.decisions = s.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              defaultAplIds: nextDefaults,
              actionedBy: CURRENT_USER,
              actionedAt: new Date().toISOString(),
            }
          : d
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "decision.confirmed",
        entityType: "decision",
        entityId: decisionId,
        before,
        after: nextDefaults.join(",") || "—",
        explanation: willAdd
          ? `Marked APL ${aplId} as default.`
          : `Removed APL ${aplId} from defaults.`,
      });
      return next;
    });
  },

  correctDecision: (decisionId, notes) => {
    const dec = get().decisions.find((d) => d.id === decisionId);
    if (!dec) return;
    set((s) => {
      const next = { ...s };
      next.decisions = s.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              status: "corrected" as DecisionStatus,
              actionedBy: CURRENT_USER,
              actionedAt: new Date().toISOString(),
              correctionNotes: notes,
            }
          : d
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "decision.corrected",
        entityType: "decision",
        entityId: decisionId,
        before: "pending",
        after: "corrected",
        explanation: `Corrected mapping. Notes: ${notes}`,
      });
      return next;
    });
  },

  markInvestigated: (decisionId) => {
    set((s) => {
      const next = { ...s };
      next.decisions = s.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              status: "investigated" as DecisionStatus,
              actionedBy: CURRENT_USER,
              actionedAt: new Date().toISOString(),
            }
          : d
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "decision.investigated",
        entityType: "decision",
        entityId: decisionId,
        before: "pending",
        after: "investigated",
      });
      return next;
    });
  },

  markPlanned: (decisionId) => {
    set((s) => {
      const next = { ...s };
      next.decisions = s.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              status: "planned" as DecisionStatus,
              actionedBy: CURRENT_USER,
              actionedAt: new Date().toISOString(),
            }
          : d
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "decision.planned",
        entityType: "decision",
        entityId: decisionId,
        before: "pending",
        after: "planned",
        explanation: "Marked transition planned. Mapping preserved until stock-exhaustion signal.",
      });
      return next;
    });
  },

  escalateToException: (decisionId) => {
    const dec = get().decisions.find((d) => d.id === decisionId);
    if (!dec) return;
    set((s) => {
      const next = { ...s };
      next.decisions = s.decisions.map((d) =>
        d.id === decisionId ? { ...d, status: "escalated" as DecisionStatus } : d
      );
      const newException: ExceptionRecord = {
        id: `exc-from-${decisionId}`,
        type: "mam-a",
        mogId: dec.mogId,
        siteId: dec.siteId,
        raisedOn: new Date().toISOString(),
        details: `Escalated from Red Queue investigation. Original explanation: ${dec.explanation}`,
        status: "open",
      };
      next.exceptions = [newException, ...s.exceptions];
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "decision.escalated",
        entityType: "decision",
        entityId: decisionId,
        before: "pending",
        after: "escalated",
        explanation: "Escalated to MAM Exception 1 Type A.",
      });
      return next;
    });
  },

  escalateDecisionToProcurement: (decisionId) => {
    const dec = get().decisions.find((d) => d.id === decisionId);
    if (!dec) return;
    set((s) => {
      const next = { ...s };
      const before = dec.status;
      next.decisions = s.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              status: "escalated" as DecisionStatus,
              actionedBy: CURRENT_USER,
              actionedAt: new Date().toISOString(),
            }
          : d
      );
      // Note: intentionally NOT creating an Exception record. Procurement
      // is notified out-of-band; the decision leaves the Red queue.
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "decision.escalated",
        entityType: "decision",
        entityId: decisionId,
        before,
        after: "escalated",
        explanation: "Escalated to Procurement — request raised for missing APL.",
      });
      return next;
    });
  },

  recategorizeDecision: (decisionId, queue) => {
    set((s) => {
      const next = { ...s };
      const dec = s.decisions.find((d) => d.id === decisionId);
      if (!dec || dec.queue === queue) return s;
      const before = dec.queue;
      next.decisions = s.decisions.map((d) =>
        d.id === decisionId ? { ...d, queue } : d
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "queue.assigned",
        entityType: "decision",
        entityId: decisionId,
        before,
        after: queue,
        explanation: `Decision moved from ${before} to ${queue} queue.`,
      });
      return next;
    });
  },

  rejectAplMatch: (decisionId, aplId, reason) => {
    set((s) => {
      const next = { ...s };
      const dec = s.decisions.find((d) => d.id === decisionId);
      if (!dec) return s;
      next.decisions = s.decisions.map((d) => {
        if (d.id !== decisionId) return d;
        return {
          ...d,
          candidateAplIds: d.candidateAplIds.filter((id) => id !== aplId),
          aplMatches: d.aplMatches?.filter((m) => m.aplId !== aplId),
          rejectedAplIds: Array.from(new Set([...(d.rejectedAplIds ?? []), aplId])),
          defaultAplIds: (d.defaultAplIds ?? []).filter((id) => id !== aplId),
        };
      });
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "decision.apl-rejected",
        entityType: "decision",
        entityId: decisionId,
        before: aplId,
        explanation: `Rejected APL ${aplId}. Reason: ${reason}`,
      });
      return next;
    });
  },

  undoRejectAplMatch: (decisionId, aplId) => {
    set((s) => {
      const next = { ...s };
      const dec = s.decisions.find((d) => d.id === decisionId);
      if (!dec) return s;
      next.decisions = s.decisions.map((d) => {
        if (d.id !== decisionId) return d;
        return {
          ...d,
          candidateAplIds: d.candidateAplIds.includes(aplId)
            ? d.candidateAplIds
            : [...d.candidateAplIds, aplId],
          rejectedAplIds: (d.rejectedAplIds ?? []).filter((id) => id !== aplId),
        };
      });
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "decision.apl-rejected",
        entityType: "decision",
        entityId: decisionId,
        before: aplId,
        explanation: `Undid rejection of APL ${aplId}.`,
      });
      return next;
    });
  },

  addAplToDecision: (decisionId, aplId, opts) => {
    // autoConfirm prop kept for call-site compatibility but no longer
    // changes behavior — the new semantics auto-map every Add, so the
    // only thing the caller affects is the audit blurb.
    const manuallyAdded = opts?.manuallyAdded ?? true;
    set((s) => {
      const next = { ...s };
      const dec = s.decisions.find((d) => d.id === decisionId);
      if (!dec) return s;
      if (dec.candidateAplIds.includes(aplId)) return s; // already there
      const matchedAt = new Date().toISOString();

      const nextMatches = [
        ...(dec.aplMatches ?? []),
        {
          aplId,
          confidence: manuallyAdded ? 100 : 95,
          matchedAt,
          status: "new-candidate" as const,
          reasoning: manuallyAdded
            ? `Manually added by ${CURRENT_USER}.`
            : "Auto-added.",
        },
      ];
      const candidateAplIds = [...dec.candidateAplIds, aplId];
      const mappedAplIds = [...(dec.mappedAplIds ?? []), aplId];
      const currentDefaults = dec.defaultAplIds ?? [];
      // Auto-seed default ONLY when nothing is currently default —
      // matches the user-confirmed rule: newly-added APL becomes
      // default only if defaultAplIds is empty.
      const defaultAplIds =
        currentDefaults.length === 0 ? [aplId] : currentDefaults;

      // Finalise if every candidate is now mapped or rejected. Add
      // already short-circuits on duplicate, so we know aplId is new.
      const rejected = new Set(dec.rejectedAplIds ?? []);
      const mappedSet = new Set(mappedAplIds);
      const finalised = candidateAplIds.every(
        (id) => mappedSet.has(id) || rejected.has(id)
      );

      next.decisions = s.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              candidateAplIds,
              mappedAplIds,
              aplMatches: nextMatches,
              defaultAplIds,
              ...(finalised
                ? {
                    status: "confirmed" as DecisionStatus,
                    actionedBy: CURRENT_USER,
                    actionedAt: new Date().toISOString(),
                  }
                : {}),
            }
          : d
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "decision.apl-added",
        entityType: "decision",
        entityId: decisionId,
        after: aplId,
        explanation: manuallyAdded
          ? `Added APL ${aplId} & mapped instantly.`
          : `Added APL ${aplId} & mapped.`,
      });
      return next;
    });
  },

  markCookbookEntered: (decisionId) => {
    const dec = get().decisions.find((d) => d.id === decisionId);
    if (!dec) return;
    set((s) => {
      const next = { ...s };
      const before = dec.status;
      next.decisions = s.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              status: "entered" as DecisionStatus,
              actionedBy: CURRENT_USER,
              actionedAt: new Date().toISOString(),
            }
          : d
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "decision.cookbook-entered",
        entityType: "decision",
        entityId: decisionId,
        before,
        after: "entered",
        explanation: `Manually entered in CookBook.`,
      });
      return next;
    });
  },

  bulkConfirmGreen: (decisionIds) => {
    decisionIds.forEach((id) => get().confirmDecision(id));
  },

  bulkPlanBlue: (decisionIds) => {
    decisionIds.forEach((id) => get().markPlanned(id));
  },

  resolveException: (exceptionId) => {
    set((s) => {
      const next = { ...s };
      next.exceptions = s.exceptions.map((e) =>
        e.id === exceptionId
          ? {
              ...e,
              status: "resolved" as const,
              resolvedAt: new Date().toISOString(),
              resolvedBy: CURRENT_USER,
            }
          : e
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "exception.raised",
        entityType: "exception",
        entityId: exceptionId,
        before: "open",
        after: "resolved",
        explanation: "Exception resolved by CMP Team.",
      });
      return next;
    });
  },

  markExceptionLinked: (exceptionId) => {
    set((s) => {
      const next = { ...s };
      const exc = s.exceptions.find((e) => e.id === exceptionId);
      if (!exc) return s;
      const before = exc.status;
      next.exceptions = s.exceptions.map((e) =>
        e.id === exceptionId
          ? {
              ...e,
              status: "linked" as const,
              resolvedAt: new Date().toISOString(),
              resolvedBy: CURRENT_USER,
            }
          : e
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "exception.linked-to-mog",
        entityType: "exception",
        entityId: exceptionId,
        before,
        after: "linked",
        explanation: "User linked an existing APL — moved to Green queue.",
      });
      return next;
    });
  },

  markExceptionEscalated: (exceptionId) => {
    set((s) => {
      const next = { ...s };
      const exc = s.exceptions.find((e) => e.id === exceptionId);
      if (!exc) return s;
      const before = exc.status;
      next.exceptions = s.exceptions.map((e) =>
        e.id === exceptionId
          ? {
              ...e,
              status: "pending-procurement" as const,
              pendingOwner: "procurement" as const,
            }
          : e
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "exception.new-mog-requested",
        entityType: "exception",
        entityId: exceptionId,
        before,
        after: "pending-procurement",
        explanation: "Escalated to Procurement — request raised for missing APL.",
      });
      return next;
    });
  },

  notifyExceptionSAP: (exceptionId) => {
    set((s) => {
      const exc = s.exceptions.find((e) => e.id === exceptionId);
      if (!exc) return s;
      const stamp = new Date().toISOString();
      const next = { ...s };
      next.exceptions = s.exceptions.map((e) =>
        e.id === exceptionId ? { ...e, notifiedAt: stamp } : e
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "exception.sap-notified",
        entityType: "exception",
        entityId: exceptionId,
        explanation:
          "Notified SAP master-data team — record awaiting field correction at source.",
      });
      return next;
    });
  },

  remindExceptionSAP: (exceptionId) => {
    set((s) => {
      const exc = s.exceptions.find((e) => e.id === exceptionId);
      if (!exc) return s;
      const stamp = new Date().toISOString();
      const next = { ...s };
      next.exceptions = s.exceptions.map((e) =>
        e.id === exceptionId ? { ...e, notifiedRemindedAt: stamp } : e
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "exception.sap-reminded",
        entityType: "exception",
        entityId: exceptionId,
        explanation:
          "Sent reminder to SAP master-data team — record still awaiting correction.",
      });
      return next;
    });
  },

  linkOrphanToMog: (exceptionId, mogId) => {
    const exc = get().exceptions.find((e) => e.id === exceptionId);
    const mog = get().mogs.find((m) => m.id === mogId);
    if (!exc || !mog) return;
    set((s) => {
      const next = { ...s };
      const before = exc.status;
      next.exceptions = s.exceptions.map((e) =>
        e.id === exceptionId
          ? {
              ...e,
              status: "linked" as const,
              resolutionPath: "linked" as const,
              linkedMogId: mogId,
              resolvedAt: new Date().toISOString(),
              resolvedBy: CURRENT_USER,
            }
          : e
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "exception.linked-to-mog",
        entityType: "exception",
        entityId: exceptionId,
        before,
        after: "linked",
        explanation: `Orphan APL linked to existing MOG '${mog.name}'.`,
      });
      return next;
    });
  },

  requestNewMog: (exceptionId, note) => {
    const exc = get().exceptions.find((e) => e.id === exceptionId);
    if (!exc) return;
    set((s) => {
      const next = { ...s };
      const before = exc.status;
      next.exceptions = s.exceptions.map((e) =>
        e.id === exceptionId
          ? {
              ...e,
              status: "pending-culinary" as const,
              resolutionPath: "requested-mog" as const,
              resolutionNote: note,
              pendingOwner: "culinary" as const,
              resolvedAt: new Date().toISOString(),
              resolvedBy: CURRENT_USER,
            }
          : e
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "exception.new-mog-requested",
        entityType: "exception",
        entityId: exceptionId,
        before,
        after: "pending-culinary",
        explanation: `New MOG requested from Culinary. Note: ${note}`,
      });
      return next;
    });
  },

  retireOrphanApl: (exceptionId) => {
    const exc = get().exceptions.find((e) => e.id === exceptionId);
    if (!exc) return;
    set((s) => {
      const next = { ...s };
      const before = exc.status;
      next.exceptions = s.exceptions.map((e) =>
        e.id === exceptionId
          ? {
              ...e,
              status: "pending-procurement" as const,
              resolutionPath: "retire-requested" as const,
              pendingOwner: "procurement" as const,
              resolvedAt: new Date().toISOString(),
              resolvedBy: CURRENT_USER,
            }
          : e
      );
      appendAudit(next, {
        actor: CURRENT_USER,
        action: "exception.retire-requested",
        entityType: "exception",
        entityId: exceptionId,
        before,
        after: "pending-procurement",
        explanation: "Retirement request raised to Procurement. Autobot does not modify SAP directly.",
      });
      return next;
    });
  },

  setTargetDate: (iso) => {
    set((s) => ({ ...s, target: { ...s.target, targetDate: iso } }));
  },

  setSiteTargetDate: (siteId, iso) => {
    set((s) => ({
      ...s,
      target: {
        ...s.target,
        siteTargetDates: { ...(s.target.siteTargetDates ?? {}), [siteId]: iso },
      },
    }));
  },

  clearSiteTargetDate: (siteId) => {
    set((s) => {
      const next = { ...(s.target.siteTargetDates ?? {}) };
      delete next[siteId];
      return { ...s, target: { ...s.target, siteTargetDates: next } };
    });
  },

  setSiteFilter: (siteId) => {
    set((s) => ({ ...s, siteFilter: siteId }));
  },

  simulateOdsRefresh: () => {
    set((s) => {
      const next = { ...s };
      next.lastRefreshAt = new Date().toISOString();
      // Move 2 pending decisions out of pending to demonstrate dashboard movement
      let moved = 0;
      next.decisions = s.decisions.map((d) => {
        if (moved < 2 && d.status === "pending" && d.queue === "green") {
          moved += 1;
          return {
            ...d,
            status: "confirmed" as DecisionStatus,
            actionedBy: "autobot-sim",
            actionedAt: new Date().toISOString(),
          };
        }
        return d;
      });
      appendAudit(next, {
        actor: "autobot",
        action: "ods.refresh.completed",
        entityType: "system",
        entityId: "ods-feed",
        explanation: "Simulated ODS refresh — 2 Green decisions auto-confirmed for demo.",
      });
      return next;
    });
  },

  // ── User management ─────────────────────────────────────────────────────
  addUser: (user) => {
    set((s) => {
      const id = `user-${Date.now()}`;
      return { ...s, users: [...s.users, { ...user, id }] };
    });
  },

  removeUser: (userId) => {
    set((s) => ({ ...s, users: s.users.filter((u) => u.id !== userId) }));
  },

  updateUser: (userId, patch) => {
    set((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
    }));
  },

  // ── Site management ──────────────────────────────────────────────────────
  toggleSiteStatus: (siteId) => {
    set((s) => ({
      ...s,
      sites: s.sites.map((site) =>
        site.id === siteId
          ? { ...site, status: site.status === "active" ? "inactive" : "active" }
          : site
      ),
    }));
  },
}));
