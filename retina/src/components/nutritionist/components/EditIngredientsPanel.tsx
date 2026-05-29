// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { Lock, Check, X, ChevronUp, ChevronDown, Plus, Copy, Trash2, RefreshCw, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { C } from "../data/tokens";
import { NNAMES, computeDisplayNuts } from "../data/nutrients";
import { useOFFImages } from "../hooks/useOFFImages";
import { useNutritionist } from "../NutritionistContext";

/**
 * Side-by-side article edit panel used by Queue (editable) and Approved (view-only).
 */

export function EditIngredientsPanel({ art, onClose, viewOnly: viewOnlyProp=false }) {
  // Retired APLs are always read-only: no edits, no action buttons.
  const retired = !!art?.retired
  const viewOnly = viewOnlyProp || retired
  const { removeArticle, showToast } = useNutritionist()
  const displayNuts = computeDisplayNuts(art)
  const [nutVals, setNutVals]     = useState(Object.fromEntries(Object.entries(displayNuts).map(([k,v])=>[k,v.v])))
  const [nutEdited, setNutEdited] = useState({})
  // ── Allergens: simple flat lists (no per-ingredient mapping)
  // Per feedback (26 May): nutritionist manages allergens at the global level,
  // not per-ingredient. The packet ingredients (often chemicals/sources) cannot
  // reliably be mapped to the compass-master ingredient list, and per-ingredient
  // allergen mapping is rarely useful in practice.
  const AL_NORM = {"Milk":"Dairy","Wheat":"Gluten","Gluten":"Gluten","Soy":"Soy","Soy (trace)":"Soy","Tree Nuts":"Tree Nuts","Tree Nuts (trace)":"Tree Nuts","Sesame (trace)":"Sesame"}
  const seedDef  = () => (art?.def_al||[]).map(a => AL_NORM[a]||a)
  const seedProb = () => (art?.prob_al||[]).map(a => AL_NORM[a]||a)
  const [defAl,  setDefAl]  = useState(seedDef)
  const [probAl, setProbAl] = useState(seedProb)
  const [addingDef,  setAddingDef]  = useState(false)
  const [addingProb, setAddingProb] = useState(false)
  const [newDef,  setNewDef]  = useState("")
  const [newProb, setNewProb] = useState("")
  const [gtinCopied, setGtinCopied] = useState(false)
  const gtin = `8901${art.apl.replace("APL-","").padStart(9,"0")}`
  // Section order: Allergens → May Contain → Nutrients → Ingredients (Ingredients last; FYI only)
  const [sec, setSec]             = useState({allergens:true, mayContain:true, nutrients:true, reasons:true, ingredients:true})
  const allExpanded = sec.allergens && sec.mayContain && sec.nutrients && sec.reasons && sec.ingredients
  const toggleAllSections = () => {
    const next = !allExpanded
    setSec({allergens:next, mayContain:next, nutrients:next, reasons:next, ingredients:next})
  }
  const [activeImg, setActiveImg] = useState(0)
  // In-place magnifier (Amazon photo-modal style): click toggles zoom; while zoomed, moving the cursor pans.
  const [imgZoomed, setImgZoomed] = useState(false)
  const [imgPan, setImgPan]       = useState({x:0, y:0})
  const ZOOM = 2.5
  const [photoCollapsed, setPhotoCollapsed] = useState(false)
  const [editImgSlot, setEditImgSlot] = useState(null)
  const [artImgOverrides, setArtImgOverrides] = useState({})
  // Re-scan / Approve confirmation modals + a shared top-right toast.
  const [rescanOpen, setRescanOpen]   = useState(false)
  const [rescanRemark, setRescanRemark] = useState("")
  const [approveOpen, setApproveOpen] = useState(false)
  const [removeOpen, setRemoveOpen]   = useState(false)
  const [topToast, setTopToast]       = useState(null) // message string | null
  const showTopToast = (msg) => { setTopToast(msg); setTimeout(()=>setTopToast(null), 3500) }
  const imgContainerRef           = useRef(null)
  const rafRef                    = useRef(0)

  // ── Open Food Facts real images ──
  const { offImgs, offLink } = useOFFImages(art)
  // offImgs: always an array (picsum immediately, upgrades to OFF when available)
  const resolvedImgs = (slot) => {
    const override = artImgOverrides[`${art.id}-${slot}`]
    if (override) return override
    return offImgs?.[slot] || null
  }

  // Map cursor position within the photo to a clamped pan offset (magnified region follows cursor).
  const panFromXY = (clientX, clientY) => {
    const rect = imgContainerRef.current?.getBoundingClientRect()
    if (!rect) return {x:0, y:0}
    const fracX = (clientX - rect.left) / rect.width
    const fracY = (clientY - rect.top)  / rect.height
    const maxX = (rect.width  * (ZOOM - 1)) / 2
    const maxY = (rect.height * (ZOOM - 1)) / 2
    return {
      x: Math.max(-maxX, Math.min(maxX, maxX * (1 - 2 * fracX))),
      y: Math.max(-maxY, Math.min(maxY, maxY * (1 - 2 * fracY))),
    }
  }
  // Click toggles zoom in/out; while zoomed, moving the cursor pans (no drag needed).
  const onImgClick = (e) => {
    if (!resolvedImgs(activeImg)) return
    if (imgZoomed) { setImgZoomed(false); setImgPan({x:0, y:0}) }
    else { setImgZoomed(true); setImgPan(panFromXY(e.clientX, e.clientY)) }
  }
  // Throttle pan to one update per animation frame → smooth, crisp tracking (no transition lag/ghosting).
  const onImgMove = (e) => {
    if (!imgZoomed) return
    const cx = e.clientX, cy = e.clientY
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => setImgPan(panFromXY(cx, cy)))
  }
  // Reset zoom when the displayed image or article changes.
  useEffect(() => { setImgZoomed(false); setImgPan({x:0, y:0}) }, [activeImg, art?.id])

  const toggleSec = (k) => setSec(p=>({...p,[k]:!p[k]}))

  /* ── Nutrient helpers ── */
  const nutStyle = (c) => {
    if(c==="missing") return {border:"1.5px solid #FCA5A5", backgroundColor:"#FCEAEA", color:C.mutedFg}
    if(c==="llm")     return {border:"1.5px solid #E8C97A", backgroundColor:"#FEF9EE", color:C.am}
    if(c==="na")      return {border:`1px solid ${C.border}`, backgroundColor:C.page,  color:C.mutedFg}
    return                   {border:`1px solid ${C.border}`, backgroundColor:"#fff",  color:C.fg}
  }
  const nutBadge = (c) => {
    if(c==="high"||c==="mid") return {label:"Scanned", bg:C.grBg, color:C.gr,      border:C.grBdr,  radius:"999px"}
    if(c==="missing")         return {label:"Missing", bg:C.rdBg, color:C.rd,      border:C.rdBdr,  radius:"999px"}
    if(c==="llm")             return {label:"AI Est.", bg:C.amBg, color:C.am,      border:C.amBdr,  radius:"999px"}
    return                           {label:"N/A",     bg:C.muted,color:C.mutedFg, border:C.border, radius:"999px"}
  }
  const nutRowStyle = (c) => {
    if(c==="missing") return {borderLeft:`3px solid ${C.rd}`, backgroundColor:"#FEF7F7"}
    if(c==="llm")     return {borderLeft:`3px solid ${C.am}`, backgroundColor:"#FFFBF2"}
    return                   {borderLeft:"3px solid transparent", backgroundColor:"transparent"}
  }

  /* ── Status badge ── */
  const stCfg = {
    green:{bg:C.grBg,color:C.gr,border:C.grBdr,label:"Ready To Cookbook"},
    amber:{bg:C.amBg,color:C.am,border:C.amBdr,label:"To Review"},
    red:  {bg:C.rdBg,color:C.rd,border:C.rdBdr,label:"To Fix"},
  }
  const sc = stCfg[art.status]||stCfg.amber

  /* ── Section header ── */
  const SectionHdr = ({k, label, badge}) => (
    <button className="w-full flex items-center justify-between px-5 transition-colors"
      style={{height:52, backgroundColor:"transparent", borderBottom: sec[k] ? `1px solid ${C.border}` : "none"}}
      onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.muted}
      onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}
      onClick={()=>toggleSec(k)}>
      <span className="flex items-center gap-2 min-w-0">
        <span style={{fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:C.fg}}>{label}</span>
        {badge}
      </span>
      {sec[k]
        ? <ChevronUp   size={14} style={{color:C.mutedFg,flexShrink:0}}/>
        : <ChevronDown size={14} style={{color:C.mutedFg,flexShrink:0}}/>}
    </button>
  )

  return (
      <div className="flex flex-col h-full"
        style={{backgroundColor:"#fff", overflow:"hidden"}}>

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 flex items-start gap-3"
          style={{borderBottom:`1px solid ${C.border}`, backgroundColor:"#fff"}}>
          <div className="flex-1 min-w-0">
            {/* Article name + confidence + barcode + scan/update meta, divided subtly */}
            <div className="flex items-center gap-2 flex-wrap min-w-0 mb-2">
              <span style={{fontSize:15,fontWeight:700,color:C.fg,letterSpacing:"-0.01em",lineHeight:1.2}}>{art.name}</span>
              {/* Confidence score chip — replaced by APL Retired chip for retired APLs */}
              {retired ? (
                <span className="inline-flex items-center gap-1 flex-shrink-0"
                  style={{
                    fontSize:11, fontWeight:700,
                    color:"#78716c", backgroundColor:"#e7e5e4",
                    border:"1px solid #d6d3d1",
                    borderRadius:6, padding:"2px 8px",
                    textTransform:"uppercase", letterSpacing:"0.04em",
                  }}>
                  <Lock size={10}/> APL Retired
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 flex-shrink-0"
                  style={{
                    fontSize:11, fontWeight:600,
                    color: sc.color,
                    backgroundColor: sc.bg,
                    borderRadius:6,
                    padding:"2px 7px",
                    letterSpacing:"0.01em",
                    fontFeatureSettings:'"tnum"',
                  }}>
                  {art.conf}% confidence
                </span>
              )}
              {viewOnly && !retired && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border flex-shrink-0"
                  style={{fontSize:10,fontWeight:600,backgroundColor:C.muted,color:C.mutedFg,borderColor:C.border}}>
                  <Lock size={9}/> Read-only
                </span>
              )}

              {/* divider */}
              <span style={{width:1,height:12,backgroundColor:C.border,flexShrink:0}}/>

              {/* Barcode + copy */}
              <span className="inline-flex items-center gap-1 flex-shrink-0">
                <span style={{fontSize:11,fontWeight:500,color:C.mutedFg,fontFeatureSettings:'"tnum"',letterSpacing:"0.04em"}}>
                  Barcode: {gtin}
                </span>
                <button
                  onClick={()=>{ navigator.clipboard.writeText(gtin); setGtinCopied(true); setTimeout(()=>setGtinCopied(false),1800) }}
                  title="Copy barcode"
                  style={{
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    width:20, height:20, border:"none", borderRadius:4,
                    backgroundColor: gtinCopied ? C.grBg : "transparent",
                    color: gtinCopied ? C.gr : C.mutedFg,
                    cursor:"pointer", flexShrink:0, transition:"all 0.15s",
                  }}
                  onMouseEnter={e=>{ if(!gtinCopied){ e.currentTarget.style.backgroundColor=C.muted; e.currentTarget.style.color=C.fg }}}
                  onMouseLeave={e=>{ if(!gtinCopied){ e.currentTarget.style.backgroundColor="transparent"; e.currentTarget.style.color=C.mutedFg }}}>
                  {gtinCopied ? <Check size={11} strokeWidth={2.5}/> : <Copy size={11} strokeWidth={1.8}/>}
                </button>
              </span>

              {/* divider */}
              <span style={{width:1,height:12,backgroundColor:C.border,flexShrink:0}}/>

              {/* Scanned at */}
              <span style={{fontSize:11,fontWeight:500,color:C.mutedFg,whiteSpace:"nowrap"}}>
                Scanned {art.at}
              </span>

              {/* divider */}
              <span style={{width:1,height:12,backgroundColor:C.border,flexShrink:0}}/>

              {/* Updated at — falls back to "Not updated yet" when no edit has been made */}
              <span style={{fontSize:11,fontWeight:500,color:C.mutedFg,whiteSpace:"nowrap"}}>
                Updated: {art.updatedAt || "Not updated yet"}
              </span>
            </div>

          </div>
          {/* Collapse all / expand all — same control as the Article SME detail */}
          <button
            type="button"
            onClick={toggleAllSections}
            title={allExpanded ? "Collapse all" : "Expand all"}
            className="flex-shrink-0 inline-flex items-center gap-1.5"
            style={{ height:32, padding:"0 12px", borderRadius:8, fontSize:12.5, fontWeight:500,
                     backgroundColor:C.card, color:C.fg, border:`1px solid ${C.border}`, cursor:"pointer" }}
            onMouseEnter={e=>{ e.currentTarget.style.backgroundColor=C.muted }}
            onMouseLeave={e=>{ e.currentTarget.style.backgroundColor=C.card }}>
            {allExpanded ? <ChevronsDownUp size={14}/> : <ChevronsUpDown size={14}/>}
            {allExpanded ? "Collapse All" : "Expand All"}
          </button>
        </div>

        {/* ── Body: LEFT details form + RIGHT photo column ── */}
        <div className="flex flex-1 overflow-hidden flex-row-reverse">

          {/* RIGHT: PHOTO PANEL */}
          <div className="flex-shrink-0 flex flex-col overflow-hidden"
            style={{width: photoCollapsed ? 0 : "50%", borderLeft: photoCollapsed ? "none" : `1px solid ${C.border}`, backgroundColor:"#fff", transition:"width 0.25s ease"}}>

                  {/* Main image — click to zoom in/out (lens +/- cursor), drag to pan when zoomed */}
                  <div
                    ref={imgContainerRef}
                    onClick={onImgClick}
                    onMouseMove={onImgMove}
                    style={{
                      flex:1, position:"relative",
                      backgroundColor:C.muted, overflow:"hidden",
                      cursor: !resolvedImgs(activeImg) ? "default" : imgZoomed ? "zoom-out" : "zoom-in",
                    }}>
                    {(() => {
                      const imgSrc = resolvedImgs(activeImg)
                      return imgSrc ? (
                      <img
                        key={imgSrc}
                        src={imgSrc}
                        alt={["Front","Back","Side","Barcode"][activeImg]}
                        draggable={false}
                        style={{
                          width:"100%", height:"100%",
                          objectFit:"cover", display:"block",
                          userSelect:"none",
                          transform:`translate3d(${imgPan.x}px, ${imgPan.y}px, 0) scale(${imgZoomed ? ZOOM : 1})`,
                          transformOrigin:"center center",
                          transition: imgZoomed ? "none" : "transform 0.18s ease-out",
                          willChange: imgZoomed ? "transform" : "auto",
                          backfaceVisibility:"hidden",
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{fontSize:11,color:C.mutedFg}}>No image</div>
                    )})()}

                    {/* Collapse button — vertically centered, flush to left edge */}
                    <button
                      onMouseDown={e=>e.stopPropagation()}
                      onMouseUp={e=>e.stopPropagation()}
                      onClick={(e)=>{ e.stopPropagation(); setPhotoCollapsed(true) }}
                      title="Hide photos"
                      style={{
                        position:"absolute", top:"50%", left:0,
                        transform:"translateY(-50%)",
                        width:22, height:22,
                        backgroundColor:"rgba(15,23,42,0.28)",
                        backdropFilter:"blur(4px)",
                        border:"1px solid rgba(255,255,255,0.15)",
                        borderRadius:"0 6px 6px 0",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        cursor:"pointer",
                        transition:"background 0.15s",
                        zIndex:5,
                      }}
                      onMouseEnter={e=>e.currentTarget.style.backgroundColor="rgba(15,23,42,0.55)"}
                      onMouseLeave={e=>e.currentTarget.style.backgroundColor="rgba(15,23,42,0.28)"}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>

                    {/* Floating dot indicators bottom-center */}
                    <div style={{
                      position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)",
                      display:"flex", gap:5, alignItems:"center",
                      padding:"5px 10px",
                      backgroundColor:"rgba(0,0,0,0.35)",
                      backdropFilter:"blur(4px)",
                      borderRadius:999,
                    }}>
                      {[0,1,2,3].map(i=>(
                        <button key={i}
                          onMouseDown={e=>e.stopPropagation()}
                          onMouseUp={e=>e.stopPropagation()}
                          onClick={(e)=>{ e.stopPropagation(); setActiveImg(i) }}
                          style={{
                            width: i===activeImg ? 18 : 6,
                            height:6,
                            borderRadius:999,
                            border: i===activeImg ? "none" : "1px solid rgba(255,255,255,0.5)",
                            backgroundColor: i===activeImg ? "#fff" : "rgba(255,255,255,0.3)",
                            padding:0, cursor:"pointer",
                            transition:"width 0.2s, background 0.15s",
                          }}/>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnail strip — compact floating cards */}
                  <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2"
                    style={{backgroundColor:"#fff", borderTop:`1px solid ${C.border}`}}>
                    {["Front","Back","Side","Barcode"].map((lbl,i)=>{
                      const imgSrc = resolvedImgs(i)
                      return (
                      <button key={i} onClick={()=>setActiveImg(i)}
                        style={{
                          width:52, height:52, flexShrink:0,
                          borderRadius:8, overflow:"hidden",
                          border: i===activeImg ? `2.5px solid ${C.pr}` : `1.5px solid ${C.border}`,
                          backgroundColor: C.muted,
                          cursor:"pointer", padding:0,
                          transition:"border-color 0.12s, box-shadow 0.12s",
                          boxShadow: i===activeImg ? "0 2px 10px rgba(0,0,0,0.12)" : "none",
                          position:"relative",
                        }}>
                        {imgSrc
                          ? <img src={imgSrc} alt={lbl} onError={e=>{ e.currentTarget.style.display="none" }} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:C.mutedFg,fontWeight:700,textTransform:"uppercase"}}>{lbl[0]}</div>
                        }
                        <div style={{
                          position:"absolute", bottom:0, left:0, right:0,
                          background:"linear-gradient(transparent, rgba(0,0,0,0.45))",
                          color:"#fff", fontSize:8, fontWeight:700,
                          textAlign:"center", padding:"4px 0 3px",
                          textTransform:"uppercase", letterSpacing:"0.04em",
                        }}>{lbl}</div>
                      </button>
                      )
                    })}
                  </div>
                </div>{/* end RIGHT PHOTO PANEL */}

          {/* LEFT: DETAILS PANEL */}
          <div className="flex-1 overflow-y-auto" style={{backgroundColor:C.page, position:"relative", paddingTop:18}}>

            {/* Camera expand tag -- fixed to right edge, vertically centered on screen */}
            {photoCollapsed && (
              <button
                onClick={()=>setPhotoCollapsed(false)}
                title="Show photos"
                style={{
                  position:"fixed", top:"50%", right:0,
                  transform:"translateY(-50%)",
                  display:"flex", alignItems:"center", gap:5,
                  backgroundColor:C.pr,
                  color:"#fff",
                  border:"none",
                  borderRadius:"8px 0 0 8px",
                  padding:"5px 9px",
                  cursor:"pointer",
                  fontSize:11, fontWeight:700,
                  letterSpacing:"0.03em",
                  boxShadow:"-2px 0 8px rgba(24,95,165,0.25)",
                  zIndex:20,
                  transition:"background 0.15s",
                }}
                onMouseEnter={e=>e.currentTarget.style.backgroundColor="#B27A18"}
                onMouseLeave={e=>e.currentTarget.style.backgroundColor=C.pr}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Photos
              </button>
            )}
            {/* ══════ ALLERGENS (Contains) — own section ══════ */}
            <div style={{border:`1px solid ${C.border}`, borderRadius:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", backgroundColor:"#fff", overflow:"hidden", margin:"0 18px 16px"}}>
              <SectionHdr k="allergens" label="Allergens (Contains)"/>
              {sec.allergens && (
                <div className="px-5 py-3" style={{backgroundColor:"#fff"}}>
                  <p style={{fontSize:11, color:C.mutedFg, marginBottom:10, lineHeight:1.5}}>
                    Allergens definitely present on the packet label.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {defAl.length ? defAl.map((a,i)=>(
                      <span key={a+i}
                        className="inline-flex items-center gap-1"
                        style={{
                          padding:"3px 8px 3px 10px", borderRadius:6,
                          fontSize:12, fontWeight:700, letterSpacing:"0.02em",
                          backgroundColor:"transparent",
                          border:`1.5px solid ${C.rd}`, color:C.rd, whiteSpace:"nowrap",
                        }}>
                        {a}
                        {!viewOnly && (
                          <button
                            onClick={()=>setDefAl(prev=>prev.filter((_,j)=>j!==i))}
                            style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
                                    width:14,height:14,border:"none",background:"transparent",
                                    cursor:"pointer",padding:0,color:C.rd,opacity:0.55,flexShrink:0}}
                            onMouseEnter={e=>e.currentTarget.style.opacity="1"}
                            onMouseLeave={e=>e.currentTarget.style.opacity="0.55"}>
                            <X size={10} strokeWidth={3}/>
                          </button>
                        )}
                      </span>
                    )) : (
                      <span style={{fontSize:12, fontStyle:"italic", color:C.mutedFg}}>None declared</span>
                    )}
                    {!viewOnly && addingDef && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={()=>{
                          if(newDef.trim()) setDefAl(p=>[...p,newDef.trim()])
                          setNewDef(""); setAddingDef(false)
                        }}/>
                        <span className="relative z-40 inline-flex items-center gap-1"
                          style={{padding:"3px 8px 3px 10px",borderRadius:6,
                                  border:`1.5px solid ${C.rd}`,color:C.rd,
                                  backgroundColor:"transparent"}}>
                          <input
                            autoFocus
                            value={newDef}
                            onChange={e=>setNewDef(e.target.value)}
                            onKeyDown={e=>{
                              if(e.key==="Enter" && newDef.trim()){ setDefAl(p=>[...p,newDef.trim()]); setNewDef(""); setAddingDef(false) }
                              if(e.key==="Escape"){ setNewDef(""); setAddingDef(false) }
                            }}
                            placeholder="Allergen name…"
                            style={{border:"none",outline:"none",background:"transparent",
                                    fontSize:12,fontWeight:700,color:C.rd,
                                    width:Math.max(110,newDef.length*7.5),minWidth:110,maxWidth:180,padding:0}}/>
                          <button
                            onClick={()=>{ if(newDef.trim()) setDefAl(p=>[...p,newDef.trim()]); setNewDef(""); setAddingDef(false) }}
                            aria-label="Save allergen"
                            style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,border:"none",background:"transparent",cursor:"pointer",padding:0,color:C.rd,flexShrink:0}}>
                            <Check size={12} strokeWidth={3}/>
                          </button>
                        </span>
                      </>
                    )}
                    {!viewOnly && !addingDef && (
                      <button onClick={()=>setAddingDef(true)}
                        style={{display:"inline-flex",alignItems:"center",gap:4,
                                padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:600,
                                backgroundColor:"transparent",color:C.mutedFg,
                                border:`1.5px dashed ${C.border2}`,cursor:"pointer"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.rd;e.currentTarget.style.color=C.rd}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.color=C.mutedFg}}>
                        <Plus size={10} strokeWidth={2.5}/> Add allergen
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* ══════ MAY CONTAIN — own section ══════ */}
            <div style={{border:`1px solid ${C.border}`, borderRadius:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", backgroundColor:"#fff", overflow:"hidden", margin:"0 18px 16px"}}>
              <SectionHdr k="mayContain" label="May Contain"/>
              {sec.mayContain && (
                <div className="px-5 py-3" style={{backgroundColor:"#fff"}}>
                  <p style={{fontSize:11, color:C.mutedFg, marginBottom:10, lineHeight:1.5}}>
                    Probable allergens — trace contamination from the same factory line.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {probAl.length ? probAl.map((a,i)=>(
                      <span key={a+i}
                        className="inline-flex items-center gap-1"
                        style={{
                          padding:"3px 8px 3px 10px", borderRadius:6,
                          fontSize:12, fontWeight:700, letterSpacing:"0.02em",
                          backgroundColor:"transparent",
                          border:`1.5px solid ${C.am}`, color:C.am, whiteSpace:"nowrap",
                        }}>
                        {a}
                        {!viewOnly && (
                          <button
                            onClick={()=>setProbAl(prev=>prev.filter((_,j)=>j!==i))}
                            style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
                                    width:14,height:14,border:"none",background:"transparent",
                                    cursor:"pointer",padding:0,color:C.am,opacity:0.55,flexShrink:0}}
                            onMouseEnter={e=>e.currentTarget.style.opacity="1"}
                            onMouseLeave={e=>e.currentTarget.style.opacity="0.55"}>
                            <X size={10} strokeWidth={3}/>
                          </button>
                        )}
                      </span>
                    )) : (
                      <span style={{fontSize:12, fontStyle:"italic", color:C.mutedFg}}>None declared</span>
                    )}
                    {!viewOnly && addingProb && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={()=>{
                          if(newProb.trim()) setProbAl(p=>[...p,newProb.trim()])
                          setNewProb(""); setAddingProb(false)
                        }}/>
                        <span className="relative z-40 inline-flex items-center gap-1"
                          style={{padding:"3px 8px 3px 10px",borderRadius:6,
                                  border:`1.5px solid ${C.am}`,color:C.am,
                                  backgroundColor:"transparent"}}>
                          <input
                            autoFocus
                            value={newProb}
                            onChange={e=>setNewProb(e.target.value)}
                            onKeyDown={e=>{
                              if(e.key==="Enter" && newProb.trim()){ setProbAl(p=>[...p,newProb.trim()]); setNewProb(""); setAddingProb(false) }
                              if(e.key==="Escape"){ setNewProb(""); setAddingProb(false) }
                            }}
                            placeholder="Probable allergen…"
                            style={{border:"none",outline:"none",background:"transparent",
                                    fontSize:12,fontWeight:700,color:C.am,
                                    width:Math.max(120,newProb.length*7.5),minWidth:120,maxWidth:200,padding:0}}/>
                          <button
                            onClick={()=>{ if(newProb.trim()) setProbAl(p=>[...p,newProb.trim()]); setNewProb(""); setAddingProb(false) }}
                            aria-label="Save probable allergen"
                            style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,border:"none",background:"transparent",cursor:"pointer",padding:0,color:C.am,flexShrink:0}}>
                            <Check size={12} strokeWidth={3}/>
                          </button>
                        </span>
                      </>
                    )}
                    {!viewOnly && !addingProb && (
                      <button onClick={()=>setAddingProb(true)}
                        style={{display:"inline-flex",alignItems:"center",gap:4,
                                padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:600,
                                backgroundColor:"transparent",color:C.mutedFg,
                                border:`1.5px dashed ${C.border2}`,cursor:"pointer"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.am;e.currentTarget.style.color=C.am}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.color=C.mutedFg}}>
                        <Plus size={10} strokeWidth={2.5}/> Add probable
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ══════ NUTRIENTS — 3-column clean table (Nutrient Name | Value | UOM) ══════ */}
            <div style={{border:`1px solid ${C.border}`, borderRadius:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", backgroundColor:"#fff", overflow:"hidden", margin:"0 18px 16px"}}>
              <SectionHdr k="nutrients" label="Nutrients"/>
              {sec.nutrients && (
                <div className="px-5 py-3" style={{backgroundColor:"#fff"}}>
                  <div className="overflow-hidden" style={{border:`1px solid ${C.border}`, borderRadius:4}}>
                    {/* Header */}
                    <div className="flex" style={{backgroundColor:C.page, borderBottom:`1px solid ${C.border}`}}>
                      <div className="px-3 py-2.5 flex-1"
                        style={{fontSize:10,fontWeight:700,
                                textTransform:"uppercase",letterSpacing:"0.08em",color:C.mutedFg}}>
                        Nutrient Name
                      </div>
                      <div className="px-3 py-2.5 flex-1"
                        style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",
                                color:C.mutedFg,borderLeft:`1px solid ${C.border}`,textAlign:"center"}}>
                        Per 100g / Per 100ml
                      </div>
                      <div className="px-3 py-2.5"
                        style={{width:64,flexShrink:0,fontSize:10,fontWeight:700,textTransform:"uppercase",
                                letterSpacing:"0.08em",color:C.mutedFg,borderLeft:`1px solid ${C.border}`}}>
                        UOM
                      </div>
                    </div>
                    {/* Rows */}
                    {Object.entries(displayNuts).map(([k,n], idx, arr)=>{
                      const isNA = n.c==="na"
                      const isLast = idx === arr.length - 1
                      const rowColor = isNA ? C.mutedFg : C.fg
                      return (
                        <div key={k} className="flex items-stretch"
                          style={{borderBottom: isLast ? "none" : `1px solid ${C.border}`, backgroundColor:"#fff"}}>
                          {/* Col 1 — Nutrient name */}
                          <div className="px-3 py-2.5 flex-1 flex items-center">
                            <span style={{fontSize:13, fontWeight:500, color:rowColor, lineHeight:1.3}}>
                              {NNAMES[k]}
                            </span>
                          </div>
                          {/* Col 2 — Per 100g/100ml input (centered) */}
                          <div className="px-3 py-1.5 flex-1 flex items-center justify-center"
                            style={{borderLeft:`1px solid ${C.border}`}}>
                            <input
                              value={isNA ? "N/A" : (nutVals[k] || "")}
                              disabled={isNA || viewOnly}
                              onChange={e=>{
                                setNutVals(p=>({...p,[k]:e.target.value}))
                                setNutEdited(p=>({...p,[k]:true}))
                              }}
                              style={{
                                width:"100%", height:30,
                                border:`1px solid ${C.border}`,
                                borderRadius:4,
                                backgroundColor: isNA ? C.page : "#fff",
                                color: isNA ? C.mutedFg : C.fg,
                                fontSize:13, fontWeight:500,
                                paddingLeft:10, paddingRight:10,
                                outline:"none", boxSizing:"border-box",
                                fontFeatureSettings:'"tnum"',
                                textAlign:"left",
                                cursor: (isNA || viewOnly) ? "default" : "text",
                              }}/>
                          </div>
                          {/* Col 3 — UOM */}
                          <div className="px-3 py-2.5 flex items-center"
                            style={{width:64,flexShrink:0,borderLeft:`1px solid ${C.border}`}}>
                            <span style={{fontSize:12, color:C.mutedFg}}>{n.u}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ══════ INGREDIENTS — FYI bullet list, read-only ══════ */}
            <div style={{border:`1px solid ${C.border}`, borderRadius:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", backgroundColor:"#fff", overflow:"hidden", margin:"0 18px 16px"}}>
              <SectionHdr k="ingredients" label="Ingredients"
                badge={art.sme && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",
                            backgroundColor:C.prBg,color:C.pr,border:`1px solid ${C.prBdr}`}}>
                    SME Updated Here
                  </span>
                )}/>
              {sec.ingredients && (() => {
                // SME-edited ingredients shown as "previous → new" so the nutritionist sees the change.
                const smeChanges = art.sme ? { "Folic acid":"Folate", "Iron":"Ferrous fumarate" } : {}
                const ingredients = ["Whole wheat flour (atta)","Salt","Vitamin B1","Vitamin B2","Vitamin B3","Vitamin B6","Folic acid","Iron","Zinc"]
                return (
                <div className="px-5 py-4 space-y-3" style={{backgroundColor:"#fff"}}>
                  {art.sme && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{backgroundColor:"#FEF9EE",border:`1px solid ${C.amBdr}`}}>
                      <span style={{fontSize:13,lineHeight:1.2,color:C.am}}>⚠</span>
                      <span style={{fontSize:11.5,fontWeight:500,color:"#7A5310",lineHeight:1.5}}>Article SME changed the highlighted ingredients (shown as old → new) — confirm the allergen list is still complete.</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{backgroundColor:C.muted,border:`1px solid ${C.border}`,
                            fontSize:12,fontWeight:500,color:C.mutedFg}}>
                    <Lock size={11}/> Read-only — packet-level ingredients (not mapped to allergens)
                  </div>
                  <ul className="space-y-1.5" style={{paddingLeft:4}}>
                    {ingredients.map(t=>{
                      const prev = smeChanges[t]
                      const isChanged = prev !== undefined
                      return (
                        <li key={t} className="flex items-start gap-2" style={{lineHeight:1.5}}>
                          <span style={{color: isChanged ? C.pr : C.mutedFg,flexShrink:0,marginTop:"0.15em",fontSize:13,fontWeight:700}}>•</span>
                          {isChanged ? (
                            <span className="inline-flex items-center gap-1.5 flex-wrap">
                              <span style={{fontSize:13,color:C.mutedFg,textDecoration:"line-through"}}>{prev}</span>
                              <span style={{fontSize:12,color:C.mutedFg}}>→</span>
                              <span style={{fontSize:13,fontWeight:700,color:C.pr,backgroundColor:C.prBg,border:`1px solid ${C.prBdr}`,borderRadius:5,padding:"0 6px"}}>{t}</span>
                              <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",color:C.pr}}>SME edited</span>
                            </span>
                          ) : (
                            <span style={{fontSize:13,color:C.fg}}>{t}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
                )
              })()}
            </div>

            {/* ══════ REASONS — last section; plain sentences, no color ══════ */}
            <div style={{border:`1px solid ${C.border}`, borderRadius:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", backgroundColor:"#fff", overflow:"hidden", margin:"0 18px 16px"}}>
              <SectionHdr k="reasons" label="Activity"/>
              {sec.reasons && (
                <div className="px-5 py-4" style={{backgroundColor:"#fff"}}>
                  {(() => {
                    // Activity timeline — same shape as the Article SME log, but
                    // without an action-taker name (only the action + timestamp).
                    const isGreen = art.status === "green"
                    const isRed   = art.status === "red"
                    const bucket  = isGreen ? "Ready To Cookbook" : isRed ? "To Fix" : "To Review"
                    const activities = []
                    if (art.rescanRequested)       activities.push({ text: "Re-scan requested", time: art.updatedAt || art.at })
                    if (art.sme)                   activities.push({ text: "Updated by Article SME", time: art.updatedAt || art.at })
                    if (art.updatedAt && !art.sme) activities.push({ text: "Nutrition details updated", time: art.updatedAt })
                    activities.push({ text: `Auto-classified as ${bucket}`, time: art.at })
                    activities.push({ text: `Scanned via ${art.scanned}`, time: art.at })
                    return (
                      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {activities.map((act, i) => (
                          <li key={i} className="flex items-start gap-2" style={{ marginBottom: i === activities.length - 1 ? 0 : 10 }}>
                            <span style={{ marginTop: 6, width: 7, height: 7, borderRadius: "50%", backgroundColor: C.pr, flexShrink: 0 }}/>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 12.5, color: C.fg, lineHeight: 1.4 }}>{act.text}</p>
                              {act.time && <p style={{ fontSize: 10.5, color: C.mutedFg, marginTop: 2 }}>{act.time}</p>}
                            </div>
                          </li>
                        ))}
                      </ol>
                    )
                  })()}
                </div>
              )}
            </div>

                  {/* bottom padding so last section isn't flush with end */}
                  <div style={{height:96}}/>
          </div>{/* end RIGHT DETAILS PANEL */}

        </div>{/* end body */}

        {/* ── Action footer — Approve is the single primary CTA ── */}
        {/* Per 26 May review: once nutritionist approves, the article goes
            straight to Cookbook (near real-time). No two-step push. */}
        {!viewOnly && (
          <div className="flex-shrink-0 px-5 py-3 flex items-center justify-end gap-2"
            style={{borderTop:`1px solid ${C.border}`, backgroundColor:"#fff"}}>
            <span style={{fontSize:11, color:C.mutedFg, marginRight:"auto"}}>
              Approving will push this article to Cookbook.
            </span>
            <button
              onClick={()=>{ setRescanRemark(""); setRescanOpen(true) }}
              style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"8px 14px", borderRadius:8,
                fontSize:13, fontWeight:600,
                backgroundColor:"#fff", color:C.mutedFg,
                border:`1px solid ${C.border2}`, cursor:"pointer",
              }}
              onMouseEnter={e=>{ e.currentTarget.style.backgroundColor=C.muted; e.currentTarget.style.borderColor=C.border3 }}
              onMouseLeave={e=>{ e.currentTarget.style.backgroundColor="#fff"; e.currentTarget.style.borderColor=C.border2 }}>
              <RefreshCw size={13}/> Request Re-scan
            </button>
            <button
              onClick={()=>setApproveOpen(true)}
              style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"8px 18px", borderRadius:8,
                fontSize:13, fontWeight:700,
                backgroundColor:C.pr, color:"#fff",
                border:`1px solid ${C.pr}`, cursor:"pointer",
                boxShadow:"0 1px 2px rgba(198,138,30,0.25)",
              }}
              onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.prHov}
              onMouseLeave={e=>e.currentTarget.style.backgroundColor=C.pr}>
              <Check size={13} strokeWidth={3}/> Approve &amp; Push
            </button>
          </div>
        )}

        {/* ── Retired APL footer — no edit/approve; only Remove Entirely ── */}
        {retired && (
          <div className="flex-shrink-0 px-5 py-3 flex items-center justify-end gap-2"
            style={{borderTop:`1px solid ${C.border}`, backgroundColor:"#fff"}}>
            <span style={{fontSize:11, color:C.mutedFg, marginRight:"auto"}}>
              This APL is retired — it can no longer be edited or approved.
            </span>
            <button
              onClick={()=>setRemoveOpen(true)}
              style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"8px 16px", borderRadius:8,
                fontSize:13, fontWeight:700,
                backgroundColor:"#fff", color:"#B42318",
                border:"1px solid #F1B0AB", cursor:"pointer",
                transition:"background-color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e=>{ e.currentTarget.style.backgroundColor="#FEF3F2"; e.currentTarget.style.borderColor="#E5736B" }}
              onMouseLeave={e=>{ e.currentTarget.style.backgroundColor="#fff"; e.currentTarget.style.borderColor="#F1B0AB" }}>
              <Trash2 size={13}/> Remove Entirely
            </button>
          </div>
        )}

        {/* ── Request Re-scan modal ── */}
        {rescanOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{backgroundColor:"rgba(15,23,42,0.5)", backdropFilter:"blur(2px)"}}
            onClick={()=>setRescanOpen(false)}>
            <div onClick={e=>e.stopPropagation()}
              style={{width:440, maxWidth:"92vw", backgroundColor:"#fff", borderRadius:14,
                      border:`1px solid ${C.border}`, boxShadow:"0 24px 64px rgba(0,0,0,0.25)", overflow:"hidden"}}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5" style={{borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:14,fontWeight:700,color:C.fg}}>Request Re-scan</span>
                <button onClick={()=>setRescanOpen(false)} aria-label="Close"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-muted/50">
                  <X size={15}/>
                </button>
              </div>
              {/* Body */}
              <div className="px-5 py-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div style={{width:56,height:56,flexShrink:0,borderRadius:8,overflow:"hidden",backgroundColor:C.muted,border:`1px solid ${C.border}`}}>
                    {resolvedImgs(0)
                      ? <img src={resolvedImgs(0)} alt={art.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                      : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.mutedFg}}>No image</div>}
                  </div>
                  <div className="min-w-0">
                    <p style={{fontSize:14,fontWeight:700,color:C.fg,lineHeight:1.3}}>{art.name}</p>
                    <p style={{fontSize:12,color:C.mutedFg,fontFeatureSettings:'"tnum"',marginTop:2}}>APL: {art.apl}</p>
                  </div>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:C.mutedFg,display:"block",marginBottom:6}}>Remarks</label>
                  <textarea
                    value={rescanRemark}
                    onChange={e=>setRescanRemark(e.target.value)}
                    placeholder="Describe what needs re-scanning (e.g. blurry nutrition panel, missing barcode)…"
                    rows={4}
                    style={{width:"100%",borderRadius:8,border:`1px solid ${C.border}`,padding:"8px 10px",
                            fontSize:13,color:C.fg,outline:"none",resize:"vertical",fontFamily:"inherit"}}/>
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-3.5" style={{borderTop:`1px solid ${C.border}`}}>
                <button onClick={()=>setRescanOpen(false)}
                  style={{padding:"8px 14px",borderRadius:8,fontSize:13,fontWeight:600,backgroundColor:"#fff",color:C.mutedFg,border:`1px solid ${C.border2}`,cursor:"pointer"}}>
                  Cancel
                </button>
                <button
                  onClick={()=>{ setRescanOpen(false); showToast("Re-scan request sent") }}
                  style={{padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,backgroundColor:C.pr,color:"#fff",border:`1px solid ${C.pr}`,cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.prHov}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor=C.pr}>
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Approve & Push confirmation modal (no remarks) ── */}
        {approveOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{backgroundColor:"rgba(15,23,42,0.5)", backdropFilter:"blur(2px)"}}
            onClick={()=>setApproveOpen(false)}>
            <div onClick={e=>e.stopPropagation()}
              style={{width:440, maxWidth:"92vw", backgroundColor:"#fff", borderRadius:14,
                      border:`1px solid ${C.border}`, boxShadow:"0 24px 64px rgba(0,0,0,0.25)", overflow:"hidden"}}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5" style={{borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:14,fontWeight:700,color:C.fg}}>Approve &amp; Push to Cookbook</span>
                <button onClick={()=>setApproveOpen(false)} aria-label="Close"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-muted/50">
                  <X size={15}/>
                </button>
              </div>
              {/* Body */}
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div style={{width:56,height:56,flexShrink:0,borderRadius:8,overflow:"hidden",backgroundColor:C.muted,border:`1px solid ${C.border}`}}>
                    {resolvedImgs(0)
                      ? <img src={resolvedImgs(0)} alt={art.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                      : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.mutedFg}}>No image</div>}
                  </div>
                  <div className="min-w-0">
                    <p style={{fontSize:14,fontWeight:700,color:C.fg,lineHeight:1.3}}>{art.name}</p>
                    <p style={{fontSize:12,color:C.mutedFg,fontFeatureSettings:'"tnum"',marginTop:2}}>APL: {art.apl}</p>
                  </div>
                </div>
                <p style={{fontSize:12.5,color:C.mutedFg,lineHeight:1.5}}>
                  This will approve the profile and push it to Cookbook.
                </p>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-3.5" style={{borderTop:`1px solid ${C.border}`}}>
                <button onClick={()=>setApproveOpen(false)}
                  style={{padding:"8px 14px",borderRadius:8,fontSize:13,fontWeight:600,backgroundColor:"#fff",color:C.mutedFg,border:`1px solid ${C.border2}`,cursor:"pointer"}}>
                  Cancel
                </button>
                <button
                  onClick={()=>{ setApproveOpen(false); showToast("Approved & pushed to Cookbook") }}
                  style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,backgroundColor:C.pr,color:"#fff",border:`1px solid ${C.pr}`,cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.prHov}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor=C.pr}>
                  <Check size={13} strokeWidth={3}/> Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Remove Entirely confirmation modal ── */}
        {removeOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{backgroundColor:"rgba(15,23,42,0.5)", backdropFilter:"blur(2px)"}}
            onClick={()=>setRemoveOpen(false)}>
            <div onClick={e=>e.stopPropagation()}
              style={{width:440, maxWidth:"92vw", backgroundColor:"#fff", borderRadius:14,
                      border:`1px solid ${C.border}`, boxShadow:"0 24px 64px rgba(0,0,0,0.25)", overflow:"hidden"}}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5" style={{borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:14,fontWeight:700,color:C.fg}}>Remove Retired APL</span>
                <button onClick={()=>setRemoveOpen(false)} aria-label="Close"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-muted/50">
                  <X size={15}/>
                </button>
              </div>
              {/* Body */}
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div style={{width:56,height:56,flexShrink:0,borderRadius:8,overflow:"hidden",backgroundColor:C.muted,border:`1px solid ${C.border}`}}>
                    {resolvedImgs(0)
                      ? <img src={resolvedImgs(0)} alt={art.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                      : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.mutedFg}}>No image</div>}
                  </div>
                  <div className="min-w-0">
                    <p style={{fontSize:14,fontWeight:700,color:C.fg,lineHeight:1.3}}>{art.name}</p>
                    <p style={{fontSize:12,color:C.mutedFg,fontFeatureSettings:'"tnum"',marginTop:2}}>APL: {art.apl}</p>
                  </div>
                </div>
                <p style={{fontSize:12.5,color:C.mutedFg,lineHeight:1.5}}>
                  This will permanently remove this retired APL article from the list. This cannot be undone.
                </p>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-3.5" style={{borderTop:`1px solid ${C.border}`}}>
                <button onClick={()=>setRemoveOpen(false)}
                  style={{padding:"8px 14px",borderRadius:8,fontSize:13,fontWeight:600,backgroundColor:"#fff",color:C.mutedFg,border:`1px solid ${C.border2}`,cursor:"pointer"}}>
                  Cancel
                </button>
                <button
                  onClick={()=>{ setRemoveOpen(false); removeArticle(art.id); showToast("APL retired article was removed"); onClose?.() }}
                  style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,backgroundColor:"#B42318",color:"#fff",border:"1px solid #B42318",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor="#9A1C13"}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor="#B42318"}>
                  <Trash2 size={13}/> Remove Entirely
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Shared completion toast (top-right) ── */}
        {topToast && (
          <div className="fixed top-4 right-4 z-[210] flex items-center gap-2 rounded-lg px-4 py-3"
            style={{backgroundColor:"#1F2937", color:"#fff", boxShadow:"0 8px 24px rgba(0,0,0,0.25)"}}>
            <Check size={15} className="text-emerald-400" strokeWidth={3}/>
            <span style={{fontSize:13,fontWeight:600}}>{topToast}</span>
          </div>
        )}
      </div>
  )
}
