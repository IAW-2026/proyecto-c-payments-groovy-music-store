export default function Loading() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto animate-pulse">

        {/* Header */}
        <div className="mb-8 border-b border-border pb-4 flex items-center justify-between">
          <div>
            <div className="h-8 w-40 bg-card rounded mb-2" />
            <div className="h-4 w-64 bg-card rounded" />
          </div>
          <div className="h-4 w-32 bg-card rounded" />
        </div>

        {/* Balances */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="h-28 bg-card rounded-lg border border-border" />
          <div className="h-28 bg-card rounded-lg border border-border" />
        </div>

        {/* Tabla */}
        <div className="h-10 w-full bg-card rounded-md border border-border mb-4" />
        <div className="h-80 bg-card rounded-lg border border-border" />
      </div>
    </main>
  )
}