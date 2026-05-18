import type { ExceptionRecord } from "@/lib/types";

const HYD = "site-hyd-hi";

// No-match exceptions from HYD 119A.
// - mam-a: MOG without suitable APL candidate (procurement gap)
// - mam-b: APL without suitable MOG (dangling article)
// "No Match" tab can surface both patterns.
export const EXCEPTIONS: ExceptionRecord[] = [
  {
    id: "exc-001",
    type: "mam-a",
    aplId: "apl-112749",
    siteId: HYD,
    raisedOn: "2026-04-16T04:12:00+05:30",
    details:
      "APL 'Balasa Plain Boondi (For Raita) 1×1 kg' has no matching MOG. None of the shortlisted MOG candidates correspond to 'Plain Boondi' or any type of boondi snack. A new Boondi RTU MOG may need to be created.",
    status: "open",
  },
  {
    id: "exc-002",
    type: "mam-a",
    aplId: "apl-202400001",
    siteId: HYD,
    raisedOn: "2026-04-16T04:12:00+05:30",
    details:
      "APL 'Broccoli, UB, Frozen, 1×1 kg' has no matching MOG. The only broccoli MOG is 'Broccoli Fresh' — not frozen. A Broccoli Frozen MOG is required or the APL must be re-evaluated.",
    status: "open",
  },
  {
    id: "exc-003",
    type: "mam-a",
    aplId: "apl-200858001",
    siteId: HYD,
    raisedOn: "2026-04-16T04:12:00+05:30",
    details:
      "APL 'Egg, UB, 1×30 nos Tray' has no matching MOG. No egg or egg product MOG exists in the current catalogue. A new Egg Whole White MOG is required.",
    status: "open",
  },
  {
    id: "exc-004",
    type: "mam-a",
    aplId: "apl-104131",
    siteId: HYD,
    raisedOn: "2026-04-16T04:12:00+05:30",
    details:
      "APL 'Sev UB 1×1 kg' has no matching MOG. No sev or plain boondi type MOG exists. All shortlisted candidates were unrelated products. A Farsan Sev RTU MOG may need to be created.",
    status: "open",
  },
  {
    id: "exc-005",
    type: "mam-a",
    aplId: "apl-112016",
    siteId: HYD,
    raisedOn: "2026-04-16T04:12:00+05:30",
    details:
      "APL 'Mushroom UB Porcini 1×500 g' has no matching MOG. The only available mushroom MOG is 'Mushroom Fresh' which does not cover porcini (dried/specialty variety). A Mushroom Porcini Dried MOG is required.",
    status: "open",
  },
  {
    id: "exc-006",
    type: "mam-a",
    aplId: "apl-103115",
    siteId: HYD,
    raisedOn: "2026-04-16T04:12:00+05:30",
    details:
      "APL 'Oats Kellogg's 1×800 g' has no matching MOG. None of the shortlisted candidates are oats or oat-based cereals. An Oats White or Instant Oats MOG must be created to map this APL.",
    status: "open",
  },
  {
    id: "exc-007",
    type: "mam-a",
    aplId: "apl-201978",
    siteId: HYD,
    raisedOn: "2026-04-16T04:12:00+05:30",
    details:
      "APL 'Prawns UB Premium 1×1 kg' has no matching MOG. No seafood or prawn MOG exists in the current catalogue. Procurement is currently sourcing without a formal MOG. A Fish Prawn Frozen MOG is required.",
    status: "open",
  },
  {
    id: "exc-008",
    type: "mam-a",
    aplId: "apl-109807",
    siteId: HYD,
    raisedOn: "2026-04-16T04:12:00+05:30",
    details:
      "APL 'Kinley Soda PET 1×750 ml' has no matching MOG. No carbonated water or soda water MOG exists. A Soda Water/Carbonated Water MOG is required to cover this APL.",
    status: "open",
  },
  {
    id: "exc-009",
    type: "mam-a",
    aplId: "apl-106289",
    siteId: HYD,
    raisedOn: "2026-04-16T04:12:00+05:30",
    details:
      "APL 'Maida Shalimar White 1×50 kg' has no matching MOG. None of the shortlisted candidates correspond to refined flour (Maida). A Maida (Refined Flour) MOG is required for this large-pack bulk purchase.",
    status: "open",
  },
  {
    id: "exc-010",
    type: "mam-a",
    aplId: "apl-102397",
    siteId: HYD,
    raisedOn: "2026-04-16T04:12:00+05:30",
    details:
      "APL 'Mayonnaise Eggless Cremica 1×1 kg' has no matching MOG. No mayonnaise MOG exists. All shortlisted candidates were unrelated products. A Mayonnaise Sauce RTU MOG is required.",
    status: "open",
  },
  {
    id: "exc-011",
    type: "mam-b",
    aplId: "apl-112749",
    siteId: HYD,
    raisedOn: "2026-04-17T10:20:00+05:30",
    details:
      "APL 'Balasa Plain Boondi (For Raita) 1×1 kg' has no matching MOG. Create or map to an approved Boondi RTU MOG.",
    status: "open",
  },
  {
    id: "exc-012",
    type: "mam-b",
    aplId: "apl-202400001",
    siteId: HYD,
    raisedOn: "2026-04-17T10:35:00+05:30",
    details:
      "APL 'Broccoli, UB, Frozen, 1×1 kg' has no matching MOG. Existing broccoli MOG covers fresh form only.",
    status: "open",
  },
  {
    id: "exc-013",
    type: "mam-b",
    aplId: "apl-102397",
    siteId: HYD,
    raisedOn: "2026-04-17T10:50:00+05:30",
    details:
      "APL 'Mayonnaise Eggless Cremica 1×1 kg' has no matching MOG. A Mayonnaise Sauce RTU MOG is required.",
    status: "open",
  },
];
