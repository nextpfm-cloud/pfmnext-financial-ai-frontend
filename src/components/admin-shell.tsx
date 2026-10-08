"use client"

import { usePathname } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { AdminSidebar } from "@/components/admin-sidebar"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === "/admin/login") return children
  return <div className="flex h-[100dvh] overflow-hidden bg-background"><AdminSidebar /><div className="flex min-w-0 flex-1 flex-col"><AdminHeader /><main className="min-h-0 flex-1 overflow-y-auto"><div className="mx-auto w-full max-w-[1320px] p-4 sm:p-6 lg:p-8">{children}</div></main></div></div>
}
