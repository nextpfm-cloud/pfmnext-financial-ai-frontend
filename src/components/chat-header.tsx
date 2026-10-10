"use client"
import { TopBar } from "@/components/top-bar"

export function ChatHeader() {
  return <TopBar
    mobileMenuEvent="nextpfm:toggle-chat-sidebar"
    showUsage
    tabs={(session) => [
      { href: "/chat", label: "Assistant", active: true },
      ...(session && ["admin", "auditor"].includes(session.role ?? "") ? [{ href: session.role === "auditor" ? "/admin/audit" : "/admin", label: "Admin console" }] : []),
    ]}
  />
}
