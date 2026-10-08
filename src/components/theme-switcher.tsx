"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

export function ThemeSwitcher({ align = "right" }: { align?: "left" | "right" }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const CurrentIcon = !mounted || resolvedTheme === "dark" ? Moon : Sun

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-foreground/[0.03] text-muted-foreground transition hover:border-sky-400/25 hover:text-sky-600 dark:hover:text-sky-300"
        aria-label="Choose color theme"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <CurrentIcon className="h-4 w-4" />
      </button>
      {open && (
        <div role="menu" className={`absolute top-11 z-[70] w-40 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl ${align === "right" ? "right-0" : "left-0"}`}>
          {options.map(({ value, label, icon: Icon }) => (
            <button
              type="button"
              role="menuitemradio"
              aria-checked={theme === value}
              key={value}
              onClick={() => { setTheme(value); setOpen(false) }}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs transition ${theme === value ? "bg-sky-500/10 text-sky-700 dark:text-sky-200" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">{label}</span>
              {theme === value && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
