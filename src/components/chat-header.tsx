"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { LogIn, LogOut, Menu, Settings, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { AppBrand } from "@/components/app-brand"
import { ThemeSwitcher } from "@/components/theme-switcher"
import type { AppSession, ChatUsage } from "@/types"
export function ChatHeader() {
  const router = useRouter(); const [session, setSession] = useState<AppSession | null>(null); const [usage, setUsage] = useState<ChatUsage | null>(null)
  useEffect(() => {
    const loadUsage = () => fetch("/api/backend/me/usage", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then(setUsage)
    fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => response.ok ? response.json() : null).then((value: AppSession | null) => { setSession(value); if (value) void loadUsage() })
    window.addEventListener("nextpfm:usage-changed", loadUsage)
    return () => window.removeEventListener("nextpfm:usage-changed", loadUsage)
  }, [])
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); setSession(null); setUsage(null); router.refresh() }
  return <header className="z-30 flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/85 px-3 py-2 backdrop-blur-xl sm:px-6"><div className="flex items-center gap-3 lg:hidden"><button type="button" onClick={() => window.dispatchEvent(new Event("nextpfm:toggle-chat-sidebar"))} className="grid h-9 w-9 place-items-center rounded-xl border border-border" aria-label="Open conversations"><Menu className="h-4 w-4" /></button><AppBrand /></div><nav className="hidden items-center gap-1 lg:flex"><Link href="/chat" className="rounded-xl bg-foreground/[0.07] px-4 py-2 text-sm font-medium text-sky-700 dark:text-sky-200">Assistant</Link>{session && ["admin", "auditor"].includes(session.role ?? "") && <Link href={session.role === "auditor" ? "/admin/audit" : "/admin"} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:bg-foreground/[0.04]">Admin console</Link>}</nav><div className="flex items-center gap-2">{usage && <div className="hidden rounded-full border border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground sm:block">{usage.remaining === null ? "Unlimited" : `${usage.remaining} / ${usage.limit} queries left`}</div>}{session ? <><div className="hidden text-right md:block"><p className="text-xs font-medium text-foreground">{session.username}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{session.role}</p></div><Link href="/account" className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground" aria-label="Account settings"><Settings className="h-4 w-4" /></Link><button type="button" onClick={() => void logout()} className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground" aria-label="Sign out"><LogOut className="h-4 w-4" /></button></> : <Link href="/admin/login?next=/chat" className="flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground"><LogIn className="h-4 w-4" /><span className="hidden sm:inline">Sign in</span></Link>}<Link href="/admin" className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground" aria-label="Admin console"><ShieldCheck className="h-4 w-4" /></Link><ThemeSwitcher /></div></header>
}
