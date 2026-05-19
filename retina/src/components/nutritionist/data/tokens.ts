/**
 * Nutritionist flow — Design System tokens.
 * Colour palette (C) and typography scale (T) for the nutritionist screens.
 * Extracted from the original artifact (retina.ai Design System §2–§3).
 */

// Brand colours — DS §2
export const C = {
  // Brand — DS §2.1
  pr: "#C68A1E", prBg: "#FEFDFC", prHov: "#B27A18", prBdr: "#E8C97A",
  am: "#7A5310",       // --brand-ink: brand text on light backgrounds
  // Surfaces — DS §2.2
  page: "#FBF9F5",     // --bg
  card: "#FFFFFF",     // --panel
  surfHov: "#F5F3EE",  // --surface-hover
  surfAct: "#F0EDE6",  // --surface-active
  muted: "#F5F3EE",    // alias for surfHov
  // Ink — DS §2.3
  fg: "#1A1A1A",       // --ink
  ink2: "#4A463E",     // --ink-2
  mutedFg: "#8A8275",  // --ink-3
  ink4: "#B8B0A1",     // --ink-4
  // Lines — DS §2.4
  border: "#ECE6DA",   // --line
  border2: "#E2DBCB",  // --line-2
  border3: "#D5CDBA",  // --line-3
  // Status: success — DS §2.5
  gr: "#1B8754", grBg: "#E6F2EA", grBdr: "#A8D9BC",
  // Status: error
  rd: "#C53030", rdBg: "#FCEAEA", rdBdr: "#EFA0A0",
  // Status: info
  info: "#1E5C7F", infoBg: "#E6EEF3", infoBdr: "#8BB8D4",
  // Status: warn (DS §2.5 — warn-soft is #FEF3E0)
  warnBg: "#FEF3E0", amBg: "#FEF3E0", amBdr: "#E8C97A",
} as const;

// Typography — DS §3.2 — Inter, compact scale
export const T: Record<string, any> = {
  // DS type scale
  display:    { fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1, fontFeatureSettings: '"tnum"' },
  h1:         { fontSize: 26, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.015em", lineHeight: 1.2 },
  h2:         { fontSize: 18, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.01em", lineHeight: 1.3 },
  h3:         { fontSize: 14, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.005em", lineHeight: 1.4 },
  body:       { fontSize: 13, fontWeight: 400, color: "#1A1A1A", lineHeight: 1.55 },
  small:      { fontSize: 12, fontWeight: 400, color: "#8A8275", lineHeight: 1.5 },
  label:      { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1.4 },
  mono:       { fontSize: 11, fontWeight: 500, fontFeatureSettings: '"tnum"', lineHeight: 1.5 },
  // Aliases kept for backwards compat
  heading:    { fontSize: 26, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.015em", lineHeight: 1.2 },
  cardTitle:  { fontSize: 18, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.01em", lineHeight: 1.3 },
  kpiLabel:   { fontSize: 11, fontWeight: 600, color: "#8A8275", textTransform: "uppercase", letterSpacing: "0.1em" },
  kpiVal:     { fontSize: 36, fontWeight: 600, fontFeatureSettings: '"tnum"', lineHeight: 1.1, letterSpacing: "-0.02em" },
  tableHdr:   { fontSize: 14, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.005em", whiteSpace: "nowrap" },
  tableNm:    { fontSize: 13, fontWeight: 600, color: "#1A1A1A" },
  tableMeta:  { fontSize: 12, fontWeight: 400, color: "#8A8275" },
  tableApl:   { fontSize: 11, fontWeight: 500, color: "#8A8275", fontFeatureSettings: '"tnum"' },
  badge:      { fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", lineHeight: 1.4, textTransform: "uppercase" },
  helper:     { fontSize: 12, fontWeight: 400, color: "#8A8275", lineHeight: 1.5 },
  micro:      { fontSize: 11, fontWeight: 600, color: "#8A8275", textTransform: "uppercase", letterSpacing: "0.1em" },
  navItem:    { fontSize: 13, fontWeight: 400 },
  tabLabel:   { fontSize: 12 },
  btnSm:      { fontSize: 12, fontWeight: 500 },
  btnDef:     { fontSize: 13, fontWeight: 500 },
  auditAct:   { fontSize: 13, fontWeight: 600, color: "#1A1A1A" },
  auditDet:   { fontSize: 12, fontWeight: 400, color: "#8A8275" },
  auditMeta:  { fontSize: 11, color: "#8A8275", fontFeatureSettings: '"tnum"' },
  modalTitle: { fontSize: 18, fontWeight: 600, color: "#1A1A1A", letterSpacing: "-0.01em" },
  toast:      { fontSize: 13, fontWeight: 600 },
  confHdr:    { fontSize: 11, fontWeight: 600, color: "#8A8275", textTransform: "uppercase", letterSpacing: "0.1em" },
  confReason: { fontSize: 12, fontWeight: 400, color: "#8A8275" },
};
