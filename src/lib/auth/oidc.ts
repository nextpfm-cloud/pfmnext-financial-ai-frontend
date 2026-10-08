import type { AppRole } from "@/lib/auth/session"

export const apiBaseUrl = () => process.env.NEXTPFM_API_BASE_URL ?? "http://127.0.0.1:10106"
export const oidcIssuer = () => process.env.NEXTPFM_OIDC_ISSUER ?? "http://localhost:8080/realms/nextpfm-dev"
export const oidcTokenUrl = () => process.env.NEXTPFM_OIDC_TOKEN_URL ?? `${oidcIssuer().replace("localhost", "127.0.0.1")}/protocol/openid-connect/token`
export const oidcLogoutUrl = () => process.env.NEXTPFM_OIDC_LOGOUT_URL ?? `${oidcIssuer().replace("localhost", "127.0.0.1")}/protocol/openid-connect/logout`
export const oidcClientId = () => process.env.NEXTPFM_OIDC_CLIENT_ID ?? "nextpfm-api"

export type TokenResponse = { access_token: string; refresh_token: string; expires_in: number; refresh_expires_in?: number; token_type: string }

export class PasswordAuthenticationError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}

export function decodeAccessClaims(token: string): { preferred_username?: string; organization_name?: string } {
  try { return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) } catch { return {} }
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
  const body = new URLSearchParams({ grant_type: "refresh_token", client_id: oidcClientId(), refresh_token: refreshToken })
  const secret = process.env.NEXTPFM_OIDC_CLIENT_SECRET
  if (secret) body.set("client_secret", secret)
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
