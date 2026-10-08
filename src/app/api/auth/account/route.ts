import { NextResponse } from "next/server"
import { oidcIssuer } from "@/lib/auth/oidc"

export async function GET() {
  return NextResponse.redirect(`${oidcIssuer().replace(/\/$/, "")}/account/`)
}
