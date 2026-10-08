import { proxyBackend } from "@/lib/server/backend"
export async function GET(request: Request) { const query = new URL(request.url).search; return proxyBackend(request, `/api/v1/documents${query}`) }
export async function POST(request: Request) { return proxyBackend(request, "/api/v1/documents/upload") }
