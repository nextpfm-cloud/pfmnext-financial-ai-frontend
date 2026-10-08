import { proxyBackend } from "@/lib/server/backend"
type Context = { params: { path: string[] } }
const target = (request: Request, path: string[]) => `/api/v1/${path.map(encodeURIComponent).join("/")}${new URL(request.url).search}`
export async function GET(request: Request, { params }: Context) { return proxyBackend(request, target(request, params.path)) }
export async function POST(request: Request, { params }: Context) { return proxyBackend(request, target(request, params.path)) }
export async function PUT(request: Request, { params }: Context) { return proxyBackend(request, target(request, params.path)) }
export async function PATCH(request: Request, { params }: Context) { return proxyBackend(request, target(request, params.path)) }
export async function DELETE(request: Request, { params }: Context) { return proxyBackend(request, target(request, params.path)) }
