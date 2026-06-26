"use client"

import { useRouter } from "next/navigation"

export default function BotonVolver() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="text-sm text-primary hover:underline transition-colors"
    >
      ← Volver
    </button>
  )
}
