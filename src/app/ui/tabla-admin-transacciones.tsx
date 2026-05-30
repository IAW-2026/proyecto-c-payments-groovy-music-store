"use client"

import { useState } from "react"

type Transaccion = {
  id: string
  order_id: string
  monto_total: number
  monto_acreditar: number
  estado: string
  fecha: Date | string
  buyer_id: string
  seller_id: string
}

type Campo = keyof Transaccion
type Dir = "asc" | "desc"

const COLUMNAS: { label: string; campo: Campo }[] = [
  { label: "ID",           campo: "id" },
  { label: "Order ID",     campo: "order_id" },
  { label: "Monto Total",  campo: "monto_total" },
  { label: "A Acreditar",  campo: "monto_acreditar" },
  { label: "Estado",       campo: "estado" },
  { label: "Fecha",        campo: "fecha" },
  { label: "ID Buyer",     campo: "buyer_id" },
  { label: "ID Seller",    campo: "seller_id" },
]

function comparar(a: Transaccion, b: Transaccion, campo: Campo, dir: Dir): number {
  const va = a[campo]
  const vb = b[campo]
  let resultado = 0
  if (va instanceof Date || typeof va === "string" && campo === "fecha") {
    resultado = new Date(va).getTime() - new Date(vb as string).getTime()
  } else if (typeof va === "number" && typeof vb === "number") {
    resultado = va - vb
  } else {
    resultado = String(va).localeCompare(String(vb))
  }
  return dir === "asc" ? resultado : -resultado
}

function formatCurrency(value: number) {
  return value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
}

export default function TablaAdminTransacciones({
  transacciones,
  nombres,
}: {
  transacciones: Transaccion[]
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
    ? [...transacciones].sort((a, b) => comparar(a, b, sortCampo, sortDir))
    : transacciones

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
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
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-4 text-center text-muted">
                No hay transacciones todavía.
              </td>
            </tr>
          ) : (
            filas.map((t, i) => (
              <tr key={t.id} className={i % 2 === 0 ? "bg-card" : "bg-background"}>
                <td className="p-3 text-muted font-mono text-xs">#{t.id}</td>
                <td className="p-3 text-muted font-mono text-xs">#{t.order_id}</td>
                <td className="p-3 text-foreground font-medium">{formatCurrency(t.monto_total)}</td>
                <td className="p-3 text-foreground">{formatCurrency(t.monto_acreditar)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    t.estado === "pagado"      ? "bg-primary text-white"       :
                    t.estado === "acreditado"  ? "bg-muted text-white"         :
                    t.estado === "fallido"     ? "bg-red-100 text-red-700"     :
                    t.estado === "reembolsado" ? "bg-amber-100 text-amber-700" :
                    "bg-border text-foreground"
                  }`}>
                    {t.estado}
                  </span>
                </td>
                <td className="p-3 text-muted">{new Date(t.fecha).toLocaleDateString("es-AR")}</td>
                <td className="p-3 text-foreground text-xs">
                  {nombres[t.buyer_id] ?? <span className="text-muted">—</span>}
                  <span className="block font-mono text-[10px] text-muted">{t.buyer_id}</span>
                </td>
                <td className="p-3 text-foreground text-xs">
                  {nombres[t.seller_id] ?? <span className="text-muted">—</span>}
                  <span className="block font-mono text-[10px] text-muted">{t.seller_id}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
