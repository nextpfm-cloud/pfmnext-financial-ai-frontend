"use client"

import { useCallback, useEffect, useState } from "react"
import { Eye, EyeOff, KeyRound, Loader2, Plus, Shield, UserRoundCog, UserX, X } from "lucide-react"
import { createUser, disableUser, fetchUsers, resetTemporaryPassword, updateUser } from "@/lib/services/admin-service"
import type { ManagedUser, UserAccessLevel, UserRole } from "@/types"

const emptyCreate = { username: "", email: "", firstName: "", lastName: "", temporaryPassword: "" }

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createFields, setCreateFields] = useState(emptyCreate)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [role, setRole] = useState<UserRole>("user")
  const [access, setAccess] = useState<UserAccessLevel>("free")
  const [limit, setLimit] = useState("")
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null)
  const [resetPassword, setResetPassword] = useState("")
  const [showResetPassword, setShowResetPassword] = useState(false)
  const control = "h-11 rounded-xl border border-border bg-background/50 px-3 text-sm text-foreground outline-none focus:border-sky-400/30"

  const load = useCallback(async () => {
    setLoading(true)
    try { setUsers(await fetchUsers()) }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load users.") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null); setSuccess(null)
    try {
      await createUser({
        username: createFields.username.trim(),
        email: createFields.email.trim() || undefined,
        first_name: createFields.firstName.trim() || undefined,
        last_name: createFields.lastName.trim() || undefined,
        temporary_password: createFields.temporaryPassword,
        role,
        access_level: access,
        ...(access === "granted" ? { daily_chat_limit: limit ? Number(limit) : null } : {}),
      })
      setSuccess(`${createFields.username.trim()} was provisioned in PFMNext and Keycloak.`)
      setCreateFields(emptyCreate); setLimit(""); await load()
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to provision user.") }
    finally { setBusy(false) }
  }

  const patch = async (user: ManagedUser, next: Partial<{ role: UserRole; access_level: UserAccessLevel; daily_chat_limit: number | null; status: "active" | "disabled" }>) => {
    setBusy(true); setError(null); setSuccess(null)
    try { await updateUser(user.user_id, next); await load() }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update user.") }
    finally { setBusy(false) }
  }

  const setQuota = (user: ManagedUser) => {
    const value = window.prompt("Daily limit (leave blank for unlimited)", user.daily_chat_limit?.toString() ?? "")
    if (value === null) return
    const parsed = Number(value)
    if (value !== "" && (!Number.isInteger(parsed) || parsed < 1)) { setError("Daily limit must be a positive whole number or blank for unlimited."); return }
    void patch(user, { daily_chat_limit: value === "" ? null : parsed })
  }

  const resetCredential = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!resetUser) return
    setBusy(true); setError(null); setSuccess(null)
    try {
      await resetTemporaryPassword(resetUser.user_id, resetPassword)
      setSuccess(`A temporary password was issued for ${resetUser.username}. Existing identity sessions were revoked.`)
      setResetUser(null); setResetPassword("")
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to reset temporary password.") }
    finally { setBusy(false) }
  }

  return <div className="space-y-6">
    <div><h2 className="page-title">Users, credentials and quotas</h2><p className="page-subtitle max-w-3xl">Provision the application user and Keycloak identity together, assign permissions, and manage temporary credentials.</p></div>

    <form onSubmit={create} className="surface-card space-y-4 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Provision user</h3><p className="mt-1 text-xs text-muted-foreground">The temporary password is sent once and is never stored or returned.</p></div><div className="rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1 text-[10px] font-medium text-amber-800 dark:text-amber-200">Forced change on first login</div></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input required minLength={3} maxLength={255} pattern="[A-Za-z0-9._@+\-]+" value={createFields.username} onChange={(event) => setCreateFields((value) => ({ ...value, username: event.target.value }))} placeholder="Username" autoComplete="off" className={control} />
        <input type="email" maxLength={320} value={createFields.email} onChange={(event) => setCreateFields((value) => ({ ...value, email: event.target.value }))} placeholder="Email (optional)" autoComplete="off" className={control} />
        <input maxLength={255} value={createFields.firstName} onChange={(event) => setCreateFields((value) => ({ ...value, firstName: event.target.value }))} placeholder="First name (optional)" autoComplete="off" className={control} />
        <input maxLength={255} value={createFields.lastName} onChange={(event) => setCreateFields((value) => ({ ...value, lastName: event.target.value }))} placeholder="Last name (optional)" autoComplete="off" className={control} />
        <label className="relative md:col-span-2"><span className="sr-only">Temporary password</span><input required type={showCreatePassword ? "text" : "password"} minLength={8} maxLength={1024} value={createFields.temporaryPassword} onChange={(event) => setCreateFields((value) => ({ ...value, temporaryPassword: event.target.value }))} placeholder="Temporary password · minimum 8 characters" autoComplete="new-password" className={`${control} w-full pr-11`} /><button type="button" onClick={() => setShowCreatePassword((value) => !value)} className="absolute right-1 top-1 grid h-9 w-9 place-items-center text-muted-foreground" aria-label={showCreatePassword ? "Hide password" : "Show password"}>{showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></label>
        <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className={control}><option value="user">User role</option><option value="admin">Administrator</option><option value="auditor">Auditor</option></select>
        <select value={access} onChange={(event) => setAccess(event.target.value as UserAccessLevel)} className={control}><option value="free">Free access</option><option value="granted">Granted access</option></select>
        {access === "granted" && <input type="number" min="1" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="Blank = unlimited quota" className={`${control} md:col-span-2`} />}
        <button disabled={busy} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50 md:col-span-2"><Plus className="h-4 w-4" />{busy ? "Provisioning…" : "Provision user"}</button>
      </div>
      <p className="text-[11px] leading-5 text-muted-foreground">Temporary credentials require Keycloak’s one-time password update before the custom development login can issue tokens. Share the <a href="/api/auth/account" target="_blank" rel="noreferrer" className="text-sky-700 underline underline-offset-2 dark:text-sky-300">account setup page</a> with the new user.</p>
    </form>

    {error && <div role="alert" className="rounded-xl border border-red-400/15 bg-red-400/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}
    {success && <div role="status" className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">{success}</div>}

    {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : <div className="grid gap-3">{users.map((user) => <article key={user.user_id} className="surface-card flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/10 text-sky-600"><UserRoundCog className="h-4 w-4" /></div><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{user.username ?? "Pending identity"}</p><span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider ${user.status === "active" ? "bg-emerald-400/10 text-emerald-700 dark:text-emerald-300" : "bg-red-400/10 text-red-600 dark:text-red-300"}`}>{user.status}</span></div><p className="truncate text-xs text-muted-foreground">{user.email ?? user.user_id}</p>{user.last_seen_at && <p className="mt-0.5 text-[10px] text-muted-foreground/70">Last seen {new Date(user.last_seen_at).toLocaleString()}</p>}</div></div>
      <div className="flex flex-wrap items-center gap-2">
        <select disabled={busy} aria-label={`Role for ${user.username}`} value={user.role} onChange={(event) => void patch(user, { role: event.target.value as UserRole })} className={control}><option value="user">User</option><option value="admin">Admin</option><option value="auditor">Auditor</option></select>
        <select disabled={busy} aria-label={`Access for ${user.username}`} value={user.access_level} onChange={(event) => void patch(user, event.target.value === "free" ? { access_level: "free" } : { access_level: "granted", daily_chat_limit: null })} className={control}><option value="free">Free · {user.effective_daily_limit}/day</option><option value="granted">Granted · {user.effective_daily_limit ?? "Unlimited"}</option></select>
        {user.access_level === "granted" && <button type="button" disabled={busy} onClick={() => setQuota(user)} className="h-11 rounded-xl border border-border px-3 text-xs text-muted-foreground">Set quota</button>}
        <button type="button" disabled={busy} onClick={() => { setResetUser(user); setResetPassword(""); setShowResetPassword(false) }} className="h-11 rounded-xl border border-border px-3 text-xs text-muted-foreground"><KeyRound className="mr-2 inline h-3.5 w-3.5" />Reset password</button>
        {user.status === "disabled" ? <button type="button" disabled={busy} onClick={() => void patch(user, { status: "active" })} className="h-11 rounded-xl border border-emerald-400/20 px-3 text-xs text-emerald-700 dark:text-emerald-300"><Shield className="mr-2 inline h-3.5 w-3.5" />Enable</button> : <button type="button" disabled={busy} onClick={() => { if (confirm(`Disable ${user.username}? Their Keycloak access will also be disabled.`)) void disableUser(user.user_id).then(load).catch((caught: Error) => setError(caught.message)) }} className="h-11 rounded-xl border border-red-400/15 px-3 text-xs text-red-600 dark:text-red-300"><UserX className="mr-2 inline h-3.5 w-3.5" />Disable</button>}
      </div>
    </article>)}</div>}

    {resetUser && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="reset-password-title"><form onSubmit={resetCredential} className="surface-card w-full max-w-md p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow mb-2">Credential reset</p><h3 id="reset-password-title" className="text-lg font-semibold">Temporary password for {resetUser.username}</h3></div><button type="button" onClick={() => setResetUser(null)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground" aria-label="Close"><X className="h-4 w-4" /></button></div><p className="mt-3 text-sm leading-6 text-muted-foreground">This revokes existing identity sessions and forces a password change through the account setup page.</p><label className="relative mt-5 block"><span className="mb-2 block text-xs font-medium text-muted-foreground">New temporary password</span><input autoFocus required type={showResetPassword ? "text" : "password"} minLength={8} maxLength={1024} value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} autoComplete="new-password" className={`${control} w-full pr-11`} /><button type="button" onClick={() => setShowResetPassword((value) => !value)} className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center text-muted-foreground" aria-label={showResetPassword ? "Hide password" : "Show password"}>{showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setResetUser(null)} className="h-10 rounded-xl border border-border px-4 text-sm text-muted-foreground">Cancel</button><button disabled={busy || resetPassword.length < 8} className="h-10 rounded-xl bg-sky-400 px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Resetting…" : "Issue temporary password"}</button></div></form></div>}
  </div>
}
