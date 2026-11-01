/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"

// Single-colour accent icons: drawn as a mask filled with the primary colour, so they follow the
// brand colour variables instead of the colour baked into the Figma export. Values: intrinsic size.
const ACCENT_ICONS: Record<string, [number, number]> = {
  "audit-check": [24, 22.7], "shield-check": [29, 32.05], document: [19, 19], lock: [24, 31], "external-link": [20, 20],
}

// Icons exported from the Figma file live in /public/icons and keep their intrinsic size.
// `dark` marks charcoal icons that need lifting in dark mode.
export function FigmaIcon({ name, size, dark = false, className }: { name: string; size?: number; dark?: boolean; className?: string }) {
  const accent = ACCENT_ICONS[name]
  if (accent) {
    const [width, height] = size ? [size, size] : accent
    const mask = `url(/icons/${name}.svg) center / contain no-repeat`
    return <span aria-hidden="true" className={cn("inline-block shrink-0 bg-primary", className)} style={{ width, height, mask, WebkitMask: mask }} />
  }
  return <img src={`/icons/${name}.svg`} alt="" aria-hidden="true" style={size ? { width: size, height: size } : undefined} className={cn("shrink-0", size && "object-contain", dark && "icon-dark", className)} />
}
