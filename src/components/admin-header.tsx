"use client"

import { usePathname } from "next/navigation"
import { TopBar } from "@/components/top-bar"

export function AdminHeader() {
  const pathname = usePathname()
  const onAudit = pathname === "/admin/audit"
  return <TopBar
    mobileMenuEvent="nextpfm:toggle-admin-sidebar"
    tabs={(session) => onAudit
      ? [session?.role === "auditor" ? { href: "/chat", label: "Assistant" } : { href: "/admin", label: "Admin console" }, { href: "/admin/audit", label: "Audit trail", active: true }]
      : [{ href: "/chat", label: "Assistant" }, { href: "/admin", label: "Admin console", active: true }]}
  />
}
