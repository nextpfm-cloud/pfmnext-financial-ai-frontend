"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Edit3, Loader2, Trash2, X } from "lucide-react"
import { AppBrand } from "@/components/app-brand"
import { FigmaIcon } from "@/components/figma-icon"
import { createConversationRepository } from "@/lib/repositories"
import { deleteConversation, fetchConversationPage, renameConversation } from "@/lib/services/conversation-service"
import type { AppSession } from "@/types"

const repository = createConversationRepository()
type SidebarConversation = { id: string; title: string; updatedAt: number }

export function ChatSidebar() {
  const [session, setSession] = useState<AppSession | null | undefined>(undefined)
  const [conversations, setConversations] = useState<SidebarConversation[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [closedGroups, setClosedGroups] = useState<string[]>([])
  const searchRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const loadConversations = useCallback(async () => {
    if (session === undefined) return
    setLoading(true)
    setError(null)
    try {
      if (session?.authenticated) {
        const page = await fetchConversationPage()
        setConversations(page.conversations.map((item) => ({ id: item.conversation_id, title: item.title, updatedAt: Date.parse(item.updated_at) })))
        setNextCursor(page.next_cursor)
      } else {
        const all = await repository.getAll()
        setConversations(all.map((item) => ({ id: item.id, title: item.title, updatedAt: item.updatedAt })).sort((left, right) => right.updatedAt - left.updatedAt))
        setNextCursor(null)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load conversations.")
    } finally { setLoading(false) }
  }, [session])

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<AppSession> : null)
      .then(setSession)
      .catch(() => setSession(null))
  }, [])
  useEffect(() => { void loadConversations() }, [loadConversations, pathname])
  useEffect(() => {
    const toggle = () => setMobileOpen((open) => !open)
    const refresh = () => void loadConversations()
    window.addEventListener("nextpfm:toggle-chat-sidebar", toggle)
    window.addEventListener("nextpfm:conversations-changed", refresh)
    return () => {
      window.removeEventListener("nextpfm:toggle-chat-sidebar", toggle)
      window.removeEventListener("nextpfm:conversations-changed", refresh)
    }
  }, [loadConversations])

  // ⌘K / Ctrl+K focuses the conversation search, as hinted in the search field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCollapsed(false); window.setTimeout(() => searchRef.current?.focus(), 0) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const grouped = useMemo(() => {
    const startToday = new Date().setHours(0, 0, 0, 0)
    const startYesterday = startToday - 86_400_000
    const startWeek = startToday - 7 * 86_400_000
    const groups: Record<string, SidebarConversation[]> = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] }
    conversations
      .filter((conversation) => conversation.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .forEach((conversation) => {
        const group = conversation.updatedAt >= startToday ? "Today" : conversation.updatedAt >= startYesterday ? "Yesterday" : conversation.updatedAt >= startWeek ? "Previous 7 days" : "Older"
        groups[group].push(conversation)
      })
    return groups
  }, [conversations, searchQuery])

  const createChat = async () => {
    setMobileOpen(false)
    if (session?.authenticated) { router.push("/chat/new"); return }
    const id = await repository.create()
    router.push(`/chat/${id}`)
  }

  const deleteChat = async (id: string) => {
    if (!window.confirm("Delete this conversation? This cannot be undone.")) return
    setError(null)
    try {
      if (session?.authenticated) await deleteConversation(id)
      else await repository.delete(id)
      await loadConversations()
      if (pathname === `/chat/${id}`) router.push(session?.authenticated ? "/chat/new" : "/chat")
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to delete this conversation.") }
  }

  const renameChat = async (id: string) => {
    const title = renameValue.trim()
    setRenamingId(null)
    if (!title) return
    setError(null)
    try {
      if (session?.authenticated) await renameConversation(id, title)
      else await repository.update(id, { title })
      await loadConversations()
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to rename this conversation.") }
  }

  const loadOlder = async () => {
    if (!nextCursor || !session?.authenticated || loadingOlder) return
    setLoadingOlder(true)
    try {
      const page = await fetchConversationPage(nextCursor)
      setConversations((current) => [...current, ...page.conversations.map((item) => ({ id: item.conversation_id, title: item.title, updatedAt: Date.parse(item.updated_at) }))])
      setNextCursor(page.next_cursor)
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load older conversations.") }
    finally { setLoadingOlder(false) }
  }

  const toggleGroup = (label: string) => setClosedGroups((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label])
  const isActive = (id: string) => pathname === `/chat/${id}`

  return (
    <>
      {mobileOpen && <button type="button" aria-label="Close conversation menu" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col bg-sidebar transition-all duration-300 lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "w-[76px]" : "w-[280px]"}`}>
        <div className={`flex h-[79px] shrink-0 items-start pt-[15px] ${collapsed ? "flex-col items-center gap-3 px-2" : "justify-between pl-[18px] pr-[19px]"}`}>
          <AppBrand compact={collapsed} />
          <button type="button" onClick={() => setCollapsed((value) => !value)} className={`hidden h-7 w-7 place-items-center rounded-md transition hover:bg-foreground/[0.06] lg:grid ${collapsed ? "" : "mt-0.5"}`} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}><FigmaIcon name="sidebar-toggle" dark /></button>
          <button type="button" onClick={() => setMobileOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground lg:hidden" aria-label="Close sidebar"><X className="h-4 w-4" /></button>
        </div>

        <div className={`shrink-0 ${collapsed ? "px-[21px] pt-10" : "px-[44px] pt-[clamp(1.5rem,9.4vh,6rem)]"}`}>
          <button type="button" onClick={() => void createChat()} className={`flex h-[35px] items-center justify-center gap-[13px] rounded-[13px] bg-sky-400 text-sm font-medium text-white transition hover:bg-sky-700 ${collapsed ? "w-[35px]" : "w-full"}`} aria-label="New chat"><FigmaIcon name="new-chat" />{!collapsed && "New chat"}</button>
          {!collapsed && <label className="relative mt-[clamp(1rem,8.4vh,5.375rem)] block">
            <FigmaIcon name="search" className="absolute left-[7px] top-1/2 -translate-y-1/2" />
            <input ref={searchRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search chat" aria-label="Search conversations" className="h-[35px] w-full rounded-[13px] border bg-muted pl-[34px] pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-[hsl(var(--brand-green))]" style={{ borderColor: "hsl(var(--brand-green))" }} />
            {!searchQuery && <FigmaIcon name="cmd-k" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-60" dark />}
          </label>}
        </div>

        <div className={`min-h-0 flex-1 overflow-y-auto pb-4 pt-[34px] ${collapsed ? "px-[21px]" : "pl-[32px] pr-4"}`}>
          {loading ? <div className="grid h-24 place-items-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div> : collapsed ? <div className="flex flex-col items-center gap-3">{conversations.slice(0, 9).map((conversation) => <button type="button" key={conversation.id} title={conversation.title} onClick={() => router.push(`/chat/${conversation.id}`)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-foreground/[0.06]" aria-label={conversation.title}><span className={`block rounded-full ${isActive(conversation.id) ? "h-[9px] w-[9px] bg-sky-400" : "h-[7px] w-[7px]"}`} style={isActive(conversation.id) ? undefined : { background: "hsl(var(--brand-green))" }} /></button>)}</div> : <>
            {Object.entries(grouped).map(([label, items]) => {
              if (items.length === 0) return null
              const open = !closedGroups.includes(label)
              return <section key={label} className="mb-[26px]">
                <button type="button" onClick={() => toggleGroup(label)} aria-expanded={open} className="flex items-center gap-2 text-[10px] font-semibold text-[#939292]">{label}<FigmaIcon name="chevron-down" className={open ? "-scale-y-100" : "rotate-90"} /></button>
                {open && <div className="relative ml-3 mt-[7px] border-l border-sky-400/70 pb-px pt-[28px]">
                  <span className="absolute -left-[4px] -top-px h-[7px] w-[7px] rounded-full" style={{ background: "hsl(var(--brand-green))" }} />
                  {items.map((conversation) => <div key={conversation.id} className="group relative flex h-[31px] items-center">
                    <span className="absolute -left-[4px] top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full" style={{ background: "hsl(var(--brand-green))" }} />
                    {renamingId === conversation.id
                      ? <input autoFocus maxLength={120} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onBlur={() => void renameChat(conversation.id)} onKeyDown={(event) => { if (event.key === "Enter") void renameChat(conversation.id); if (event.key === "Escape") setRenamingId(null) }} className="ml-4 h-7 w-full rounded-md border border-input bg-background px-2 text-sm outline-none" />
                      : <button type="button" onClick={() => { setMobileOpen(false); router.push(`/chat/${conversation.id}`) }} className={`min-w-0 flex-1 truncate pl-4 pr-12 text-left text-sm transition hover:text-foreground ${isActive(conversation.id) ? "font-medium text-foreground" : "text-muted-foreground"}`}>{conversation.title}</button>}
                    <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 items-center bg-sidebar group-hover:flex">
                      <button type="button" onClick={() => { setRenamingId(conversation.id); setRenameValue(conversation.title) }} className="grid h-7 w-6 place-items-center text-muted-foreground hover:text-sky-600" aria-label="Rename chat"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => void deleteChat(conversation.id)} className="grid h-7 w-6 place-items-center text-muted-foreground hover:text-red-600" aria-label="Delete chat"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>)}
                </div>}
              </section>
            })}
            {!loading && conversations.length === 0 && <p className="pr-4 text-xs leading-5 text-muted-foreground">No conversations yet.</p>}
            {nextCursor && <button type="button" disabled={loadingOlder} onClick={() => void loadOlder()} className="flex h-8 items-center gap-2 text-[10px] font-semibold text-[#939292] hover:text-foreground">{loadingOlder && <Loader2 className="h-3 w-3 animate-spin" />}Load older<FigmaIcon name="chevron-down" className="rotate-90" /></button>}
            {error && <p className="py-2 pr-4 text-xs leading-5 text-red-600 dark:text-red-300">{error}</p>}
          </>}
        </div>

        {!collapsed && <div className="flex h-[76px] shrink-0 flex-col justify-center gap-[10px] pl-[55px] text-xs font-medium text-foreground" style={{ background: "hsl(var(--sidebar-footer))" }}>
          {(session?.role === "admin" || session?.role === "auditor" || !session?.authenticated) && <Link href={session?.role === "auditor" ? "/admin/audit" : "/admin"} className="w-fit hover:text-sky-600">Admin portal</Link>}
          {session?.authenticated ? <Link href="/account" className="w-fit hover:text-sky-600">Account settings</Link> : <Link href="/admin/login?next=/chat" className="w-fit hover:text-sky-600">Sign in</Link>}
        </div>}
      </aside>
    </>
  )
}
