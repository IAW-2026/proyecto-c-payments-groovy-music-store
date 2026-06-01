import { confirmarPago } from "@/lib/confirmar-pago"

type SearchParams = {
  payment_id?:         string
  external_reference?: string
  status?:             string
}

export default async function PagoFallidoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp            = await searchParams
  const paymentId     = sp.payment_id
  const transaccionId = sp.external_reference

  if (paymentId && transaccionId) {
    try {
      await confirmarPago(paymentId, transaccionId)
    } catch (err) {
      console.error("confirmarPago desde /pago/fallido:", err)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-card rounded-lg border border-border p-8 text-center">

        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-700 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Pago rechazado
        </h1>
        <p className="text-muted mb-6">
          Tu pago no pudo procesarse. Podés intentarlo de nuevo con otro medio de pago.
        </p>

        {transaccionId && (
          <p className="text-xs text-muted font-mono bg-background rounded-md border border-border px-3 py-2 mb-6">
            Transacción: {transaccionId}
          </p>
        )}

        <a
          href="/"
          className="inline-block px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </main>
  )
}
