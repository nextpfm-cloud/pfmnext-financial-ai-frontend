import {
  apiErrorMessage,
  type ChatRequest,
  type ConversationDetail,
  type ConversationExchange,
  type ConversationList,
  type ConversationSummary,
} from "@/types"

async function parse<T>(response: Response, fallback: string): Promise<T> {
  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(apiErrorMessage(data, fallback))
  return data as T
}

function conversationUrl(id?: string): string {
  return id ? `/api/backend/conversations/${encodeURIComponent(id)}` : "/api/backend/conversations"
}

export async function fetchConversationPage(cursor?: string): Promise<ConversationList> {
  const query = new URLSearchParams({ limit: "100" })
  if (cursor) query.set("cursor", cursor)
  return parse(await fetch(`${conversationUrl()}?${query}`, { cache: "no-store" }), "Unable to load conversation history.")
}

export async function fetchConversation(id: string): Promise<ConversationDetail> {
  return parse(await fetch(conversationUrl(id), { cache: "no-store" }), "Unable to load this conversation.")
}

export async function createConversation(payload: ChatRequest, idempotencyKey: string): Promise<ConversationExchange> {
  return parse(await fetch(conversationUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  }), "The regulatory service could not start this conversation.")
}

export async function addConversationMessage(id: string, payload: ChatRequest, idempotencyKey: string): Promise<ConversationExchange> {
  return parse(await fetch(`${conversationUrl(id)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  }), "The regulatory service could not answer this question.")
}

export async function renameConversation(id: string, title: string): Promise<ConversationSummary> {
  return parse(await fetch(conversationUrl(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  }), "Unable to rename this conversation.")
}

export async function deleteConversation(id: string): Promise<void> {
  await parse<void>(await fetch(conversationUrl(id), { method: "DELETE" }), "Unable to delete this conversation.")
}
