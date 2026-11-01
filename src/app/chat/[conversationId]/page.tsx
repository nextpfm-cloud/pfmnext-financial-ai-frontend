"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { BarChart3, BookOpenCheck, ClipboardList, Loader2, Wallet, X } from "lucide-react"
import { FigmaIcon } from "@/components/figma-icon"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatHeader } from "@/components/chat-header"
import { ChatComposer } from "@/components/chat/composer"
import { ChatMessageComponent } from "@/components/chat/messages"
import { createConversationRepository } from "@/lib/repositories"
import { addConversationMessage, createConversation, fetchConversation } from "@/lib/services/conversation-service"
import { apiErrorMessage, type AppSession, type ChatResponse, type ConversationMessage, type PersistedConversationMessage } from "@/types"

const repository = createConversationRepository()
const suggestions = [
  { icon: Wallet, title: "How is this year's budget allocated across programmes?", detail: "Budget estimates and allocations" },
  { icon: BarChart3, title: "Which performance targets were missed last year?", detail: "Performance reports" },
  { icon: ClipboardList, title: "What actions are planned and who is responsible?", detail: "Action plans and timelines" },
  { icon: BookOpenCheck, title: "Compare spending plans with reported results", detail: "Cross-document financial analysis" },
]

function toMessage(message: PersistedConversationMessage): ConversationMessage {
  return {
    id: message.message_id,
    role: message.role,
    content: message.content_markdown,
    citations: message.citations,
    usedCategories: message.used_categories,
    timestamp: Date.parse(message.created_at),
    status: message.status,
  }
}

