"use client"

import { usePathname } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { AdminSidebar } from "@/components/admin-sidebar"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === "/admin/login") return children
  return <div className="flex h-[100dvh] overflow-hidden bg-background"><AdminSidebar /><div className="relative flex min-w-0 flex-1 flex-col"><AdminHeader /><main className="min-h-0 flex-1 overflow-y-auto"><div className="w-full max-w-[1160px] px-4 pb-12 pt-6 sm:px-6 lg:pl-[82px] lg:pr-[114px] lg:pt-9">{children}</div></main></div></div>
}
