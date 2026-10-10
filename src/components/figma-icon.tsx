/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"

// Icons exported from the Figma file live in /public/icons and keep their intrinsic size.
// `dark` marks charcoal icons that need lifting in dark mode.
export function FigmaIcon({ name, size, dark = false, className }: { name: string; size?: number; dark?: boolean; className?: string }) {
  return <img src={`/icons/${name}.svg`} alt="" aria-hidden="true" style={size ? { width: size, height: size } : undefined} className={cn("shrink-0", size && "object-contain", dark && "icon-dark", className)} />
}
