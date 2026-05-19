// @ts-nocheck
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Card } from "../components/ui";
import { C, T } from "../data/tokens";
import { ARTS, APPR } from "../data/mockData";
import { PageHeader } from "../components/shared";
import { EditIngredientsPanel } from "../components/EditIngredientsPanel";
import { useNutritionist } from "../NutritionistContext";

/** Approved profiles list with date/status/category filters + inline view panel. */

export function ApprovedScreen() {
  const navigate = useNavigate();
  const { selectedSites, setNavIds } = useNutritionist();
  // Approved articles open in read-only mode.
  const openArt = (id, _ro, ids) => {
    if (ids) setNavIds(ids);
    navigate(`/nutritionist/article/${id}`, { state: { viewOnly: true, backTarget: "approved" } });
  };
  const [viewPanelArtId, setViewPanelArtId] = useState(APPR[0]?.artId ?? null)
  const [panelWidth, setPanelWidth] = useState(70)
  const [datePreset, setDatePreset] = useState("all")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo]     = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCat, setFilterCat]       = useState("all")
  const [visibleCount, setVisibleCount] = useState(10)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const containerRef = useRef(null)
  const sentinelRef = useRef(null)

  const DATE_PRESETS = [
    {key:"today",    label:"Today"},
    {key:"week",     label:"This Week"},
    {key:"month",    label:"This Month"},
    {key:"all",      label:"All Time"},
    {key:"custom",   label:"Custom"},
  ]

  // Filter by site, date, status, category
  const filteredAPPR = APPR.filter(a => {
    const art = ARTS.find(x=>x.id===a.artId)
    if(art && !selectedSites.includes(art.site)) return false
    if(datePreset === "today")  return a.date.startsWith("Today")
    if(datePreset === "week")   return !a.date.includes("5 days")
    if(datePreset === "month")  return true
    if(datePreset === "all")    return true
    if(datePreset === "custom") return true
    return true
  }).filter(a => {
    const art = ARTS.find(x=>x.id===a.artId)
    if(filterStatus !== "all" && art?.status !== filterStatus) return false
    if(filterCat !== "all" && art?.cat !== filterCat) return false
    return true
  })

  const ALL_CATS = [...new Set(ARTS.map(a=>a.cat))].sort()

  // Reset visible count when any filter changes
  React.useEffect(() => { setVisibleCount(10) }, [datePreset, customFrom, customTo, filterStatus, filterCat])

  const apprVisibleList = filteredAPPR.slice(0, visibleCount)

  // Infinite scroll observer
  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingMore && visibleCount < filteredAPPR.length) {
        setIsLoadingMore(true)
        setTimeout(() => {
          setVisibleCount(c => c + 10)
          setIsLoadingMore(false)
        }, 2000)
      }
    }, { threshold: 0.1 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isLoadingMore, visibleCount, filteredAPPR.length])

  const startDrag = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = panelWidth
    const containerW = containerRef.current?.offsetWidth || window.innerWidth
    const onMove = (mv) => {
      const dx = startX - mv.clientX
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

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{backgroundColor:C.page}}>
      <PageHeader title="Approved Profiles"/>

      {/* ── Compact filter bar ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2"
        style={{backgroundColor:C.card, borderBottom:`1px solid ${C.border}`}}>

        {/* Date — segmented pill group */}
        <div className="flex items-center rounded-md overflow-hidden flex-shrink-0"
          style={{border:`1px solid ${C.border}`, height:28}}>
          {DATE_PRESETS.filter(p=>p.key!=="custom").map((p, i, arr) => (
            <button key={p.key}
              onClick={()=>{ setDatePreset(p.key); setCustomFrom(""); setCustomTo("") }}
              style={{
                padding:"0 10px", height:"100%", fontSize:11, fontWeight:600,
                backgroundColor: datePreset===p.key ? C.pr : "transparent",
                color: datePreset===p.key ? "#fff" : C.mutedFg,
                border:"none",
                borderRight: i < arr.length-1 ? `1px solid ${C.border}` : "none",
                cursor:"pointer", transition:"all 0.1s", whiteSpace:"nowrap",
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        <div className="flex items-center gap-1.5">
          <input type="date" value={customFrom}
            onChange={e=>{ setCustomFrom(e.target.value); setDatePreset("custom") }}
            style={{
              height:28, padding:"0 6px", borderRadius:6, fontSize:11,
              border:`1px solid ${datePreset==="custom"&&customFrom ? C.pr : C.border}`,
              backgroundColor: datePreset==="custom"&&customFrom ? C.prBg : "#fff",
              color:C.fg, outline:"none", cursor:"pointer",
            }}/>
          <span style={{fontSize:10,color:C.mutedFg,flexShrink:0}}>→</span>
          <input type="date" value={customTo}
            onChange={e=>{ setCustomTo(e.target.value); setDatePreset("custom") }}
            style={{
              height:28, padding:"0 6px", borderRadius:6, fontSize:11,
              border:`1px solid ${datePreset==="custom"&&customTo ? C.pr : C.border}`,
              backgroundColor: datePreset==="custom"&&customTo ? C.prBg : "#fff",
              color:C.fg, outline:"none", cursor:"pointer",
            }}/>
          {datePreset==="custom" && (customFrom||customTo) && (
            <button onClick={()=>{ setCustomFrom(""); setCustomTo(""); setDatePreset("all") }}
              style={{display:"flex",alignItems:"center",gap:3,padding:"0 7px",height:28,
                      borderRadius:6,fontSize:11,color:C.mutedFg,border:`1px solid ${C.border}`,
                      backgroundColor:"transparent",cursor:"pointer"}}>
              <X size={9}/>Clear
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{width:1, height:16, backgroundColor:C.border, flexShrink:0}}/>

        {/* Status filter */}
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          style={{
            height:28, padding:"0 8px", borderRadius:6, fontSize:11, fontWeight:500,
            border:`1px solid ${filterStatus!=="all" ? C.pr : C.border}`,
            backgroundColor: filterStatus!=="all" ? C.prBg : "#fff",
            color: filterStatus!=="all" ? C.pr : C.fg,
            outline:"none", cursor:"pointer",
          }}>
          <option value="all">All Statuses</option>
          <option value="green">High Confidence</option>
          <option value="amber">Need Review</option>
          <option value="red">Low Confidence</option>
        </select>

        {/* Category filter */}
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)}
          style={{
            height:28, padding:"0 8px", borderRadius:6, fontSize:11, fontWeight:500,
            border:`1px solid ${filterCat!=="all" ? C.pr : C.border}`,
            backgroundColor: filterCat!=="all" ? C.prBg : "#fff",
            color: filterCat!=="all" ? C.pr : C.fg,
            outline:"none", cursor:"pointer",
          }}>
          <option value="all">All Categories</option>
          {ALL_CATS.map(c=><option key={c} value={c}>{c}</option>)}
        </select>

        {/* Active filter count badge */}
        {(filterStatus!=="all"||filterCat!=="all") && (
          <button onClick={()=>{ setFilterStatus("all"); setFilterCat("all") }}
            style={{display:"flex",alignItems:"center",gap:3,padding:"0 7px",height:28,
                    borderRadius:6,fontSize:11,fontWeight:500,color:C.rd,
                    border:`1px solid ${C.rdBdr}`,backgroundColor:C.rdBg,cursor:"pointer"}}>
            <X size={9}/>Reset
          </button>
        )}

        {/* Result count */}
        <span style={{marginLeft:"auto",fontSize:11,color:C.mutedFg,flexShrink:0}}>
          {filteredAPPR.length} article{filteredAPPR.length!==1?"s":""}
        </span>
      </div>

      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* TABLE COLUMN */}
        <div className="flex flex-col overflow-hidden"
          style={{
            width: viewPanelArtId ? 280 : "100%",
            flex: viewPanelArtId ? "none" : 1,
            flexShrink: viewPanelArtId ? 0 : 1,
            backgroundColor:C.page,
            borderRight: viewPanelArtId ? `1px solid ${C.border}` : "none",
          }}>
          <div className="flex-1 overflow-y-auto">
            <div>
              <Card className="shadow-sm overflow-hidden rounded-none border-x-0 border-t-0" style={{borderRadius:0}}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <tbody>
                      {apprVisibleList.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-16">
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
                              <p style={{fontSize:13,color:C.mutedFg,fontWeight:500}}>No approved articles in this date range.</p>
                            )}
                          </div>
                        </td></tr>
                      ) : apprVisibleList.map(a => {
                        const art = ARTS.find(x=>x.id===a.artId)
                        const isActive = a.artId === viewPanelArtId
                        return (
                          <tr key={a.id} className="cursor-pointer transition-colors"
                            style={{
                              borderBottom:`1px solid ${C.border}`,
                              backgroundColor: isActive ? C.pr : "transparent",
                              borderLeft: isActive ? `3px solid ${C.pr}` : "3px solid transparent",
                            }}
                            onClick={()=>setViewPanelArtId(a.artId)}
                            onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.backgroundColor=C.page }}
                            onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.backgroundColor="transparent" }}>
                            <td className="px-4 py-3">
                              <p style={{...T.tableNm, fontSize: viewPanelArtId?12:13, color: isActive ? "#fff" : T.tableNm.color}}>{art?.name}</p>
                              <p style={{...T.tableApl, color: isActive ? "rgba(255,255,255,0.85)" : T.tableApl.color}}>{art?.apl}</p>
                            </td>
                            {!viewPanelArtId && <td className="px-4 py-3" style={{...T.tableMeta,whiteSpace:"nowrap", color: isActive ? "rgba(255,255,255,0.85)" : T.tableMeta.color}}>{a.date}</td>}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
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
              {!isLoadingMore && visibleCount >= filteredAPPR.length && filteredAPPR.length > 0 && (
                <div className="flex items-center justify-center py-4">
                  <span style={{fontSize:11,color:C.mutedFg}}>All {filteredAPPR.length} articles loaded</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INLINE VIEW PANEL */}
        {selectedSites.length === 0 ? (
          <div className="flex flex-1 items-center justify-center overflow-hidden"
            style={{borderLeft:`1px solid ${C.border}`, backgroundColor:C.page}}>
            <div className="flex flex-col items-center gap-3" style={{opacity:0.7}}>
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
        ) : viewPanelArtId ? (() => {
          const panelArt = ARTS.find(a=>a.id===viewPanelArtId)
          if(!panelArt) return null
          return (
            <div className="flex flex-1 overflow-hidden"
              style={{borderLeft:`1px solid ${C.border}`}}>
              <div onMouseDown={startDrag}
                style={{
                  width:6, flexShrink:0, cursor:"col-resize",
                  backgroundColor:"transparent", borderLeft:`1px solid ${C.border}`,
                  transition:"background-color 0.15s",
                  display:"flex", alignItems:"center", justifyContent:"center", position:"relative",
                }}
                onMouseEnter={e=>{ e.currentTarget.style.backgroundColor=C.prBg; e.currentTarget.style.borderLeftColor=C.pr }}
                onMouseLeave={e=>{ e.currentTarget.style.backgroundColor="transparent"; e.currentTarget.style.borderLeftColor=C.border }}>
                <div style={{display:"flex",flexDirection:"column",gap:3,pointerEvents:"none"}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:3,height:3,borderRadius:"50%",backgroundColor:C.border}}/>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <EditIngredientsPanel key={panelArt.id} art={panelArt} viewOnly={true} onClose={()=>setViewPanelArtId(APPR[0]?.artId ?? null)}/>
              </div>
            </div>
          )
        })() : null}

      </div>
    </div>
  )
}
