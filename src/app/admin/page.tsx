"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { FigmaIcon } from "@/components/figma-icon"
import { fetchDocuments } from "@/lib/services/document-service"
import { fetchHealth } from "@/lib/services/health-service"
import type { DocumentSummary, HealthResponse } from "@/types"

export default function AdminDashboard() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchDocuments(), fetchHealth()]).then(([documentData, healthData]) => { setDocuments(documentData); setHealth(healthData) }).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load the admin overview." )).finally(() => setLoading(false))
  }, [])

  const metrics = useMemo(() => [
    { label: "Indexed documents", value: documents.length, helper: "Across the regulatory corpus", icon: "stat-documents", iconClass: "" },
    { label: "Processed chunks", value: documents.reduce((total, item) => total + item.chunk_count, 0).toLocaleString(), helper: "Available for vector retrieval", icon: "stat-chunks", iconClass: "" },
    { label: "Pages scanned", value: documents.reduce((total, item) => total + item.page_count, 0).toLocaleString(), helper: "OCR and native text layers", icon: "stat-pages", iconClass: "-scale-y-100" },
    { label: "Public sources", value: documents.filter((item) => item.visibility === "public").length, helper: "Open to anonymous access", icon: "stat-sources", iconClass: "" },
  ], [documents])

  if (loading) return <div className="grid min-h-[60vh] place-items-center"><div className="flex items-center gap-3 text-sm font-medium text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-sky-600" />Loading corpus intelligence…</div></div>

  const healthy = health?.status === "ok" && health?.database === "connected"
  return <div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h2 className="page-title">Intelligence overview</h2><p className="page-subtitle">Live operational visibility across indexed documents and retrieval-ready content.</p></div>
      <p className="flex w-fit items-center gap-2 text-[10px] font-medium text-muted-foreground" title={`API ${health?.status ?? "unavailable"} · database ${health?.database ?? "unavailable"}`}><span className={`h-1.5 w-1.5 rounded-full ${healthy ? "bg-emerald-500" : "bg-amber-500"}`} />{healthy ? "All services operational" : "Service check needed"}</p>
    </div>
    {error && <div className="mt-6 rounded-[10px] border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}

    <div className="mt-10 grid gap-x-[24.5px] gap-y-4 sm:grid-cols-2 lg:mt-[62px] xl:grid-cols-4">
      {metrics.map(({ label, value, helper, icon, iconClass }, index) => <div key={label} className="relative h-[135px] rounded-[10px] border bg-[hsl(var(--surface))] pl-[23px] pr-[14px] pt-[20px]" style={{ borderColor: index % 2 === 0 ? "#178099" : "hsl(var(--brand-lime))" }}>
        <div className="flex items-start justify-between"><p className="text-[15px] font-semibold leading-[19px] text-foreground">{label}</p><FigmaIcon name={icon} dark className={iconClass} /></div>
        <p className="mt-[5px] text-[41px] font-medium leading-[52px] text-foreground">{value}</p>
        <p className="ml-1 mr-[9px] whitespace-nowrap border-t border-foreground/50 pt-[5px] text-xs font-medium leading-[15px] text-foreground">{helper}</p>
      </div>)}
    </div>

    <section className="surface-card mt-10 px-5 pb-8 pt-[29px] sm:px-[42px] lg:mt-14">
      <div className="flex items-start justify-between gap-4 border-b border-[#efefef] pb-[10px] dark:border-border">
        <div><h3 className="text-base font-medium leading-5 text-foreground">Recently indexed</h3><p className="mt-[5px] text-xs font-medium text-muted-foreground">Latest additions to the vector store</p></div>
        <Link href="/admin/documents" className="mt-2 flex items-center gap-[7px] text-xs font-medium text-sky-400 hover:text-sky-700">View registry <FigmaIcon name="external-link" size={18} /></Link>
      </div>
      <div className="pt-[14px]">
        {documents.length ? [...documents].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 7).map((document) => <Link href={`/admin/documents/${document.document_id}`} key={document.document_id} className="-mx-2 flex h-[51px] items-center gap-[13px] rounded-[10px] px-2 transition hover:bg-[hsl(var(--surface))]">
          <FigmaIcon name="document" size={18} className="ml-[6px] self-start mt-[9px]" />
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold leading-[15px] text-foreground">{document.file_name}</p><p className="mt-[3px] truncate text-[10px] font-medium leading-[13px] text-muted-foreground">{document.category_label} · {document.page_count} pages · {document.chunk_count} chunks</p></div>
          <span className="hidden self-start pt-[10px] text-[10px] font-medium text-muted-foreground sm:block">{new Date(document.created_at).toLocaleDateString()}</span>
        </Link>) : <p className="py-12 text-center text-sm font-medium text-muted-foreground">No documents indexed yet.</p>}
      </div>
    </section>
  </div>
}
