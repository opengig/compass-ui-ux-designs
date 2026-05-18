import type { MockState } from "@/lib/types";
import { SITES } from "./sites";
import { MOGS } from "./mogs";
import { APLS } from "./apls";
import { DECISIONS, HISTORICAL_CONFIRMED, SYNTHETIC_APLS } from "./decisions";
import { EXCEPTIONS } from "./exceptions";
import { SEED_AUDIT } from "./audit";

export const INITIAL_STATE: MockState = {
  sites: SITES,
  mogs: MOGS,
  apls: [...APLS, ...SYNTHETIC_APLS],
  decisions: [...DECISIONS, ...HISTORICAL_CONFIRMED],
  exceptions: EXCEPTIONS,
  audit: SEED_AUDIT,
  target: {
    targetDate: "2026-05-31",
    exerciseStartedOn: "2026-03-04",
    // Two illustrative per-site overrides so the demo shows the override behaviour out of the box.
    // Mumbai BKC has an aggressive cutover; Bangalore Whitefield has a longer runway.
    siteTargetDates: {
      "site-hyd-hi":   "2026-05-20",
      "site-blr-wf":   "2026-06-15",
    },
  },
  lastRefreshAt: "2026-04-16T04:12:00+05:30",
  siteFilter: "site-hyd-hi",
};
