import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, SESSION_COOKIE, secureCookie } from "@/lib/auth/session"
import { revokeSession } from "@/lib/auth/oidc"
export async function POST() {
  const refreshToken = cookies().get(REFRESH_TOKEN_COOKIE)?.value
  if (refreshToken) await revokeSession(refreshToken)
  for (const name of [SESSION_COOKIE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]) cookies().set(name, "", { httpOnly: true, secure: secureCookie(), sameSite: "lax", path: "/", maxAge: 0 })
  return NextResponse.json({ authenticated: false })
}
