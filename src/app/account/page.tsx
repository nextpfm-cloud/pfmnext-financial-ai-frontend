"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, KeyRound, Loader2, ShieldCheck } from "lucide-react"
import { AppBrand } from "@/components/app-brand"
import { ThemeSwitcher } from "@/components/theme-switcher"
import type { AppSession } from "@/types"

export default function AccountPage() {
  const [session, setSession] = useState<AppSession | null>(null)
  const [passwordChanged, setPasswordChanged] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => response.ok ? response.json() : null).then(setSession)
    setPasswordChanged(new URLSearchParams(window.location.search).get("passwordChanged"))
    const reset = () => setRedirecting(false)
    window.addEventListener("pageshow", reset)
    return () => window.removeEventListener("pageshow", reset)
  }, [])

  return <main className="min-h-[100dvh] bg-background px-4 py-6 sm:px-6 sm:py-10">
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex items-center justify-between gap-3"><AppBrand /><div className="flex items-center gap-2"><Link href="/chat" className="flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" />Assistant</Link><ThemeSwitcher /></div></header>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="surface-card p-5 sm:p-6"><div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-400/10 text-sky-600 dark:text-sky-300"><ShieldCheck className="h-5 w-5" /></div><p className="eyebrow mb-2 mt-5">Signed-in identity</p><h1 className="text-2xl font-semibold">Account security</h1><dl className="mt-6 space-y-4 text-sm"><div><dt className="text-xs text-muted-foreground">Username</dt><dd className="mt-1 font-medium">{session?.username ?? "Loading…"}</dd></div><div><dt className="text-xs text-muted-foreground">Organization</dt><dd className="mt-1 font-medium">{session?.organization ?? "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Application role</dt><dd className="mt-1 capitalize">{session?.role ?? "—"}</dd></div></dl><p className="mt-7 text-xs leading-5 text-muted-foreground">Passwords are managed by the PFMNext identity provider. You can choose to sign out other devices when you change it.</p></section>
        <section className="surface-card p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-foreground/[0.03] text-sky-600 dark:text-sky-300"><KeyRound className="h-4 w-4" /></div><div><h2 className="text-lg font-semibold">Change password</h2><p className="text-xs text-muted-foreground">You will confirm your identity on the secure sign-in page.</p></div></div>{passwordChanged === "1" && <div role="status" className="mb-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3.5 py-3 text-sm text-emerald-800 dark:text-emerald-200">Your password has been changed.</div>}{passwordChanged === "0" && <div role="status" className="mb-4 rounded-xl border border-border bg-foreground/[0.03] px-3.5 py-3 text-sm text-muted-foreground">Password change was cancelled. Your password is unchanged.</div>}<a href="/api/auth/login?action=update-password&next=%2Faccount" onClick={() => setRedirecting(true)} aria-disabled={redirecting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-400 text-sm font-semibold text-primary-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50">{redirecting ? <><Loader2 className="h-4 w-4 animate-spin" />Redirecting…</> : <>Change password<ArrowRight className="h-4 w-4" /></>}</a></section>
      </div>
    </div>
  </main>
}
