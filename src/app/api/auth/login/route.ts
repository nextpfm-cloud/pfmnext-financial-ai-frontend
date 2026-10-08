import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ACCESS_TOKEN_COOKIE, DEVICE_ID_COOKIE, REFRESH_TOKEN_COOKIE, SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, secureCookie } from "@/lib/auth/session"
import { PasswordAuthenticationError, decodeAccessClaims, exchangePassword, resolveApplicationRole } from "@/lib/auth/oidc"

export async function POST(request: Request) {
  const responseHeaders = { "Cache-Control": "no-store", Pragma: "no-cache" }
  const body = await request.json().catch(() => null) as { username?: unknown; password?: unknown } | null
  if (typeof body?.username !== "string" || typeof body.password !== "string" || !body.username.trim() || !body.password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400, headers: responseHeaders })
  }
  if (body.username.length > 255 || body.password.length > 1024) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 400, headers: responseHeaders })
  }
  try {
    const tokens = await exchangePassword(body.username.trim(), body.password)
    const deviceId = cookies().get(DEVICE_ID_COOKIE)?.value ?? crypto.randomUUID()
    const role = await resolveApplicationRole(tokens.access_token, deviceId)
    const claims = decodeAccessClaims(tokens.access_token)
    const secret = process.env.NEXTPFM_SESSION_SECRET
    if (!secret || secret.length < 32) return NextResponse.json({ error: "Session security is not configured." }, { status: 503, headers: responseHeaders })
    const session = await createSessionToken({ username: claims.preferred_username ?? body.username.trim(), organization: claims.organization_name, role }, secret)
    const options = { httpOnly: true, secure: secureCookie(), sameSite: "lax" as const, path: "/" }
    cookies().set(ACCESS_TOKEN_COOKIE, tokens.access_token, { ...options, maxAge: tokens.expires_in })
    cookies().set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, { ...options, maxAge: tokens.refresh_expires_in ?? SESSION_TTL_SECONDS })
    cookies().set(SESSION_COOKIE, session, { ...options, maxAge: SESSION_TTL_SECONDS })
    if (!cookies().get(DEVICE_ID_COOKIE)) cookies().set(DEVICE_ID_COOKIE, deviceId, { ...options, maxAge: 60 * 60 * 24 * 365 })
    return NextResponse.json({ authenticated: true, username: claims.preferred_username ?? body.username.trim(), organization: claims.organization_name, role }, { headers: responseHeaders })
  } catch (caught) {
    if (caught instanceof PasswordAuthenticationError) return NextResponse.json({ error: caught.message }, { status: caught.status, headers: responseHeaders })
    return NextResponse.json({ error: "Your identity could not be authorized for this application." }, { status: 401, headers: responseHeaders })
  }
}
