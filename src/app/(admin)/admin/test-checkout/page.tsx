"use client"

import { useState } from "react"

export default function TestCheckoutPage() {
  const [form, setForm] = useState({
    order_id: "ORDER-001",
    buyer_id: "user_test_comprador",
    seller_id: "user_test_vendedor",
    monto_total: "5500",
    costoEnvio: "500",
  })
  const [resultado, setResultado] = useState<{
    transaccion_id: number
    init_point: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const inputIds = {
    order_id: "checkout-order-id",
    buyer_id: "checkout-buyer-id",
    seller_id: "checkout-seller-id",
    monto_total: "checkout-monto-total",
    costoEnvio: "checkout-costo-envio",
  }

  async function handleSubmit() {
    setCargando(true)
    setError(null)
    setResultado(null)

    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: form.order_id,
          buyer_id: form.buyer_id,
          seller_id: form.seller_id,
          monto_total: Number(form.monto_total),
          costoEnvio: Number(form.costoEnvio),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error desconocido")
        return
      }

      setResultado(data)
    } catch (e) {
      setError("Error de red al llamar al endpoint")
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test — Generar pago</h1>

      <div className="flex flex-col gap-4">
        {Object.entries(form).map(([key, value]) => (
          <div key={key} className="flex flex-col gap-1">
            <label htmlFor={inputIds[key as keyof typeof inputIds]} className="text-sm font-medium text-foreground">{key}</label>
            <input
              id={inputIds[key as keyof typeof inputIds]}
              className="border border-border rounded px-3 py-2 bg-card text-foreground"
              value={value}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={cargando}
          className="bg-primary text-white rounded px-4 py-2 font-medium disabled:opacity-50"
        >
          {cargando ? "Generando..." : "Generar link de pago"}
        </button>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {resultado && (
        <div className="mt-6 p-4 bg-card border border-border rounded flex flex-col gap-3">
          <p className="font-medium">✅ Pago generado</p>
          <p className="text-sm">
            <span className="text-muted">Transacción ID:</span>{" "}
            <span className="font-mono font-bold">{resultado.transaccion_id}</span>
          </p>
          
          <a
            href={resultado.init_point}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-white text-center rounded px-4 py-2 font-medium hover:opacity-90"
          >
            Abrir link de pago →
          </a>
          <p className="text-xs text-muted">
            Después de pagar, buscá la transacción {resultado.transaccion_id} en el historial.
          </p>
        </div>
      )}
    </main>
  )
}