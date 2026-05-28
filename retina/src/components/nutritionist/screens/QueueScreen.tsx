// @ts-nocheck
import React, { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Filter, ChevronLeft, ChevronRight, ChevronDown, Check, X, RefreshCcw, Search, ArrowDownWideNarrow, Calendar,
  FolderInput, Hand, Grab, ArrowRightLeft, ArrowDownToLine,
} from "lucide-react";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui";
import { C, T } from "../data/tokens";
import { ARTS } from "../data/mockData";
import { PageHeader, IssueChips } from "../components/shared";
import { BtnSecondary } from "../components/buttons";
import { EditIngredientsPanel } from "../components/EditIngredientsPanel";
import { NUTRITIONIST_ROUTES } from "../../../router/routes";
import { useNutritionist } from "../NutritionistContext";

/** Task queue with status tabs, filters, infinite scroll, and inline edit panel. */

export function QueueScreen() {
  const navigate = useNavigate();
  const { articleId } = useParams();
  const ctx = useNutritionist();
  const { selectedSites, queueTab, setQueueTab, highlightArtIds, setHighlightArtIds, setNavIds, showToast, removedIds } = ctx;
  const initialArtId = articleId ? Number(articleId) : null;
  const clearQueueArtId = () => navigate(NUTRITIONIST_ROUTES.queue, { replace: true });
  const openArt = (id, ro, ids) => {
    if (ids) setNavIds(ids);
    navigate(`/nutritionist/article/${id}`, { state: { viewOnly: !!ro, backTarget: "queue" } });
  };
  const [qIssues, setQIssues] = useState([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortBy, setSortBy] = useState("newest") // "newest" | "oldest" | "name" | "confLow" | "confHigh"
  const [searchQ, setSearchQ] = useState("")
  const [filterCats, setFilterCats] = useState([]) // multi-select; empty array = All categories
  const [catOpen, setCatOpen] = useState(false)
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [panelPos, setPanelPos] = useState({top:0,left:0})
  const [visibleCount, setVisibleCount] = useState(10)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [editPanelArtId, setEditPanelArtId] = useState(initialArtId ?? ARTS[0]?.id ?? null)
  const [panelWidth, setPanelWidth] = useState(70)
  const [listWidth, setListWidth] = useState(320)
  // Re-bucket via drag-and-drop. Status overrides live in-memory so the prototype
  // can demonstrate dragging articles between Review / Fix buckets at the bottom
  // of the list (per 26 May review).
  const [statusOverrides, setStatusOverrides] = useState({}) // {[artId]: "amber" | "red"}
  const [draggingId, setDraggingId] = useState(null)
  const [hoverBucket, setHoverBucket] = useState(null) // "amber" | "red" | null
  const [bucketMode, setBucketMode] = useState(false)  // toggles drag-to-rebucket UI
  // Snapshot of statusOverrides taken when the user enters bucket mode.
  // Used to (a) compute "how many articles moved this session" and (b) restore
  // them all in one shot when the Undo action on the Done toast is clicked.
  const [sessionBaseline, setSessionBaseline] = useState({})
  // Per-row "⋮" quick-move menu (alternative to drag). {id, top, right} | null
  const [rowMenu, setRowMenu] = useState(null)
  // Move/undo toast scoped to the article list (not the global shell toast).
  const [listToast, setListToast] = useState(null) // {msg, kind?, action?} | null
  const listToastTimer = useRef(null)
  const filterBtnRef = useRef(null)
  const sortBtnRef = useRef(null)
  const containerRef = useRef(null)
  const scrollRef = useRef(null)
  const sentinelRef = useRef(null)
  // Track popover anchor coords so the menu can be position:fixed and escape
  // ancestor overflow:hidden clipping (the table column clips otherwise).
  const [filterAnchor, setFilterAnchor] = useState(null) // {top, left}
  const [sortAnchor,   setSortAnchor]   = useState(null)
  // Custom calendar picker — opens beside the filter popover.
  const [datePickerFor, setDatePickerFor] = useState(null) // "start" | "end" | null
  const [pickerMonth, setPickerMonth] = useState(() => {
    const d = new Date(); d.setDate(1); return d
  })

  // When arriving from dashboard with a pre-selected article, open it and clear the flag
  useState(() => {
    if(initialArtId) { setEditPanelArtId(initialArtId); clearQueueArtId?.() }
  })

  // Scroll to first highlighted article when navigating from Incremental Article
  React.useEffect(() => {
    if(highlightArtIds.length > 0) {
      setTimeout(() => {
        const firstId = highlightArtIds[0]
        const el = document.querySelector(`[data-art-id="${firstId}"]`)
        if(el) el.scrollIntoView({ behavior:"smooth", block:"center" })
      }, 150)
    }
  }, [highlightArtIds])

  /* ── Drag-to-resize logic (right edit panel) ── */
  const startDrag = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = panelWidth
    const containerW = containerRef.current?.offsetWidth || window.innerWidth

    const onMove = (mv) => {
      const dx = startX - mv.clientX          // dragging left = panel grows
      const newPct = Math.min(75, Math.max(25, startW + (dx / containerW) * 100))
      setPanelWidth(newPct)
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  /* ── Drag-to-resize logic (left article list) ── */
  const startListDrag = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = listWidth
    const onMove = (mv) => {
      const dx = mv.clientX - startX
      setListWidth(Math.min(520, Math.max(180, startW + dx)))
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  // Reset visible count whenever tab or filters change
  const qf = queueTab
  const setQf = (v) => { setQueueTab(v); setVisibleCount(10) }
  const toggleCat = (c) => {
    setFilterCats(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c])
    setVisibleCount(10)
  }
  const toggleIssue = (k) => { setQIssues(prev => prev.includes(k) ? prev.filter(x=>x!==k) : [...prev,k]); setVisibleCount(10) }

  const siteFilteredArts = ARTS.filter(a => selectedSites.includes(a.site) && !removedIds.includes(a.id))
  // Tab labels + dot styles mirror /article-sme/review for consistency
  // Status dot colors avoid red/green (veg/non-veg connotation per 26 May review).
  // Sky → high confidence, Amber → review, Violet → fix.
  const tabStatus = (a) => statusOverrides[a.id] || a.status
  const STATUS_TABS = [
    {key:"all",  label:"All Pending Approval", dotClass: null, count: siteFilteredArts.length},
    {key:"green",label:"Ready To Cookbook", dotClass:null, count: siteFilteredArts.filter(a=>tabStatus(a)==="green").length},
    {key:"amber",label:"To Review", dotClass:null, count: siteFilteredArts.filter(a=>tabStatus(a)==="amber").length},
    {key:"red",  label:"To Fix",    dotClass:null, count: siteFilteredArts.filter(a=>tabStatus(a)==="red").length},
    {key:"sme",  label:"From SME", dotClass:null, count: siteFilteredArts.filter(a=>a.sme===true).length},
  ]
  const ISSUE_DEFS = [
    {key:"allergen",label:"Allergen",cls:"bg-[#FCEAEA] text-[#C53030] border-[#EFA0A0]"},
    {key:"nutrition",label:"Nutrition",cls:"bg-[#FEF9EE] text-[#7A5310] border-[#E8C97A]"},
    {key:"maycontain",label:"May Contain",cls:"bg-[#E6EEF3] text-[#1E5C7F] border-[#8BB8D4]"},
  ]

  const activeFilters = (filterCats.length ? 1 : 0) + qIssues.length + (filterDateFrom ? 1 : 0) + (filterDateTo ? 1 : 0)

  const effStatus = (a) => statusOverrides[a.id] || a.status
  let list = ARTS.filter(a => selectedSites.includes(a.site) && !removedIds.includes(a.id)).filter(a => {
    if(qf==="green") return effStatus(a)==="green"
    if(qf==="amber") return effStatus(a)==="amber"
    if(qf==="red")   return effStatus(a)==="red"
    if(qf==="sme")   return a.sme===true
    return true
  })
  if(filterCats.length) list = list.filter(a=>filterCats.includes(a.cat))
  if(qIssues.length) list = list.filter(a=>qIssues.some(iss=>{
    if(iss==="allergen")   return a.def_al?.length || a.prob_al?.length
    if(iss==="nutrition")  return Object.values(a.nuts||{}).some(n=>n.c==="missing")
    if(iss==="maycontain") return a.prob_al?.length
    return false
  }))
  // Search by name or APL code
  if(searchQ.trim()) {
    const q = searchQ.trim().toLowerCase()
    list = list.filter(a => a.name.toLowerCase().includes(q) || a.apl.toLowerCase().includes(q))
  }
  // Sorting
  list = [...list].sort((a,b) => {
    if(sortBy==="name")     return a.name.localeCompare(b.name)
    if(sortBy==="oldest")   return a.id - b.id
    if(sortBy==="confLow")  return (a.conf ?? 0) - (b.conf ?? 0)
    if(sortBy==="confHigh") return (b.conf ?? 0) - (a.conf ?? 0)
    return b.id - a.id // newest first
  })

  const visibleList = list.slice(0, visibleCount)

  // Infinite scroll: observe sentinel, load more after 2s delay
  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingMore && visibleCount < list.length) {
        setIsLoadingMore(true)
        setTimeout(() => {
          setVisibleCount(c => c + 10)
          setIsLoadingMore(false)
        }, 1000)
      }
    }, { threshold: 0.1 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isLoadingMore, visibleCount, list.length])

  // In-list toast (move confirmation / undo / warning) shown inside the article list column.
  const showListToast = (t) => {
    if (listToastTimer.current) clearTimeout(listToastTimer.current)
    setListToast(t)
    listToastTimer.current = setTimeout(() => setListToast(null), t.duration || 4000)
  }

  // Quick-move an article to another confidence bucket from the row "⋮" menu.
  const moveArticle = (id, toStatus) => {
    const art = ARTS.find(x => x.id === id)
    const label = toStatus === "amber" ? "To Review" : toStatus === "red" ? "To Fix" : "Ready To Cookbook"
    const prevOverride = statusOverrides[id]
    const currentStatus = prevOverride ?? art?.status
    setRowMenu(null)
    if (currentStatus === toStatus) {
      showListToast({ msg: `${art?.name || "Article"} is already in ${label}`, kind: "warn", duration: 2800 })
      return
    }
    setStatusOverrides(prev => ({ ...prev, [id]: toStatus }))
    setHighlightArtIds([id])
    setTimeout(() => setHighlightArtIds([]), 2000)
    showListToast({
      msg: `Moved ${art?.name || "article"} to ${label}`,
      action: {
        label: "Undo",
        onClick: () => setStatusOverrides(prev => {
          const next = { ...prev }
          if (prevOverride === undefined) delete next[id]
          else next[id] = prevOverride
          return next
        }),
      },
      duration: 5000,
    })
  }

  // The drag-and-drop bucket area only slides up while an article is actually being dragged.
  const dragAreaOpen = bucketMode && draggingId != null

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <PageHeader title="My Tasks" divider={false} dense/>
      {/* Status tabs + filter — segmented pill control, matches /article-sme/review */}
      <div className="flex-shrink-0 flex items-center px-6 h-9 bg-card gap-2">
        <nav className="inline-flex items-center bg-stone-200/70 rounded-lg p-1 gap-0.5 shrink min-w-0 overflow-x-auto">
          {STATUS_TABS.map(t => {
            const on = qf === t.key
            return (
              <button key={t.key}
                onClick={()=>setQf(qf===t.key&&t.key!=="all"?"all":t.key)}
                className={`inline-flex items-center gap-2 h-7 px-2.5 rounded-md transition-all shrink-0 ${
                  on
                    ? "bg-card text-foreground font-semibold shadow-soft"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                {t.dotClass ? (
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${t.dotClass}`}/>
                ) : null}
                <span className="text-[12.5px] whitespace-nowrap">{t.label}</span>
                <span
                  className={`tabular-nums text-[11px] px-1.5 py-0.5 rounded font-semibold ${
                    on ? "bg-foreground/10 text-foreground/85" : "bg-stone-300/60 text-muted-foreground/90"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* White gap (no gray) + divider that touches the content below */}
      <div className="flex-shrink-0 h-2 bg-card border-b border-border"/>
      {/* ── Main body: table + optional inline edit panel ── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* ── TABLE COLUMN — resizable via drag handle ── */}
        <div className="flex flex-col overflow-hidden flex-shrink-0 bg-background relative"
          style={{width:listWidth, minWidth:220, maxWidth:520}}>

          {/* ── Search + Filter + Sort row — pinned at top of list ── */}
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5"
            style={{borderBottom:`1px solid ${C.border}`, backgroundColor:C.card}}>
            {/* Search box */}
            <div className="relative flex-1 min-w-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/>
              <input
                value={searchQ}
                onChange={e=>{ setSearchQ(e.target.value); setVisibleCount(10) }}
                placeholder="Search articles..."
                className="w-full h-9 rounded-md border bg-card pl-8 pr-7 text-[12.5px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                style={{borderColor:C.border, color:C.fg}}
              />
              {searchQ && (
                <button onClick={()=>{ setSearchQ(""); setVisibleCount(10) }}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40">
                  <X size={11}/>
                </button>
              )}
            </div>
            {/* Filter icon button */}
            <div className="flex-shrink-0">
              <button
                ref={filterBtnRef}
                onClick={()=>{
                  setSortOpen(false); setSortAnchor(null)
                  setFilterOpen(o=>{
                    const next = !o
                    if(next && filterBtnRef.current){
                      const r = filterBtnRef.current.getBoundingClientRect()
                      // Anchor by LEFT edge (matches reference) — popover extends to the right,
                      // overlapping the detail panel rather than colliding with the table column edge.
                      setFilterAnchor({top: r.bottom + 6, left: r.left})
                    } else { setFilterAnchor(null) }
                    return next
                  })
                }}
                aria-label="Filter"
                className="inline-flex items-center justify-center rounded-md border transition-colors"
                style={{
                  width:36, height:36,
                  borderColor: activeFilters>0 ? C.prBdr : C.border,
                  backgroundColor: activeFilters>0 ? "#FEF9EE" : C.card,
                  color: activeFilters>0 ? C.pr : C.mutedFg,
                  position:"relative",
                }}>
                <Filter size={14}/>
                {activeFilters>0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{backgroundColor:"#E53935"}}/>
                )}
              </button>
              {filterOpen && filterAnchor && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={()=>{ setFilterOpen(false); setFilterAnchor(null); setDatePickerFor(null) }}/>
                  <div className="fixed z-[70]"
                    style={{top:filterAnchor.top, left:filterAnchor.left,
                            width:320,
                            backgroundColor:C.card,
                            border:`1px solid ${C.border3}`,
                            borderRadius:14,
                            boxShadow:"0 12px 32px rgba(26,26,26,0.14)",
                            padding:"16px 18px 18px"}}>
                    {/* CATEGORY */}
                    <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",
                               textTransform:"uppercase",color:C.mutedFg,marginBottom:8}}>
                      Category
                    </p>
                    {/* Multi-select category dropdown — full width of popover */}
                    {(() => {
                      const CATS = ["Staples","Dairy","Bakery","Confectionery"]
                      const label = filterCats.length === 0
                        ? "All categories"
                        : filterCats.length === 1
                          ? filterCats[0]
                          : `${filterCats.length} categories selected`
                      return (
                        <div className="relative w-full">
                          <button type="button"
                            onClick={()=>setCatOpen(o=>!o)}
                            className="w-full inline-flex items-center justify-between transition-colors"
                            style={{
                              height:42, borderRadius:10,
                              border:`1px solid ${catOpen ? C.pr : C.border}`,
                              backgroundColor: catOpen ? "#FEF9EE" : "#fff",
                              padding:"0 12px", cursor:"pointer",
                            }}>
                            <span style={{fontSize:13,
                                          color: filterCats.length ? C.fg : C.mutedFg,
                                          fontWeight: filterCats.length ? 500 : 400,
                                          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                              {label}
                            </span>
                            <ChevronDown size={14}
                              style={{color: catOpen ? C.pr : C.mutedFg, flexShrink:0,
                                      transition:"transform 0.15s",
                                      transform: catOpen ? "rotate(180deg)" : "none"}}/>
                          </button>
                          {catOpen && (
                            <>
                              <div className="fixed inset-0 z-[72]" onClick={()=>setCatOpen(false)}/>
                              <div className="absolute z-[73] w-full mt-1.5 py-1.5"
                                style={{backgroundColor:C.card,
                                        border:`1px solid ${C.border3}`,
                                        borderRadius:10,
                                        boxShadow:"0 8px 20px rgba(26,26,26,0.12)"}}>
                                {filterCats.length>0 && (
                                  <button onClick={()=>{ setFilterCats([]); setVisibleCount(10) }}
                                    className="w-full flex items-center px-3 py-2 transition-colors"
                                    style={{fontSize:12, color:C.mutedFg, fontWeight:500, textAlign:"left",
                                            borderBottom:`1px solid ${C.border}`, cursor:"pointer", background:"transparent"}}
                                    onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.muted}
                                    onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
                                    Clear selection
                                  </button>
                                )}
                                {CATS.map(c=>{
                                  const on = filterCats.includes(c)
                                  return (
                                    <button key={c} onClick={()=>toggleCat(c)}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors"
                                      style={{cursor:"pointer", background:"transparent", textAlign:"left"}}
                                      onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.muted}
                                      onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
                                      <span className="inline-flex items-center justify-center flex-shrink-0"
                                        style={{
                                          width:16, height:16, borderRadius:4,
                                          border:`1.5px solid ${on ? C.pr : C.border2}`,
                                          backgroundColor: on ? C.pr : "#fff",
                                        }}>
                                        {on && <Check size={11} color="#fff" strokeWidth={3}/>}
                                      </span>
                                      <span style={{fontSize:13, color:C.fg, fontWeight: on ? 600 : 500}}>{c}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })()}

                    {/* SCANNED DATE */}
                    <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",
                               textTransform:"uppercase",color:C.mutedFg,
                               marginTop:18, marginBottom:8}}>
                      Scanned Date
                    </p>
                    <div className="flex items-center gap-2">
                      {[
                        {key:"start", val:filterDateFrom, ph:"Start date"},
                        {key:"end",   val:filterDateTo,   ph:"End date"},
                      ].map(d=>{
                        const on = datePickerFor === d.key
                        const fmt = d.val ? new Date(d.val).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : ""
                        return (
                          <button key={d.key} type="button"
                            onClick={()=>{
                              setDatePickerFor(prev => prev===d.key ? null : d.key)
                              if(d.val){
                                const m = new Date(d.val); m.setDate(1); setPickerMonth(m)
                              }
                            }}
                            className="flex-1 inline-flex items-center justify-between transition-colors"
                            style={{
                              height:42, borderRadius:10,
                              border:`1px solid ${on ? C.pr : C.border}`,
                              backgroundColor: on ? "#FEF9EE" : "#fff",
                              padding:"0 12px", cursor:"pointer",
                            }}>
                            <span style={{fontSize:13,
                                          color: fmt ? C.fg : C.mutedFg,
                                          fontWeight: fmt ? 500 : 400}}>
                              {fmt || d.ph}
                            </span>
                            <Calendar size={14} style={{color: on ? C.pr : C.mutedFg, flexShrink:0}}/>
                          </button>
                        )
                      })}
                    </div>

                    {activeFilters>0 && (
                      <button
                        onClick={()=>{ setFilterCats([]); setQIssues([]); setFilterDateFrom(""); setFilterDateTo("") }}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg transition-colors"
                        style={{fontSize:12,fontWeight:600,
                                color:C.pr, border:`1px solid ${C.prBdr}`,
                                backgroundColor:"#FEF9EE"}}>
                        <RefreshCcw size={11}/> Clear all filters
                      </button>
                    )}
                  </div>

                  {/* ── Calendar picker — appears beside the filter menu ── */}
                  {datePickerFor && (() => {
                    const month = pickerMonth
                    const y = month.getFullYear()
                    const m = month.getMonth()
                    const first = new Date(y, m, 1)
                    const firstDow = first.getDay() // 0 = Sun
                    const daysInMonth = new Date(y, m+1, 0).getDate()
                    const monthName = month.toLocaleDateString("en-IN",{month:"long",year:"numeric"})
                    const selectedStr = datePickerFor==="start" ? filterDateFrom : filterDateTo
                    const selDate = selectedStr ? new Date(selectedStr) : null
                    const today = new Date()
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`
                    const cells = []
                    for(let i=0; i<firstDow; i++) cells.push(null)
                    for(let d=1; d<=daysInMonth; d++) cells.push(d)
                    const setDate = (d) => {
                      const v = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`
                      if(datePickerFor==="start") setFilterDateFrom(v)
                      else setFilterDateTo(v)
                      setVisibleCount(10)
                      setDatePickerFor(null)
                    }
                    const shiftMonth = (delta) => {
                      const nm = new Date(y, m+delta, 1); setPickerMonth(nm)
                    }
                    return (
                      <div
                        style={{
                          position:"fixed",
                          top:filterAnchor.top, left:filterAnchor.left + 380 + 10,
                          width:280,
                          backgroundColor:C.card,
                          border:`1px solid ${C.border3}`,
                          borderRadius:14,
                          boxShadow:"0 12px 32px rgba(26,26,26,0.14)",
                          padding:"14px 14px 16px",
                          zIndex:71,
                        }}>
                        {/* Header: month + nav */}
                        <div className="flex items-center justify-between mb-2">
                          <button onClick={()=>shiftMonth(-1)}
                            className="inline-flex items-center justify-center rounded-md"
                            style={{width:28,height:28,border:`1px solid ${C.border}`,
                                    backgroundColor:"#fff",color:C.mutedFg,cursor:"pointer"}}>
                            <ChevronLeft size={14}/>
                          </button>
                          <span style={{fontSize:13,fontWeight:600,color:C.fg}}>{monthName}</span>
                          <button onClick={()=>shiftMonth(1)}
                            className="inline-flex items-center justify-center rounded-md"
                            style={{width:28,height:28,border:`1px solid ${C.border}`,
                                    backgroundColor:"#fff",color:C.mutedFg,cursor:"pointer"}}>
                            <ChevronRight size={14}/>
                          </button>
                        </div>
                        {/* Day-of-week header */}
                        <div className="grid grid-cols-7 gap-0 mb-1">
                          {["S","M","T","W","T","F","S"].map((d,i)=>(
                            <div key={i} style={{textAlign:"center",fontSize:10,fontWeight:700,
                                                  color:C.mutedFg,padding:"4px 0",
                                                  textTransform:"uppercase",letterSpacing:"0.05em"}}>
                              {d}
                            </div>
                          ))}
                        </div>
                        {/* Day grid */}
                        <div className="grid grid-cols-7 gap-0.5">
                          {cells.map((d,i)=>{
                            if(d===null) return <div key={i}/>
                            const dStr = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`
                            const isSel = selDate && selDate.getFullYear()===y && selDate.getMonth()===m && selDate.getDate()===d
                            const isToday = dStr===todayStr
                            return (
                              <button key={i} onClick={()=>setDate(d)}
                                className="inline-flex items-center justify-center transition-colors"
                                style={{
                                  height:32, borderRadius:6,
                                  fontSize:12, fontWeight: isSel?700:500,
                                  border:"none", cursor:"pointer",
                                  color: isSel ? "#fff" : isToday ? C.pr : C.fg,
                                  backgroundColor: isSel ? C.pr : "transparent",
                                  outline: isToday && !isSel ? `1px solid ${C.prBdr}` : "none",
                                }}
                                onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.backgroundColor=C.muted }}
                                onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.backgroundColor="transparent" }}>
                                {d}
                              </button>
                            )
                          })}
                        </div>
                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3 pt-2"
                          style={{borderTop:`1px solid ${C.border}`}}>
                          <button onClick={()=>{
                              if(datePickerFor==="start") setFilterDateFrom("")
                              else setFilterDateTo("")
                              setDatePickerFor(null)
                              setVisibleCount(10)
                            }}
                            style={{fontSize:11,color:C.mutedFg,fontWeight:600,
                                    background:"transparent",border:"none",cursor:"pointer",padding:"4px 2px"}}>
                            Clear
                          </button>
                          <button onClick={()=>{
                              const t = new Date()
                              setDate(t.getDate())
                            }}
                            style={{fontSize:11,color:C.pr,fontWeight:600,
                                    background:"transparent",border:"none",cursor:"pointer",padding:"4px 2px"}}>
                            Today
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
            {/* Rebucket / drag-mode toggle — same icon-button style as Filter/Sort */}
            <div className="flex-shrink-0">
              <button
                onClick={()=>{
                  setBucketMode(o=>{
                    if(!o){
                      // Entering bucket mode — snapshot current overrides as baseline
                      setSessionBaseline({...statusOverrides})
                    }
                    return !o
                  })
                  setFilterOpen(false); setFilterAnchor(null)
                  setSortOpen(false); setSortAnchor(null)
                }}
                aria-label={bucketMode ? "Hide rebucket zones" : "Show rebucket zones"}
                title={bucketMode ? "Hide buckets" : "Move articles between buckets"}
                className="inline-flex items-center justify-center rounded-md border transition-colors"
                style={{
                  width:36, height:36,
                  borderColor: bucketMode ? C.prBdr : C.border,
                  backgroundColor: bucketMode ? "#FEF9EE" : C.card,
                  color: bucketMode ? C.pr : C.mutedFg,
                }}>
                <FolderInput size={14}/>
              </button>
            </div>

            {/* Sort icon button */}
            <div className="flex-shrink-0">
              <button
                ref={sortBtnRef}
                onClick={()=>{
                  setFilterOpen(false); setFilterAnchor(null)
                  setSortOpen(o=>{
                    const next = !o
                    if(next && sortBtnRef.current){
                      const r = sortBtnRef.current.getBoundingClientRect()
                      setSortAnchor({top: r.bottom + 6, right: window.innerWidth - r.right})
                    } else { setSortAnchor(null) }
                    return next
                  })
                }}
                aria-label="Sort"
                className="inline-flex items-center justify-center rounded-md border transition-colors"
                style={{
                  width:36, height:36,
                  borderColor: sortBy!=="newest" ? C.prBdr : C.border,
                  backgroundColor: sortBy!=="newest" ? "#FEF9EE" : C.card,
                  color: sortBy!=="newest" ? C.pr : C.mutedFg,
                }}>
                <ArrowDownWideNarrow size={14}/>
              </button>
              {sortOpen && sortAnchor && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={()=>{ setSortOpen(false); setSortAnchor(null) }}/>
                  <div className="fixed z-[70] rounded-xl py-1.5 w-52"
                    style={{top:sortAnchor.top, right:sortAnchor.right, backgroundColor:C.card,
                            border:`1px solid ${C.border3}`,
                            boxShadow:"0 8px 16px rgba(26,26,26,0.12)"}}>
                    <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.05em]"
                      style={{color:C.mutedFg}}>Sort by</p>
                    {[
                      {k:"newest",   label:"Newest first"},
                      {k:"oldest",   label:"Oldest first"},
                      {k:"name",     label:"Name (A → Z)"},
                      {k:"confLow",  label:"Confidence (low → high)"},
                      {k:"confHigh", label:"Confidence (high → low)"},
                    ].map(o=>{
                      const on = sortBy===o.k
                      return (
                        <button key={o.k} onClick={()=>{ setSortBy(o.k); setSortOpen(false); setVisibleCount(10) }}
                          className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors"
                          style={{fontSize:12.5, color:on?C.pr:C.fg, fontWeight: on?600:500,
                                  backgroundColor: on?"#FEF9EE":"transparent"}}
                          onMouseEnter={e=>{ if(!on) e.currentTarget.style.backgroundColor=C.muted }}
                          onMouseLeave={e=>{ if(!on) e.currentTarget.style.backgroundColor="transparent" }}>
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

          <div className="flex-1 overflow-y-auto">
            <div>
              {/* Card wrapper removed — its default py-6 created an unwanted
                  gap between the search row and the first article. */}
              <div className="overflow-x-auto bg-card">
                <table className="w-full text-left">
                  <tbody>
                      {visibleList.length ? visibleList.map(a=>{
                        const isActive = a.id === editPanelArtId
                        const highlightIndex = highlightArtIds.indexOf(a.id)
                        const isHighlighted = highlightIndex !== -1
                        const effectiveStatus = statusOverrides[a.id] || a.status
                        const isDragging = draggingId === a.id
                        return (
                          <tr key={a.id} data-art-id={a.id}
                            draggable={bucketMode}
                            onDragStart={(e)=>{
                              if(!bucketMode) return
                              setDraggingId(a.id)
                              e.dataTransfer.effectAllowed = "move"
                              e.dataTransfer.setData("text/plain", String(a.id))
                              // Replace the default drag image with a styled card so the
                              // preview reads cleanly outside its table context.
                              if(e.dataTransfer.setDragImage){
                                const ghost = document.createElement("div")
                                ghost.style.cssText = [
                                  "position:absolute","top:-1000px","left:-1000px",
                                  "padding:8px 14px","min-width:180px","max-width:260px",
                                  "background:#fff",
                                  "border:1px solid #ECE6DA",
                                  "border-left:3px solid #C68A1E",
                                  "border-radius:10px",
                                  "box-shadow:0 16px 32px rgba(0,0,0,0.18)",
                                  "font:600 13px Inter, system-ui, sans-serif",
                                  "color:#1A1A1A",
                                  "transform:rotate(-2deg)",
                                  "pointer-events:none",
                                ].join(";")
                                ghost.innerHTML = `
                                  <div style="display:flex;align-items:center;gap:6px;">
                                    <span style="font-size:13px;font-weight:700;">${a.name}</span>
                                  </div>
                                  <div style="font-size:11px;color:#8A8275;margin-top:2px;font-weight:500;">${a.apl}</div>
                                `
                                document.body.appendChild(ghost)
                                e.dataTransfer.setDragImage(ghost, 14, 14)
                                setTimeout(()=>{ try { document.body.removeChild(ghost) } catch(_){} }, 0)
                              }
                            }}
                            onDragEnd={()=>{ setDraggingId(null); setHoverBucket(null) }}
                            className={`border-b border-border/60 ${
                              isActive
                                ? "bg-[#F0EDE6]"
                                : "hover:bg-muted/40"
                            } ${bucketMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                            style={{
                              animation: isHighlighted ? `artGlow 2s ease-in-out 0s both` : "none",
                              opacity: isDragging ? 0.35 : 1,
                              transform: isDragging ? "scale(0.985)" : "scale(1)",
                              transition: "opacity 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1), background-color 0.15s ease",
                              willChange: bucketMode ? "transform, opacity" : "auto",
                            }}
                            onClick={()=>{ if(!bucketMode) setEditPanelArtId(a.id) }}>
                            {bucketMode && (
                              <td className="pl-2 pr-0 py-3" style={{width:26}}>
                                {/* Hand (palm) when idle, fist (Grab) when this row is being dragged */}
                                {isDragging ? (
                                  <Grab size={15}
                                    style={{
                                      color: C.pr, flexShrink:0,
                                      transition:"color 0.15s ease, transform 0.15s ease",
                                      transform: "scale(1.15)",
                                    }}/>
                                ) : (
                                  <Hand size={15}
                                    style={{
                                      color: C.mutedFg, flexShrink:0,
                                      transition:"color 0.15s ease, transform 0.15s ease",
                                    }}/>
                                )}
                              </td>
                            )}
                            <td className="pl-3 pr-4 py-3">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <p className={`${editPanelArtId ? "text-[12px]" : "text-[13px]"} font-medium ${isActive ? "text-foreground" : "text-foreground"}`}>{a.name}</p>
                                {bucketMode && (() => {
                                  const cfg = effectiveStatus==="green" ? {l:"Ready To Cookbook", c:"bg-teal-50 text-teal-700 border-teal-200"}
                                            : effectiveStatus==="amber" ? {l:"To Review",         c:"bg-slate-100 text-slate-700 border-slate-200"}
                                            : effectiveStatus==="red"   ? {l:"To Fix",            c:"bg-gray-100 text-gray-600 border-gray-200"}
                                            : {l:"—", c:"bg-stone-100 text-stone-500 border-stone-200"}
                                  return (
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border flex-shrink-0 text-[9px] font-bold uppercase tracking-wide ${cfg.c}`}>
                                      {cfg.l}
                                    </span>
                                  )
                                })()}
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
                              <p className={`text-[11.5px] ${isActive ? "text-muted-foreground" : "text-muted-foreground"}`}>{a.apl}</p>
                            </td>
                            {!editPanelArtId && <td className="px-4 py-3"><IssueChips art={a}/></td>}
                            {!bucketMode && (
                              <td className="pr-2 py-3 text-right align-middle" style={{width:34}}>
                                {!a.retired && (
                                  <button
                                    onClick={(e)=>{
                                      e.stopPropagation()
                                      const r = e.currentTarget.getBoundingClientRect()
                                      setRowMenu(rm => rm?.id===a.id ? null : { id:a.id, top:r.bottom+4, right: window.innerWidth - r.right })
                                    }}
                                    aria-label="Move article"
                                    title="Move article"
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                    <ArrowRightLeft size={14}/>
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        )
                      }) : (
                        <tr><td colSpan={(bucketMode ? 1 : 0) + (editPanelArtId ? 1 : 2)} className="text-center py-16">
                          <div className="flex flex-col items-center gap-2">
                            {selectedSites.length === 0 ? (
                              <>
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{opacity:0.35}}>
                                  <rect x="4" y="8" width="24" height="18" rx="3" stroke={C.mutedFg} strokeWidth="1.5" fill="none"/>
                                  <path d="M4 13h24" stroke={C.mutedFg} strokeWidth="1.5"/>
                                  <circle cx="24" cy="24" r="7" fill={C.page} stroke={C.mutedFg} strokeWidth="1.5"/>
                                  <path d="M21.5 24h5M24 21.5v5" stroke={C.mutedFg} strokeWidth="1.5" strokeLinecap="round" transform="rotate(45 24 24)"/>
                                </svg>
                                <p style={{fontSize:13,color:C.mutedFg,fontWeight:500}}>There are no articles to review</p>
                                <p style={{fontSize:11,color:C.ink4}}>Select a site to load articles</p>
                              </>
                            ) : (
                              <p style={{fontSize:13,color:C.mutedFg,fontWeight:500}}>No articles match this filter.</p>
                            )}
                          </div>
                        </td></tr>
                      )}
                  </tbody>
                </table>
              </div>
              {/* Infinite scroll sentinel + loader */}
              <div ref={sentinelRef} style={{height:1}}/>
              {isLoadingMore && (
                <div className="flex items-center justify-center gap-2 py-5" style={{borderTop:`1px solid ${C.border}`}}>
                  <svg width="18" height="18" viewBox="0 0 18 18" style={{animation:"spin 0.8s linear infinite"}}>
                    <circle cx="9" cy="9" r="7" fill="none" stroke={C.border} strokeWidth="2.5"/>
                    <path d="M9 2 A7 7 0 0 1 16 9" fill="none" stroke={C.pr} strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <span style={{fontSize:12,color:C.mutedFg,fontWeight:500}}>Loading more articles…</span>
                </div>
              )}
              {!isLoadingMore && visibleCount >= list.length && list.length > 0 && (
                <div className="flex items-center justify-center py-4">
                  <span style={{fontSize:11,color:C.mutedFg}}>All {list.length} articles loaded</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Drag-to-rebucket drop zones — slide up from bottom when bucket mode is on ── */}
          {/* Per 26 May review: nutritionist re-buckets articles by dragging them
              into Review (Amber) or Fix (Red) zones. Hidden by default; revealed
              via the Move icon button beside Sort. */}
          <div className="flex-shrink-0 flex flex-col gap-1.5 overflow-hidden"
            style={{
              borderTop: dragAreaOpen ? `1px solid ${C.border}` : "none",
              backgroundColor:C.page,
              padding: dragAreaOpen ? "8px 8px 10px" : "0 8px",
              maxHeight: dragAreaOpen ? 150 : 0,
              opacity: dragAreaOpen ? 1 : 0,
              transform: dragAreaOpen ? "translateY(0)" : "translateY(20px)",
              transition: "max-height 0.22s cubic-bezier(0.4,0,0.2,1), padding 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease, transform 0.22s cubic-bezier(0.4,0,0.2,1)",
              pointerEvents: dragAreaOpen ? "auto" : "none",
            }}>
            {/* Instruction */}
            <p style={{fontSize:10.5,fontWeight:600,color:C.mutedFg,textAlign:"center",letterSpacing:"0.01em"}}>
              {draggingId != null ? "Drop the article into a bucket" : "Drag an article to move it between buckets"}
            </p>
            {/* Buckets + Done */}
            <div className="flex items-stretch gap-2" style={{minHeight:58}}>
            {/* Drop zones appear only while dragging, filtered by the dragged article's bucket */}
            <div className="flex-1 flex gap-2">
            {(() => {
              const BUCKET_DEFS = {
                green: {key:"green", label:"Ready To Cookbook", sub:"Drop here", color:"#0D9488", bg:"#F0FDFA", bdr:"#99F6E4"},
                amber: {key:"amber", label:"To Review",         sub:"Drop here", color:"#475569", bg:"#F1F5F9", bdr:"#CBD5E1"},
                red:   {key:"red",   label:"To Fix",            sub:"Drop here", color:"#6B7280", bg:"#F9FAFB", bdr:"#D1D5DB"},
              }
              const dragArt = draggingId != null ? ARTS.find(a => a.id === draggingId) : null
              const dragStatus = dragArt ? (statusOverrides[draggingId] ?? dragArt.status) : null
              const targetKeys = dragStatus === "amber" ? ["green","red"] : dragStatus ? ["amber"] : []
              return targetKeys.map(k => BUCKET_DEFS[k])
            })().map(b => {
              const isHover = hoverBucket === b.key
              const isDragActive = draggingId !== null
              // Articles moved into this bucket since the user entered bucket mode.
              const sessionCount = Object.keys(statusOverrides).reduce((n, id) => {
                if(statusOverrides[id] === b.key && sessionBaseline[id] !== b.key) return n+1
                return n
              }, 0)
              return (
                <div key={b.key} className="flex-1"
                  onDragOver={(e)=>{ e.preventDefault(); e.dataTransfer.dropEffect="move"; setHoverBucket(b.key) }}
                  onDragLeave={()=>{ if(hoverBucket===b.key) setHoverBucket(null) }}
                  onDrop={(e)=>{
                    e.preventDefault()
                    const id = Number(e.dataTransfer.getData("text/plain"))
                    if(!id) { setDraggingId(null); setHoverBucket(null); return }
                    // Same-bucket guard: if the article is already in this bucket,
                    // don't reapply the override — show an alert toast instead.
                    const art = ARTS.find(x => x.id === id)
                    const currentStatus = statusOverrides[id] || art?.status
                    if(currentStatus === b.key){
                      showListToast({
                        msg: `${art?.name || "This article"} is already in ${b.label}`,
                        kind: "warn",
                        duration: 2800,
                      })
                      setDraggingId(null); setHoverBucket(null)
                      return
                    }
                    // Apply the move and show a per-drop undo toast in the list.
                    const prevOverride = statusOverrides[id]
                    setStatusOverrides(prev => ({...prev, [id]: b.key}))
                    setHighlightArtIds([id]); setTimeout(()=>setHighlightArtIds([]), 2000)
                    showListToast({
                      msg: `Moved ${art?.name || "article"} to ${b.label}`,
                      action: { label:"Undo", onClick: () => setStatusOverrides(prev => { const next={...prev}; if(prevOverride===undefined) delete next[id]; else next[id]=prevOverride; return next }) },
                      duration: 5000,
                    })
                    setDraggingId(null); setHoverBucket(null)
                  }}
                  style={{
                    minHeight:58,
                    padding:"10px",
                    borderRadius:10,
                    border: `${isHover ? 2 : 1.5}px dashed ${isHover ? b.color : b.bdr}`,
                    backgroundColor: isHover ? `${b.color}1A` : b.bg,
                    boxShadow: isHover ? `0 8px 22px ${b.color}33` : "none",
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4,
                    transition:"border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                    transform: isHover ? "scale(1.03) translateY(-2px)" : "scale(1)",
                    animation: isDragActive && !isHover ? "bucketPulse 1.6s ease-in-out infinite" : "none",
                    position:"relative",
                  }}>
                  <ArrowDownToLine size={16} style={{color:b.color, transition:"transform 0.18s ease", transform: isHover ? "translateY(2px)" : "translateY(0)"}}/>
                  <span style={{fontSize:11.5,fontWeight:700,color:b.color,lineHeight:1.2,
                                textTransform:"uppercase",letterSpacing:"0.03em",textAlign:"center"}}>{b.label}</span>
                  <span style={{fontSize:9.5,color:C.mutedFg,textAlign:"center",lineHeight:1}}>
                    {isHover ? "Release to move" : b.sub}
                  </span>
                  {/* Session count badge on the back-top of the bucket */}
                  {sessionCount > 0 && (
                    <span style={{
                      position:"absolute", top:-7, right:-7,
                      minWidth:20, height:20, padding:"0 6px",
                      borderRadius:10,
                      backgroundColor:b.color, color:"#fff",
                      fontSize:11, fontWeight:800,
                      display:"inline-flex", alignItems:"center", justifyContent:"center",
                      fontFeatureSettings:'"tnum"',
                      boxShadow:`0 2px 6px ${b.color}55, 0 0 0 2px ${C.page}`,
                    }}>{sessionCount}</span>
                  )}
                </div>
              )
            })}
            </div>
            </div>
          </div>

          {/* In-list move / undo / warning toast — scoped to the article list column */}
          {listToast && (
            <div className="absolute left-2 right-3 bottom-3 z-30 flex items-center gap-2 rounded-lg px-3 py-2"
              style={{
                backgroundColor: listToast.kind==="warn" ? "#FEF3E0" : "#1F2937",
                color: listToast.kind==="warn" ? "#7A5310" : "#fff",
                border: listToast.kind==="warn" ? `1px solid ${C.amBdr}` : "none",
                boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
              }}>
              {listToast.kind!=="warn" && <Check size={14} className="text-emerald-400 flex-shrink-0" strokeWidth={3}/>}
              <span className="flex-1 text-[12px] font-medium leading-snug">{listToast.msg}</span>
              {listToast.action && (
                <button onClick={()=>{ listToast.action.onClick(); if(listToastTimer.current) clearTimeout(listToastTimer.current); setListToast(null) }}
                  className="flex-shrink-0 text-[12px] font-bold underline underline-offset-2"
                  style={{color: listToast.kind==="warn" ? "#7A5310" : "#fff"}}>
                  {listToast.action.label}
                </button>
              )}
              <button onClick={()=>{ if(listToastTimer.current) clearTimeout(listToastTimer.current); setListToast(null) }}
                aria-label="Dismiss"
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                style={{color: listToast.kind==="warn" ? "#7A5310" : "#fff"}}>
                <X size={13}/>
              </button>
            </div>
          )}

          {/* ── List resize handle (right edge) ── */}
          <div
            onMouseDown={startListDrag}
            style={{
              position:"absolute", top:0, right:0, width:5, height:"100%",
              cursor:"col-resize", zIndex:10,
              backgroundColor:"transparent",
              borderRight:`1px solid ${C.border}`,
              transition:"background-color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.backgroundColor=C.prBg;e.currentTarget.style.borderRightColor=C.pr}}
            onMouseLeave={e=>{e.currentTarget.style.backgroundColor="transparent";e.currentTarget.style.borderRightColor=C.border}}
          />
        </div>

        {/* ── INLINE EDIT PANEL — shown beside table, not as overlay ── */}
        {selectedSites.length === 0 ? (
          <div className="flex flex-1 items-center justify-center overflow-hidden"
            style={{borderLeft:`1px solid ${C.border}`, backgroundColor:C.page}}>
            <div className="flex flex-col items-center gap-3" style={{opacity:0.7}}>
              {/* Subtle document + cursor illustration */}
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="12" y="8" width="32" height="40" rx="4" stroke={C.border3} strokeWidth="1.5" fill={C.muted}/>
                <path d="M19 20h18M19 27h18M19 34h11" stroke={C.border3} strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="46" cy="46" r="10" fill={C.page} stroke={C.border2} strokeWidth="1.5"/>
                <path d="M42 46h8M46 42v8" stroke={C.ink4} strokeWidth="1.5" strokeLinecap="round" transform="rotate(45 46 46)"/>
              </svg>
              <p style={{fontSize:13,fontWeight:500,color:C.mutedFg,textAlign:"center"}}>No article selected</p>
              <p style={{fontSize:11,color:C.ink4,textAlign:"center",maxWidth:160,lineHeight:1.5}}>Select a site to load articles for review</p>
            </div>
          </div>
        ) : editPanelArtId ? (() => {
          const panelArt = ARTS.find(a=>a.id===editPanelArtId && !removedIds.includes(a.id))
          if(!panelArt) return null
          return (
            <div className="flex flex-1 overflow-hidden"
              style={{
                minWidth:400,
                borderLeft:`1px solid ${C.border}`,
              }}>
              {/* Panel content */}
              <div className="flex-1 overflow-hidden">
                <EditIngredientsPanel key={panelArt.id} art={panelArt} onClose={()=>setEditPanelArtId(list.find(a=>a.id!==editPanelArtId)?.id ?? null)}/>
              </div>
            </div>
          )
        })() : null}

      </div>

      {/* Per-row quick-move menu (⋮) — options depend on the article's current bucket */}
      {rowMenu && (() => {
        const menuArt = ARTS.find(a => a.id === rowMenu.id)
        const cur = statusOverrides[rowMenu.id] ?? menuArt?.status
        const OPTS = cur === "amber"
          ? [
              {status:"green", label:"Move to Ready To Cookbook"},
              {status:"red",   label:"Move to Fix"},
            ]
          : [ // green (Ready To Cookbook) and red (To Fix) both move to Review
              {status:"amber", label:"Move to Review"},
            ]
        return (
        <>
          <div className="fixed inset-0 z-[60]" onClick={()=>setRowMenu(null)}/>
          <div className="fixed z-[70] rounded-xl py-1.5 w-60"
            style={{top:rowMenu.top, right:rowMenu.right, backgroundColor:C.card,
                    border:`1px solid ${C.border3}`, boxShadow:"0 8px 16px rgba(26,26,26,0.12)"}}>
            {OPTS.map(opt => (
              <button key={opt.status} onClick={()=>moveArticle(rowMenu.id, opt.status)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                style={{fontSize:12.5, color:C.fg, fontWeight:500, whiteSpace:"nowrap"}}
                onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.muted}
                onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
                {opt.label}
              </button>
            ))}
          </div>
        </>
        )
      })()}
    </div>
  )
}
