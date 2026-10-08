"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react"
import { AppBrand } from "@/components/app-brand"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { changePassword } from "@/lib/services/admin-service"
import type { AppSession } from "@/types"

export default function AccountPage() {
  const router = useRouter()
  const [session, setSession] = useState<AppSession | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => response.ok ? response.json() : null).then(setSession)
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (newPassword !== confirmation) { setError("The new password confirmation does not match."); return }
    if (newPassword === currentPassword) { setError("Choose a new password that differs from your current password."); return }
    setBusy(true)
    try {
      await changePassword(currentPassword, newPassword)
      await fetch("/api/auth/logout", { method: "POST" })
      router.replace("/admin/login?passwordChanged=1")
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to change password.")
      setBusy(false)
    }
  }

  const inputClass = "h-12 w-full rounded-xl border border-border bg-background/60 px-3.5 pr-12 text-sm outline-none focus:border-sky-400/35 focus:ring-4 focus:ring-sky-400/[0.06]"
  return <main className="min-h-[100dvh] bg-background px-4 py-6 sm:px-6 sm:py-10">
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex items-center justify-between gap-3"><AppBrand /><div className="flex items-center gap-2"><Link href="/chat" className="flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" />Assistant</Link><ThemeSwitcher /></div></header>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="surface-card p-5 sm:p-6"><div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-400/10 text-sky-600 dark:text-sky-300"><ShieldCheck className="h-5 w-5" /></div><p className="eyebrow mb-2 mt-5">Signed-in identity</p><h1 className="text-2xl font-semibold">Account security</h1><dl className="mt-6 space-y-4 text-sm"><div><dt className="text-xs text-muted-foreground">Username</dt><dd className="mt-1 font-medium">{session?.username ?? "Loading…"}</dd></div><div><dt className="text-xs text-muted-foreground">Organization</dt><dd className="mt-1 font-medium">{session?.organization ?? "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Application role</dt><dd className="mt-1 capitalize">{session?.role ?? "—"}</dd></div></dl><p className="mt-7 text-xs leading-5 text-muted-foreground">Changing your password updates Keycloak and revokes existing identity sessions. You will need to sign in again.</p></section>
        <section className="surface-card p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-foreground/[0.03] text-sky-600 dark:text-sky-300"><KeyRound className="h-4 w-4" /></div><div><h2 className="text-lg font-semibold">Change password</h2><p className="text-xs text-muted-foreground">Verify your current credential before setting a new one.</p></div></div><form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-2 block text-xs font-medium text-muted-foreground">Current password</span><span className="relative block"><input required type={showPasswords ? "text" : "password"} maxLength={1024} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} /><button type="button" onClick={() => setShowPasswords((value) => !value)} className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center text-muted-foreground" aria-label={showPasswords ? "Hide passwords" : "Show passwords"}>{showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label><label className="block"><span className="mb-2 block text-xs font-medium text-muted-foreground">New password</span><input required type={showPasswords ? "text" : "password"} minLength={8} maxLength={1024} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} /></label><label className="block"><span className="mb-2 block text-xs font-medium text-muted-foreground">Confirm new password</span><input required type={showPasswords ? "text" : "password"} minLength={8} maxLength={1024} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClass} /></label>{error && <div role="alert" className="rounded-xl border border-red-400/15 bg-red-400/[0.06] px-3.5 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}<button disabled={busy || newPassword.length < 8 || confirmation.length < 8 || !currentPassword} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-400 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "Changing password…" : "Change password"}</button></form></section>
      </div>
    </div>
  </main>
}
