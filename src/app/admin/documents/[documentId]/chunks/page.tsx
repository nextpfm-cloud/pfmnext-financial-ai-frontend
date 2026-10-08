"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { DocumentChunks } from "@/components/admin/document-chunks"
import { fetchDocumentChunks } from "@/lib/services/document-service"
import type { DocumentChunk } from "@/types"

export default function AdminDocumentChunks() {
  const { documentId } = useParams<{ documentId: string }>()
  const [chunks, setChunks] = useState<DocumentChunk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { fetchDocumentChunks(documentId).then((data) => setChunks(data.chunks ?? [])).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load chunks.")).finally(() => setLoading(false)) }, [documentId])
  if (loading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-sky-600 dark:text-sky-300" /></div>
  return <div className="mx-auto max-w-5xl space-y-6"><Link href={`/admin/documents/${documentId}`} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-sky-600 dark:text-sky-300"><ArrowLeft className="h-3.5 w-3.5" />Document details</Link>{error ? <div className="surface-card p-8 text-center text-sm text-red-700 dark:text-red-200">{error}</div> : <DocumentChunks chunks={chunks} />}</div>
}
