import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session"
export async function GET() {
  const session = await verifySessionToken(cookies().get(SESSION_COOKIE)?.value, process.env.NEXTPFM_SESSION_SECRET)
  return session ? NextResponse.json({ authenticated: true, ...session }) : NextResponse.json({ authenticated: false }, { status: 401 })
}
