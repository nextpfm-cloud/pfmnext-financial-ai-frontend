import { proxyBackend } from "@/lib/server/backend"
export async function GET(request: Request) { return proxyBackend(request, "/api/v1/documents/categories") }
