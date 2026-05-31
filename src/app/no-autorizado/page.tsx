import Link from "next/link"

export default function NoAutorizadoPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <p className="text-8xl font-bold text-primary mb-4">403</p>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Sin permisos
        </h1>
        <p className="text-muted mb-8">
          Tu cuenta no tiene acceso a esta sección.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}