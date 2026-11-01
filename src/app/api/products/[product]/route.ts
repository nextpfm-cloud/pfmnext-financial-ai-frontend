import { NextResponse } from "next/server"
import { PRODUCT_KEYS, type ProductKey } from "@/lib/products"
import { appOrigin } from "@/lib/auth/oidc"

export const dynamic = "force-dynamic"

// Opens another PFMNext product (or "all": the product list) through the portal, which checks
// access and signs the user in there on the same Keycloak session.
export function GET(request: Request, { params }: { params: { product: string } }) {
  const portal = process.env.NEXTPFM_PORTAL_URL?.trim().replace(/\/$/, "")
  if (!portal) return NextResponse.redirect(new URL("/", appOrigin(request)))
  const target = PRODUCT_KEYS.includes(params.product as ProductKey) ? `${portal}/go/${params.product}` : `${portal}/?choose=1`
  return NextResponse.redirect(target, { headers: { "Cache-Control": "no-store" } })
}
