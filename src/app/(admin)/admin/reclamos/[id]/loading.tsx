export default function Loading() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto animate-pulse">

        {/* Header */}
        <div className="mb-8 border-b border-border pb-4 flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-border rounded" />
            <div className="h-4 w-40 bg-border rounded mt-2" />
          </div>
          <div className="h-4 w-20 bg-border rounded" />
        </div>

        {/* Detalle del reclamo */}
        <div className="mb-6 bg-card rounded-lg border border-border p-6">
          <div className="h-5 w-40 bg-border rounded mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 w-36 bg-border rounded shrink-0" />
                <div className="h-4 w-48 bg-border rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Transacción relacionada */}
        <div className="mb-6 bg-card rounded-lg border border-border p-6">
          <div className="h-5 w-48 bg-border rounded mb-4" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 w-36 bg-border rounded shrink-0" />
                <div className="h-4 w-56 bg-border rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Formulario resolución */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="h-5 w-36 bg-border rounded mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-5 w-48 bg-border rounded" />
            ))}
          </div>
          <div className="h-9 w-40 bg-border rounded mt-5" />
        </div>

      </div>
    </main>
  )
}