export default function ChatConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const router = useRouter()
  const [session, setSession] = useState<AppSession | null | undefined>(undefined)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [topK, setTopK] = useState(6)
  const [loadingConversation, setLoadingConversation] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const retryRef = useRef<{ question: string; key: string } | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<AppSession> : null)
      .then((value) => { if (active) setSession(value) })
      .catch(() => { if (active) setSession(null) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (session === undefined) return
    let active = true
    setLoadingConversation(true)
    setError(null)
    setMessages([])
    if (session?.authenticated) {
      if (conversationId === "new") {
        setMessages([])
        setLoadingConversation(false)
        return () => { active = false }
      }
      fetchConversation(conversationId)
        .then((detail) => { if (active) setMessages(detail.messages.map(toMessage)) })
        .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Unable to load this conversation.") })
        .finally(() => { if (active) setLoadingConversation(false) })
      return () => { active = false }
    }
    if (conversationId === "new") {
      repository.create().then((id) => router.replace(`/chat/${id}`)).catch(() => {
        if (active) { setError("Your local conversation could not be created."); setLoadingConversation(false) }
      })
      return () => { active = false }
    }
    repository.get(conversationId).then((conversation) => {
      if (!active) return
      if (!conversation) { router.replace("/chat"); return }
      setMessages(conversation.messages ?? [])
      setCurrentMessage(conversation.draft ?? "")
      setSelectedCategories(conversation.selectedCategories ?? [])
      setSelectedCountries(conversation.selectedCountries ?? [])
      setLoadingConversation(false)
    }).catch(() => { if (active) { setError("Unable to load this local conversation."); setLoadingConversation(false) } })
    return () => { active = false }
  }, [conversationId, router, session])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, isLoading])

  const sendQuestion = async (question?: string) => {
    const trimmed = (question ?? currentMessage).trim()
    if (!trimmed || isLoading || session === undefined) return
    const userMessage: ConversationMessage = { id: crypto.randomUUID(), role: "user", content: trimmed, timestamp: Date.now(), status: "pending" }
    const previousMessages = messages
    const pendingMessages = [...messages, userMessage]
    setMessages(pendingMessages)
    setCurrentMessage("")
    setIsLoading(true)
    setError(null)

    const payload = { question: trimmed, top_k: topK, categories: selectedCategories.length ? selectedCategories : undefined, countries: selectedCountries.length ? selectedCountries : undefined }
    try {
      if (session?.authenticated) {
        const retry = retryRef.current
        const idempotencyKey = retry?.question === trimmed ? retry.key : crypto.randomUUID()
        retryRef.current = { question: trimmed, key: idempotencyKey }
        const exchange = conversationId === "new"
          ? await createConversation(payload, idempotencyKey)
          : await addConversationMessage(conversationId, payload, idempotencyKey)
        retryRef.current = null
        const completedMessages = [...previousMessages, toMessage(exchange.user_message), toMessage(exchange.assistant_message)]
        setMessages(completedMessages)
        window.dispatchEvent(new Event("nextpfm:conversations-changed"))
        window.dispatchEvent(new Event("nextpfm:usage-changed"))
        window.setTimeout(() => window.dispatchEvent(new Event("nextpfm:conversations-changed")), 2500)
        if (conversationId === "new") router.replace(`/chat/${exchange.conversation.conversation_id}`)
        return
      }

      const response = await fetch("/api/backend/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = (await response.json().catch(() => ({}))) as ChatResponse & { error?: string; detail?: string }
      if (!response.ok) throw new Error(apiErrorMessage(data, "The finance service could not answer this question."))
      const assistantMessage: ConversationMessage = { id: crypto.randomUUID(), role: "assistant", content: data.answer_markdown || "No answer was returned.", timestamp: Date.now(), citations: data.citations ?? [], usedCategories: data.used_categories ?? [], status: "completed" }
      const completedMessages = [...pendingMessages.map((message) => message.id === userMessage.id ? { ...message, status: "completed" as const } : message), assistantMessage]
      setMessages(completedMessages)
      await repository.update(conversationId, {
        messages: completedMessages,
        selectedCategories, selectedCountries,
        ...(previousMessages.length === 0 ? { title: trimmed.split(/\s+/).slice(0, 7).join(" ") } : {}),
      })
      window.dispatchEvent(new Event("nextpfm:conversations-changed"))
    } catch (caught) {
      setMessages(pendingMessages.map((message) => message.id === userMessage.id ? { ...message, status: "failed" } : message))
      setCurrentMessage(trimmed)
      setError(caught instanceof Error ? caught.message : "A network error interrupted the request.")
      if (!session?.authenticated) await repository.update(conversationId, { messages: pendingMessages, selectedCategories, selectedCountries })
    } finally {
      setIsLoading(false)
    }
  }

  const updateCategories = (categories: string[]) => {
    setSelectedCategories(categories)
    if (!session?.authenticated && conversationId !== "new") void repository.update(conversationId, { selectedCategories: categories })
  }

  const deleteMessage = session?.authenticated ? undefined : async (messageId: string) => {
    const nextMessages = messages.filter((message) => message.id !== messageId)
    setMessages(nextMessages)
    await repository.update(conversationId, { messages: nextMessages })
  }

  const retryMessage = (messageId: string) => {
    const index = messages.findIndex((message) => message.id === messageId)
    const question = [...messages.slice(0, index)].reverse().find((message) => message.role === "user")
    if (question) setCurrentMessage(question.content)
  }

  const composer = <ChatComposer onSend={() => void sendQuestion()} initialValue={currentMessage} onChange={setCurrentMessage} isLoading={isLoading || session === undefined} selectedCategories={selectedCategories} onCategoriesChange={updateCategories} selectedCountries={selectedCountries} onCountriesChange={setSelectedCountries} topK={topK} onTopKChange={setTopK} />
  const isEmpty = !loadingConversation && messages.length === 0

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <ChatSidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <ChatHeader />
        {isEmpty ? (
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="my-auto pb-[clamp(0px,5.5vh,3.5rem)]">
              <section className="mx-auto flex max-w-[640px] flex-col items-center px-4 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/pfmnext-mark.svg" alt="" aria-hidden="true" width={173} height={182} className="h-[182px] w-[173px]" />
                <h1 className="text-[32px] font-bold leading-[1.26] text-sky-600 sm:text-[40px]">Financial clarity,<br /><span style={{ color: "hsl(var(--brand-lime))" }}>on demand.</span></h1>
                <p className="mt-[31px] max-w-[360px] text-sm font-medium leading-[18px] text-muted-foreground">{session?.authenticated ? "Ask a question to begin a private, persistent conversation with contextual follow-ups." : "Search action plans, performance reports and budgets through one grounded intelligence workspace."}</p>
                {error && <div className="mt-5 rounded-[10px] border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}
              </section>
              <div className="mt-[clamp(2rem,9.5vh,6.0625rem)]">{composer}</div>
            </div>
          </main>
        ) : (
          <>
            <main className="min-h-0 flex-1 overflow-y-auto">
              {loadingConversation ? <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-sky-600" /></div> : <div className="mx-auto max-w-[740px] space-y-8 px-4 py-8 sm:px-6 sm:py-10">{messages.map((message) => <ChatMessageComponent key={message.id} id={message.id} role={message.role} content={message.content} status={message.status} citations={message.citations} usedCategories={message.usedCategories} onDelete={deleteMessage} onRetry={retryMessage} onCopy={(content) => navigator.clipboard.writeText(content)} />)}{isLoading && <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-sky-600" />Reviewing indexed sources and conversation context…</div>}{error && <div className="rounded-[10px] border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}<div ref={endRef} /></div>}
            </main>
            {composer}
          </>
        )}

        {/* Help: example questions */}
        <div className="absolute bottom-10 right-10 z-20 hidden lg:block">
          {helpOpen && <div role="dialog" aria-label="Example questions" className="absolute bottom-[52px] right-0 w-[320px] rounded-[17px] border border-border bg-popover p-4 shadow-[0_2px_10px_rgba(0,0,0,0.12)]">
            <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-foreground">Try asking</p><button type="button" onClick={() => setHelpOpen(false)} className="grid h-6 w-6 place-items-center text-muted-foreground" aria-label="Close"><X className="h-3.5 w-3.5" /></button></div>
            <div className="space-y-1">{suggestions.map(({ icon: Icon, title, detail }) => <button type="button" key={title} onClick={() => { setCurrentMessage(title); setHelpOpen(false) }} className="flex w-full items-start gap-3 rounded-[10px] p-2 text-left transition hover:bg-muted"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" /><span><span className="block text-xs font-semibold leading-4 text-foreground">{title}</span><span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">{detail}</span></span></button>)}</div>
          </div>}
          <button type="button" onClick={() => setHelpOpen((open) => !open)} aria-expanded={helpOpen} aria-label="Example questions" className="grid h-10 w-10 place-items-center rounded-full border border-[#efefef] bg-background transition hover:bg-muted dark:border-border"><FigmaIcon name="help-mark" dark /></button>
        </div>
      </div>
    </div>
  )
}
