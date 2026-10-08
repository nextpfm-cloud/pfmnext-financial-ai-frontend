import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXTPFM_API_BASE_URL}/health`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Backend unhealthy" },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 502 }
    );
  }
}