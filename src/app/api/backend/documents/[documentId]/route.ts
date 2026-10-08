import { proxyBackend } from "@/lib/server/backend"
type Context = { params: { documentId: string } }
export async function GET(request: Request, { params }: Context) { return proxyBackend(request, `/api/v1/documents/${encodeURIComponent(params.documentId)}`) }
export async function PATCH(request: Request, { params }: Context) { return proxyBackend(request, `/api/v1/documents/${encodeURIComponent(params.documentId)}`) }
export async function DELETE(request: Request, { params }: Context) { return proxyBackend(request, `/api/v1/documents/${encodeURIComponent(params.documentId)}`) }
