import { proxyBackend } from "@/lib/server/backend"
export async function GET(request: Request, { params }: { params: { documentId: string } }) { return proxyBackend(request, `/api/v1/documents/${encodeURIComponent(params.documentId)}/chunks`) }
