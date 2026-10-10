"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Fingerprint, Loader2, LockKeyhole, ShieldCheck } from "lucide-react"
import { AppBrand } from "@/components/app-brand"
import { ThemeSwitcher } from "@/components/theme-switcher"

const SIGN_IN_ERRORS: Record<string, string> = {
  expired: "Your sign-in attempt expired. Please try again.",
  denied: "Sign in was cancelled.",
  unauthorized: "Your identity could not be authorized for this application.",
  unavailable: "Authentication service is unavailable. Please try again shortly.",
  configuration: "Session security is not configured.",
  failed: "Sign in failed. Please try again.",
}

export default function AdminLogin() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const errorCode = searchParams.get("error")
  const error = errorCode ? SIGN_IN_ERRORS[errorCode] ?? SIGN_IN_ERRORS.failed : null
  const signInParams = new URLSearchParams()
  const requested = searchParams.get("next")
  if (requested) signInParams.set("next", requested)
  // After a failed attempt, force the credential prompt so a different account can be used.
  if (errorCode) signInParams.set("prompt", "login")
  const signInQuery = signInParams.toString()
  const signInHref = `/api/auth/login${signInQuery ? `?${signInQuery}` : ""}`

  // Reset the button when the page is restored from the back-forward cache.
  useEffect(() => {
    const reset = () => setIsLoading(false)
    window.addEventListener("pageshow", reset)
    return () => window.removeEventListener("pageshow", reset)
  }, [])

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
      <p className="text-xs text-muted-foreground/70">PFMNext AI · Regulatory intelligence</p>
    </section>
    <section className="relative flex items-center justify-center px-4 py-12 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-9 lg:hidden"><AppBrand /></div>
        <div className="surface-card p-6 sm:p-8">
          <div className="mb-7"><div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-border bg-foreground/[0.04] text-sky-600 dark:text-sky-300"><LockKeyhole className="h-5 w-5" /></div><p className="eyebrow mb-2">Organization account</p><h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">You will be redirected to the secure PFMNext sign-in page.</p></div>
          {searchParams.get("passwordChanged") === "1" && <div role="status" className="mb-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3.5 py-3 text-sm text-emerald-800 dark:text-emerald-200">Password changed. Sign in again with your new password.</div>}
          {error && <div role="alert" className="mb-5 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-3.5 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}
          <a href={signInHref} onClick={() => setIsLoading(true)} aria-disabled={isLoading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-400 text-sm font-semibold text-primary-foreground shadow-[0_14px_32px_-16px_rgba(14,165,233,0.75)] transition hover:-translate-y-0.5 hover:bg-sky-300 aria-disabled:pointer-events-none aria-disabled:translate-y-0 aria-disabled:opacity-45">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Redirecting…</> : <>Sign in securely<ArrowRight className="h-4 w-4" /></>}</a>
          <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">Forgot your password or using a temporary one? Continue to sign in and follow the prompts.</p>
        </div>
        <Link href="/chat" className="mt-5 block text-center text-xs text-muted-foreground/70 transition hover:text-sky-600 dark:hover:text-sky-300">Continue without signing in</Link>
      </div>
    </section>
  </main>
}
