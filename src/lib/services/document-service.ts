import { apiErrorMessage, DocumentChunksResponse, DocumentSummary, DocumentUploadResponse, DocumentVisibility } from "@/types"
async function parse<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(apiErrorMessage(data, `${fallback} (${response.status})`))
  return data as T
}
export async function fetchDocuments(params?: { category?: string | null; country?: string | null; visibility?: DocumentVisibility | null }): Promise<DocumentSummary[]> {
  const query = new URLSearchParams()
  if (params?.category) query.set("category", params.category)
  if (params?.country) query.set("country", params.country.toUpperCase())
  if (params?.visibility) query.set("visibility", params.visibility)
  const data = await parse<{ documents: DocumentSummary[] }>(await fetch(`/api/backend/documents${query.size ? `?${query}` : ""}`), "Unable to load documents")
  return data.documents
}
export async function fetchDocument(documentId: string): Promise<DocumentSummary> { return parse(await fetch(`/api/backend/documents/${documentId}`), "Unable to load document") }
export async function fetchDocumentChunks(documentId: string): Promise<DocumentChunksResponse> { return parse(await fetch(`/api/backend/documents/${documentId}/chunks`), "Unable to load document chunks") }
export async function uploadDocument(file: File, metadata: { category: string; jurisdictionCountryCode: string; visibility: DocumentVisibility; sourceUrl: string }): Promise<DocumentUploadResponse> {
  const form = new FormData(); form.append("file", file); form.append("category", metadata.category); form.append("jurisdiction_country_code", metadata.jurisdictionCountryCode.toUpperCase()); form.append("visibility", metadata.visibility); form.append("source_url", metadata.sourceUrl)
  return parse(await fetch("/api/backend/documents", { method: "POST", body: form }), "Upload failed")
}
export async function updateDocument(documentId: string, metadata: { category: string; jurisdiction_country_code: string; visibility: DocumentVisibility; source_url: string }): Promise<DocumentSummary> {
  return parse(await fetch(`/api/backend/documents/${documentId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(metadata) }), "Update failed")
}
export async function deleteDocument(documentId: string): Promise<{ deleted: boolean }> { return parse(await fetch(`/api/backend/documents/${documentId}`, { method: "DELETE" }), "Delete failed") }
