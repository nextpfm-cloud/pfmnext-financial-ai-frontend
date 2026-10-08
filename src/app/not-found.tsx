import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="btn btn-primary">
          Return to Home
        </Link>
      </div>
    </div>
  )
}