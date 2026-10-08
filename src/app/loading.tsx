export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}