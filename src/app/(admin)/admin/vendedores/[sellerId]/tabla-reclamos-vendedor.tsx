"use client"

import { useState } from "react"
import { getLabelMotivo } from "@/lib/motivos-reclamo"

type Reclamo = {
  id: string
  transaccion_id: string
  motivo: string
  estado: string
  fecha_apertura: Date | string
  monto_reembolso: number | null
}

type Campo = keyof Reclamo
type Dir = "asc" | "desc"

const COLUMNAS: { label: string; campo: Campo }[] = [
  { label: "ID",             campo: "id" },
  { label: "Transacción",    campo: "transaccion_id" },
  { label: "Motivo",         campo: "motivo" },
  { label: "Estado",         campo: "estado" },
  { label: "Fecha Apertura", campo: "fecha_apertura" },
  { label: "Reembolso",      campo: "monto_reembolso" },
]

function formatCurrency(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
}

// Valor normalizado para comparar: fecha→timestamp, motivo→label legible,
// reembolso nulo→0, resto→string.
function valorComparable(r: Reclamo, campo: Campo): string | number {
  switch (campo) {
    case "fecha_apertura":  return new Date(r.fecha_apertura).getTime()
    case "monto_reembolso": return r.monto_reembolso ?? 0
    case "motivo":          return getLabelMotivo(r.motivo)
    default:                return String(r[campo])
  }
}

function comparar(a: Reclamo, b: Reclamo, campo: Campo, dir: Dir): number {
  const va = valorComparable(a, campo)
  const vb = valorComparable(b, campo)
  let resultado = 0
  if (typeof va === "number" && typeof vb === "number") {
    resultado = va - vb
  } else {
    resultado = String(va).localeCompare(String(vb))
  }
  return dir === "asc" ? resultado : -resultado
}

export default function TablaReclamosVendedor({ reclamos }: { reclamos: Reclamo[] }) {
  const [sortCampo, setSortCampo] = useState<Campo | null>(null)
  const [sortDir, setSortDir] = useState<Dir>("desc")

  function handleSort(campo: Campo) {
    if (sortCampo !== campo) {
      setSortCampo(campo)
      setSortDir("desc")
    } else if (sortDir === "desc") {
      setSortDir("asc")
    } else {
      setSortCampo(null)
    }
  }

  const filas = sortCampo
    ? [...reclamos].sort((a, b) => comparar(a, b, sortCampo, sortDir))
    : reclamos

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm text-center">
        <thead>
          <tr className="bg-secondary text-white">
            {COLUMNAS.map(({ label, campo }) => {
              const isActive = sortCampo === campo
              const icon = !isActive ? "↕" : sortDir === "desc" ? "↓" : "↑"
              return (
                <th key={campo} scope="col" className="p-3">
                  <button
                    type="button"
                    onClick={() => handleSort(campo)}
                    className={`inline-flex items-center gap-1 whitespace-nowrap transition-opacity hover:opacity-75 ${
                      isActive ? "text-primary" : ""
                    }`}
                  >
                    {label}
                    <span className="text-[10px] opacity-60">{icon}</span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-4 text-center text-muted">
                Sin reclamos asociados.
              </td>
            </tr>
          ) : (
            filas.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? "bg-card" : "bg-background"}>
                <td className="p-3 font-mono text-xs text-muted">#{r.id}</td>
                <td className="p-3 font-mono text-xs text-muted">#{r.transaccion_id}</td>
                <td className="p-3 text-foreground">{getLabelMotivo(r.motivo)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    r.estado === "abierto"  ? "bg-primary text-white" :
                    r.estado === "resuelto" ? "bg-muted text-white"   :
                    "bg-border text-foreground"
                  }`}>
                    {r.estado}
                  </span>
                </td>
                <td className="p-3 text-muted">{new Date(r.fecha_apertura).toLocaleDateString("es-AR")}</td>
                <td className="p-3 text-foreground">
                  {r.monto_reembolso != null && r.monto_reembolso > 0
                    ? formatCurrency(r.monto_reembolso)
                    : <span className="text-muted">—</span>}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
