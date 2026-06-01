"use client"

import { useAuth, SignOutButton } from "@clerk/nextjs"
import Link from "next/link"

export default function NavButtons() {
  const { isSignedIn } = useAuth()

  if (!isSignedIn) return null

  return (
    <div className="flex gap-4">
      <Link
        href="/admin/test-checkout"
        className="px-3 py-1.5 rounded-md bg-background hover:bg-card border border-border text-foreground text-sm font-medium transition-colors"
      >
        Generar pago MP (provisional)
      </Link>
      <Link
        href="/admin"
        className="px-3 py-1.5 rounded-md bg-background hover:bg-card border border-border text-foreground text-sm font-medium transition-colors"
      >
        Ir al Panel
      </Link>
      <SignOutButton redirectUrl="/sign-in">
        <button className="px-3 py-1.5 rounded-md bg-background hover:bg-card border border-border text-foreground text-sm font-medium transition-colors">
          Cerrar sesión
        </button>
      </SignOutButton>
    </div>
  )
}
