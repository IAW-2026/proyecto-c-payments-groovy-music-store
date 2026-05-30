"use client"

import { useEffect } from "react"
import Link from "next/link"

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error("Error capturado:", error)
  }, [error])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <p className="text-8xl font-bold text-primary mb-4">500</p>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Algo salió mal
        </h1>
        <p className="text-muted mb-8">
          Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-md border border-border bg-card text-foreground text-sm font-medium hover:bg-card/80 transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}