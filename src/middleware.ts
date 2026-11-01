import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session"
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, process.env.NEXTPFM_SESSION_SECRET)
  if (pathname.startsWith("/account") || pathname.startsWith("/chat")) {
    if (session) return NextResponse.next()
    const loginUrl = new URL("/admin/login", request.url); loginUrl.searchParams.set("next", `${pathname}${search}`); return NextResponse.redirect(loginUrl)
  }
  if (pathname === "/admin/login") {
    if (session?.role === "admin") return NextResponse.redirect(new URL("/admin", request.url))
    if (session?.role === "auditor") return NextResponse.redirect(new URL("/admin/audit", request.url))
    // Signing in happens on the shared Keycloak page; this page only shows sign-in errors and notices.
    const params = request.nextUrl.searchParams
    if (params.has("error") || params.has("passwordChanged")) return NextResponse.next()
    const signIn = new URL("/api/auth/login", request.url)
    const next = params.get("next"); if (next) signIn.searchParams.set("next", next)
    return NextResponse.redirect(signIn)
  }
  if (!session || !["admin", "auditor"].includes(session.role)) {
    const loginUrl = new URL("/admin/login", request.url); loginUrl.searchParams.set("next", `${pathname}${search}`); return NextResponse.redirect(loginUrl)
  }
  if (session.role === "auditor" && pathname !== "/admin/audit") return NextResponse.redirect(new URL("/admin/audit", request.url))
  return NextResponse.next()
}
export const config = { matcher: ["/admin/:path*", "/account/:path*", "/chat/:path*", "/chat"] }
