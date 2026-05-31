"use client"

import { useState } from "react"
import Link from "next/link"
import { getLabelMotivo } from "@/lib/motivos-reclamo"

type Reclamo = {
  id: string
  transaccion_id: string
  motivo: string
  estado: string
  fecha_apertura: Date | string
  transaccion: { buyer_id: string; seller_id: string }
}

type Campo = "id" | "transaccion_id" | "motivo" | "estado" | "fecha_apertura"
type Dir = "asc" | "desc"

const COLUMNAS: { label: string; campo: Campo }[] = [
  { label: "ID",             campo: "id" },
  { label: "Transacción",    campo: "transaccion_id" },
  { label: "Motivo",         campo: "motivo" },
  { label: "Estado",         campo: "estado" },
  { label: "Fecha Apertura", campo: "fecha_apertura" },
]

function comparar(a: Reclamo, b: Reclamo, campo: Campo, dir: Dir): number {
  const va = a[campo]
  const vb = b[campo]
  let resultado = 0
  if (campo === "fecha_apertura") {
    resultado = new Date(va as string).getTime() - new Date(vb as string).getTime()
  } else if (typeof va === "number" && typeof vb === "number") {
    resultado = va - vb
  } else {
    resultado = String(va).localeCompare(String(vb))
  }
  return dir === "asc" ? resultado : -resultado
}

export default function TablaAdminReclamos({
  reclamos,
  nombres,
}: {
  reclamos: Reclamo[]
  nombres: Record<string, string>
}) {
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
    <div className="bg-card rounded-lg border border-border overflow-visible">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary text-white">
            {COLUMNAS.map(({ label, campo }) => {
              const isActive = sortCampo === campo
              const icon = !isActive ? "↕" : sortDir === "desc" ? "↓" : "↑"
              return (
                <th key={campo} className="p-3 text-left">
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
            <th className="p-3 text-left">ID Buyer</th>
            <th className="p-3 text-left">ID Seller</th>
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-4 text-center text-muted">
                No hay reclamos abiertos.
              </td>
            </tr>
          ) : (
            filas.map((r, i) => (
              <tr key={r.id} className={`group ${i % 2 === 0 ? "bg-card" : "bg-background"} hover:bg-primary/15`}>
                <td className="p-3 text-muted font-mono text-xs">#{r.id}</td>
                <td className="p-3 text-muted font-mono text-xs">#{r.transaccion_id}</td>
                <td className="p-3 text-foreground max-w-[200px] truncate" title={getLabelMotivo(r.motivo)}>{getLabelMotivo(r.motivo)}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary text-white">
                    {r.estado}
                  </span>
                </td>
                <td className="p-3 text-muted">{new Date(r.fecha_apertura).toLocaleDateString("es-AR")}</td>
                <td className="p-3 text-foreground text-xs">
                  {nombres[r.transaccion.buyer_id] ?? <span className="text-muted">—</span>}
                  <span className="block font-mono text-[10px] text-muted">{r.transaccion.buyer_id}</span>
                </td>
                <td className="p-3 pr-8 min-w-[150px] text-foreground text-xs relative">
                  {nombres[r.transaccion.seller_id] ?? <span className="text-muted">—</span>}
                  <span className="block font-mono text-[10px] text-muted">{r.transaccion.seller_id}</span>
                  {r.estado === "abierto" && (
                    <Link
                      href={`/admin/reclamos/${r.id}`}
                      className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-10 px-3 py-1 rounded text-xs font-semibold bg-primary text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                    >
                      →
                    </Link>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
