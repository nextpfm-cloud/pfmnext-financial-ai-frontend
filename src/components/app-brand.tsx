/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"

// PFM NEXT logo (Figma "new logo2", 139×35, Nov 2026). `compact` shows only the PFM NEXT mark.
export function AppBrand({ compact = false, className }: { compact?: boolean; className?: string }) {
  if (compact) return <img src="/brand/pfmnext-mark.svg" alt="PFM NEXT" width={27} height={28} className={cn("h-7 w-auto", className)} />
  return <img src="/brand/pfmnext-logo.png" alt="PFM NEXT — Transformation & Intelligence" width={139} height={35} className={cn("h-[35px] w-[139px] object-contain", className)} />
}
