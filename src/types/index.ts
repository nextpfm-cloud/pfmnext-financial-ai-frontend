export type DocumentCategory = { tag: string; label: string; document_count?: number }
export type DocumentVisibility = "public" | "internal"
export type DocumentSummary = {
  document_id: string; file_name: string; category: string; category_label: string
  jurisdiction_country_code: string; visibility: DocumentVisibility; source_url: string
  uploaded_by_user_id: string | null; source_language: string; translated_to_english: boolean
  page_count: number; chunk_count: number; created_at: string; updated_at: string
}
export type DocumentChunk = { chunk_id: string; page: number; heading: string | null; content: string }
export type DocumentChunksResponse = Pick<DocumentSummary, "document_id" | "category" | "category_label" | "jurisdiction_country_code" | "visibility" | "source_url" | "source_language" | "translated_to_english"> & { chunks: DocumentChunk[] }
export type DocumentUploadResponse = Pick<DocumentSummary, "document_id" | "file_name" | "category" | "category_label" | "jurisdiction_country_code" | "visibility" | "source_url" | "source_language" | "translated_to_english"> & { pages_processed: number; chunks_created: number; duplicate: boolean }
export type ChatRequest = { question: string; top_k?: number; categories?: string[]; countries?: string[] }
export type Citation = {
  source_id: string; document_id: string; file_name: string; category: string; category_label: string
  jurisdiction_country_code: string; visibility: DocumentVisibility; source_url: string
  source_language: string; translated_to_english: boolean; page: number; score: number
}
export type UsedCategory = { tag: string; label: string }
export type ChatResponse = { answer_markdown: string; used_categories: UsedCategory[]; citations: Citation[] }
export type ConversationMessage = { id: string; role: "user" | "assistant"; content: string; citations?: Citation[]; usedCategories?: UsedCategory[]; timestamp: number; status?: "pending" | "completed" | "failed" }
export type Conversation = { id: string; title: string; createdAt: number; updatedAt: number; selectedCategories: string[]; selectedCountries?: string[]; messages: ConversationMessage[]; draft?: string }
export type ConversationSummary = {
  conversation_id: string
  title: string
  title_source: "auto" | "manual"
  last_message_at: string
  created_at: string
  updated_at: string
}
export type PersistedConversationMessage = {
  message_id: string
  role: "user" | "assistant"
  content_markdown: string
  status: "pending" | "completed" | "failed"
  used_categories: UsedCategory[]
  citations: Citation[]
  created_at: string
}
export type ConversationExchange = {
  conversation: ConversationSummary
  user_message: PersistedConversationMessage
  assistant_message: PersistedConversationMessage
}
export type ConversationDetail = { conversation: ConversationSummary; messages: PersistedConversationMessage[] }
export type ConversationList = { conversations: ConversationSummary[]; next_cursor: string | null }
export type ChatUsage = { plan: string; access_level: "free" | "granted" | null; limit: number | null; used: number; remaining: number | null; resets_at: string | null }
export type UserRole = "user" | "admin" | "auditor"
export type UserAccessLevel = "free" | "granted"
export type ManagedUser = { user_id: string; username: string | null; email: string | null; role: UserRole; access_level: UserAccessLevel; daily_chat_limit: number | null; effective_daily_limit: number | null; status: "active" | "disabled"; last_seen_at: string | null; created_at: string; updated_at: string }
export type AuditEvent = { audit_event_id: string; occurred_at: string; request_id: string; actor_user_id: string | null; device_id: string | null; action: string; resource_type: string | null; resource_id: string | null; outcome: string; http_status: number | null; metadata: Record<string, unknown> }
export type AppSession = { authenticated: boolean; username?: string; organization?: string; role?: UserRole; expiresAt?: number }
export type HealthResponse = { status: "ok" | "degraded" | "unhealthy"; database: "connected" | "disconnected" | "unavailable" }
export type ApiError = { status: number; code: string; message: string; retryable: boolean }
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: ApiError }

export function apiErrorMessage(value: unknown, fallback: string): string {
  if (!value || typeof value !== "object") return fallback
  const data = value as { error?: unknown; detail?: unknown }
  if (typeof data.error === "string") return data.error
  if (typeof data.detail === "string") return data.detail
  if (data.detail && typeof data.detail === "object" && "message" in data.detail && typeof (data.detail as { message?: unknown }).message === "string") return (data.detail as { message: string }).message
  if (Array.isArray(data.detail)) {
    const messages = data.detail.flatMap((item) => item && typeof item === "object" && "msg" in item && typeof (item as { msg?: unknown }).msg === "string" ? [(item as { msg: string }).msg] : [])
    if (messages.length) return messages.join(" ")
  }
  return fallback
}
