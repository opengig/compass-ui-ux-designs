// @ts-nocheck
import { Button } from "./ui";

/**
 * Nutritionist button primitives — thin wrappers around the shared DS Button
 * so call-sites stay stable but styling matches the Article SME flow.
 *   BtnPrimary   — DS default (solid primary)
 *   BtnSecondary — DS outline
 *   BtnGhost     — DS ghost (small)
 *   BtnConfirm   — emerald-soft (no equivalent DS variant)
 *   BtnReject    — DS destructive
 *   BtnCancel    — DS outline
 */

export function BtnPrimary({ children, onClick, className = "", disabled = false }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`h-10 px-5 text-[13px] font-medium gap-1.5 ${className}`}
    >
      {children}
    </Button>
  );
}

export function BtnSecondary({ children, onClick, className = "", disabled = false }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={`h-8 px-4 text-[13px] font-medium gap-1.5 ${className}`}
    >
      {children}
    </Button>
  );
}

export function BtnGhost({ children, onClick, className = "" }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`h-7 px-2 text-[12px] font-medium gap-1.5 ${className}`}
    >
      {children}
    </Button>
  );
}

export function BtnConfirm({ children, onClick, disabled = false, className = "" }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`h-8 px-3 text-[12px] font-semibold gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-600 hover:bg-emerald-100 ${className}`}
    >
      {children}
    </Button>
  );
}

export function BtnReject({ children, onClick, disabled = false, className = "" }) {
  return (
    <Button
      variant="destructive"
      onClick={onClick}
      disabled={disabled}
      className={`h-8 px-3 text-[12px] font-semibold gap-1.5 border border-destructive/40 ${className}`}
    >
      {children}
    </Button>
  );
}

export function BtnCancel({ children, onClick }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="h-8 px-3 text-[12px] font-medium gap-1.5"
    >
      {children}
    </Button>
  );
}
