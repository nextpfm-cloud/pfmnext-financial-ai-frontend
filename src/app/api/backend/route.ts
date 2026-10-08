import { NextResponse } from "next/server"
export function GET() { return NextResponse.json({ detail: "Specify a backend API resource." }, { status: 404 }) }
