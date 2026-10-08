import { HealthResponse } from "@/types"

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/backend/health", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`)
  }

  return response.json()
}
