"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { FigmaIcon } from "@/components/figma-icon"
import { DocumentTable } from "@/components/admin/document-table"
import { fetchDocuments } from "@/lib/services/document-service"
import type { DocumentSummary, DocumentVisibility } from "@/types"
const categories = [{ tag: "", label: "All" }, { tag: "acts", label: "Acts" }, { tag: "gazettes", label: "Gazettes" }, { tag: "circulars", label: "Circulars" }, { tag: "guidelines", label: "Guidelines" }]
export default function AdminDocuments() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [category, setCategory] = useState(""); const [visibility, setVisibility] = useState<"" | DocumentVisibility>(""); const [country, setCountry] = useState(""); const [query, setQuery] = useState("")
  const load = useCallback(async () => { setLoading(true); setError(null); try { setDocuments(await fetchDocuments({ category: category || null, country: country.length === 2 ? country : null, visibility: visibility || null })) } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load documents.") } finally { setLoading(false) } }, [category, country, visibility])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => documents.filter((document) => `${document.file_name} ${document.document_id} ${document.source_url}`.toLowerCase().includes(query.toLowerCase())), [documents, query])
  const pillControl = "h-[35px] w-[141px] rounded-full border border-input bg-card px-4 text-center text-sm font-medium text-foreground outline-none placeholder:text-foreground focus:border-sky-400"
  return <div>
    <div><h2 className="page-title">Regulatory documents</h2><p className="page-subtitle">Search and maintain organization-scoped sources, jurisdiction, visibility, and canonical links.</p></div>
    <section className="tool-panel mt-10 px-4 pb-[18px] pt-5 sm:px-[30px] lg:mt-[clamp(2.5rem,11vh,7rem)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-[19px]">
        <label className="relative block flex-1"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, ID or source URL..." aria-label="Search documents" className="h-[51px] w-full rounded-[10px] border border-[#e5e5e5] bg-card pl-5 pr-14 text-sm text-foreground outline-none placeholder:text-xs placeholder:font-light placeholder:text-muted-foreground focus:border-sky-400 dark:border-border" /><FigmaIcon name="search-lg" className="pointer-events-none absolute right-[26px] top-1/2 -translate-y-1/2" /></label>
        <div className="flex gap-[27px]">
          <input aria-label="Country filter" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))} placeholder="Country" className={pillControl} />
          <select aria-label="Visibility filter" value={visibility} onChange={(e) => setVisibility(e.target.value as "" | DocumentVisibility)} className={`${pillControl} appearance-none [text-align-last:center]`}><option value="">All visibility</option><option value="public">Public</option><option value="internal">Internal</option></select>
        </div>
      </div>
      <div className="mt-[29px] flex items-center gap-[10px] overflow-x-auto pb-px">{categories.map((item) => <button type="button" key={item.tag} onClick={() => setCategory(item.tag)} aria-pressed={category === item.tag} className="chip shrink-0">{item.label}</button>)}</div>
    </section>
    {error && <div className="mt-6 rounded-[10px] border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}
    <div className="mt-[29px]">{loading ? <div className="grid min-h-72 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-sky-600" /></div> : <DocumentTable documents={filtered} onDeleted={load} />}</div>
  </div>
}
