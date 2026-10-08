import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, SESSION_COOKIE, secureCookie } from "@/lib/auth/session"
import { oidcClientId, oidcLogoutUrl } from "@/lib/auth/oidc"
export async function POST() {
  const refreshToken = cookies().get(REFRESH_TOKEN_COOKIE)?.value
  if (refreshToken) {
    const body = new URLSearchParams({ client_id: oidcClientId(), refresh_token: refreshToken }); const secret = process.env.NEXTPFM_OIDC_CLIENT_SECRET
    if (secret) body.set("client_secret", secret)
    await fetch(oidcLogoutUrl(), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }).catch(() => undefined)
  }
  for (const name of [SESSION_COOKIE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]) cookies().set(name, "", { httpOnly: true, secure: secureCookie(), sameSite: "lax", path: "/", maxAge: 0 })
  return NextResponse.json({ authenticated: false })
}
