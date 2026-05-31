export default function Loading() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto animate-pulse">

        <div className="mb-8 border-b border-border pb-4 flex items-center justify-between">
          <div>
            <div className="h-8 w-36 bg-border rounded" />
            <div className="h-4 w-52 bg-border rounded mt-2" />
          </div>
          <div className="h-4 w-28 bg-border rounded" />
        </div>

        <div className="h-4 w-40 bg-border rounded mb-4" />

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="h-10 bg-secondary" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 border-t border-border" />
          ))}
        </div>
      </div>
    </main>
  )
}
