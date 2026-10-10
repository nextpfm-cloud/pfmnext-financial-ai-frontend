import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ACCESS_TOKEN_COOKIE, DEVICE_ID_COOKIE, REFRESH_TOKEN_COOKIE, SESSION_COOKIE, secureCookie } from "@/lib/auth/session"
import { apiBaseUrl, refreshTokens } from "@/lib/auth/oidc"
async function requestBackend(path: string, init: RequestInit, accessToken?: string): Promise<Response> {
  const headers = new Headers(init.headers); headers.set("Accept", "application/json")
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
  const deviceId = cookies().get(DEVICE_ID_COOKIE)?.value
  if (deviceId) headers.set("X-Device-ID", deviceId)
  return fetch(`${apiBaseUrl()}${path}`, { ...init, headers, cache: "no-store" })
}
export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let accessToken = cookies().get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = cookies().get(REFRESH_TOKEN_COOKIE)?.value
  // The access token cookie expires with the token. Without it the backend would treat the request
  // as an anonymous guest (403 on admin routes instead of 401), so renew it before calling.
  let response = accessToken || !refreshToken ? await requestBackend(path, init, accessToken) : null
  if (response && (response.status !== 401 || !refreshToken)) return response
  const refreshed = refreshToken ? await refreshTokens(refreshToken) : null
  const options = { httpOnly: true, secure: secureCookie(), sameSite: "lax" as const, path: "/" }
  if (refreshed === "rejected") {
    // The sign-in session is over: drop the application session too, so the UI stops presenting a signed-in user.
    for (const name of [SESSION_COOKIE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]) cookies().set(name, "", { ...options, maxAge: 0 })
    return response ?? requestBackend(path, init)
  }
  if (!refreshed) return response ?? NextResponse.json({ detail: "The sign-in service is unavailable. Try again shortly." }, { status: 503 })
  accessToken = refreshed.access_token
  cookies().set(ACCESS_TOKEN_COOKIE, accessToken, { ...options, maxAge: refreshed.expires_in })
  cookies().set(REFRESH_TOKEN_COOKIE, refreshed.refresh_token, { ...options, maxAge: refreshed.refresh_expires_in ?? 60 * 60 * 10 })
  return requestBackend(path, init, accessToken)
}
export async function proxyBackend(request: Request, path: string): Promise<NextResponse> {
  const headers = new Headers(request.headers)
  for (const name of ["host", "origin", "referer", "cookie", "authorization", "content-length", "connection", "transfer-encoding"]) headers.delete(name)
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer()
  try {
    const backend = await backendFetch(path, { method: request.method, headers, body })
    const responseHeaders = new Headers()
    for (const key of ["content-type", "ratelimit-limit", "ratelimit-remaining", "ratelimit-reset", "retry-after", "x-request-id", "idempotent-replayed", "cache-control", "pragma"]) { const value = backend.headers.get(key); if (value) responseHeaders.set(key, value) }
    const responseBody = [204, 205, 304].includes(backend.status) ? null : backend.body
    return new NextResponse(responseBody, { status: backend.status, headers: responseHeaders })
  } catch { return NextResponse.json({ detail: "The backend service is unavailable." }, { status: 502 }) }
}
