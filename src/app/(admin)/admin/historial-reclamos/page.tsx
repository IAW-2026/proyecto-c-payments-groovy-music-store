import { Suspense } from "react"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import Buscador from "@/app/ui/buscador"
import Link from "next/link"
import SortLink from "@/app/ui/sort-link"
import { getLabelMotivo } from "@/lib/motivos-reclamo"
import { getNombresUsuarios } from "@/lib/usuarios"

const ESTADOS_RECLAMO = ["abierto", "cerrado", "resuelto"] as const
const CAMPOS_R = ["id", "transaccion_id", "motivo", "estado", "fecha_apertura"]

type SearchParams = Promise<{
  qReclamo?: string
  buyerReclamo?: string
  sellerReclamo?: string
  estadoReclamo?: string
  sortBy?: string
  sortDir?: string
}>

export default async function HistorialReclamosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { qReclamo = "", buyerReclamo = "", sellerReclamo = "", estadoReclamo = "", sortBy = "", sortDir = "" } = await searchParams

  const where: Prisma.ReclamoWhereInput = {}

  if (qReclamo.trim()) {
    const q = qReclamo.trim()
    where.OR = [
      { id:             { contains: q, mode: "insensitive" } },
      { transaccion_id: { contains: q, mode: "insensitive" } },
    ]
  }
  if (estadoReclamo.trim()) where.estado = estadoReclamo.trim()
  if (buyerReclamo.trim())  where.transaccion = { ...where.transaccion as object, buyer_id:  { contains: buyerReclamo.trim(),  mode: "insensitive" } }
  if (sellerReclamo.trim()) where.transaccion = { ...where.transaccion as object, seller_id: { contains: sellerReclamo.trim(), mode: "insensitive" } }

  const orderBy: Prisma.ReclamoOrderByWithRelationInput = CAMPOS_R.includes(sortBy)
    ? { [sortBy]: sortDir === "asc" ? "asc" : "desc" } as Prisma.ReclamoOrderByWithRelationInput
    : { fecha_apertura: "desc" }

  const baseParams = { qReclamo, buyerReclamo, sellerReclamo, estadoReclamo, sortBy, sortDir } as Record<string, string | undefined>

  const [reclamos, total] = await Promise.all([
    prisma.reclamo.findMany({
      where,
      orderBy,
      include: {
        transaccion: {
          select: { buyer_id: true, seller_id: true, monto_total: true },
        },
      },
    }),
    prisma.reclamo.count({ where }),
  ])

  // Resolver nombres de usuario para los buyer/seller de esta página (fallback al ID).
  const nombres = await getNombresUsuarios(
    reclamos.flatMap((r) => [r.transaccion.buyer_id, r.transaccion.seller_id])
  )

  const hayFiltros = qReclamo || buyerReclamo || sellerReclamo || estadoReclamo

  const formatCurrency = (value: number) =>
    value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 border-b border-border pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Historial de Reclamos
            </h1>
            <p className="text-muted mt-1">
              Todos los reclamos del marketplace.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-primary hover:underline transition-colors"
          >
            ← Volver al Panel
          </Link>
        </div>

        <section>
          <div className="mb-4">
            <Suspense fallback={<div className="h-10 bg-card rounded-md border border-border animate-pulse" />}>
              <Buscador
                params={{
                  query: "qReclamo",
                  buyerId: "buyerReclamo",
                  sellerId: "sellerReclamo",
                  estado: "estadoReclamo",
                }}
                placeholder="Buscar por ID de reclamo o transacción"
                estadoOpciones={ESTADOS_RECLAMO}
              />
            </Suspense>
          </div>

          <p className="text-sm text-muted mb-3">
            {hayFiltros
              ? `${total} resultado${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`
              : `${total} reclamo${total !== 1 ? "s" : ""} en total`}
          </p>

          <div className="bg-card rounded-lg border border-border overflow-visible">
            <table className="w-full min-w-[1200px] text-sm">
              <thead>
                <tr className="bg-secondary text-white">
                  <th className="p-3 text-left"><SortLink label="ID" sortKey="id" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                  <th className="p-3 text-left"><SortLink label="Transacción" sortKey="transaccion_id" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                  <th className="p-3 text-left"><SortLink label="Motivo" sortKey="motivo" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                  <th className="p-3 text-left"><SortLink label="Estado" sortKey="estado" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                  <th className="p-3 text-left">Monto</th>
                  <th className="p-3 text-left"><SortLink label="Fecha Apertura" sortKey="fecha_apertura" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                  <th className="p-3 text-left">ID Buyer</th>
                  <th className="p-3 text-left">ID Seller</th>
                </tr>
              </thead>
              <tbody>
                {reclamos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-muted">
                      {hayFiltros
                        ? "No se encontraron reclamos con esos filtros."
                        : "No hay reclamos todavía."}
                    </td>
                  </tr>
                ) : (
                  reclamos.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`group ${i % 2 === 0 ? "bg-card" : "bg-background"} hover:bg-primary/15`}
                    >
                      <td className="p-3 text-muted font-mono text-xs">#{r.id}</td>
                      <td className="p-3 text-muted font-mono text-xs">#{r.transaccion_id}</td>
                      <td className="p-3 text-foreground max-w-[200px] truncate" title={getLabelMotivo(r.motivo)}>{getLabelMotivo(r.motivo)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          r.estado === "abierto"  ? "bg-primary text-white"   :
                          r.estado === "resuelto" ? "bg-muted text-white"     :
                          "bg-border text-foreground"
                        }`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="p-3 text-foreground">
                        {formatCurrency(r.transaccion.monto_total)}
                      </td>
                      <td className="p-3 text-muted">
                        {new Date(r.fecha_apertura).toLocaleDateString("es-AR")}
                      </td>
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
        </section>
      </div>
    </main>
  )
}
