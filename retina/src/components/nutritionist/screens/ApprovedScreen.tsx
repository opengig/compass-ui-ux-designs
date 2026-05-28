// @ts-nocheck
import React, { useState, useRef } from "react";
import { Search, X, Filter, ArrowUpDown, Check } from "lucide-react";
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
  const activeFilters = filterCats.length

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
      <div className="flex-shrink-0 flex items-center px-6 h-9 bg-card gap-2">
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

      {/* White gap + divider touching the content */}
      <div className="flex-shrink-0 h-2 bg-card border-b border-border"/>

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
                  <div className="fixed inset-0 z-[60]" onClick={() => { setFilterOpen(false); setFilterAnchor(null); setCatOpen(false) }}/>
                  <div className="fixed z-[70]"
                    style={{ top: filterAnchor.top, left: filterAnchor.left, width: 280,
                             backgroundColor: C.card, border: `1px solid ${C.border3}`, borderRadius: 14,
                             boxShadow: "0 12px 32px rgba(26,26,26,0.14)", padding: "16px 18px 18px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.mutedFg, marginBottom: 8 }}>
                      Category
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_CATS.map(c => {
                        const on = filterCats.includes(c)
                        return (
                          <button key={c} onClick={() => toggleCat(c)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
                            style={on
                              ? { backgroundColor: "#FEF9EE", color: C.pr, borderColor: C.prBdr }
                              : { backgroundColor: "#fff", color: C.mutedFg, borderColor: C.border }}>
                            {on && <Check size={10} strokeWidth={3}/>}{c}
                          </button>
                        )
                      })}
                    </div>
                    {activeFilters > 0 && (
                      <button onClick={() => setFilterCats([])}
                        className="mt-3 text-[11px] underline underline-offset-2"
                        style={{ color: C.pr }}>
                        Clear filter
                      </button>
                    )}
                  </div>
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
                <ArrowUpDown size={14}/>
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
                          isActive ? "bg-[#F0EDE6]" : "hover:bg-muted/40"
                        }`}
                        onClick={() => setViewPanelArtId(a.id)}>
                        <td className="pl-3 pr-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-[13px] font-medium text-foreground">{a.name}</p>
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
