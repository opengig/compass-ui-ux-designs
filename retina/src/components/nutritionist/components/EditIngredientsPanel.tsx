// @ts-nocheck
import { useState, useRef } from "react";
import { Lock, Check, X, ChevronUp, ChevronDown, Plus, Copy } from "lucide-react";
import { C } from "../data/tokens";
import { NNAMES, computeDisplayNuts } from "../data/nutrients";
import { useOFFImages } from "../hooks/useOFFImages";

/**
 * Side-by-side article edit panel used by Queue (editable) and Approved (view-only).
 */

export function EditIngredientsPanel({ art, onClose, viewOnly=false }) {
  const displayNuts = computeDisplayNuts(art)
  const [nutVals, setNutVals]     = useState(Object.fromEntries(Object.entries(displayNuts).map(([k,v])=>[k,v.v])))
  const [nutEdited, setNutEdited] = useState({})
  // ── Allergen table — rows fixed from Ingredients section; users only manage allergens per row
  const ALL_ALLERGEN_OPTIONS = ["Gluten","Dairy","Soy","Peanuts","Tree Nuts","Eggs","Fish","Shellfish","Sesame","Mustard","Sulphites","Celery","Lupin","Molluscs"]
  const INGREDIENT_LIST = ["Whole Wheat Flour (Atta)","Sugar","Refined Palm Oil","Invert Syrup","Leavening Agents","Salt","Skimmed Milk Powder","Soy Lecithin (Emulsifier)","Natural Flavours"]
  const ALLERGEN_HINTS = {
    "Gluten":    ["wheat","atta","flour","maida","barley","oat","rye"],
    "Dairy":     ["milk","cream","butter","ghee","whey","lactose","casein","cheese","skimmed"],
    "Soy":       ["soy","soya","lecithin"],
    "Peanuts":   ["peanut","groundnut"],
    "Tree Nuts": ["cashew","almond","walnut","pistachio","hazel","pecan","nut"],
    "Eggs":      ["egg","albumin"],
    "Fish":      ["fish","anchovy","tuna","salmon"],
    "Shellfish": ["shrimp","prawn","crab","lobster"],
    "Sesame":    ["sesame","til","gingelly"],
    "Mustard":   ["mustard"],
    "Sulphites": ["sulphite","sulfite","sulphur"],
    "Celery":    ["celery"],
    "Lupin":     ["lupin"],
    "Molluscs":  ["mollusc","squid","oyster","mussel"],
  }
  const AL_NORM = {"Milk":"Dairy","Wheat":"Gluten","Gluten":"Gluten","Soy":"Soy","Soy (trace)":"Soy","Tree Nuts":"Tree Nuts","Tree Nuts (trace)":"Tree Nuts","Sesame (trace)":"Sesame"}
  const seedRows = () => {
    const defSet = (art?.def_al||[]).map(a=>({label:AL_NORM[a]||a,type:"definitive"}))
    const probSet = (art?.prob_al||[]).map(a=>({label:AL_NORM[a]||a,type:"probable"}))
    const allAl = [...defSet,...probSet]
    return INGREDIENT_LIST.map(ing => {
      const ingL = ing.toLowerCase()
      const seen = new Set()
      const allergens = allAl.filter(al=>{
        if(seen.has(al.label)) return false
        const hits = ALLERGEN_HINTS[al.label]||[]
        if(hits.some(h=>ingL.includes(h))){ seen.add(al.label); return true }
        return false
      })
      return {id:ing, ingredient:ing, allergens}
    })
  }
  const [alRows, setAlRows] = useState(seedRows)
  const [addState, setAddState] = useState(null)  // null | {rowId, step:"type"|"input", type:"definitive"|"probable"|null}
  const [addText, setAddText] = useState("")
  const [gtinCopied, setGtinCopied] = useState(false)
  const gtin = `8901${art.apl.replace("APL-","").padStart(9,"0")}`
  const [sec, setSec]             = useState({allergens:true, nutrients:false, reasons:false, ingredients:false})
  const allExpanded = sec.allergens && sec.nutrients && sec.reasons && sec.ingredients
  const toggleAllSections = () => {
    const next = !allExpanded
    setSec({allergens:next, nutrients:next, reasons:next, ingredients:next})
  }
  const [activeImg, setActiveImg] = useState(0)
  const [zoom, setZoom]           = useState(false)
  const [zoomPos, setZoomPos]     = useState({x:50, y:50})
  const [photoCollapsed, setPhotoCollapsed] = useState(false)
  const [editImgSlot, setEditImgSlot] = useState(null)
  const [artImgOverrides, setArtImgOverrides] = useState({})
  const imgContainerRef           = useRef(null)

  // ── Open Food Facts real images ──
  const { offImgs, offLink } = useOFFImages(art)
  // offImgs: always an array (picsum immediately, upgrades to OFF when available)
  const resolvedImgs = (slot) => {
    const override = artImgOverrides[`${art.id}-${slot}`]
    if (override) return override
    return offImgs?.[slot] || null
  }

  const handleMouseMove = (e) => {
    const rect = imgContainerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width)  * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    setZoomPos({x, y})
  }

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
    green:{bg:C.grBg,color:C.gr,border:C.grBdr,label:"High confidence"},
    amber:{bg:C.amBg,color:C.am,border:C.amBdr,label:"Need review"},
    red:  {bg:C.rdBg,color:C.rd,border:C.rdBdr,label:"Low confidence"},
  }
  const sc = stCfg[art.status]||stCfg.amber

  /* ── Section header ── */
  const SectionHdr = ({k, label}) => (
    <button className="w-full flex items-center justify-between px-5 transition-colors"
      style={{height:40, backgroundColor:sec[k]?"#fff":C.page, borderBottom:`1px solid ${C.border}`}}
      onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.muted}
      onMouseLeave={e=>e.currentTarget.style.backgroundColor=sec[k]?"#fff":C.page}
      onClick={()=>toggleSec(k)}>
      <span style={{fontSize:13,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:C.fg}}>{label}</span>
      {sec[k]
        ? <ChevronUp   size={13} style={{color:C.mutedFg,flexShrink:0}}/>
        : <ChevronDown size={13} style={{color:C.mutedFg,flexShrink:0}}/>}
    </button>
  )

  return (
      <div className="flex flex-col h-full"
        style={{backgroundColor:"#fff", overflow:"hidden"}}>

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 flex items-start gap-3"
          style={{borderBottom:`1px solid ${C.border}`, backgroundColor:"#fff"}}>
          <div className="flex-1 min-w-0">
            {/* Article name row with expand/collapse all button on opposite side */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span style={{fontSize:15,fontWeight:700,color:C.fg,letterSpacing:"-0.01em",lineHeight:1.2}}>{art.name}</span>
                {/* Confidence score chip */}
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
                {viewOnly && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border flex-shrink-0"
                    style={{fontSize:10,fontWeight:600,backgroundColor:C.muted,color:C.mutedFg,borderColor:C.border}}>
                    <Lock size={9}/> Read-only
                  </span>
                )}
              </div>
              {/* Barcode number + copy button */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span style={{fontSize:11,fontWeight:500,color:C.mutedFg,fontFeatureSettings:'"tnum"',letterSpacing:"0.04em"}}>
                  Barcode: {gtin}
                </span>
                <button
                  onClick={()=>{ navigator.clipboard.writeText(gtin); setGtinCopied(true); setTimeout(()=>setGtinCopied(false),1800) }}
                  title="Copy barcode"
                  style={{
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    width:22, height:22, border:"none", borderRadius:4,
                    backgroundColor: gtinCopied ? C.grBg : "transparent",
                    color: gtinCopied ? C.gr : C.mutedFg,
                    cursor:"pointer", flexShrink:0, transition:"all 0.15s",
                  }}
                  onMouseEnter={e=>{ if(!gtinCopied){ e.currentTarget.style.backgroundColor=C.muted; e.currentTarget.style.color=C.fg }}}
                  onMouseLeave={e=>{ if(!gtinCopied){ e.currentTarget.style.backgroundColor="transparent"; e.currentTarget.style.color=C.mutedFg }}}>
                  {gtinCopied ? <Check size={11} strokeWidth={2.5}/> : <Copy size={11} strokeWidth={1.8}/>}
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* ── Body: LEFT details form + RIGHT photo column ── */}
        <div className="flex flex-1 overflow-hidden flex-row-reverse">

          {/* RIGHT: PHOTO PANEL */}
          <div className="flex-shrink-0 flex flex-col overflow-hidden"
            style={{width: photoCollapsed ? 0 : "50%", borderLeft: photoCollapsed ? "none" : `1px solid ${C.border}`, backgroundColor:"#fff", transition:"width 0.25s ease"}}>

                  {/* Main image — Amazon-style zoom on hover */}
                  <div
                    ref={imgContainerRef}
                    onMouseEnter={()=>setZoom(true)}
                    onMouseLeave={()=>setZoom(false)}
                    onMouseMove={handleMouseMove}
                    style={{
                      flex:1, position:"relative",
                      backgroundColor:C.muted, overflow:"hidden",
                      cursor: zoom ? "crosshair" : "default",
                    }}>
                    {(() => {
                      const imgSrc = resolvedImgs(activeImg)
                      return imgSrc ? (
                      <img
                        key={imgSrc}
                        src={imgSrc}
                        alt={["Front","Back","Side","Barcode"][activeImg]}
                        style={{
                          width:"100%", height:"100%",
                          objectFit:"cover", display:"block",
                          transition: zoom ? "none" : "transform 0.2s",
                          transform: zoom
                            ? `scale(2.2) translate(${(50-zoomPos.x)*0.7}%, ${(50-zoomPos.y)*0.7}%)`
                            : "scale(1)",
                          transformOrigin:`${zoomPos.x}% ${zoomPos.y}%`,
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{fontSize:11,color:C.mutedFg}}>No image</div>
                    )})()}

                    {/* Collapse button — vertically centered, flush to left edge */}
                    <button
                      onClick={()=>setPhotoCollapsed(true)}
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
                        <button key={i} onClick={()=>setActiveImg(i)}
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
                          border: i===activeImg ? `2.5px solid ${C.fg}` : `1.5px solid ${C.border}`,
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
                    {offLink && (
                      <a href={offLink} target="_blank" rel="noopener noreferrer"
                        style={{marginLeft:"auto",fontSize:9,color:C.mutedFg,textDecoration:"none",whiteSpace:"nowrap",flexShrink:0}}
                        title="View on Open Food Facts">
                        📷 OFF
                      </a>
                    )}
                  </div>
                </div>{/* end RIGHT PHOTO PANEL */}

          {/* LEFT: DETAILS PANEL */}
          <div className="flex-1 overflow-y-auto" style={{backgroundColor:C.page, position:"relative"}}>

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
            <div style={{borderBottom:`1px solid ${C.border}`}}>
              <SectionHdr k="allergens" label="Allergens"/>
              {sec.allergens && (
                <div className="px-5 py-3" style={{backgroundColor:"#fff"}}>

                  {/* ── ALLERGENS TABLE ── */}
                  <div className="rounded-lg overflow-hidden" style={{border:`1px solid ${C.border}`}}>

                    {/* Table header */}
                    <div className="flex" style={{backgroundColor:C.muted, borderBottom:`1px solid ${C.border2}`}}>
                      <div className="px-3 py-2" style={{width:190,flexShrink:0,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.mutedFg}}>Ingredient Name</div>
                      <div className="px-3 py-2 flex-1" style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.mutedFg,borderLeft:`1px solid ${C.border2}`}}>Allergen</div>
                    </div>

                    {/* Ingredient rows — fixed list, allergens editable only */}
                    {alRows.map((row, ri) => {
                      // Two-step add state for this row
                      const isAddingThisRow = addState?.rowId === row.id
                      const addStep = isAddingThisRow ? addState.step : null
                      const addType = isAddingThisRow ? addState.type : null
                      const isDef_input = addType === "definitive"

                      const commitAllergen = () => {
                        const label = addText.trim()
                        if(label && addType) {
                          setAlRows(rows=>rows.map(r=>
                            r.id===row.id ? {...r, allergens:[...r.allergens,{label, type:addType}]} : r
                          ))
                        }
                        setAddState(null); setAddText("")
                      }

                      return (
                        <div key={row.id}
                          style={{borderBottom: ri<alRows.length-1 ? `1px solid ${C.border}` : "none", backgroundColor:"#fff"}}>
                          <div className="flex items-start" style={{minHeight:38}}>

                            {/* Col 1 — Ingredient name (read-only) */}
                            <div className="px-3 py-2.5 flex-shrink-0 flex items-center" style={{width:190}}>
                              <span style={{fontSize:12,fontWeight:500,color:C.fg,lineHeight:1.45}}>{row.ingredient}</span>
                            </div>

                            {/* Col 2 — Allergen chips + add flow */}
                            <div className="px-3 py-2 flex-1 flex flex-wrap items-center gap-1.5"
                              style={{borderLeft:`1px solid ${C.border}`, minHeight:38}}>



                              {/* Existing allergen chips — each with × */}
                              {row.allergens.map((al, ai) => {
                                const isDef = al.type==="definitive"
                                return (
                                  <span key={al.label+ai}
                                    className="inline-flex items-center gap-1"
                                    style={{
                                      padding:"2px 5px 2px 8px", borderRadius:4,
                                      fontSize:11, fontWeight:700, letterSpacing:"0.02em",
                                      // Outline + text only, no fill — per styling brief.
                                      backgroundColor: "transparent",
                                      border:           `1px solid ${isDef ? C.rd : C.am}`,
                                      color:           isDef ? C.rd : C.am,
                                      whiteSpace:"nowrap",
                                    }}>
                                    {al.label}
                                    {!viewOnly && (
                                      <button
                                        onClick={()=>setAlRows(rows=>rows.map(r=>
                                          r.id===row.id ? {...r, allergens:r.allergens.filter((_,j)=>j!==ai)} : r
                                        ))}
                                        style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
                                                width:14,height:14,border:"none",background:"transparent",
                                                cursor:"pointer",padding:0,borderRadius:2,
                                                color: isDef ? C.rd : C.am, opacity:0.55, flexShrink:0}}
                                        onMouseEnter={e=>e.currentTarget.style.opacity="1"}
                                        onMouseLeave={e=>e.currentTarget.style.opacity="0.55"}>
                                        <X size={9} strokeWidth={3}/>
                                      </button>
                                    )}
                                  </span>
                                )
                              })}

                              {/* ── STEP 1: Type selector — shown after clicking + Add ── */}
                              {!viewOnly && addStep === "type" && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={()=>{ setAddState(null); setAddText("") }}/>
                                  <div className="relative z-40 inline-flex items-center gap-1 rounded-md overflow-hidden"
                                    style={{border:`1px solid ${C.border2}`, backgroundColor:C.muted}}>
                                    <span style={{fontSize:10,fontWeight:700,color:C.mutedFg,paddingLeft:7,paddingRight:4,textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>Type:</span>
                                    {/* Definitely allergen button */}
                                    <button
                                      onClick={()=>{ setAddState({rowId:row.id,step:"input",type:"definitive"}); setAddText("") }}
                                      style={{
                                        display:"inline-flex",alignItems:"center",gap:3,
                                        padding:"3px 9px", border:"none",
                                        fontSize:11,fontWeight:700,cursor:"pointer",
                                        backgroundColor:C.rdBg, color:C.rd,
                                        borderLeft:`1px solid ${C.rdBdr}`,
                                      }}
                                      onMouseEnter={e=>e.currentTarget.style.backgroundColor="#F5D5D5"}
                                      onMouseLeave={e=>e.currentTarget.style.backgroundColor=C.rdBg}>
                                      Definitely allergen
                                    </button>
                                    {/* Probably allergen button */}
                                    <button
                                      onClick={()=>{ setAddState({rowId:row.id,step:"input",type:"probable"}); setAddText("") }}
                                      style={{
                                        display:"inline-flex",alignItems:"center",gap:3,
                                        padding:"3px 9px", border:"none",
                                        fontSize:11,fontWeight:700,cursor:"pointer",
                                        backgroundColor:C.amBg, color:C.am,
                                        borderLeft:`1px solid ${C.amBdr}`,
                                      }}
                                      onMouseEnter={e=>e.currentTarget.style.backgroundColor="#F5E5C0"}
                                      onMouseLeave={e=>e.currentTarget.style.backgroundColor=C.amBg}>
                                      Probably allergen
                                    </button>
                                    {/* Cancel */}
                                    <button
                                      onClick={()=>{ setAddState(null); setAddText("") }}
                                      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
                                              width:22,height:"100%",border:"none",background:"transparent",
                                              cursor:"pointer",color:C.mutedFg,borderLeft:`1px solid ${C.border2}`}}
                                      onMouseEnter={e=>e.currentTarget.style.color=C.rd}
                                      onMouseLeave={e=>e.currentTarget.style.color=C.mutedFg}>
                                      <X size={9} strokeWidth={3}/>
                                    </button>
                                  </div>
                                </>
                              )}

                              {/* ── STEP 2: Inline editable tag — styled as the chip itself ── */}
                              {!viewOnly && addStep === "input" && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={commitAllergen}/>
                                  <span className="relative z-40 inline-flex items-center gap-1"
                                    style={{
                                      padding:"2px 5px 2px 8px", borderRadius:4,
                                      fontSize:11, fontWeight:700, letterSpacing:"0.02em",
                                      backgroundColor: "transparent",
                                      color:           isDef_input ? C.rd : C.am,
                                      border:`1.5px solid ${isDef_input ? C.rd : C.am}`,
                                    }}>
                                    <input
                                      autoFocus
                                      value={addText}
                                      onChange={e=>setAddText(e.target.value)}
                                      onKeyDown={e=>{
                                        if(e.key==="Enter") commitAllergen()
                                        if(e.key==="Escape"){ setAddState(null); setAddText("") }
                                      }}
                                      placeholder="Type allergen…"
                                      style={{
                                        border:"none", outline:"none", background:"transparent",
                                        fontSize:11, fontWeight:700, letterSpacing:"0.02em",
                                        color: isDef_input ? C.rd : C.am,
                                        width: Math.max(80, addText.length * 7.5),
                                        minWidth:80, maxWidth:160,
                                        padding:0,
                                      }}
                                    />
                                    {/* Confirm × / ✓ */}
                                    <button onClick={commitAllergen}
                                      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
                                              width:14,height:14,border:"none",background:"transparent",
                                              cursor:"pointer",padding:0,borderRadius:2,
                                              color: isDef_input ? C.rd : C.am, opacity:0.7, flexShrink:0}}
                                      onMouseEnter={e=>e.currentTarget.style.opacity="1"}
                                      onMouseLeave={e=>e.currentTarget.style.opacity="0.7"}>
                                      <Check size={9} strokeWidth={3}/>
                                    </button>
                                  </span>
                                </>
                              )}

                              {/* + Add button — only shown when not in add flow for this row */}
                              {!viewOnly && !isAddingThisRow && (
                                <button
                                  onClick={()=>{ setAddState({rowId:row.id, step:"type", type:null}); setAddText("") }}
                                  style={{
                                    display:"inline-flex",alignItems:"center",gap:3,
                                    padding:"2px 8px",borderRadius:4,
                                    fontSize:11,fontWeight:600,
                                    backgroundColor:"transparent", color:C.mutedFg,
                                    border:`1.5px dashed ${C.border2}`,
                                    cursor:"pointer", transition:"border-color 0.15s, color 0.15s",
                                  }}
                                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pr;e.currentTarget.style.color=C.pr}}
                                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.color=C.mutedFg}}>
                                  <Plus size={9} strokeWidth={2.5}/> Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>



                </div>
              )}
            </div>

            {/* ══════ NUTRIENTS ══════ */}
            <div style={{borderBottom:`1px solid ${C.border}`}}>
              <SectionHdr k="nutrients" label="Nutrients"/>
              {sec.nutrients && (
                <div style={{backgroundColor:"#fff"}}>
                  {/* Per 100g banner */}
                  <div className="mx-5 mt-4 mb-3 px-3 py-1.5 rounded-r"
                    style={{backgroundColor:C.prBg,borderLeft:`2px solid ${C.pr}`,
                            fontSize:12,fontWeight:600,color:C.pr}}>
                    All values per 100g / 100ml
                  </div>
                  {/* Rows */}
                  {Object.entries(displayNuts).map(([k,n])=>{
                    const miss = n.c==="missing"
                    const isLLM = n.c==="llm"
                    const isNA  = n.c==="na"
                    const edited = nutEdited[k]
                    const badge  = nutBadge(n.c)
                    const rStyle = nutRowStyle(n.c)
                    return (
                      <div key={k}
                        className="flex items-center px-5 py-3 gap-3"
                        style={{
                          borderBottom:`1px solid ${C.border}`,
                          borderLeft: rStyle.borderLeft,
                          backgroundColor: rStyle.backgroundColor,
                        }}>
                        {/* Label col */}
                        <div className="flex-1 min-w-0">
                          <p style={{
                            fontSize:13,
                            fontWeight: miss||isLLM ? 700 : 500,
                            color: miss?C.rd : isLLM?C.am : isNA?C.mutedFg : C.fg,
                            lineHeight:1.3,
                          }}>
                            {NNAMES[k]}
                          </p>
                          {miss  && <p style={{fontSize:11,color:C.rd,  marginTop:2,lineHeight:1.4}}>Not found on label — manual entry required</p>}
                          {isLLM && <p style={{fontSize:11,color:C.am,  marginTop:2,lineHeight:1.4}}>AI estimated — verify against label</p>}
                        </div>
                        {/* Value + unit + badge */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input
                            style={{
                              ...nutStyle(n.c),
                              width:88, height:34,
                              fontSize:13, fontFeatureSettings:'"tnum"',
                              fontWeight:500,
                              borderRadius:8,
                              paddingLeft:10, paddingRight:6,
                              outline:"none",
                              boxSizing:"border-box",
                              cursor: viewOnly ? "default" : undefined,
                            }}
                            value={isNA?"N/A":nutVals[k]||""}
                            disabled={isNA || viewOnly}
                            placeholder={miss?"—":""}
                            onChange={e=>{
                              setNutVals(p=>({...p,[k]:e.target.value}))
                              setNutEdited(p=>({...p,[k]:true}))
                            }}
                          />
                          <span style={{fontSize:12,color:C.mutedFg,width:26,flexShrink:0}}>{n.u}</span>
                          <span style={{
                            display:"inline-flex",alignItems:"center",justifyContent:"center",
                            padding:"3px 10px",
                            borderRadius:badge.radius,
                            border:`1.5px solid ${badge.border}`,
                            backgroundColor:badge.bg,
                            color:badge.color,
                            fontSize:11,fontWeight:700,
                            whiteSpace:"nowrap",
                            minWidth:64,
                          }}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ══════ REASONS ══════ */}
            <div style={{borderBottom:`1px solid ${C.border}`}}>
              <SectionHdr k="reasons" label="Reasons"/>
              {sec.reasons && (
                <div className="px-5 py-4" style={{backgroundColor:"#fff"}}>
                  {(() => {
                    const isGreen = art.status === "green"
                    const isRed   = art.status === "red"
                    const color   = isGreen ? C.gr : isRed ? C.rd : C.am
                    const bg      = isGreen ? C.grBg : isRed ? C.rdBg : C.amBg
                    const border  = isGreen ? C.grBdr : isRed ? C.rdBdr : C.amBdr
                    const label   = isGreen ? "High confidence" : isRed ? "Low confidence" : "Need review"
                    const reasons = art.reasons.length > 0
                      ? art.reasons
                      : isGreen
                        ? ["All values scanned and verified","No allergen discrepancies detected","Nutritional data complete"]
                        : isRed
                          ? ["Critical data missing or unverifiable"]
                          : ["Requires manual verification"]
                    return (
                      <div className="rounded-xl px-4 py-3"
                        style={{backgroundColor:bg, border:`1px solid ${border}`}}>
                        <p style={{fontSize:12,fontWeight:700,color,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                          {label}
                        </p>
                        <ul className="space-y-1.5">
                          {reasons.map((r,i)=>(
                            <li key={i} className="flex items-start gap-2" style={{lineHeight:1.5}}>
                              <span style={{color,flexShrink:0,marginTop:"0.15em",fontSize:13,fontWeight:700}}>•</span>
                              <span style={{fontSize:13,color}}>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* ══════ INGREDIENTS ══════ */}
            <div>
              <SectionHdr k="ingredients" label="Ingredients"/>
              {sec.ingredients && (
                <div className="px-5 py-4 space-y-3" style={{backgroundColor:"#fff"}}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{backgroundColor:C.muted,border:`1px solid ${C.border}`,
                            fontSize:12,fontWeight:500,color:C.mutedFg}}>
                    <Lock size={11}/> View only — editable by Procurement team
                  </div>
                  <p style={{fontSize:13,color:C.mutedFg,lineHeight:1.7,
                              backgroundColor:C.page,border:`1px solid ${C.border}`,
                              borderRadius:10,padding:"10px 14px"}}>
                    Whole wheat flour (atta), salt, vitamins (B1, B2, B3, B6, folic acid), iron, zinc.
                    Contains gluten. May contain traces of soy.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Whole wheat flour","Salt","Vit B1","Iron","Zinc","Soy (trace)","Gluten"].map(t=>(
                      <span key={t} className="px-2 py-0.5 rounded-full"
                        style={{fontSize:11,fontWeight:500,backgroundColor:C.muted,
                                color:C.mutedFg,border:`1px solid ${C.border}`}}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

                  {/* bottom padding so last section isn't flush with end */}
                  <div style={{height:8}}/>
          </div>{/* end RIGHT DETAILS PANEL */}

        </div>{/* end body */}
      </div>
  )
}
