"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Compass, Loader2 } from "lucide-react"
import { createConversationRepository } from "@/lib/repositories"
import type { AppSession } from "@/types"

const repository = createConversationRepository()

export default function ChatPage() {
  const router = useRouter()
  const initialized = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<AppSession> : null)
      .then(async (session) => {
        if (session?.authenticated) { router.replace("/chat/new"); return }
        const conversations = await repository.getAll()
        const latest = [...conversations].sort((left, right) => right.updatedAt - left.updatedAt)[0]
        const id = latest?.id ?? await repository.create()
        router.replace(`/chat/${id}`)
      })
      .catch(() => setError("Your conversation workspace could not be opened."))
  }, [router])

  return <main className="grid min-h-screen place-items-center bg-background px-6 text-center"><div><div className="beacon-pulse mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-600 dark:text-sky-300 shadow-[0_0_50px_rgba(56,189,248,0.15)]">{error ? <Compass className="h-7 w-7" /> : <Loader2 className="h-6 w-6 animate-spin" />}</div><p className="text-sm text-muted-foreground">{error ?? "Opening your regulatory workspace…"}</p></div></main>
}
