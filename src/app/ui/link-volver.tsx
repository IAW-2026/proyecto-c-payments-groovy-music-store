"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

const CLASES = "text-sm text-primary hover:underline transition-colors"

/**
 * Link de "volver" unificado.
 * - Con `href`: navega a esa ruta.
 * - Sin `href`: vuelve a la página anterior (router.back()).
 */
export default function LinkVolver({
  href,
  label = "Volver",
}: {
  href?: string
  label?: string
}) {
  const router = useRouter()

  if (href) {
    return (
      <Link href={href} className={CLASES}>
        ← {label}
      </Link>
    )
  }

  return (
    <button type="button" onClick={() => router.back()} className={CLASES}>
      ← {label}
    </button>
  )
}
