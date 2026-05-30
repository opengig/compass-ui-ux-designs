// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, ChevronUp, ChevronDown, Check, X, Eye, Lock,
  AlertTriangle, Plus, MoveDown, SkipForward, Clock,
} from "lucide-react";
import {
  Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Checkbox, Alert, AlertDescription,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../components/ui";
import { C } from "../data/tokens";
import { NNAMES, computeDisplayNuts } from "../data/nutrients";
import { ARTS } from "../data/mockData";
import { StatusBadge, NutBadge } from "../components/shared";
import { BtnPrimary, BtnSecondary, BtnGhost, BtnConfirm, BtnReject, BtnCancel } from "../components/buttons";
import { useOFFImages } from "../hooks/useOFFImages";
import { NUTRITIONIST_ROUTES } from "../../../router/routes";
import { useNutritionist } from "../NutritionistContext";

/** Article detail screen with approve / reject / skip / move flows. */

export function DetailScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const ctx = useNutritionist();
  const artId = Number(params.articleId);
  const viewOnly = location.state?.viewOnly ?? false;
  const backTarget = location.state?.backTarget ?? "queue";
  const { showToast, navIds, setNavIds } = ctx;
  const goApp = (s) => navigate(`/nutritionist/${s}`);
  const openArt = (id, ro, ids) => {
    if (ids) setNavIds(ids);
    navigate(`/nutritionist/article/${id}`, { state: { viewOnly: !!ro, backTarget } });
  };
  void navIds;
  const art = ARTS.find(a=>a.id===artId)
  const displayNuts = computeDisplayNuts(art)
  const [nutVals, setNutVals] = useState(Object.fromEntries(Object.entries(displayNuts).map(([k,v])=>[k,v.v])))
  const [nutEdited, setNutEdited] = useState({})
  const [defAl, setDefAl] = useState([...(art?.def_al||[])])
  const [probAl, setProbAl] = useState([...(art?.prob_al||[])])
  const [newAlDef, setNewAlDef] = useState("")
  const [newAlProb, setNewAlProb] = useState("")
  const [remark, setRemark] = useState("")
  const [modal, setModal] = useState(null)
  const [skipRemark, setSkipRemark] = useState("")
  const [skipErr, setSkipErr] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [lightbox, setLightbox] = useState(null) // {url, label}
  const [activeImg, setActiveImg] = useState(0)

  // Reset selected thumbnail to Front whenever article changes
  useEffect(() => { setActiveImg(0) }, [artId])

  // ── Open Food Facts real images ──
  const { offImgs: detailOffImgs, offLink: detailOffLink } = useOFFImages(art || null)

  if(!art) return null
  const hasEdits = Object.keys(nutEdited).some(k=>nutEdited[k])
  const confColor = art.conf>=80?"text-[#1B8754]":art.conf>=50?"text-[#7A5310]":"text-[#C53030]"

  /* Navigate to next article in the list, or fall back to queue/approved */
  const goNext = () => {
    const ids = navIds || ARTS.map(a=>a.id)
    const idx = ids.indexOf(art.id)
    const nextId = idx < ids.length - 1 ? ids[idx + 1] : null
    if(nextId) {
      openArt(nextId, viewOnly, ids)
    } else {
      goApp(backTarget)
    }
  }

  const nutInputClass = (c) => {
    if(c==="missing") return "border-red-300 bg-[#FCEAEA] text-[#8A8275]"
    if(c==="llm")     return "border-[#E8C97A] bg-[#FEF9EE] text-[#7A5310]"
    if(c==="ai")      return "border-[#E8C97A] bg-[#FEF9EE] text-[#7A5310]"
    if(c==="na")      return "border-[#ECE6DA] bg-[#FBF9F5] text-[#8A8275]"
    return "border-[#ECE6DA]"
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Detail topbar */}
      <div className="bg-[#ffffff] border-b border-[#ECE6DA] px-5 py-2.5 flex items-center gap-2.5 flex-shrink-0 min-h-12">
        <BtnGhost style={{color:C.pr, fontSize:12, fontWeight:600}}
          onClick={()=>goApp(backTarget)}>
          <ArrowLeft size={13}/>{backTarget==="approved"?"Back to Submitted":"Back to Queue"}
        </BtnGhost>
        <span className="text-gray-200 text-base">/</span>
        <span className="text-[13px] font-semibold text-[#1A1A1A]">{art.name}</span>
        <span className="text-xs text-[#8A8275] font-mono bg-[#F5F2EC] px-2 py-0.5 rounded">{art.apl}</span>
        <StatusBadge status={art.status}/>
        {/* Skip → Review Later — only for amber/need-review, right-aligned */}
        {!viewOnly && art.status==="amber" && (
          <div className="ml-auto">
            <BtnSecondary onClick={()=>setModal("skip")}>
              <Clock size={11}/>Review Later
            </BtnSecondary>
          </div>
        )}
      </div>

      {/* Body — scrollable page */}
      <div className="flex-1 overflow-y-auto" style={{backgroundColor:C.page}}>
        <div className="px-8 py-6 max-w-5xl mx-auto">

          {/* Read-only banner */}
          {viewOnly && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-4 text-xs font-semibold flex-shrink-0"
              style={{backgroundColor:C.prBg, border:`1px solid ${C.prBdr}`, color:C.pr}}>
              <Eye size={12}/> Read-only — this article is approved. No edits permitted.
            </div>
          )}

          {/* Article title */}
          <h1 style={{fontSize:22, fontWeight:700, color:C.fg, marginBottom:12, letterSpacing:"-0.02em"}}>{art.name}</h1>

          {/* Two-column: image left, accordions right */}
          <div className="flex gap-6 items-start">

            {/* LEFT — images */}
            <div style={{width:"42%", flexShrink:0}}>

              {/* ── Product Images header ── */}
              <p style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:C.mutedFg,marginBottom:8}}>
                Product Images
                {detailOffLink && (
                  <a href={detailOffLink} target="_blank" rel="noopener noreferrer"
                    style={{marginLeft:8,fontSize:9,color:C.pr,textDecoration:"none",fontWeight:600,letterSpacing:"0.04em"}}>
                    ↗ Open Food Facts
                  </a>
                )}
              </p>

              {/* Main image — lightbox/zoom disabled in nutritionist flow */}
              <div
                className="relative rounded-xl overflow-hidden flex items-center justify-center mb-3"
                style={{border:`1px solid ${C.border}`, backgroundColor:C.muted, aspectRatio:"1/1", boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                {detailOffImgs?.[activeImg] ? (
                  <img
                    key={detailOffImgs[activeImg]}
                    src={detailOffImgs[activeImg]}
                    alt={["Front","Back","Side","Barcode"][activeImg]}
                    onError={e=>{ e.currentTarget.style.display="none" }}
                    style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2" style={{color:C.mutedFg}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span style={{fontSize:11}}>No image</span>
                  </div>
                )}
                {detailOffImgs?.[activeImg] && (
                  <>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white rounded-lg px-2 py-1" style={{fontSize:9,fontWeight:600,letterSpacing:"0.04em",backdropFilter:"blur(4px)"}}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                        <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                      </svg>
                      ENLARGE
                    </div>
                    <div className="absolute top-2 left-2 text-white rounded-lg px-2 py-1"
                      style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",
                              backgroundColor:`${C.pr}ee`,backdropFilter:"blur(4px)"}}>
                      {["Front","Back","Side","Barcode"][activeImg]||"Image"}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 mb-1">
                {["Front","Back","Side","Barcode"].map((label, i) => {
                  const url = detailOffImgs?.[i]
                  const isActive = activeImg === i
                  return (
                    <button key={label} onClick={()=>setActiveImg(i)}
                      className="flex-1 overflow-hidden transition-all"
                      style={{
                        borderRadius: 10,
                        border: isActive ? `2.5px solid ${C.pr}` : `1.5px solid ${C.border}`,
                        boxShadow: isActive ? `0 0 0 3px ${C.prBg}, 0 2px 8px rgba(198,138,30,0.18)` : "none",
                        backgroundColor: C.muted,
                        position:"relative",
                        transform: isActive ? "scale(1.06)" : "scale(1)",
                        transition:"transform 0.15s, border-color 0.15s, box-shadow 0.15s",
                        outline:"none",
                      }}>
                      <div style={{aspectRatio:"1/1", overflow:"hidden", borderRadius:8}}>
                        {url
                          ? <img src={url} alt={label} onError={e=>e.currentTarget.style.display="none"} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                          : <div className="w-full h-full flex items-center justify-center" style={{fontSize:8,fontWeight:700,color:C.mutedFg,textTransform:"uppercase"}}>{label[0]}</div>
                        }
                      </div>
                      {/* Label bar — amber when active */}
                      <div style={{
                        position:"absolute",bottom:0,left:0,right:0,
                        background: isActive
                          ? `linear-gradient(transparent, ${C.pr}dd)`
                          : "linear-gradient(transparent, rgba(0,0,0,0.5))",
                        color:"#fff",fontSize:7,fontWeight:700,
                        textAlign:"center",padding:"5px 0 3px",
                        textTransform:"uppercase",letterSpacing:"0.05em",
                        borderRadius:"0 0 8px 8px",
                        transition:"background 0.15s",
                      }}>{label}</div>
                    </button>
                  )
                })}
              </div>

              {/* Article summary card */}
              <div className="mt-4 rounded-xl p-4" style={{backgroundColor:C.card, border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                <p className="text-[9px] font-bold uppercase tracking-[0.05em] mb-3" style={{color:C.mutedFg}}>Article Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  {[["Category",art.cat,""],["Site",art.site,""],["Scanned by",art.scanned,""],["APL Code",art.apl,"font-mono"]].map(([l,v,cls])=>(
                    <div key={l}>
                      <p style={{fontSize:10,color:C.mutedFg,marginBottom:2}}>{l}</p>
                      <p className={cls} style={{fontSize:12,fontWeight:700,color:C.fg}}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prev / Next */}
              {(() => {
                const ids = navIds || ARTS.map(a=>a.id)
                const idx = ids.indexOf(art.id)
                const total = ids.length
                const prevArt = idx > 0 ? ARTS.find(a=>a.id===ids[idx-1]) : null
                const nextArt = idx < total-1 ? ARTS.find(a=>a.id===ids[idx+1]) : null
                return (
                  <div className="flex items-center justify-between mt-4 pt-4" style={{borderTop:`1px solid ${C.border}`}}>
                    <button disabled={!prevArt} onClick={()=>prevArt && openArt(prevArt.id, viewOnly, ids)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{fontSize:12,fontWeight:600,color:C.pr,backgroundColor:prevArt?C.prBg:"transparent",border:`1px solid ${prevArt?C.prBdr:"transparent"}`}}>
                      <ArrowLeft size={12}/> Prev
                    </button>
                    <span style={{fontSize:11,fontWeight:700,fontFeatureSettings:'"tnum"',color:C.mutedFg}}>
                      <span style={{color:C.fg}}>{idx+1}</span> / {total}
                    </span>
                    <button disabled={!nextArt} onClick={()=>nextArt && openArt(nextArt.id, viewOnly, ids)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{fontSize:12,fontWeight:600,color:C.pr,backgroundColor:nextArt?C.prBg:"transparent",border:`1px solid ${nextArt?C.prBdr:"transparent"}`}}>
                      Next <ChevronRight size={12}/>
                    </button>
                  </div>
                )
              })()}
            </div>

            {/* RIGHT — accordions */}
            <div className="flex-1 flex flex-col gap-4">

              {/* ALLERGENS (Contains) accordion */}
              {(() => {
                const [open, setOpen] = useState(true)
                return (
                  <div style={{border:`1px solid ${C.border}`, backgroundColor:C.card, borderRadius:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                    <button className="w-full flex items-center justify-between px-5 py-4 transition-colors"
                      style={{backgroundColor:"transparent", borderRadius: open ? "14px 14px 0 0" : 14}}
                      onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.muted}
                      onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}
                      onClick={()=>setOpen(o=>!o)}>
                      <span style={{fontSize:13,fontWeight:600,color:C.fg,letterSpacing:"0.04em",textTransform:"uppercase"}}>Allergens (Contains)</span>
                      {open ? <ChevronUp size={16} color={C.mutedFg}/> : <ChevronDown size={16} color={C.mutedFg}/>}
                    </button>
                    {open && (
                      <div style={{borderTop:`1px solid ${C.border}`, padding:"16px 20px 20px", borderRadius:"0 0 14px 14px"}}>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[11px] mb-2" style={{color:C.mutedFg}}>Allergens definitely present on the packet label.</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {defAl.length ? defAl.map((a,i)=>(
                                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{backgroundColor:C.rdBg,color:C.rd,border:`1px solid ${C.rdBdr}`}}>
                                  {a}{!viewOnly&&<button onClick={()=>setDefAl(prev=>prev.filter((_,j)=>j!==i))}><X size={11} className="opacity-50 hover:opacity-100"/></button>}
                                </span>
                              )) : <span className="text-xs italic" style={{color:C.mutedFg}}>None</span>}
                            </div>
                            {!viewOnly && (
                              <div className="flex gap-2">
                                <Input className="h-8 text-xs flex-1" placeholder="Add allergen..." value={newAlDef} onChange={e=>setNewAlDef(e.target.value)}
                                  onKeyDown={e=>{if(e.key==="Enter"&&newAlDef.trim()){setDefAl(p=>[...p,newAlDef.trim()]);setNewAlDef("")}}}/>
                                <BtnSecondary style={{height:32, borderColor:C.rdBdr, color:C.rd}}
                                  onClick={()=>{if(newAlDef.trim()){setDefAl(p=>[...p,newAlDef.trim()]);setNewAlDef("")}}}>
                                  <Plus size={11}/>Add
                                </BtnSecondary>
                              </div>
                            )}
                          </div>
                          <div className="h-px" style={{backgroundColor:C.border}}/>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox id="nv" disabled={viewOnly}/><label htmlFor="nv" className="text-sm cursor-pointer" style={{color:C.fg}}>Contains non-vegetarian ingredient</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox id="av" disabled={viewOnly}/><label htmlFor="av" className="text-sm cursor-pointer" style={{color:C.fg}}>Verified allergens match packet label</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* MAY CONTAIN accordion */}
              {(() => {
                const [open, setOpen] = useState(true)
                return (
                  <div style={{border:`1px solid ${C.border}`, backgroundColor:C.card, borderRadius:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                    <button className="w-full flex items-center justify-between px-5 py-4 transition-colors"
                      style={{backgroundColor:"transparent", borderRadius: open ? "14px 14px 0 0" : 14}}
                      onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.muted}
                      onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}
                      onClick={()=>setOpen(o=>!o)}>
                      <span style={{fontSize:13,fontWeight:600,color:C.fg,letterSpacing:"0.04em",textTransform:"uppercase"}}>May Contain</span>
                      {open ? <ChevronUp size={16} color={C.mutedFg}/> : <ChevronDown size={16} color={C.mutedFg}/>}
                    </button>
                    {open && (
                      <div style={{borderTop:`1px solid ${C.border}`, padding:"16px 20px 20px", borderRadius:"0 0 14px 14px"}}>
                        <p className="text-[11px] mb-2" style={{color:C.mutedFg}}>Probable allergens — trace contamination from the same factory line.</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {probAl.length ? probAl.map((a,i)=>(
                            <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{backgroundColor:C.amBg,color:C.am,border:`1px solid ${C.amBdr}`}}>
                              {a}{!viewOnly&&<button onClick={()=>setProbAl(prev=>prev.filter((_,j)=>j!==i))}><X size={11} className="opacity-50 hover:opacity-100"/></button>}
                            </span>
                          )) : <span className="text-xs italic" style={{color:C.mutedFg}}>None declared</span>}
                        </div>
                        {!viewOnly && (
                          <div className="flex gap-2">
                            <Input className="h-8 text-xs flex-1" placeholder="Add probable allergen..." value={newAlProb} onChange={e=>setNewAlProb(e.target.value)}
                              onKeyDown={e=>{if(e.key==="Enter"&&newAlProb.trim()){setProbAl(p=>[...p,newAlProb.trim()]);setNewAlProb("")}}}/>
                            <BtnSecondary style={{height:32, borderColor:C.amBdr, color:C.am}}
                              onClick={()=>{if(newAlProb.trim()){setProbAl(p=>[...p,newAlProb.trim()]);setNewAlProb("")}}}>
                              <Plus size={11}/>Add
                            </BtnSecondary>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* NUTRIENTS accordion */}
              {(() => {
                const [open, setOpen] = useState(true)
                return (
                  <div style={{border:`1px solid ${C.border}`, backgroundColor:C.card, borderRadius:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                    <button className="w-full flex items-center justify-between px-5 py-4 transition-colors"
                      style={{backgroundColor:"transparent", borderRadius: open ? "14px 14px 0 0" : 14}}
                      onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.muted}
                      onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}
                      onClick={()=>setOpen(o=>!o)}>
                      <span style={{fontSize:13,fontWeight:600,color:C.fg,letterSpacing:"0.04em",textTransform:"uppercase"}}>Nutrients</span>
                      {open ? <ChevronUp size={16} color={C.mutedFg}/> : <ChevronDown size={16} color={C.mutedFg}/>}
                    </button>
                    {open && (
                      <div style={{borderTop:`1px solid ${C.border}`, borderRadius:"0 0 14px 14px"}}>
                        <div className="px-5 py-4">
                          {/* 3-column clean table: Nutrient Name | Per 100g/100ml | UOM */}
                          <div className="overflow-hidden" style={{border:`1px solid ${C.border}`, borderRadius:4}}>
                            {/* Header */}
                            <div className="flex" style={{backgroundColor:C.page, borderBottom:`1px solid ${C.border}`}}>
                              <div className="px-3 py-2.5"
                                style={{width:200,flexShrink:0,fontSize:10,fontWeight:700,
                                        textTransform:"uppercase",letterSpacing:"0.08em",color:C.mutedFg}}>
                                Nutrient Name
                              </div>
                              <div className="px-3 py-2.5 flex-1"
                                style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",
                                        color:C.mutedFg,borderLeft:`1px solid ${C.border}`,textAlign:"left"}}>
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
                                  <div className="px-3 py-2.5 flex items-center"
                                    style={{width:200,flexShrink:0}}>
                                    <span style={{fontSize:13, fontWeight:500, color:rowColor, lineHeight:1.3}}>
                                      {NNAMES[k]}
                                    </span>
                                  </div>
                                  <div className="px-3 py-1.5 flex-1 flex items-center justify-center"
                                    style={{borderLeft:`1px solid ${C.border}`}}>
                                    <input
                                      value={isNA ? "N/A" : (nutVals[k] || "")}
                                      disabled={isNA || viewOnly}
                                      onChange={e=>{
                                        setNutVals(prev=>({...prev,[k]:e.target.value}))
                                        setNutEdited(prev=>({...prev,[k]:true}))
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
                                  <div className="px-3 py-2.5 flex items-center"
                                    style={{width:64,flexShrink:0,borderLeft:`1px solid ${C.border}`}}>
                                    <span style={{fontSize:12, color:C.mutedFg}}>{n.u}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {!viewOnly && hasEdits && (
                            <Alert className="mt-3 border-[#E8C97A] bg-[#FEF9EE]">
                              <AlertDescription className="text-[#7A5310] text-xs font-medium">⚠ Unsaved edits — values have been modified.</AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* INGREDIENTS accordion */}
              {(() => {
                const [open, setOpen] = useState(false)
                return (
                  <div style={{border:`1px solid ${C.border}`, backgroundColor:C.card, borderRadius:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                    <button className="w-full flex items-center justify-between px-5 py-4 transition-colors"
                      style={{backgroundColor:"transparent", borderRadius: open ? "14px 14px 0 0" : 14}}
                      onMouseEnter={e=>e.currentTarget.style.backgroundColor=C.muted}
                      onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}
                      onClick={()=>setOpen(o=>!o)}>
                      <span style={{fontSize:13,fontWeight:600,color:C.fg,letterSpacing:"0.04em",textTransform:"uppercase"}}>Ingredients</span>
                      {open ? <ChevronUp size={16} color={C.mutedFg}/> : <ChevronDown size={16} color={C.mutedFg}/>}
                    </button>
                    {open && (
                      <div style={{borderTop:`1px solid ${C.border}`, padding:"16px 20px 20px", borderRadius:"0 0 14px 14px"}}>
                        <Alert className="border-[#E8C97A] bg-[#FEF9EE] mb-3">
                          <AlertTriangle size={13} className="text-[#7A5310]"/>
                          <AlertDescription className="text-[#7A5310] text-xs font-medium">Ingredients updated by Procurement team — allergen review may be required.</AlertDescription>
                        </Alert>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs mb-3" style={{backgroundColor:C.muted,color:C.mutedFg,border:`1px solid ${C.border}`}}>
                          <Lock size={11}/> Editable by Procurement team only
                        </div>
                        <p className="text-sm leading-relaxed rounded-lg p-3 mb-3" style={{color:C.mutedFg,backgroundColor:C.muted,border:`1px solid ${C.border}`}}>
                          Whole wheat flour (atta), salt, vitamins (B1, B2, B3, B6, folic acid), iron, zinc. Contains gluten. May contain traces of soy.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {["Whole wheat flour","Salt","Vit B1","Iron","Zinc","Soy (trace)","Gluten"].map(t=>(
                            <span key={t} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{backgroundColor:C.muted,color:C.mutedFg,border:`1px solid ${C.border}`}}>{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Action section */}
              {!viewOnly && (
                <div className="rounded-xl p-4 space-y-2" style={{backgroundColor:C.card, border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.05em]" style={{color:C.mutedFg}}>Remark & Evidence</p>
                  <Textarea className="text-xs min-h-14 resize-none" placeholder="Explain your change or paste a source URL..." value={remark} onChange={e=>setRemark(e.target.value)}/>
                  <div className="flex gap-2 items-center">
                    {art.status==="green" && (
                      <div className="relative group inline-flex">
                        <BtnSecondary style={{width:32, height:32, padding:0, justifyContent:"center", borderColor:C.amBdr, color:C.am}} onClick={()=>setModal("amber")}><MoveDown size={14}/></BtnSecondary>
                        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 pointer-events-none">
                          <div className="bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded whitespace-nowrap">Move to Amber</div>
                        </div>
                      </div>
                    )}
                    <BtnReject onClick={()=>setModal("reject")}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor:C.pr}}>
                        <X size={9} color="#fff" strokeWidth={2.5}/>
                      </span>
                      Reject
                    </BtnReject>
                    <BtnConfirm className="flex-1 justify-center" onClick={()=>setModal("approve")}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor:C.pr}}>
                        <Check size={9} color="#fff" strokeWidth={2.5}/>
                      </span>
                      Approve & Push
                    </BtnConfirm>
                  </div>
                </div>
              )}

            </div>{/* end right accordions */}
          </div>{/* end two-col */}
        </div>{/* end max-w container */}
      </div>{/* end scrollable body */}

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{backgroundColor:"rgba(0,0,0,0.82)", backdropFilter:"blur(4px)"}}
          onClick={()=>setLightbox(null)}>
          <div className="relative max-w-3xl w-full mx-6" onClick={e=>e.stopPropagation()}>
            {/* Close button */}
            <button
              className="absolute -top-10 right-0 flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
              style={{fontSize:13,fontWeight:600}}
              onClick={()=>setLightbox(null)}>
              <X size={16}/> Close
            </button>
            {/* Image */}
            <img
              src={lightbox.url}
              alt={lightbox.label}
              className="w-full rounded-xl object-contain"
              style={{maxHeight:"76vh", boxShadow:"0 24px 64px rgba(0,0,0,0.5)"}}
            />
            {/* Label */}
            <div className="mt-3 text-center">
              <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.08em"}}>
                {art.name} — {lightbox.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      {/* Approve */}
      <Dialog open={modal==="approve"} onOpenChange={()=>setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{fontSize:16,fontWeight:700}}>Approve & push to Cookbook?</DialogTitle>
            <DialogDescription className="text-sm">This marks the article as approved and dispatches it to the Cookbook API.</DialogDescription>
          </DialogHeader>
          <div className="bg-[#FBF9F5] rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-[#8A8275]">Article</span><span className="font-semibold text-[#1A1A1A]">{art.name}</span></div>
            <div className="flex justify-between"><span className="text-[#8A8275]">APL</span><span className="font-mono font-semibold">{art.apl}</span></div>
            <div className="flex justify-between"><span className="text-[#8A8275]">Confidence</span><span className={`font-bold ${confColor}`}>{art.conf}%</span></div>
          </div>
          {/* Interactive checklist */}
          {(()=>{
            const [chk, setChk] = useState({allergen:false, nutrition:false, remark:false})
            const toggle = k => setChk(p=>({...p,[k]:!p[k]}))
            const allRequired = chk.allergen && chk.nutrition
            const items = [
              {key:"allergen",  label:"Allergens verified",       required:true},
              {key:"nutrition", label:"Nutrition values checked",  required:true},
              {key:"remark",    label:"Remark added",              required:false, hint:"optional"},
            ]
            return (
              <>
                <div className="space-y-2">
                  {items.map(item=>(
                    <div key={item.key}>
                      <button onClick={()=>toggle(item.key)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                        style={{
                          backgroundColor: chk[item.key] ? C.grBg : C.page,
                          border: `1.5px solid ${chk[item.key] ? C.grBdr : C.border}`,
                          borderRadius: item.key==="remark" && chk[item.key] ? "8px 8px 0 0" : "8px",
                        }}>
                        <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            backgroundColor: chk[item.key] ? C.gr : "#fff",
                            border: `2px solid ${chk[item.key] ? C.gr : C.border}`,
                          }}>
                          {chk[item.key] && <Check size={11} color="#fff" strokeWidth={3}/>}
                        </span>
                        <span style={{fontSize:13, fontWeight: chk[item.key]?600:400, color: chk[item.key]?C.gr:C.fg}}>
                          {item.label}
                        </span>
                        {item.hint && (
                          <span className="ml-auto" style={{fontSize:10,color:C.mutedFg}}>{item.hint}</span>
                        )}
                        {item.required && !chk[item.key] && (
                          <span className="ml-auto" style={{fontSize:9,fontWeight:600,color:C.am}}>Required</span>
                        )}
                      </button>
                      {/* Remark textarea — appears when checked */}
                      {item.key==="remark" && chk[item.key] && (
                        <div style={{border:`1.5px solid ${C.grBdr}`, borderTop:"none", borderRadius:"0 0 8px 8px", backgroundColor:C.grBg, padding:"0 10px 10px"}}>
                          <textarea
                            autoFocus
                            placeholder="Add your remark here…"
                            rows={3}
                            className="w-full resize-none outline-none bg-white rounded-md px-3 py-2"
                            style={{fontSize:13, color:C.fg, border:`1px solid ${C.border}`, lineHeight:1.6, marginTop:8}}
                            onClick={e=>e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <BtnCancel onClick={()=>setModal(null)}>Cancel</BtnCancel>
                  <BtnConfirm disabled={!allRequired} style={{height:36, paddingLeft:16, paddingRight:16}}
                    onClick={()=>{if(!allRequired)return;setModal(null);showToast("✓ Approved and pushed to Cookbook API");goNext()}}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{backgroundColor:C.pr}}>
                      <Check size={10} color="#fff" strokeWidth={3}/>
                    </span>
                    Confirm Approve
                  </BtnConfirm>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Reject */}
      <Dialog open={modal==="reject"} onOpenChange={()=>setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{fontSize:16,fontWeight:700}}>Reject this article?</DialogTitle>
            <DialogDescription>The article will be returned to the queue for re-scan.</DialogDescription>
          </DialogHeader>
          <Select value={rejectReason} onValueChange={setRejectReason}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Reason for rejection..."/></SelectTrigger>
            <SelectContent>{["Damaged packaging","Blurry image","Incomplete scan","Data cannot be verified","Other"].map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea className="text-sm min-h-20 resize-none" placeholder="Additional notes..."/>
          <div className="flex items-center gap-2 text-sm"><Checkbox id="rescan"/><label htmlFor="rescan">Request re-scan from Store Manager</label></div>
          <DialogFooter>
            <BtnCancel onClick={()=>setModal(null)}>Cancel</BtnCancel>
            <BtnReject onClick={()=>{setModal(null);showToast("Article rejected — returned to queue");goNext()}}>
              <X size={12}/>Confirm Reject
            </BtnReject>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip */}
      <Dialog open={modal==="skip"} onOpenChange={()=>{setModal(null);setSkipErr(false);setSkipRemark("")}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{fontSize:16,fontWeight:700}}>Skip this article?</DialogTitle>
            <DialogDescription>Article moves to end of queue. A remark is <strong>required</strong>.</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-xs text-[#8A8275] font-semibold block mb-1.5">Reason for skipping <span className="text-[#C53030]">*</span></label>
            <Textarea className={`mt-1.5 text-sm min-h-20 resize-none ${skipErr?"border-[#EFA0A0] bg-[#FCEAEA]":""}`}
              placeholder="Explain why you are skipping this article..."
              value={skipRemark} onChange={e=>{setSkipRemark(e.target.value);setSkipErr(false)}}/>
            {skipErr && <p className="text-xs text-[#C53030] font-semibold mt-1">⚠ A remark is required before skipping.</p>}
          </div>
          <DialogFooter>
            <BtnCancel onClick={()=>{setModal(null);setSkipErr(false);setSkipRemark("")}}>Cancel</BtnCancel>
            <BtnSecondary style={{borderColor:C.amBdr, color:C.am}} onClick={()=>{
              if(!skipRemark.trim()){setSkipErr(true);return}
              setModal(null);showToast("↷ Skipped — moved to end of queue");goApp("queue")
            }}>
              <SkipForward size={12}/>Confirm Skip
            </BtnSecondary>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Amber */}
      <Dialog open={modal==="amber"} onOpenChange={()=>setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{fontSize:16,fontWeight:700}}>Move to Amber queue?</DialogTitle>
            <DialogDescription>Downgrades the article from Green to Amber for manual review.</DialogDescription>
          </DialogHeader>
          <div className="bg-[#FBF9F5] rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-[#8A8275]">Article</span><span className="font-semibold">{art.name}</span></div>
            <div className="flex justify-between"><span className="text-[#8A8275]">Current</span><StatusBadge status="green"/></div>
            <div className="flex justify-between"><span className="text-[#8A8275]">New status</span><StatusBadge status="amber"/></div>
          </div>
          <Textarea className="text-sm min-h-16 resize-none" placeholder="Reason (optional)..."/>
          <DialogFooter>
            <BtnCancel onClick={()=>setModal(null)}>Cancel</BtnCancel>
            <BtnSecondary style={{borderColor:C.amBdr, color:C.am}} onClick={()=>{setModal(null);showToast("Moved to Amber — added to Review Queue");goApp("queue")}}>
              <MoveDown size={12}/>Move to Amber
            </BtnSecondary>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
