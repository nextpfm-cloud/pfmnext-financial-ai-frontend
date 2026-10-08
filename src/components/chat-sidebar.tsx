"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Edit3, Loader2, LogIn, MessageSquare, Plus, Search, Settings, ShieldCheck, Trash2, X } from "lucide-react"
import { AppBrand } from "@/components/app-brand"
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

  return (
    <>
      {mobileOpen && <button type="button" aria-label="Close conversation menu" className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-border bg-card/98 transition-all duration-300 lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "w-[76px]" : "w-[280px]"}`}>
        <div className="flex h-16 items-center justify-between px-4">
          <AppBrand compact={collapsed} />
          <button type="button" onClick={() => setCollapsed((value) => !value)} className="hidden h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground/90 lg:grid" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
          <button type="button" onClick={() => setMobileOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground lg:hidden" aria-label="Close sidebar"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3 px-3 pb-4 pt-2">
          <button type="button" onClick={() => void createChat()} className={`flex h-11 w-full items-center rounded-xl border border-sky-400/15 bg-sky-400/[0.07] text-sm font-medium text-sky-700 transition hover:border-sky-400/30 hover:bg-sky-400/10 dark:text-sky-200 ${collapsed ? "justify-center" : "justify-center gap-2"}`}><Plus className="h-4 w-4" /> {!collapsed && "New chat"}</button>
          {!collapsed && <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search conversations" className="h-10 w-full rounded-xl border border-border bg-foreground/[0.025] pl-9 pr-3 text-sm text-foreground/90 outline-none placeholder:text-muted-foreground/70 focus:border-sky-400/25" /></label>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {loading ? <div className="grid h-24 place-items-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div> : collapsed ? <div className="space-y-2">{conversations.slice(0, 7).map((conversation) => <button type="button" key={conversation.id} title={conversation.title} onClick={() => router.push(`/chat/${conversation.id}`)} className={`grid h-10 w-full place-items-center rounded-xl ${pathname === `/chat/${conversation.id}` ? "bg-sky-400/10 text-sky-600 dark:text-sky-300" : "text-muted-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground/80"}`}><MessageSquare className="h-4 w-4" /></button>)}</div> : <>{Object.entries(grouped).map(([label, items]) => items.length > 0 && <section key={label} className="mb-5"><h2 className="eyebrow mb-2 px-2">{label}</h2><div className="space-y-1">{items.map((conversation) => <div key={conversation.id} className={`group relative rounded-xl ${pathname === `/chat/${conversation.id}` ? "bg-foreground/[0.075]" : "hover:bg-foreground/[0.035]"}`}>{renamingId === conversation.id ? <input autoFocus maxLength={120} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onBlur={() => void renameChat(conversation.id)} onKeyDown={(event) => { if (event.key === "Enter") void renameChat(conversation.id); if (event.key === "Escape") setRenamingId(null) }} className="h-10 w-full rounded-xl bg-foreground/[0.05] px-3 text-sm outline-none" /> : <button type="button" onClick={() => { setMobileOpen(false); router.push(`/chat/${conversation.id}`) }} className="flex h-10 w-full items-center gap-2.5 px-3 pr-16 text-left text-sm text-muted-foreground"><MessageSquare className={`h-4 w-4 shrink-0 ${pathname === `/chat/${conversation.id}` ? "text-sky-600 dark:text-sky-300" : "text-muted-foreground/70"}`} /><span className="truncate">{conversation.title}</span></button>}<div className="absolute right-1 top-1 hidden items-center group-hover:flex"><button type="button" onClick={() => { setRenamingId(conversation.id); setRenameValue(conversation.title) }} className="grid h-8 w-7 place-items-center text-muted-foreground hover:text-sky-600 dark:hover:text-sky-300" aria-label="Rename chat"><Edit3 className="h-3.5 w-3.5" /></button><button type="button" onClick={() => void deleteChat(conversation.id)} className="grid h-8 w-7 place-items-center text-muted-foreground hover:text-red-600 dark:hover:text-red-300" aria-label="Delete chat"><Trash2 className="h-3.5 w-3.5" /></button></div></div>)}</div></section>)}{nextCursor && <button type="button" disabled={loadingOlder} onClick={() => void loadOlder()} className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-border text-xs text-muted-foreground">{loadingOlder && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Load older</button>}{error && <p className="px-2 py-2 text-xs leading-5 text-red-600 dark:text-red-300">{error}</p>}</>}
        </div>

        <div className="space-y-2 border-t border-border p-3">
          <Link href="/admin" className={`flex h-10 items-center rounded-xl text-sm text-foreground/80 transition hover:bg-foreground/[0.04] ${collapsed ? "justify-center" : "gap-3 px-3"}`}><ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-300" />{!collapsed && <span className="flex-1">Admin portal</span>}</Link>
          {session?.authenticated && <Link href="/account" className={`flex h-10 items-center rounded-xl text-sm text-foreground/80 transition hover:bg-foreground/[0.04] ${collapsed ? "justify-center" : "gap-3 px-3"}`}><Settings className="h-4 w-4 text-sky-600 dark:text-sky-300" />{!collapsed && <span className="flex-1">Account settings</span>}</Link>}
          {!collapsed && <div className="flex items-center justify-between px-3 py-1 text-xs text-muted-foreground/70"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{session?.authenticated ? "Synced history" : "Local history"}</span><LogIn className="h-3.5 w-3.5" /></div>}
        </div>
      </aside>
    </>
  )
}
