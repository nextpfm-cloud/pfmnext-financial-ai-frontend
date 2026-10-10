import type { AppRole } from "@/lib/auth/session"

export const apiBaseUrl = () => process.env.NEXTPFM_API_BASE_URL ?? "http://127.0.0.1:10106"
export const oidcIssuer = () => process.env.NEXTPFM_OIDC_ISSUER ?? "http://localhost:8080/realms/nextpfm-dev"
export const oidcTokenUrl = () => process.env.NEXTPFM_OIDC_TOKEN_URL ?? `${oidcIssuer().replace("localhost", "127.0.0.1")}/protocol/openid-connect/token`
export const oidcLogoutUrl = () => process.env.NEXTPFM_OIDC_LOGOUT_URL ?? `${oidcIssuer().replace("localhost", "127.0.0.1")}/protocol/openid-connect/logout`
export const oidcClientId = () => process.env.NEXTPFM_OIDC_CLIENT_ID ?? "nextpfm-api"
// Browser-facing endpoint, so it uses the public issuer rather than the internal token URL.
export const oidcAuthorizeUrl = () => process.env.NEXTPFM_OIDC_AUTHORIZE_URL ?? `${oidcIssuer().replace(/\/$/, "")}/protocol/openid-connect/auth`
export const passwordLoginEnabled = () => process.env.NEXTPFM_PASSWORD_LOGIN_ENABLED === "true"

export function appOrigin(request: Request): string {
  const configured = process.env.NEXTPFM_PUBLIC_URL?.trim().replace(/\/$/, "")
  if (configured) return configured
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim()
  return forwardedHost ? `${forwardedProto || new URL(request.url).protocol.replace(":", "")}://${forwardedHost}` : new URL(request.url).origin
}
export const oidcRedirectUri = (request: Request) => `${appOrigin(request)}/api/auth/callback`

export type TokenResponse = { access_token: string; refresh_token: string; expires_in: number; refresh_expires_in?: number; token_type: string; id_token?: string }

export class PasswordAuthenticationError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}

export function decodeAccessClaims(token: string): { preferred_username?: string; organization_name?: string } {
  try { return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) } catch { return {} }
}
export function decodeIdTokenClaims(token: string): { nonce?: string; iss?: string; aud?: string | string[] } {
  try { return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) } catch { return {} }
}

export function randomUrlSafe(byteLength = 32): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(byteLength))).toString("base64url")
}
export async function pkceChallenge(verifier: string): Promise<string> {
  return Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))).toString("base64url")
}

function clientCredentials(body: URLSearchParams): URLSearchParams {
  const secret = process.env.NEXTPFM_OIDC_CLIENT_SECRET
  if (secret) body.set("client_secret", secret)
  return body
}

export async function exchangeAuthorizationCode(code: string, codeVerifier: string, redirectUri: string): Promise<TokenResponse> {
  const body = clientCredentials(new URLSearchParams({ grant_type: "authorization_code", client_id: oidcClientId(), code, code_verifier: codeVerifier, redirect_uri: redirectUri }))
  let response: Response
  try {
    response = await fetch(oidcTokenUrl(), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" })
  } catch { throw new PasswordAuthenticationError(503, "Authentication service is unavailable.") }
  if (!response.ok) throw new PasswordAuthenticationError(response.status, "Sign in could not be completed.")
  return response.json() as Promise<TokenResponse>
}

export async function revokeSession(refreshToken: string): Promise<void> {
  const body = clientCredentials(new URLSearchParams({ client_id: oidcClientId(), refresh_token: refreshToken }))
  await fetch(oidcLogoutUrl(), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" }).catch(() => undefined)
}

export async function exchangePassword(username: string, password: string): Promise<TokenResponse> {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl()}/api/v1/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    })
  } catch { throw new PasswordAuthenticationError(503, "Authentication service is unavailable.") }
  const data = await response.json().catch(() => null) as { detail?: unknown } | TokenResponse | null
  if (!response.ok) {
    const detail = data && "detail" in data && typeof data.detail === "string" ? data.detail : "Sign in failed."
    throw new PasswordAuthenticationError(response.status, detail)
  }
  return data as TokenResponse
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse | null> {
  const body = clientCredentials(new URLSearchParams({ grant_type: "refresh_token", client_id: oidcClientId(), refresh_token: refreshToken }))
  try {
    const response = await fetch(oidcTokenUrl(), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" })
    return response.ok ? response.json() : null
  } catch { return null }
}

export async function resolveApplicationRole(accessToken: string, deviceId: string): Promise<AppRole> {
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/json", "X-Device-ID": deviceId }
  const admin = await fetch(`${apiBaseUrl()}/api/v1/admin/users`, { headers, cache: "no-store" })
  if (admin.ok) return "admin"
  if (admin.status !== 403) throw new Error("The backend could not authorize this identity.")
  const audit = await fetch(`${apiBaseUrl()}/api/v1/admin/audit-events?limit=1`, { headers, cache: "no-store" })
  if (audit.ok) return "auditor"
  if (audit.status !== 403) throw new Error("The backend could not authorize this identity.")
  const usage = await fetch(`${apiBaseUrl()}/api/v1/me/usage`, { headers, cache: "no-store" })
  if (!usage.ok) throw new Error("This identity is not authorized for the application.")
  return "user"
}
