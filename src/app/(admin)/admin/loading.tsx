export default function Loading() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto animate-pulse">
        {/* Encabezado */}
        <div className="mb-8 border-b border-border pb-4">
          <div className="h-8 w-64 bg-border rounded" />
          <div className="h-4 w-48 bg-border rounded mt-2" />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-4 h-28" />
          ))}
        </div>

        {/* Buscador skeleton */}
        <div className="h-10 bg-card rounded-md border border-border mb-4" />

        {/* Tabla skeleton */}
        <div className="bg-card rounded-lg border border-border overflow-hidden mb-10">
          <div className="h-10 bg-secondary" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 border-t border-border" />
          ))}
        </div>
      </div>
    </main>
  )
}
