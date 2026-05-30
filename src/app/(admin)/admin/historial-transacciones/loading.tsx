export default function Loading() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="mb-8 border-b border-border pb-4">
          <div className="h-4 w-24 bg-border rounded mb-2" />
          <div className="h-8 w-64 bg-border rounded" />
          <div className="h-4 w-48 bg-border rounded mt-2" />
        </div>
        <div className="h-10 bg-card rounded-md border border-border mb-4" />
        <div className="h-4 w-40 bg-border rounded mb-3" />
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="h-10 bg-secondary" />
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 border-t border-border" />
          ))}
        </div>
      </div>
    </main>
  )
}
