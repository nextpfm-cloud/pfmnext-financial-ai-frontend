export const SESSION_COOKIE = "nextpfm_session"
export const ACCESS_TOKEN_COOKIE = "nextpfm_access_token"
export const REFRESH_TOKEN_COOKIE = "nextpfm_refresh_token"
export const DEVICE_ID_COOKIE = "nextpfm_device_id"
export const OIDC_TRANSACTION_COOKIE = "nextpfm_oidc_tx"
export const SESSION_TTL_SECONDS = 60 * 60 * 10
export const OIDC_TRANSACTION_TTL_SECONDS = 60 * 10

export type AppRole = "admin" | "auditor" | "user"
export type SessionPayload = { username: string; organization?: string; role: AppRole; expiresAt: number }
export type OidcTransaction = { state: string; nonce: string; verifier: string; next?: string; action?: "UPDATE_PASSWORD"; expiresAt: number }

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}
function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}
async function sign(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))))
}
function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length)
  let difference = left.length ^ right.length
  for (let index = 0; index < length; index += 1) difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0)
  return difference === 0
}
async function createSignedToken(payload: object, secret: string): Promise<string> {
  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  return `${encoded}.${await sign(encoded, secret)}`
}
async function readSignedToken<T extends { expiresAt: number }>(token: string | undefined, secret: string | undefined): Promise<T | null> {
  if (!token || !secret || secret.length < 32) return null
  const [encoded, provided, extra] = token.split(".")
  if (!encoded || !provided || extra || !constantTimeEqual(provided, await sign(encoded, secret))) return null
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as T
    return typeof payload.expiresAt === "number" && payload.expiresAt > Date.now() ? payload : null
  } catch { return null }
}
export async function createSessionToken(payload: Omit<SessionPayload, "expiresAt">, secret: string): Promise<string> {
  return createSignedToken({ ...payload, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 }, secret)
}
export async function verifySessionToken(token: string | undefined, secret: string | undefined): Promise<SessionPayload | null> {
  const payload = await readSignedToken<SessionPayload>(token, secret)
  return payload?.username && ["admin", "auditor", "user"].includes(payload.role) ? payload : null
}
export async function createOidcTransaction(transaction: Omit<OidcTransaction, "expiresAt">, secret: string): Promise<string> {
  return createSignedToken({ ...transaction, expiresAt: Date.now() + OIDC_TRANSACTION_TTL_SECONDS * 1000 }, secret)
}
export async function readOidcTransaction(token: string | undefined, secret: string | undefined): Promise<OidcTransaction | null> {
  const transaction = await readSignedToken<OidcTransaction>(token, secret)
  return transaction?.state && transaction.nonce && transaction.verifier ? transaction : null
}
export { constantTimeEqual }
export function secureCookie(): boolean { return process.env.NEXTPFM_AUTH_SECURE_COOKIE === "true" }
