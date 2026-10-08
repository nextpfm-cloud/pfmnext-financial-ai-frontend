"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Fingerprint, Loader2, LockKeyhole, ShieldCheck } from "lucide-react"
import { AppBrand } from "@/components/app-brand"
import { ThemeSwitcher } from "@/components/theme-switcher"
import type { UserRole } from "@/types"

export default function AdminLogin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const result = await response.json().catch(() => ({})) as { error?: string; role?: UserRole }
      if (!response.ok) throw new Error(result.error || "Sign in failed.")
      const requested = searchParams.get("next")
      const safeRequested = requested?.startsWith("/") && !requested.startsWith("//") ? requested : null
      const destination = safeRequested?.startsWith("/account") ? safeRequested : result.role === "admin"
        ? safeRequested?.startsWith("/admin") ? safeRequested : "/admin"
        : result.role === "auditor" ? "/admin/audit" : "/chat"
      router.replace(destination)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.")
      setIsLoading(false)
    }
  }

  const inputClass = "h-12 w-full rounded-xl border border-border bg-background/55 px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/55 focus:border-sky-400/45 focus:ring-4 focus:ring-sky-400/[0.07]"

  return <main className="relative grid min-h-[100dvh] overflow-hidden bg-background lg:grid-cols-[1.08fr_0.92fr]">
    <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6"><ThemeSwitcher /></div>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_42%,rgba(14,165,233,0.16),transparent_30rem),radial-gradient(circle_at_82%_12%,rgba(99,102,241,0.07),transparent_23rem)]" />
    <section className="relative hidden flex-col justify-between border-r border-border p-10 lg:flex xl:p-16">
      <AppBrand />
      <div className="max-w-xl">
        <div className="mb-7 grid h-16 w-16 place-items-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-600 shadow-[0_0_60px_rgba(56,189,248,0.16)] dark:text-sky-300"><ShieldCheck className="h-7 w-7" /></div>
        <p className="eyebrow mb-4 text-sky-600 dark:text-sky-300/70">Governed access</p>
        <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.04em] text-foreground">Regulatory operations, securely governed.</h1>
        <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">Sign in to your organization workspace to manage trusted sources, user access, quotas, and audit activity.</p>
        <div className="mt-9 grid max-w-lg grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card/45 p-4"><LockKeyhole className="mb-3 h-4 w-4 text-sky-600 dark:text-sky-300" /><p className="text-xs font-medium text-foreground">Secure sessions</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">HttpOnly tokens with automatic refresh.</p></div>
          <div className="rounded-2xl border border-border bg-card/45 p-4"><Fingerprint className="mb-3 h-4 w-4 text-sky-600 dark:text-sky-300" /><p className="text-xs font-medium text-foreground">Role governed</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Backend-enforced organization access.</p></div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground/70">NextPFM AI · Regulatory intelligence</p>
    </section>
    <section className="relative flex items-center justify-center px-4 py-12 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-9 lg:hidden"><AppBrand /></div>
        <div className="surface-card p-6 sm:p-8">
          <div className="mb-7"><div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-border bg-foreground/[0.04] text-sky-600 dark:text-sky-300"><LockKeyhole className="h-5 w-5" /></div><p className="eyebrow mb-2">Organization account</p><h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Enter your NextPFM username and password to continue.</p></div>
          {searchParams.get("passwordChanged") === "1" && <div role="status" className="mb-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3.5 py-3 text-sm text-emerald-800 dark:text-emerald-200">Password changed. Sign in again with your new password.</div>}
          <form onSubmit={submit} className="space-y-5">
            <label className="block"><span className="mb-2 block text-xs font-medium text-muted-foreground">Username</span><input autoFocus autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={255} className={inputClass} placeholder="Your username" /></label>
            <label className="block"><span className="mb-2 block text-xs font-medium text-muted-foreground">Password</span><span className="relative block"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={1024} className={`${inputClass} pr-12`} placeholder="Your password" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/[0.04] hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
            {error && <div role="alert" className="rounded-xl border border-red-400/15 bg-red-400/[0.06] px-3.5 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}
            <button type="submit" disabled={isLoading || !username.trim() || !password} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-400 text-sm font-semibold text-primary-foreground shadow-[0_14px_32px_-16px_rgba(14,165,233,0.75)] transition hover:-translate-y-0.5 hover:bg-sky-300 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</> : <>Sign in securely<ArrowRight className="h-4 w-4" /></>}</button>
          </form>
          <a href="/api/auth/account" target="_blank" rel="noreferrer" className="mt-4 block text-center text-xs text-muted-foreground transition hover:text-sky-600 dark:hover:text-sky-300">Using a temporary password? Complete first-time setup</a>
        </div>
        <Link href="/chat" className="mt-5 block text-center text-xs text-muted-foreground/70 transition hover:text-sky-600 dark:hover:text-sky-300">Continue without signing in</Link>
      </div>
    </section>
  </main>
}
