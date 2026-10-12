"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { AppBrand } from "@/components/app-brand"
import { FigmaIcon } from "@/components/figma-icon"
import type { AppSession } from "@/types"

const adminNavigation = [
  { href: "/admin", label: "Intelligence overview", icon: "nav-overview" },
  { href: "/admin/documents", label: "Document registry", icon: "nav-registry" },
  { href: "/admin/upload", label: "Upload document", icon: "nav-upload", flip: true },
  { href: "/admin/users", label: "Users and quotas", icon: "nav-users" },
  { href: "/admin/audit", label: "Audit trail", icon: "nav-audit" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [session, setSession] = useState<AppSession | null>(null)
  useEffect(() => {
    const toggle = () => setMobileOpen((open) => !open)
    window.addEventListener("nextpfm:toggle-admin-sidebar", toggle)
    fetch("/api/auth/session").then((response) => response.json()).then(setSession).catch(() => setSession(null))
    return () => window.removeEventListener("nextpfm:toggle-admin-sidebar", toggle)
  }, [])
  const navigation = session?.role === "auditor" ? adminNavigation.filter((item) => item.href === "/admin/audit") : adminNavigation

  return <>
    {mobileOpen && <button type="button" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col bg-sidebar transition-all duration-300 lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "w-[76px]" : "w-[280px]"}`}>
      <div className={`flex h-[79px] shrink-0 items-start pt-4 ${collapsed ? "flex-col items-center gap-3 px-2" : "justify-between pl-[22px] pr-[19px]"}`}>
        <AppBrand compact={collapsed} />
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="hidden h-7 w-7 place-items-center rounded-md transition hover:bg-foreground/[0.06] lg:grid" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}><FigmaIcon name="sidebar-toggle" dark /></button>
        <button type="button" onClick={() => setMobileOpen(false)} className="grid h-8 w-8 place-items-center text-muted-foreground lg:hidden" aria-label="Close navigation"><X className="h-4 w-4" /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!collapsed && <>
          <p className="pl-[23px] pt-4 text-sm text-muted-foreground">OIDC session : {session?.role ?? "checking"}</p>
          <p className="pl-[26px] pt-[55px] text-sm font-semibold text-muted-foreground">Workspace</p>
        </>}
        <nav className={collapsed ? "flex flex-col items-center gap-1 pt-10" : "pl-[36px] pr-4 pt-[39px]"} aria-label="Admin">
          {navigation.map(({ href, label, icon, flip }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href))
            return <Link key={href} href={href} onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined} title={collapsed ? label : undefined} className={`flex h-[31px] items-center rounded-md text-sm transition hover:text-foreground ${collapsed ? "w-[31px] justify-center" : "gap-[14px]"} ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              <span className="grid h-5 w-[25px] shrink-0 place-items-center"><FigmaIcon name={icon} className={`${flip ? "-scale-x-100" : ""} ${active ? "brightness-50 dark:brightness-150" : ""}`} /></span>
              {!collapsed && label}
            </Link>
          })}
        </nav>
      </div>

      {!collapsed && <div className="flex h-[76px] shrink-0 flex-col justify-center gap-[10px] pl-[55px] text-xs font-medium text-foreground" style={{ background: "hsl(var(--sidebar-footer))" }}>
        <p className="truncate pr-4">{session?.username ?? "Authenticated"}</p>
        <Link href="/account" className="w-fit hover:text-sky-600">Account settings</Link>
      </div>}
    </aside>
  </>
}
