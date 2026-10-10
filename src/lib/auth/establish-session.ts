import { cookies } from "next/headers"
import { ACCESS_TOKEN_COOKIE, DEVICE_ID_COOKIE, REFRESH_TOKEN_COOKIE, SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, secureCookie, type AppRole } from "@/lib/auth/session"
import { decodeAccessClaims, resolveApplicationRole, type TokenResponse } from "@/lib/auth/oidc"

export class SessionConfigurationError extends Error {}

export type EstablishedSession = { username: string; organization?: string; role: AppRole }

export async function establishSession(tokens: TokenResponse, fallbackUsername?: string): Promise<EstablishedSession> {
  const secret = process.env.NEXTPFM_SESSION_SECRET
  if (!secret || secret.length < 32) throw new SessionConfigurationError("Session security is not configured.")
  const deviceId = cookies().get(DEVICE_ID_COOKIE)?.value ?? crypto.randomUUID()
  const role = await resolveApplicationRole(tokens.access_token, deviceId)
  const claims = decodeAccessClaims(tokens.access_token)
  const username = claims.preferred_username ?? fallbackUsername ?? ""
  const session = await createSessionToken({ username, organization: claims.organization_name, role }, secret)
  const options = { httpOnly: true, secure: secureCookie(), sameSite: "lax" as const, path: "/" }
  cookies().set(ACCESS_TOKEN_COOKIE, tokens.access_token, { ...options, maxAge: tokens.expires_in })
  cookies().set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, { ...options, maxAge: tokens.refresh_expires_in ?? SESSION_TTL_SECONDS })
  cookies().set(SESSION_COOKIE, session, { ...options, maxAge: SESSION_TTL_SECONDS })
  if (!cookies().get(DEVICE_ID_COOKIE)) cookies().set(DEVICE_ID_COOKIE, deviceId, { ...options, maxAge: 60 * 60 * 24 * 365 })
  return { username, organization: claims.organization_name, role }
}

export function safeRelativePath(value: string | null | undefined): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : null
}

export function postLoginDestination(role: AppRole, requested?: string | null): string {
  const safeRequested = safeRelativePath(requested)
  if (safeRequested?.startsWith("/account")) return safeRequested
  if (role === "admin") return safeRequested?.startsWith("/admin") ? safeRequested : "/admin"
  return role === "auditor" ? "/admin/audit" : "/chat"
}
