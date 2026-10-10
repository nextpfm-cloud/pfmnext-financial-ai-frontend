"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, FileSearch, Loader2, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { deleteDocument } from "@/lib/services/document-service"
import type { DocumentSummary } from "@/types"

const pageSizes = [25, 50, 100]

// Page numbers to show: first, last and the neighbours of the current page; 0 marks a gap.
function pageNumbers(current: number, total: number): number[] {
  const wanted = Array.from({ length: total }, (_, index) => index + 1).filter((number) => number === 1 || number === total || Math.abs(number - current) <= 1)
  return wanted.flatMap((number, index) => index > 0 && number - wanted[index - 1] > 1 ? [0, number] : [number])
}

export function DocumentTable({ documents, onDeleted, resetKey = "" }: { documents: DocumentSummary[]; onDeleted: () => Promise<void>; resetKey?: string }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(pageSizes[0])
  // A new search or filter starts again from the first page with nothing selected.
  useEffect(() => { setPage(1); setSelectedIds([]) }, [resetKey])
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (ids: string[]) => {
    if (!ids.length || !window.confirm(`Delete ${ids.length === 1 ? "this document" : `${ids.length} documents`} and all indexed chunks?`)) return
    setDeleting(true); setError(null)
    try { await Promise.all(ids.map(deleteDocument)); setSelectedIds([]); await onDeleted() } catch (caught) { setError(caught instanceof Error ? caught.message : "Delete failed.") } finally { setDeleting(false) }
  }

  if (!documents.length) return <div className="surface-card grid min-h-72 place-items-center px-6 text-center"><div><FileSearch className="mx-auto mb-4 h-7 w-7 text-sky-600" strokeWidth={1.5} /><h3 className="text-sm font-semibold text-foreground">No matching documents</h3><p className="mt-2 text-xs font-medium text-muted-foreground">Try another search or upload a new PDF.</p></div></div>

  const toggle = (id: string) => setSelectedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])
  const pageCount = Math.max(1, Math.ceil(documents.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const first = (currentPage - 1) * pageSize
  const visible = documents.slice(first, first + pageSize)
  const visibleIds = visible.map((document) => document.document_id)
  const selectedOnPage = visibleIds.filter((id) => selectedIds.includes(id)).length
  const pageButton = "grid h-[25px] min-w-[25px] place-items-center rounded-full border border-input px-1.5 text-[10px] font-medium text-foreground transition hover:border-sky-400 disabled:pointer-events-none disabled:opacity-40 aria-[current=page]:border-sky-400 aria-[current=page]:bg-sky-400 aria-[current=page]:text-primary-foreground"
  const heading = "px-2 py-[11px] text-xs font-semibold text-sky-400"
  return <section className="surface-card min-h-[472px] px-4 pb-6 pt-[14px] sm:px-[34px]">
    {error && <div className="mb-3 rounded-[10px] border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}
    <div className="flex h-[22px] items-center justify-between text-[10px] font-medium text-muted-foreground">
      <span>{selectedIds.length ? `${selectedIds.length} selected` : `${documents.length} ${documents.length === 1 ? "document" : "documents"}`}</span>
      {selectedIds.length > 0 && <button type="button" disabled={deleting} onClick={() => void remove(selectedIds)} className="flex items-center gap-1.5 text-red-600 hover:underline disabled:opacity-40 dark:text-red-300">{deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}Delete selected</button>}
    </div>
    <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] text-left">
      <thead><tr className="border-y border-[#efefef] dark:border-border"><th className="w-7 py-[11px] pl-0.5 pr-2"><Checkbox aria-label="Select all documents on this page" checked={selectedOnPage === visibleIds.length ? true : selectedOnPage ? "indeterminate" : false} onCheckedChange={(checked) => setSelectedIds((ids) => checked === true ? Array.from(new Set([...ids, ...visibleIds])) : ids.filter((id) => !visibleIds.includes(id)))} /></th><th className={`${heading} pl-0`}>Document reference</th><th className={heading}>Taxonomy</th><th className={heading}>Access</th><th className={heading}>Segmentation</th><th className={heading}>Indexed</th><th className={heading}>Actions</th></tr></thead>
      <tbody>{visible.map((document) => <tr key={document.document_id} className="transition hover:bg-[hsl(var(--surface))]">
        <td className="py-[14px] pl-0.5 pr-2"><Checkbox aria-label={`Select ${document.file_name}`} checked={selectedIds.includes(document.document_id)} onCheckedChange={() => toggle(document.document_id)} /></td>
        <td className="max-w-[230px] py-[14px] pr-2"><Link href={`/admin/documents/${document.document_id}`} className="block truncate text-xs font-semibold leading-[15px] text-foreground hover:text-sky-600">{document.file_name}</Link><p className="mt-[3px] truncate text-[10px] font-medium leading-[13px] text-muted-foreground">{document.document_id.slice(0, 18)}</p></td>
        <td className="px-2 py-[14px]"><span className="chip pointer-events-none max-w-[132px] truncate whitespace-nowrap !inline-block leading-[23px] text-center">{document.category_label}</span></td>
        <td className="whitespace-nowrap px-2 py-[14px] text-xs font-medium text-foreground"><span className="capitalize">{document.visibility}</span>.{document.jurisdiction_country_code}</td>
        <td className="whitespace-nowrap px-2 py-[14px] text-xs font-medium text-foreground">{document.page_count} pages · {document.chunk_count} chunks</td>
        <td className="px-2 py-[14px] text-xs font-medium text-foreground">{new Date(document.created_at).toLocaleDateString()}</td>
        <td className="px-2 py-[14px]"><div className="flex items-center gap-1.5"><Link href={`/admin/documents/${document.document_id}/chunks`} className="chip min-w-0 px-2.5 hover:border-sky-400">Chunks</Link><Link href={`/admin/documents/${document.document_id}`} className="chip min-w-0 px-2.5 hover:border-sky-400">Details</Link><button type="button" onClick={() => void remove([document.document_id])} className="grid h-[25px] w-[25px] place-items-center rounded-full text-muted-foreground hover:text-red-600" aria-label={`Delete ${document.file_name}`}><Trash2 className="h-3.5 w-3.5" /></button></div></td>
      </tr>)}</tbody>
    </table></div>
    <div className="divide-y divide-[#efefef] dark:divide-border md:hidden">{visible.map((document) => <div key={document.document_id} className="py-4"><div className="flex items-start gap-3"><Checkbox checked={selectedIds.includes(document.document_id)} onCheckedChange={() => toggle(document.document_id)} className="mt-0.5" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-foreground">{document.file_name}</p><p className="mt-1 text-[10px] font-medium text-muted-foreground">{document.category_label} · {document.visibility}.{document.jurisdiction_country_code} · {document.page_count} pages</p><div className="mt-3 flex gap-2"><Link href={`/admin/documents/${document.document_id}/chunks`} className="chip min-w-0">Chunks</Link><Link href={`/admin/documents/${document.document_id}`} className="chip min-w-0">Details <ChevronRight className="ml-1 h-3 w-3" /></Link></div></div></div></div>)}</div>
    <div className="mt-4 flex flex-col gap-3 border-t border-[#efefef] pt-4 text-[10px] font-medium text-muted-foreground dark:border-border sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3"><span>Showing {first + 1}–{first + visible.length} of {documents.length}</span><label className="flex items-center gap-1.5">Rows per page<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }} className="h-[25px] rounded-full border border-input bg-card px-2 text-[10px] font-medium text-foreground outline-none focus:border-sky-400">{pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}</select></label></div>
      {pageCount > 1 && <nav aria-label="Document pages" className="flex items-center gap-1.5">
        <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className={pageButton} aria-label="Previous page"><ChevronLeft className="h-3 w-3" /></button>
        {pageNumbers(currentPage, pageCount).map((number, index) => number ? <button type="button" key={number} onClick={() => setPage(number)} aria-current={number === currentPage ? "page" : undefined} className={pageButton}>{number}</button> : <span key={`gap-${index}`} className="px-0.5">…</span>)}
        <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className={pageButton} aria-label="Next page"><ChevronRight className="h-3 w-3" /></button>
      </nav>}
    </div>
  </section>
}
