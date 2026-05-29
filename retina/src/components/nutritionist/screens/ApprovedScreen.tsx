// @ts-nocheck
import React, { useState, useRef } from "react";
import { Search, X, Filter, ArrowDownWideNarrow, Check, ChevronDown, ChevronLeft, ChevronRight, Calendar, RefreshCcw } from "lucide-react";
import { C } from "../data/tokens";
import { ARTS, APPR } from "../data/mockData";
import { PageHeader } from "../components/shared";
import { EditIngredientsPanel } from "../components/EditIngredientsPanel";
import { useNutritionist } from "../NutritionistContext";

/**
 * Submitted profiles — same layout as My Tasks but read-only.
 * Two tabs: Sent to Cookbook (green) and Rejected (red).
 */

export function ApprovedScreen() {
  const { selectedSites, removedIds } = useNutritionist();

  const [tab, setTab]             = useState("sent")     // "sent" | "rejected"
  const [searchQ, setSearchQ]     = useState("")
  const [sortBy, setSortBy]       = useState("newest")
  const [sortOpen, setSortOpen]   = useState(false)
  const [sortAnchor, setSortAnchor] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterAnchor, setFilterAnchor] = useState(null)
  const [filterCats, setFilterCats] = useState([])
  const [catOpen, setCatOpen]     = useState(false)
  // Date filters — visual only (mirrors My Tasks, which also doesn't filter rows by date).
  const [submFrom, setSubmFrom]       = useState("")  // submitted date
  const [submTo, setSubmTo]           = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")  // scanned date
  const [filterDateTo, setFilterDateTo]     = useState("")
  const [datePickerFor, setDatePickerFor]   = useState(null) // submStart|submEnd|scanStart|scanEnd
  const [pickerMonth, setPickerMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [listWidth, setListWidth] = useState(320)
  const [viewPanelArtId, setViewPanelArtId] = useState(null)
  const containerRef = useRef(null)
  const sortBtnRef   = useRef(null)
  const filterBtnRef = useRef(null)

  // ── Data per tab ──
  const sentIds      = [...new Set(APPR.map(a => a.artId))]
  const sentArts     = sentIds.map(id => ARTS.find(a => a.id === id)).filter(Boolean)
  const rejectedArts = ARTS.filter(a => a.rescanRequested)
  const ALL_CATS     = [...new Set(ARTS.map(a => a.cat))].sort()

  const TABS = [
    { key: "sent",     label: "Sent to Cookbook", dotClass: "bg-emerald-500", count: sentArts.filter(a=>selectedSites.includes(a.site) && !removedIds.includes(a.id)).length },
    { key: "rejected", label: "Re-scan Requested", dotClass: "bg-rose-500",   count: rejectedArts.filter(a=>selectedSites.includes(a.site) && !removedIds.includes(a.id)).length },
  ]

  // ── Build the filtered + sorted list ──
  const base = tab === "sent" ? sentArts : rejectedArts
  let list = base.filter(a => selectedSites.includes(a.site) && !removedIds.includes(a.id))
  if (filterCats.length) list = list.filter(a => filterCats.includes(a.cat))
  if (searchQ.trim()) {
    const q = searchQ.trim().toLowerCase()
    list = list.filter(a => a.name.toLowerCase().includes(q) || a.apl.toLowerCase().includes(q))
  }
  list = [...list].sort((a, b) => {
    if (sortBy === "name")     return a.name.localeCompare(b.name)
    if (sortBy === "oldest")   return a.id - b.id
    if (sortBy === "confLow")  return (a.conf ?? 0) - (b.conf ?? 0)
    if (sortBy === "confHigh") return (b.conf ?? 0) - (a.conf ?? 0)
    return b.id - a.id // newest
  })

  const panelArt = list.find(a => a.id === viewPanelArtId) || list[0] || null
  const activeFilters = (filterCats.length ? 1 : 0) + (submFrom ? 1 : 0) + (submTo ? 1 : 0) + (filterDateFrom ? 1 : 0) + (filterDateTo ? 1 : 0)

  // ── List column resize ──
  const startListDrag = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = listWidth
    const onMove = (mv) => setListWidth(Math.min(520, Math.max(220, startW + (mv.clientX - startX))))
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""; document.body.style.userSelect = ""
    }
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  const toggleCat = (c) => setFilterCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <PageHeader title="Submitted Profiles" divider={false} dense/>

      {/* Tabs — Sent to Cookbook (green) / Rejected (red), My Tasks pill style */}
      <div className="flex-shrink-0 flex items-center px-3 pb-2 bg-card gap-2 border-b border-border">
        <nav className="inline-flex items-center bg-stone-200/70 rounded-lg p-1 gap-0.5 shrink min-w-0 overflow-x-auto">
          {TABS.map(t => {
            const on = tab === t.key
            return (
              <button key={t.key}
                onClick={() => { setTab(t.key); setSearchQ("") }}
                className={`inline-flex items-center gap-2 h-7 px-2.5 rounded-md transition-all shrink-0 ${
                  on
                    ? "bg-card text-foreground font-semibold shadow-soft"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}>
                <span className="text-[12.5px] whitespace-nowrap">{t.label}</span>
                <span className={`tabular-nums text-[11px] px-1.5 py-0.5 rounded font-semibold ${
                  on ? "bg-foreground/10 text-foreground/85" : "bg-stone-300/60 text-muted-foreground/90"
                }`}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>


      {/* ── Main body: list + read-only detail panel ── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* ── LIST COLUMN ── */}
        <div className="flex flex-col overflow-hidden flex-shrink-0 bg-background relative"
          style={{ width: listWidth, minWidth: 220, maxWidth: 520 }}>

          {/* Search + Filter + Sort (no move button) */}
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5"
            style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.card }}>
            {/* Search box */}
            <div className="relative flex-1 min-w-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search articles..."
                className="w-full h-9 rounded-md border bg-card pl-8 pr-7 text-[12.5px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{ borderColor: C.border, color: C.fg }}
              />
              {searchQ && (
                <button onClick={() => setSearchQ("")} aria-label="Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40">
                  <X size={11}/>
                </button>
              )}
            </div>

            {/* Filter button */}
            <div className="flex-shrink-0">
              <button
                ref={filterBtnRef}
                onClick={() => {
                  setSortOpen(false); setSortAnchor(null)
                  setFilterOpen(o => {
                    const next = !o
                    if (next && filterBtnRef.current) {
                      const r = filterBtnRef.current.getBoundingClientRect()
                      setFilterAnchor({ top: r.bottom + 6, left: r.left })
                    } else { setFilterAnchor(null) }
                    return next
                  })
                }}
                aria-label="Filter"
                className="inline-flex items-center justify-center rounded-md border transition-colors"
                style={{
                  width: 36, height: 36,
                  borderColor: activeFilters > 0 ? C.prBdr : C.border,
                  backgroundColor: activeFilters > 0 ? "#FEF9EE" : C.card,
                  color: activeFilters > 0 ? C.pr : C.mutedFg,
                  position: "relative",
                }}>
                <Filter size={14}/>
                {activeFilters > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: "#E53935" }}/>
                )}
              </button>
              {filterOpen && filterAnchor && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => { setFilterOpen(false); setFilterAnchor(null); setCatOpen(false); setDatePickerFor(null) }}/>
                  <div className="fixed z-[70]"
                    style={{ top: filterAnchor.top, left: filterAnchor.left, width: 320,
                             backgroundColor: C.card, border: `1px solid ${C.border3}`, borderRadius: 14,
                             boxShadow: "0 12px 32px rgba(26,26,26,0.14)", padding: "16px 18px 18px" }}>
                    {/* CATEGORY — multi-select dropdown (same as My Tasks) */}
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.mutedFg, marginBottom: 8 }}>Category</p>
                    {(() => {
                      const label = filterCats.length === 0 ? "All categories"
                        : filterCats.length === 1 ? filterCats[0]
                        : `${filterCats.length} categories selected`
                      return (
                        <div className="relative w-full">
                          <button type="button" onClick={() => setCatOpen(o => !o)}
                            className="w-full inline-flex items-center justify-between transition-colors"
                            style={{ height: 42, borderRadius: 10, border: `1px solid ${catOpen ? C.pr : C.border}`, backgroundColor: catOpen ? "#FEF9EE" : "#fff", padding: "0 12px", cursor: "pointer" }}>
                            <span style={{ fontSize: 13, color: filterCats.length ? C.fg : C.mutedFg, fontWeight: filterCats.length ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
                            <ChevronDown size={14} style={{ color: catOpen ? C.pr : C.mutedFg, flexShrink: 0, transition: "transform 0.15s", transform: catOpen ? "rotate(180deg)" : "none" }}/>
                          </button>
                          {catOpen && (
                            <>
                              <div className="fixed inset-0 z-[72]" onClick={() => setCatOpen(false)}/>
                              <div className="absolute z-[73] w-full mt-1.5 py-1.5" style={{ backgroundColor: C.card, border: `1px solid ${C.border3}`, borderRadius: 10, boxShadow: "0 8px 20px rgba(26,26,26,0.12)" }}>
                                {filterCats.length > 0 && (
                                  <button onClick={() => setFilterCats([])}
                                    className="w-full flex items-center px-3 py-2 transition-colors"
                                    style={{ fontSize: 12, color: C.mutedFg, fontWeight: 500, textAlign: "left", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: "transparent" }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.muted}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                                    Clear selection
                                  </button>
                                )}
                                {ALL_CATS.map(c => {
                                  const on = filterCats.includes(c)
                                  return (
                                    <button key={c} onClick={() => toggleCat(c)}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors"
                                      style={{ cursor: "pointer", background: "transparent", textAlign: "left" }}
                                      onMouseEnter={e => e.currentTarget.style.backgroundColor = C.muted}
                                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                                      <span className="inline-flex items-center justify-center flex-shrink-0" style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${on ? C.pr : C.border2}`, backgroundColor: on ? C.pr : "#fff" }}>
                                        {on && <Check size={11} color="#fff" strokeWidth={3}/>}
                                      </span>
                                      <span style={{ fontSize: 13, color: C.fg, fontWeight: on ? 600 : 500 }}>{c}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })()}

                    {/* SUBMITTED DATE — new, sits between Category and Scanned Date */}
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.mutedFg, marginTop: 18, marginBottom: 8 }}>Submitted Date</p>
                    <div className="flex items-center gap-2">
                      {[{ key: "submStart", val: submFrom, ph: "Start date" }, { key: "submEnd", val: submTo, ph: "End date" }].map(d => {
                        const on = datePickerFor === d.key
                        const fmt = d.val ? new Date(d.val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""
                        return (
                          <button key={d.key} type="button"
                            onClick={() => { setDatePickerFor(prev => prev === d.key ? null : d.key); if (d.val) { const m = new Date(d.val); m.setDate(1); setPickerMonth(m) } }}
                            className="flex-1 inline-flex items-center justify-between transition-colors"
                            style={{ height: 42, borderRadius: 10, border: `1px solid ${on ? C.pr : C.border}`, backgroundColor: on ? "#FEF9EE" : "#fff", padding: "0 12px", cursor: "pointer" }}>
                            <span style={{ fontSize: 13, color: fmt ? C.fg : C.mutedFg, fontWeight: fmt ? 500 : 400 }}>{fmt || d.ph}</span>
                            <Calendar size={14} style={{ color: on ? C.pr : C.mutedFg, flexShrink: 0 }}/>
                          </button>
                        )
                      })}
                    </div>

                    {/* SCANNED DATE — same as My Tasks */}
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.mutedFg, marginTop: 18, marginBottom: 8 }}>Scanned Date</p>
                    <div className="flex items-center gap-2">
                      {[{ key: "scanStart", val: filterDateFrom, ph: "Start date" }, { key: "scanEnd", val: filterDateTo, ph: "End date" }].map(d => {
                        const on = datePickerFor === d.key
                        const fmt = d.val ? new Date(d.val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""
                        return (
                          <button key={d.key} type="button"
                            onClick={() => { setDatePickerFor(prev => prev === d.key ? null : d.key); if (d.val) { const m = new Date(d.val); m.setDate(1); setPickerMonth(m) } }}
                            className="flex-1 inline-flex items-center justify-between transition-colors"
                            style={{ height: 42, borderRadius: 10, border: `1px solid ${on ? C.pr : C.border}`, backgroundColor: on ? "#FEF9EE" : "#fff", padding: "0 12px", cursor: "pointer" }}>
                            <span style={{ fontSize: 13, color: fmt ? C.fg : C.mutedFg, fontWeight: fmt ? 500 : 400 }}>{fmt || d.ph}</span>
                            <Calendar size={14} style={{ color: on ? C.pr : C.mutedFg, flexShrink: 0 }}/>
                          </button>
                        )
                      })}
                    </div>

                    {activeFilters > 0 && (
                      <button onClick={() => { setFilterCats([]); setSubmFrom(""); setSubmTo(""); setFilterDateFrom(""); setFilterDateTo("") }}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg transition-colors"
                        style={{ fontSize: 12, fontWeight: 600, color: C.pr, border: `1px solid ${C.prBdr}`, backgroundColor: "#FEF9EE" }}>
                        <RefreshCcw size={11}/> Clear all filters
                      </button>
                    )}
                  </div>

                  {/* Calendar picker — shared by both date ranges */}
                  {datePickerFor && (() => {
                    const curVal = datePickerFor === "submStart" ? submFrom : datePickerFor === "submEnd" ? submTo : datePickerFor === "scanStart" ? filterDateFrom : filterDateTo
                    const applyDate = (v) => {
                      if (datePickerFor === "submStart") setSubmFrom(v)
                      else if (datePickerFor === "submEnd") setSubmTo(v)
                      else if (datePickerFor === "scanStart") setFilterDateFrom(v)
                      else setFilterDateTo(v)
                    }
                    const month = pickerMonth
                    const y = month.getFullYear(); const m = month.getMonth()
                    const firstDow = new Date(y, m, 1).getDay()
                    const daysInMonth = new Date(y, m + 1, 0).getDate()
                    const monthName = month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
                    const selDate = curVal ? new Date(curVal) : null
                    const today = new Date()
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
                    const cells = []
                    for (let i = 0; i < firstDow; i++) cells.push(null)
                    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
                    const setDate = (d) => { const v = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; applyDate(v); setDatePickerFor(null) }
                    const shiftMonth = (delta) => setPickerMonth(new Date(y, m + delta, 1))
                    return (
                      <div style={{ position: "fixed", top: filterAnchor.top, left: filterAnchor.left + 320 + 10, width: 280, backgroundColor: C.card, border: `1px solid ${C.border3}`, borderRadius: 14, boxShadow: "0 12px 32px rgba(26,26,26,0.14)", padding: "14px 14px 16px", zIndex: 71 }}>
                        <div className="flex items-center justify-between mb-2">
                          <button onClick={() => shiftMonth(-1)} className="inline-flex items-center justify-center rounded-md" style={{ width: 28, height: 28, border: `1px solid ${C.border}`, backgroundColor: "#fff", color: C.mutedFg, cursor: "pointer" }}><ChevronLeft size={14}/></button>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.fg }}>{monthName}</span>
                          <button onClick={() => shiftMonth(1)} className="inline-flex items-center justify-center rounded-md" style={{ width: 28, height: 28, border: `1px solid ${C.border}`, backgroundColor: "#fff", color: C.mutedFg, cursor: "pointer" }}><ChevronRight size={14}/></button>
                        </div>
                        <div className="grid grid-cols-7 gap-0 mb-1">
                          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                            <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: C.mutedFg, padding: "4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                          {cells.map((d, i) => {
                            if (d === null) return <div key={i}/>
                            const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
                            const isSel = selDate && selDate.getFullYear() === y && selDate.getMonth() === m && selDate.getDate() === d
                            const isToday = dStr === todayStr
                            return (
                              <button key={i} onClick={() => setDate(d)}
                                className="inline-flex items-center justify-center transition-colors"
                                style={{ height: 32, borderRadius: 6, fontSize: 12, fontWeight: isSel ? 700 : 500, border: "none", cursor: "pointer", color: isSel ? "#fff" : isToday ? C.pr : C.fg, backgroundColor: isSel ? C.pr : "transparent", outline: isToday && !isSel ? `1px solid ${C.prBdr}` : "none" }}
                                onMouseEnter={e => { if (!isSel) e.currentTarget.style.backgroundColor = C.muted }}
                                onMouseLeave={e => { if (!isSel) e.currentTarget.style.backgroundColor = "transparent" }}>
                                {d}
                              </button>
                            )
                          })}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                          <button onClick={() => { applyDate(""); setDatePickerFor(null) }} style={{ fontSize: 11, color: C.mutedFg, fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", padding: "4px 2px" }}>Clear</button>
                          <button onClick={() => setDate(new Date().getDate())} style={{ fontSize: 11, color: C.pr, fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", padding: "4px 2px" }}>Today</button>
                        </div>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>

            {/* Sort button */}
            <div className="flex-shrink-0">
              <button
                ref={sortBtnRef}
                onClick={() => {
                  setFilterOpen(false); setFilterAnchor(null)
                  setSortOpen(o => {
                    const next = !o
                    if (next && sortBtnRef.current) {
                      const r = sortBtnRef.current.getBoundingClientRect()
                      setSortAnchor({ top: r.bottom + 6, right: window.innerWidth - r.right })
                    } else { setSortAnchor(null) }
                    return next
                  })
                }}
                aria-label="Sort"
                className="inline-flex items-center justify-center rounded-md border transition-colors"
                style={{
                  width: 36, height: 36,
                  borderColor: sortBy !== "newest" ? C.prBdr : C.border,
                  backgroundColor: sortBy !== "newest" ? "#FEF9EE" : C.card,
                  color: sortBy !== "newest" ? C.pr : C.mutedFg,
                }}>
                <ArrowDownWideNarrow size={14}/>
              </button>
              {sortOpen && sortAnchor && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => { setSortOpen(false); setSortAnchor(null) }}/>
                  <div className="fixed z-[70] rounded-xl py-1.5 w-52"
                    style={{ top: sortAnchor.top, right: sortAnchor.right, backgroundColor: C.card,
                             border: `1px solid ${C.border3}`, boxShadow: "0 8px 16px rgba(26,26,26,0.12)" }}>
                    <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.05em]" style={{ color: C.mutedFg }}>Sort by</p>
                    {[
                      { k: "newest",   label: "Newest first" },
                      { k: "oldest",   label: "Oldest first" },
                      { k: "name",     label: "Name (A → Z)" },
                      { k: "confLow",  label: "Confidence (low → high)" },
                      { k: "confHigh", label: "Confidence (high → low)" },
                    ].map(o => {
                      const on = sortBy === o.k
                      return (
                        <button key={o.k} onClick={() => { setSortBy(o.k); setSortOpen(false) }}
                          className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors"
                          style={{ fontSize: 12.5, color: on ? C.pr : C.fg, fontWeight: on ? 600 : 500, backgroundColor: on ? "#FEF9EE" : "transparent" }}
                          onMouseEnter={e => { if (!on) e.currentTarget.style.backgroundColor = C.muted }}
                          onMouseLeave={e => { if (!on) e.currentTarget.style.backgroundColor = "transparent" }}>
                          {o.label}
                          {on && <Check size={12} strokeWidth={3}/>}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto">
            <div className="overflow-x-auto bg-card">
              <table className="w-full text-left">
                <tbody>
                  {list.length ? list.map(a => {
                    const isActive = a.id === (panelArt?.id ?? null)
                    return (
                      <tr key={a.id}
                        className={`cursor-pointer transition-colors border-b border-border/60 ${
                          isActive ? "bg-[#F0EDE6]" : "hover:bg-[#F5F3EE]"
                        }`}
                        onClick={() => setViewPanelArtId(a.id)}>
                        <td className="pl-3 pr-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className={`text-[13px] ${isActive ? "font-semibold" : "font-medium"} text-foreground`}>{a.name}</p>
                            {a.sme && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border flex-shrink-0 text-[9px] font-bold uppercase tracking-wide bg-primary/10 text-primary border-primary/30">
                                SME Updated
                              </span>
                            )}
                            {a.retired && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border flex-shrink-0 text-[9px] font-bold uppercase tracking-wide bg-stone-200 text-stone-500 border-stone-300">
                                APL Retired
                              </span>
                            )}
                          </div>
                          <p className="text-[11.5px] text-muted-foreground">{a.apl}</p>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr><td className="text-center py-16">
                      <p style={{ fontSize: 13, color: C.mutedFg, fontWeight: 500 }}>
                        {selectedSites.length === 0 ? "Select a site to load articles" : "No articles in this view."}
                      </p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* List resize handle (right edge) */}
          <div
            onMouseDown={startListDrag}
            style={{ position: "absolute", top: 0, right: 0, width: 5, height: "100%", cursor: "col-resize", zIndex: 10,
                     backgroundColor: "transparent", borderRight: `1px solid ${C.border}`, transition: "background-color 0.15s, border-color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.prBg; e.currentTarget.style.borderRightColor = C.pr }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderRightColor = C.border }}
          />
        </div>

        {/* ── READ-ONLY DETAIL PANEL ── */}
        {panelArt ? (
          <div className="flex flex-1 overflow-hidden" style={{ minWidth: 400, borderLeft: `1px solid ${C.border}` }}>
            <div className="flex-1 overflow-hidden">
              <EditIngredientsPanel key={panelArt.id} art={panelArt} viewOnly={true} onClose={() => {}}/>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center overflow-hidden"
            style={{ borderLeft: `1px solid ${C.border}`, backgroundColor: C.page }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: C.mutedFg }}>No article selected</p>
          </div>
        )}
      </div>
    </div>
  )
}
