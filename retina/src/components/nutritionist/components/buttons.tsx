// @ts-nocheck
import { C } from "../data/tokens";

/**
 * Reusable button primitives for the nutritionist screens.
 * Mirrors the retina.ai buttons spec (DS §9):
 *   BtnPrimary  — solid brand-amber CTA (one per screen)
 *   BtnSecondary — outlined chrome toolbar action
 *   BtnGhost    — inline borderless action
 *   BtnConfirm  — ok-soft confirm (approve)
 *   BtnReject   — err-soft reject (deny)
 *   BtnCancel   — neutral outlined cancel
 */

export function BtnPrimary({ children, onClick, className="", disabled=false, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{backgroundColor:C.pr, color:"#fff", fontSize:13, fontWeight:500, border:"none",
              height:40, borderRadius:8, cursor:disabled?"not-allowed":"pointer", ...style}}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.backgroundColor=C.prHov }}
      onMouseLeave={e=>{ if(!disabled) e.currentTarget.style.backgroundColor=C.pr }}>
      {children}
    </button>
  )
}
// Secondary — toolbar actions, outlined chrome — DS §9.1 Default: h32 px16 r6
export function BtnSecondary({ children, onClick, className="", disabled=false, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-4 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{backgroundColor:C.card, color:C.ink2, fontSize:13, fontWeight:500,
              border:`1px solid ${C.border}`, height:32, borderRadius:6,
              cursor:disabled?"not-allowed":"pointer", ...style}}
      onMouseEnter={e=>{ if(!disabled){ e.currentTarget.style.backgroundColor=C.surfHov; e.currentTarget.style.borderColor=C.border2 }}}
      onMouseLeave={e=>{ if(!disabled){ e.currentTarget.style.backgroundColor=C.card; e.currentTarget.style.borderColor=C.border }}}>
      {children}
    </button>
  )
}
// Ghost — inline, no border — DS §9.1
export function BtnGhost({ children, onClick, className="", style={} }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 px-2 transition-all ${className}`}
      style={{backgroundColor:"transparent", color:C.ink2, fontSize:12, fontWeight:500,
              border:"none", height:28, borderRadius:6, cursor:"pointer", ...style}}
      onMouseEnter={e=>{ e.currentTarget.style.backgroundColor=C.surfHov; e.currentTarget.style.color=C.fg }}
      onMouseLeave={e=>{ e.currentTarget.style.backgroundColor="transparent"; e.currentTarget.style.color=C.ink2 }}>
      {children}
    </button>
  )
}
// Confirm — DS §9.4: ok-soft bg, ok border, ok text — h32 px12 r6
export function BtnConfirm({ children, onClick, disabled=false, className="", style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{backgroundColor:C.grBg, color:C.gr, fontSize:12, fontWeight:600,
              border:`1px solid ${C.gr}`, height:32, borderRadius:6,
              cursor:disabled?"not-allowed":"pointer", ...style}}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.backgroundColor="#D4E8DD" }}
      onMouseLeave={e=>{ if(!disabled) e.currentTarget.style.backgroundColor=C.grBg }}>
      {children}
    </button>
  )
}
// Reject — DS §9.4: err-soft bg, err border, err text — h32 px12 r6
export function BtnReject({ children, onClick, disabled=false, className="", style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{backgroundColor:C.rdBg, color:C.rd, fontSize:12, fontWeight:600,
              border:`1px solid ${C.rd}`, height:32, borderRadius:6,
              cursor:disabled?"not-allowed":"pointer", ...style}}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.backgroundColor="#F5D5D5" }}
      onMouseLeave={e=>{ if(!disabled) e.currentTarget.style.backgroundColor=C.rdBg }}>
      {children}
    </button>
  )
}
// Cancel — neutral outlined — DS §9.1 Small: h28 px12 r4
export function BtnCancel({ children, onClick }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 px-3 transition-all"
      style={{backgroundColor:"transparent", color:C.ink2, fontSize:12, fontWeight:500,
              border:`1px solid ${C.border}`, height:32, borderRadius:6, cursor:"pointer"}}
      onMouseEnter={e=>{ e.currentTarget.style.backgroundColor=C.surfHov }}
      onMouseLeave={e=>{ e.currentTarget.style.backgroundColor="transparent" }}>
      {children}
    </button>
  )
}

