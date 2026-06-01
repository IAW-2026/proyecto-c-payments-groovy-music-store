"use client"

import { useActionState } from "react"
import { acreditarTransaccion, type AcreditarState } from "./actions"

export default function BotonAcreditar({ transaccionId }: { transaccionId: string }) {
  const [state, formAction, pending] = useActionState<AcreditarState, FormData>(
    acreditarTransaccion,
    null,
  )

  return (
    <form action={formAction} className="mb-6">
      <input type="hidden" name="transaccionId" value={transaccionId} />
      <button
        type="submit"
        disabled={pending}
        className="block w-full text-center bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Acreditando..." : "Acreditar monto al vendedor"}
      </button>
      {state && (
        <p className={`mt-3 text-sm ${state.ok ? "text-foreground" : "text-red-600"}`}>
          {state.message}
        </p>
      )}
    </form>
  )
}
