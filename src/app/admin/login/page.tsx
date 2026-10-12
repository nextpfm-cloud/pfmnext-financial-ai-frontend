"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { AppBrand } from "@/components/app-brand"
import { FigmaIcon } from "@/components/figma-icon"
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

  return <main className="relative min-h-[100dvh] bg-background">
    <div className="absolute left-[22px] top-4"><AppBrand /></div>
    <div className="absolute right-4 top-4 z-30"><ThemeSwitcher /></div>
    <div className="mx-auto grid min-h-[100dvh] max-w-[1440px] items-center gap-10 px-5 pb-12 pt-24 lg:grid-cols-[1fr_560px] lg:gap-[99px] lg:pl-[136px] lg:pr-[113px] lg:pt-12">
      <section className="hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/x-mark.svg" alt="" aria-hidden="true" width={231} height={196} className="ml-[100px] h-[196px] w-[231px]" />
        <h1 className="mt-[17px] text-[40px] font-medium leading-[50px] text-sky-600">Regulatory operations,<br /><span style={{ color: "hsl(var(--brand-lime))" }}>securely governed.</span></h1>
        <p className="mt-[19px] max-w-[532px] text-sm font-medium leading-[18px] text-muted-foreground">Sign in to your organization workspace to manage trusted sources, user access, quotas and audit activity.</p>
        <div className="mt-[79px] flex gap-x-[40px] whitespace-nowrap xl:gap-x-[53px]">
          <div className="flex items-start gap-[10px]"><FigmaIcon name="shield-check" className="mt-1" /><div><p className="text-[15px] font-medium leading-[19px] text-sky-600">Secure sessions</p><p className="mt-1 text-[10px] font-medium leading-[13px] text-muted-foreground">HttpOnly tokens with automatic refresh.</p></div></div>
          <div className="flex items-start gap-[11px]"><FigmaIcon name="lock" className="mt-[5px]" /><div><p className="text-[15px] font-medium leading-[19px] text-sky-600">Role governed</p><p className="mt-1 text-[10px] font-medium leading-[13px] text-muted-foreground">Backend-enforced organization access.</p></div></div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[560px] rounded-[17px] border-2 border-[#f0efef] bg-card px-6 pb-[42px] pt-[54px] text-center dark:border-border sm:px-[69px]">
        <p className="text-sm text-foreground">Organization Account</p>
        <h2 className="mt-[17px] text-4xl font-medium leading-[45px] text-foreground">Welcome back</h2>
        <p className="mx-auto mt-[17px] max-w-[380px] text-sm leading-[18px] text-foreground">You will be redirected to the secure PFMNext sign-in page to enter your username and password.</p>
        {searchParams.get("passwordChanged") === "1" && <div role="status" className="mt-6 rounded-[10px] border border-emerald-500/20 bg-emerald-500/[0.06] px-3.5 py-3 text-sm text-emerald-800 dark:text-emerald-200">Password changed. Sign in again with your new password.</div>}
        {error && <div role="alert" className="mt-6 rounded-[10px] border border-red-400/20 bg-red-400/[0.06] px-3.5 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}
        <a href={signInHref} onClick={() => setIsLoading(true)} aria-disabled={isLoading} className="btn-primary mt-[46px] min-w-[145px] aria-disabled:pointer-events-none aria-disabled:opacity-50">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Redirecting…</> : "Sign in securely"}</a>
        <p className="mx-auto mt-[30px] max-w-[417px] text-sm font-medium leading-[18px] text-muted-foreground">Using a temporary password or forgot it? Continue to sign in and follow the prompts.</p>
        <Link href="/chat" className="mt-[28px] inline-block text-sm font-medium text-muted-foreground transition hover:text-sky-600">Continue without signing in</Link>
      </section>
    </div>
  </main>
}
