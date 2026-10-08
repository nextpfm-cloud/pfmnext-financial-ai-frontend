"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { DocumentDetails } from "@/components/admin/document-details"
import { fetchDocument } from "@/lib/services/document-service"
import type { DocumentSummary } from "@/types"

export default function AdminDocumentDetails() {
  const { documentId } = useParams<{ documentId: string }>()
  const [document, setDocument] = useState<DocumentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { fetchDocument(documentId).then(setDocument).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load this document.")).finally(() => setLoading(false)) }, [documentId])
  if (loading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-sky-600 dark:text-sky-300" /></div>
  return <div className="mx-auto max-w-5xl space-y-6"><Link href="/admin/documents" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-sky-600 dark:text-sky-300"><ArrowLeft className="h-3.5 w-3.5" />Document registry</Link>{error || !document ? <div className="surface-card p-8 text-center text-sm text-red-700 dark:text-red-200">{error ?? "Document not found."}</div> : <DocumentDetails document={document} />}</div>
}
