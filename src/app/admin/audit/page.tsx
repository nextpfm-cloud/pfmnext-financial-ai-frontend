"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Activity, Loader2, ShieldAlert, XCircle } from "lucide-react"
import { FigmaIcon } from "@/components/figma-icon"
import { fetchAuditEvents } from "@/lib/services/admin-service"
import type { AuditEvent } from "@/types"

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState("")
  const load = useCallback(async () => { setLoading(true); setError(null); try { setEvents(await fetchAuditEvents(action ? { action } : undefined)) } catch (e) { setError(e instanceof Error ? e.message : "Unable to load audit events.") } finally { setLoading(false) } }, [action])
  useEffect(() => { void load() }, [load])
  const actions = useMemo(() => Array.from(new Set(events.map((item) => item.action))).sort(), [events])

  return <div>
    <Link href="/admin" aria-label="Back to admin console" className="-ml-3 hidden w-fit transition hover:opacity-70 lg:block"><FigmaIcon name="back" dark /></Link>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mt-[35px]">
      <div><h2 className="page-title">Audit trail</h2><p className="page-subtitle">Organization scoped access, governance and chat outcomes with request correlation</p></div>
      <label className="relative block w-[194px] shrink-0">
        <FigmaIcon name="filter" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
        <select aria-label="Filter by action" value={action} onChange={(e) => setAction(e.target.value)} className="h-[35px] w-full appearance-none rounded-[10px] border border-[#8d8d8d] bg-[hsl(var(--surface))] pl-[39px] pr-8 text-xs font-light text-muted-foreground outline-none focus:border-sky-400"><option value="">All actions</option>{actions.map((value) => <option key={value}>{value}</option>)}</select>
        <FigmaIcon name="chevron-down" className="pointer-events-none absolute right-[15px] top-1/2 -translate-y-1/2 -scale-y-100" />
      </label>
    </div>
    {error && <div className="mt-6 rounded-[10px] border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}
    {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-sky-600" /></div> : <section className="surface-card mt-[37px] px-5 py-2 sm:pl-[41px] sm:pr-[50px]">
      <div className="divide-y divide-[#efefef] dark:divide-border">
        {events.map((event) => <article key={event.audit_event_id} className="grid items-center gap-x-[26px] gap-y-2 py-[14px] sm:grid-cols-[24px_1fr_auto]">
          {event.outcome === "success" ? <FigmaIcon name="audit-check" /> : event.outcome === "denied" ? <ShieldAlert className="h-6 w-6 text-amber-500" strokeWidth={1.5} /> : <XCircle className="h-6 w-6 text-red-500" strokeWidth={1.5} />}
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-[15px] text-foreground">{event.action.replace(/[._]/g, " ")}</p>
            <p className="mt-[3px] break-all text-[10px] font-medium leading-[13px] text-muted-foreground">request {event.request_id}{event.resource_id ? ` · ${event.resource_type} ${event.resource_id}` : ""}</p>
            {Object.keys(event.metadata).length > 0 && <p className="mt-1 truncate text-[10px] font-medium leading-[13px] text-muted-foreground">{JSON.stringify(event.metadata)}</p>}
          </div>
          <div className="self-start text-left text-[10px] font-medium text-muted-foreground sm:text-right">
            <p className="capitalize leading-[13px]">{event.outcome} :&nbsp; {event.http_status ?? "—"}</p>
            <p className="mt-[9px] leading-[13px]">{new Date(event.occurred_at).toLocaleString()}</p>
          </div>
        </article>)}
        {events.length === 0 && <div className="grid min-h-64 place-items-center text-sm font-medium text-muted-foreground"><span className="flex flex-col items-center"><Activity className="mb-3 h-6 w-6" />No matching events.</span></div>}
      </div>
    </section>}
  </div>
}
