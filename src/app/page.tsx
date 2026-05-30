import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-lg w-full text-center space-y-8">

        {/* Logo / nombre */}
        <div className="space-y-2">
          <p className="text-sm font-mono uppercase tracking-widest text-muted">♪ Groovy Music Store</p>
          <h1 className="text-5xl font-bold text-foreground leading-tight">
            Groovy<br />Payments
          </h1>
          <div className="h-1 w-16 bg-primary mx-auto rounded-full mt-4" />
        </div>

        {/* Descripción */}
        <p className="text-muted text-base leading-relaxed">
          Plataforma de pagos segura de Groovy Music Store.<br />
          Procesamos y gestionamos todos los pagos del marketplace.
        </p>

        {/* CTA */}
        <Link
          href="/admin"
          className="inline-block px-6 py-3 bg-primary text-white text-sm font-semibold rounded-md hover:opacity-85 transition-opacity"
        >
          Panel de administración →
        </Link>

      </div>
    </main>
  )
}
