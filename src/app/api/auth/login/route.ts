import { NextResponse } from "next/server"
import { OIDC_TRANSACTION_COOKIE, OIDC_TRANSACTION_TTL_SECONDS, createOidcTransaction, secureCookie } from "@/lib/auth/session"
import { PasswordAuthenticationError, exchangePassword, oidcAuthorizeUrl, oidcClientId, oidcRedirectUri, passwordLoginEnabled, pkceChallenge, randomUrlSafe } from "@/lib/auth/oidc"
import { SessionConfigurationError, establishSession, safeRelativePath } from "@/lib/auth/establish-session"

export const dynamic = "force-dynamic"

// Starts the OIDC authorization code flow with PKCE (S256).
export async function GET(request: Request) {
  const responseHeaders = { "Cache-Control": "no-store", Pragma: "no-cache" }
  const secret = process.env.NEXTPFM_SESSION_SECRET
  if (!secret || secret.length < 32) return NextResponse.json({ error: "Session security is not configured." }, { status: 503, headers: responseHeaders })
  const params = new URL(request.url).searchParams
  const action = params.get("action") === "update-password" ? "UPDATE_PASSWORD" as const : undefined
  const state = randomUrlSafe(), nonce = randomUrlSafe(), verifier = randomUrlSafe(48)
  const transaction = await createOidcTransaction({ state, nonce, verifier, next: safeRelativePath(params.get("next")) ?? undefined, action }, secret)
  const authorize = new URL(oidcAuthorizeUrl())
  authorize.search = new URLSearchParams({
    client_id: oidcClientId(),
    response_type: "code",
    scope: "openid",
    redirect_uri: oidcRedirectUri(request),
    state,
    nonce,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: "S256",
  }).toString()
  if (action) authorize.searchParams.set("kc_action", action)
  if (params.get("prompt") === "login") authorize.searchParams.set("prompt", "login")
  const response = NextResponse.redirect(authorize, { headers: responseHeaders })
  response.cookies.set(OIDC_TRANSACTION_COOKIE, transaction, { httpOnly: true, secure: secureCookie(), sameSite: "lax", path: "/api/auth", maxAge: OIDC_TRANSACTION_TTL_SECONDS })
  return response
}

// Legacy resource-owner password login. Disabled unless NEXTPFM_PASSWORD_LOGIN_ENABLED=true.
export async function POST(request: Request) {
  const responseHeaders = { "Cache-Control": "no-store", Pragma: "no-cache" }
  if (!passwordLoginEnabled()) return NextResponse.json({ error: "Password sign in is disabled. Use secure sign in." }, { status: 404, headers: responseHeaders })
  const body = await request.json().catch(() => null) as { username?: unknown; password?: unknown } | null
  if (typeof body?.username !== "string" || typeof body.password !== "string" || !body.username.trim() || !body.password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400, headers: responseHeaders })
  }
  if (body.username.length > 255 || body.password.length > 1024) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 400, headers: responseHeaders })
  }
  try {
    const tokens = await exchangePassword(body.username.trim(), body.password)
    const session = await establishSession(tokens, body.username.trim())
    return NextResponse.json({ authenticated: true, ...session }, { headers: responseHeaders })
  } catch (caught) {
    if (caught instanceof SessionConfigurationError) return NextResponse.json({ error: caught.message }, { status: 503, headers: responseHeaders })
    if (caught instanceof PasswordAuthenticationError) return NextResponse.json({ error: caught.message }, { status: caught.status, headers: responseHeaders })
    return NextResponse.json({ error: "Your identity could not be authorized for this application." }, { status: 401, headers: responseHeaders })
  }
}
