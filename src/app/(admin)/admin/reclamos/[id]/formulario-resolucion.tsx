"use client"

import { useState } from "react"
import { resolverReclamo } from "./actions"

type Decision = "" | "REEMBOLSO_TOTAL" | "REEMBOLSO_PARCIAL" | "RECHAZAR"

const formatCurrency = (value: number) =>
  value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })

export default function FormularioResolucion({
  reclamoId,
  transaccionId,
  montoTotal,
}: {
  reclamoId: string
  transaccionId: string
  montoTotal: number
}) {
  const [decision, setDecision] = useState<Decision>("")
  const [monto, setMonto] = useState("")

  const decisionTotalId = "decision-reembolso-total"
  const decisionParcialId = "decision-reembolso-parcial"
  const decisionRechazarId = "decision-rechazar-reclamo"
  const montoInputId = "monto-reembolso-parcial"

  return (
    <section className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Resolver Reclamo</h2>

      <form action={resolverReclamo} className="space-y-5">
        <input type="hidden" name="reclamoId"     value={reclamoId} />
        <input type="hidden" name="transaccionId" value={transaccionId} />
        <input type="hidden" name="montoTotal"    value={montoTotal} />

        <fieldset className="space-y-3">
          <legend className="text-sm text-muted mb-2">Decisión</legend>

          <label htmlFor={decisionTotalId} className="flex items-center gap-3 cursor-pointer">
            <input
              id={decisionTotalId}
              type="radio"
              name="decision"
              value="REEMBOLSO_TOTAL"
              checked={decision === "REEMBOLSO_TOTAL"}
              onChange={() => setDecision("REEMBOLSO_TOTAL")}
              className="accent-primary"
            />
            <span className="text-sm text-foreground">
              Reembolso total ({formatCurrency(montoTotal)})
            </span>
          </label>

          <label htmlFor={decisionParcialId} className="flex items-center gap-3 cursor-pointer">
            <input
              id={decisionParcialId}
              type="radio"
              name="decision"
              value="REEMBOLSO_PARCIAL"
              checked={decision === "REEMBOLSO_PARCIAL"}
              onChange={() => setDecision("REEMBOLSO_PARCIAL")}
              className="accent-primary"
            />
            <span className="text-sm text-foreground">Reembolso parcial</span>
          </label>

          <label htmlFor={decisionRechazarId} className="flex items-center gap-3 cursor-pointer">
            <input
              id={decisionRechazarId}
              type="radio"
              name="decision"
              value="RECHAZAR"
              checked={decision === "RECHAZAR"}
              onChange={() => setDecision("RECHAZAR")}
              className="accent-primary"
            />
            <span className="text-sm text-foreground">Rechazar reclamo</span>
          </label>
        </fieldset>

        {decision === "REEMBOLSO_PARCIAL" && (
          <div>
            <label htmlFor={montoInputId} className="block text-sm text-muted mb-1">
              Monto a reembolsar (ARS)
            </label>
            <input
              id={montoInputId}
              type="number"
              name="monto"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              min="0.01"
              max={montoTotal}
              step="0.01"
              required
              placeholder="0.00"
              className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={decision === ""}
          className="px-4 py-2 rounded-md text-sm font-semibold bg-primary text-white hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirmar resolución
        </button>
      </form>
    </section>
  )
}
