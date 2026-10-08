import { Compass } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-600 dark:text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.18)]">
        <Compass className="h-[18px] w-[18px]" />
      </div>
      <div className={cn("min-w-0", compact && "hidden")}>
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-semibold tracking-tight text-foreground">NextPFM</span>
          <span className="rounded-md border border-sky-400/20 bg-sky-400/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-sky-600 dark:text-sky-300">AI</span>
        </div>
        <p className="text-[11px] leading-4 text-muted-foreground">Regulatory intelligence</p>
      </div>
    </div>
  )
}
