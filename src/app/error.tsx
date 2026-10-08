"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Something Went Wrong</h1>
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try again later.
        </p>
        <button
          onClick={() => {
            reset()
          }}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}