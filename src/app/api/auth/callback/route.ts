import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { OIDC_TRANSACTION_COOKIE, constantTimeEqual, readOidcTransaction, secureCookie } from "@/lib/auth/session"
import { PasswordAuthenticationError, appOrigin, decodeIdTokenClaims, exchangeAuthorizationCode, oidcClientId, oidcIssuer, oidcRedirectUri, revokeSession } from "@/lib/auth/oidc"
import { SessionConfigurationError, establishSession, postLoginDestination } from "@/lib/auth/establish-session"

export const dynamic = "force-dynamic"

function redirectTo(request: Request, path: string): NextResponse {
  const response = NextResponse.redirect(new URL(path, appOrigin(request)), { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } })
  response.cookies.set(OIDC_TRANSACTION_COOKIE, "", { httpOnly: true, secure: secureCookie(), sameSite: "lax", path: "/api/auth", maxAge: 0 })
  return response
}
const fail = (request: Request, reason: string) => redirectTo(request, `/admin/login?error=${reason}`)

function validIdToken(idToken: string | undefined, nonce: string): boolean {
  if (!idToken) return false
  const claims = decodeIdTokenClaims(idToken)
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  return typeof claims.nonce === "string" && constantTimeEqual(claims.nonce, nonce)
    && claims.iss === oidcIssuer().replace(/\/$/, "") && audiences.includes(oidcClientId())
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const transaction = await readOidcTransaction(cookies().get(OIDC_TRANSACTION_COOKIE)?.value, process.env.NEXTPFM_SESSION_SECRET)
  const state = params.get("state")
  if (!transaction || !state || !constantTimeEqual(state, transaction.state)) return fail(request, "expired")
  const actionStatus = params.get("kc_action_status")
  const code = params.get("code")
  if (!code) {
    if (transaction.action) return redirectTo(request, `/account?passwordChanged=${actionStatus === "success" ? "1" : "0"}`)
    return fail(request, params.get("error") === "access_denied" ? "denied" : "failed")
  }
  try {
    const tokens = await exchangeAuthorizationCode(code, transaction.verifier, oidcRedirectUri(request))
    if (!validIdToken(tokens.id_token, transaction.nonce)) {
      await revokeSession(tokens.refresh_token)
      return fail(request, "failed")
    }
    const session = await establishSession(tokens)
    if (transaction.action) return redirectTo(request, `/account?passwordChanged=${actionStatus === "success" ? "1" : "0"}`)
    return redirectTo(request, postLoginDestination(session.role, transaction.next))
  } catch (caught) {
    if (caught instanceof SessionConfigurationError) return fail(request, "configuration")
    if (caught instanceof PasswordAuthenticationError) return fail(request, caught.status === 503 ? "unavailable" : "failed")
    // Authenticated with Keycloak but not authorized by this application's backend. Keep the identity
    // session: it is shared with the sibling application, which the user may still be allowed to use.
    return fail(request, "unauthorized")
  }
}
