/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"

// PFMnext logo (Figma asset, 146×47 in the design). `compact` shows only the X mark.
export function AppBrand({ compact = false, className }: { compact?: boolean; className?: string }) {
  if (compact) return <img src="/brand/x-mark.svg" alt="PFMNext" width={33} height={28} className={cn("h-7 w-auto", className)} />
  return <img src="/brand/logo.png" alt="PFMNext — Transformation & Intelligence" width={146} height={47} className={cn("h-[47px] w-[146px] object-contain", className)} />
}
