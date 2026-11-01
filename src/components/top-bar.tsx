"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogIn, LogOut, Menu, User } from "lucide-react"
import { AppBrand } from "@/components/app-brand"
import { FigmaIcon } from "@/components/figma-icon"
import { ProductSwitcher } from "@/components/product-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import type { AppSession, ChatUsage } from "@/types"

export type TopBarTab = { href: string; label: string; active?: boolean }

// Shared top bar: pill tabs on the left, signed-in identity on the right, and the column of
// small utility buttons under the avatar (theme, sign in/out, account settings).
export function TopBar({ tabs, mobileMenuEvent, showUsage = false }: { tabs: (session: AppSession | null) => TopBarTab[]; mobileMenuEvent: string; showUsage?: boolean }) {
  const router = useRouter()
  const [session, setSession] = useState<AppSession | null>(null)
  const [usage, setUsage] = useState<ChatUsage | null>(null)
  const showUsageRef = useRef(showUsage)

  useEffect(() => {
    const loadUsage = () => fetch("/api/backend/me/usage", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then(setUsage).catch(() => setUsage(null))
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((value: AppSession | null) => { setSession(value); if (value && showUsageRef.current) void loadUsage() })
      .catch(() => setSession(null))
    window.addEventListener("nextpfm:usage-changed", loadUsage)
    return () => window.removeEventListener("nextpfm:usage-changed", loadUsage)
  }, [])

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setSession(null); setUsage(null)
    router.replace("/chat"); router.refresh()
  }

  return (
    <header className="relative z-30 flex h-[85px] shrink-0 items-start justify-between gap-3 bg-background px-4 pt-[13px] sm:px-6 lg:pl-[50px] lg:pr-4">
      <div className="flex items-center gap-3 pt-3 lg:hidden">
        <button type="button" onClick={() => window.dispatchEvent(new Event(mobileMenuEvent))} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground" aria-label="Open navigation"><Menu className="h-4 w-4" /></button>
        <AppBrand className="h-9 w-auto" />
      </div>
      <nav className="hidden items-center gap-[27px] pt-3 lg:flex" aria-label="Sections">
        {tabs(session).map((tab) => <Link key={tab.href} href={tab.href} aria-current={tab.active ? "page" : undefined} className="pill-tab">{tab.label}</Link>)}
      </nav>
      <div className="flex items-center gap-2 pt-1.5 lg:pt-0">
        {showUsage && usage && <span className="mr-2 hidden rounded-full border border-border px-3 py-1 text-[10px] font-medium text-muted-foreground sm:inline">{usage.remaining === null ? "Unlimited" : `${usage.remaining} / ${usage.limit} queries left`}</span>}
        {session ? <>
          <div className="mr-1"><ProductSwitcher products={session.products} /></div>
          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-semibold leading-[13px] text-[#4a4a4a] dark:text-foreground">{session.username}</p>
            <p className="text-[8px] capitalize leading-[10px] text-muted-foreground/70">{session.organization ? `${session.organization} · ` : ""}{session.role}</p>
          </div>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-400 text-[11px] font-semibold uppercase text-white" aria-hidden="true">{session.username?.[0] ?? <User className="h-3.5 w-3.5" />}</span>
        </> : <Link href="/admin/login?next=/chat" className="flex h-7 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-medium text-foreground"><LogIn className="h-3.5 w-3.5" />Sign in</Link>}
        {/* Utility buttons: a row on small screens, the vertical column from the design on desktop */}
        <div className="flex items-center gap-2 lg:absolute lg:right-4 lg:top-[87px] lg:flex-col lg:gap-4">
          <ThemeSwitcher />
          {session && <button type="button" onClick={() => void logout()} className="util-button" aria-label="Sign out" title="Sign out"><LogOut className="h-3.5 w-3.5" /></button>}
          {session && <Link href="/account" className="util-button" aria-label="Account settings" title="Account settings"><FigmaIcon name="settings" size={14} className="brightness-75 dark:brightness-150" /></Link>}
        </div>
      </div>
    </header>
  )
}
