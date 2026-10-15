"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
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

  return <main className="grid min-h-screen place-items-center bg-background px-6 text-center"><div>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/x-mark.svg" alt="" aria-hidden="true" className={`mx-auto mb-5 h-14 w-auto ${error ? "" : "beacon-pulse"}`} /><p className="text-sm font-medium text-muted-foreground">{error ?? "Opening your finance workspace…"}</p></div></main>
}
