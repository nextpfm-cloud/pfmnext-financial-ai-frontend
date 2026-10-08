"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, LogOut, Menu, Settings, UploadCloud } from "lucide-react"
import { ThemeSwitcher } from "@/components/theme-switcher"

const titleByPath = (pathname: string) => pathname === "/admin" ? "Overview" : pathname === "/admin/documents" ? "Document registry" : pathname === "/admin/upload" ? "Upload document" : pathname === "/admin/users" ? "Users and quotas" : pathname === "/admin/audit" ? "Audit trail" : pathname.includes("/chunks") ? "Processed chunks" : "Document details"

export function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace("/admin/login")
    router.refresh()
  }

  return (
    <header className="z-30 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={() => window.dispatchEvent(new Event("nextpfm:toggle-admin-sidebar"))} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-foreground/80 lg:hidden" aria-label="Open admin navigation"><Menu className="h-4 w-4" /></button>
        <div className="min-w-0"><p className="eyebrow hidden sm:block">Admin console</p><h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{titleByPath(pathname)}</h1></div>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/chat" className="hidden h-9 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground transition hover:text-foreground sm:flex"><ArrowLeft className="h-3.5 w-3.5" />Back to assistant</Link>
        {pathname !== "/admin/audit" && <Link href="/admin/upload" className="flex h-9 items-center gap-2 rounded-xl bg-sky-400 px-3 text-xs font-semibold text-primary-foreground transition hover:bg-sky-300"><UploadCloud className="h-3.5 w-3.5" /><span className="hidden sm:inline">Upload</span></Link>}
        <Link href="/account" className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground" aria-label="Account settings"><Settings className="h-4 w-4" /></Link>
        <ThemeSwitcher />
        <button type="button" onClick={() => void logout()} className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-red-400/20 hover:text-red-600 dark:text-red-300" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
      </div>
    </header>
  )
}
