/**
 * Nutrient label dictionary + status normalisation helpers.
 *
 * `NNAMES` — human-readable labels for each nutrient key.
 * `_n` / `_full` / `_miss` — compact helpers used to seed mock article nutrient data.
 * `computeDisplayNuts` — remaps a article's nutrient confidence status (`c`) so the
 *   queue/distribution percentages line up with the legend in the design:
 *     • green articles: 15 scanned · 1 AI-estimated · 1 N/A
 *     • amber articles:  9 scanned · 4 AI-estimated · 4 N/A
 *     • red articles:    2 scanned · 13 missing · 2 N/A
 */

export const NNAMES: Record<string, string> = {
  energy: "Energy",
  protein: "Protein",
  carbs: "Carbohydrates",
  fat: "Total Fat",
  satfat: "Saturated Fat",
  sodium: "Sodium",
  fibre: "Dietary Fibre",
  sugar: "Added Sugar",
  potassium: "Potassium",
  mufa: "MUFA",
  pufa: "PUFA",
  calcium: "Calcium",
  iron: "Iron",
  zinc: "Zinc",
  vitA: "Vitamin A",
  vitC: "Vitamin C",
  gi: "Glycemic Index",
};

export type NutConfidence = "high" | "mid" | "llm" | "ai" | "missing" | "na";
export interface NutValue {
  v: string;
  u: string;
  c: NutConfidence;
}
export type NutMap = Record<string, NutValue>;

export const _n = (v: string, u: string, c: NutConfidence): NutValue => ({ v, u, c });

export const _full = (
  e: string, pr: string, cb: string, f: string, sf: string, so: string,
  fi: string, su: string, po: string, mu: string, pu: string, ca: string,
  ir: string, zn: string, va: string, vc: string, gi: string,
  st: NutConfidence, fg: NutConfidence
): NutMap => ({
  energy:    _n(e,  "kcal", st),
  protein:   _n(pr, "g",    st),
  carbs:     _n(cb, "g",    st),
  fat:       _n(f,  "g",    st),
  satfat:    _n(sf, "g",    st),
  sodium:    _n(so, "mg",   st),
  fibre:     _n(fi, "g",    fg),
  sugar:     _n(su, "g",    st),
  potassium: _n(po, "mg",   po === "N/A" ? "na" : st),
  mufa:      _n(mu, "g",    mu.startsWith("~") ? "llm" : st),
  pufa:      _n(pu, "g",    st),
  calcium:   _n(ca, "mg",   ca === "N/A" ? "na" : st),
  iron:      _n(ir, "mg",   ir === "N/A" ? "na" : st),
  zinc:      _n(zn, "mg",   zn === "N/A" ? "na" : st),
  vitA:      _n(va, "mcg",  "na"),
  vitC:      _n(vc, "mg",   "na"),
  gi:        _n(gi, "index", gi === "N/A" ? "na" : "mid"),
});

export const _miss = (): NutMap => ({
  energy:    _n("—", "kcal", "missing"),
  protein:   _n("—", "g",    "missing"),
  carbs:     _n("—", "g",    "missing"),
  fat:       _n("—", "g",    "missing"),
  satfat:    _n("—", "g",    "missing"),
  sodium:    _n("—", "mg",   "missing"),
  fibre:     _n("—", "g",    "missing"),
  sugar:     _n("—", "g",    "missing"),
  potassium: _n("—", "mg",   "missing"),
  mufa:      _n("—", "g",    "missing"),
  pufa:      _n("—", "g",    "missing"),
  calcium:   _n("—", "mg",   "missing"),
  iron:      _n("—", "mg",   "missing"),
  zinc:      _n("—", "mg",   "missing"),
  vitA:      _n("—", "mcg",  "missing"),
  vitC:      _n("—", "mg",   "missing"),
  gi:        _n("—", "index", "missing"),
});

/**
 * Returns a remapped copy of art.nuts where each nutrient's `c` (confidence)
 * is overridden to match the queue-type distribution rules.
 */
export function computeDisplayNuts(art: { status?: string; nuts?: NutMap } | null | undefined): NutMap {
  if (!art || !art.nuts) return {} as NutMap;
  const nuts = art.nuts;
  const keys = Object.keys(nuts); // 17 keys in NNAMES order

  // Placeholder scanned values for red articles (whose actual values are "—").
  const RED_SCAN_VALS: Record<string, string> = { energy: "284", protein: "8.1" };

  let statusSeq: NutConfidence[];
  if (art.status === "green") {
    // 15 Scanned · 1 AI Est. · 1 N/A → 88% ≈ 90%
    statusSeq = [...Array(15).fill("high"), "llm", "na"] as NutConfidence[];
  } else if (art.status === "amber") {
    // 9 Scanned · 4 AI Est. · 4 N/A → 53% ≈ 50%
    statusSeq = [...Array(9).fill("mid"), ...Array(4).fill("llm"), ...Array(4).fill("na")] as NutConfidence[];
  } else if (art.status === "red") {
    // 2 Scanned · 13 Missing · 2 N/A → 12% ≈ 10% scanned, 76% ≈ 80% missing
    statusSeq = [...Array(2).fill("high"), ...Array(13).fill("missing"), ...Array(2).fill("na")] as NutConfidence[];
  } else {
    return nuts;
  }

  return Object.fromEntries(
    keys.map((k, i) => {
      const orig = nuts[k];
      const c = statusSeq[i] ?? "na";
      let v = orig.v;

      if (art.status === "red") {
        if (c === "high") {
          v = orig.v && orig.v !== "—" ? orig.v : RED_SCAN_VALS[k] ?? "—";
        } else if (c === "missing") {
          v = "—";
        }
        // na: orig.v doesn't matter — input renders "N/A" via isNA guard
      }

      return [k, { v, u: orig.u, c }];
    })
  );
}
