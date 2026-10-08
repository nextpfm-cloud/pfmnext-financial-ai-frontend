"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { BookOpenCheck, Building2, Compass, Landmark, Loader2, ScrollText } from "lucide-react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatHeader } from "@/components/chat-header"
import { ChatComposer } from "@/components/chat/composer"
import { ChatMessageComponent } from "@/components/chat/messages"
import { createConversationRepository } from "@/lib/repositories"
import { addConversationMessage, createConversation, fetchConversation } from "@/lib/services/conversation-service"
import { apiErrorMessage, type AppSession, type ChatResponse, type ConversationMessage, type PersistedConversationMessage } from "@/types"

const repository = createConversationRepository()
const suggestions = [
  { icon: Landmark, title: "What are the current income tax obligations?", detail: "Acts and statutory requirements" },
  { icon: Building2, title: "Summarize recent VAT exemption changes", detail: "Gazettes and circular updates" },
  { icon: ScrollText, title: "What filing deadlines should we track?", detail: "Compliance calendar review" },
  { icon: BookOpenCheck, title: "Compare guidance across source categories", detail: "Cross-document regulatory analysis" },
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
      if (!response.ok) throw new Error(apiErrorMessage(data, "The regulatory service could not answer this question."))
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

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <ChatSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {loadingConversation ? <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-sky-600 dark:text-sky-300" /></div> : messages.length === 0 ? <section className="mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center px-4 py-10 sm:px-8"><div className="relative mb-7 grid h-20 w-20 place-items-center rounded-full border border-sky-400/15 bg-card/70 text-sky-600 dark:text-sky-300 shadow-[0_0_80px_rgba(14,165,233,0.18)]"><div className="beacon-pulse absolute inset-2 rounded-full border border-sky-400/25" /><Compass className="relative h-7 w-7" /></div><h1 className="text-center text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">Regulatory clarity, on demand.</h1><p className="mt-4 max-w-2xl text-center text-sm leading-6 text-muted-foreground sm:text-base">{session?.authenticated ? "Ask a question to begin a private, persistent conversation with contextual follow-ups." : "Search acts, gazettes, circulars and policy guidance through one grounded intelligence workspace."}</p>{error && <div className="mt-5 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}<div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-2">{suggestions.map(({ icon: Icon, title, detail }) => <button type="button" key={title} onClick={() => setCurrentMessage(title)} className="group flex items-start gap-3 rounded-2xl border border-border bg-card/45 p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-400/20 hover:bg-card/80"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-400/[0.07] text-sky-600 dark:text-sky-300"><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-medium leading-5 text-foreground/90">{title}</span><span className="mt-1 block text-xs text-muted-foreground/70">{detail}</span></span></button>)}</div></section> : <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">{messages.map((message) => <ChatMessageComponent key={message.id} id={message.id} role={message.role} content={message.content} status={message.status} citations={message.citations} usedCategories={message.usedCategories} onDelete={deleteMessage} onRetry={retryMessage} onCopy={(content) => navigator.clipboard.writeText(content)} />)}{isLoading && <div className="flex items-center gap-3 text-sm text-muted-foreground"><div className="grid h-8 w-8 place-items-center rounded-xl border border-sky-400/15 bg-sky-400/[0.07]"><Loader2 className="h-4 w-4 animate-spin text-sky-600 dark:text-sky-300" /></div>Reviewing indexed sources and conversation context…</div>}{error && <div className="rounded-xl border border-red-400/15 bg-red-400/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}<div ref={endRef} /></div>}
        </main>
        <ChatComposer onSend={() => void sendQuestion()} initialValue={currentMessage} onChange={setCurrentMessage} isLoading={isLoading || session === undefined} selectedCategories={selectedCategories} onCategoriesChange={updateCategories} selectedCountries={selectedCountries} onCountriesChange={setSelectedCountries} topK={topK} onTopKChange={setTopK} />
      </div>
    </div>
  )
}
