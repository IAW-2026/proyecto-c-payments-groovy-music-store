"use client"

import { useActionState } from "react"
import { acreditarRetenidos, type AcreditarRetenidosState } from "./actions"

export default function BotonAcreditarRetenidos({ sellerId }: { sellerId: string }) {
  const [state, formAction, pending] = useActionState<AcreditarRetenidosState, FormData>(
    acreditarRetenidos,
    null,
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="sellerId" value={sellerId} />
      <button
        type="submit"
        disabled={pending}
        className="block w-full text-center bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Acreditando..." : "Acreditar montos retenidos"}
      </button>
      {state && (
        <p className={`mt-3 text-sm ${state.ok ? "text-foreground" : "text-red-600"}`}>
          {state.message}
        </p>
      )}
    </form>
  )
}
