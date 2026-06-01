import { Suspense } from "react"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import Buscador from "@/app/ui/buscador"
import Paginacion from "@/app/ui/paginacion"
import Link from "next/link"
import SortLink from "@/app/ui/sort-link"
import { getNombresUsuarios } from "@/lib/usuarios"
import { ESTADOS_TRANSACCION } from "@/lib/constants"
const CAMPOS_T = ["id", "order_id", "monto_total", "monto_acreditar", "estado", "fecha", "buyer_id", "seller_id"]

const POR_PAGINA = 50

type SearchParams = {
  query?: string
  estado?: string
  buyerId?: string
  sellerId?: string
  pagina?: string
  sortBy?: string
  sortDir?: string
}

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams

  const query    = sp.query?.trim()    ?? ""
  const estado   = sp.estado?.trim()   ?? ""
  const buyerId  = sp.buyerId?.trim()  ?? ""
  const sellerId = sp.sellerId?.trim() ?? ""
  const pagina   = Math.max(1, parseInt(sp.pagina ?? "1", 10))
  const sortBy   = sp.sortBy  ?? ""
  const sortDir  = sp.sortDir ?? ""

  const where: Prisma.TransaccionWhereInput = {}

  if (query) {
    where.OR = [
      { id:       { contains: query, mode: "insensitive" } },
      { order_id: { contains: query, mode: "insensitive" } },
    ]
  }
  if (estado)   where.estado    = estado
  if (buyerId)  where.buyer_id  = { contains: buyerId,  mode: "insensitive" }
  if (sellerId) where.seller_id = { contains: sellerId, mode: "insensitive" }

  const orderBy: Prisma.TransaccionOrderByWithRelationInput = CAMPOS_T.includes(sortBy)
    ? { [sortBy]: sortDir === "asc" ? "asc" : "desc" } as Prisma.TransaccionOrderByWithRelationInput
    : { fecha: "desc" }

  const baseParams = sp as Record<string, string | undefined>

  const [transacciones, total] = await Promise.all([
    prisma.transaccion.findMany({
      where,
      orderBy,
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.transaccion.count({ where }),
  ])

  // Resolver nombres de usuario para los buyer/seller de esta página (fallback al ID).
  const nombres = await getNombresUsuarios(
    transacciones.flatMap((t) => [t.buyer_id, t.seller_id])
  )

  const hayFiltros = query || estado || buyerId || sellerId
  const tieneMasPaginas = pagina * POR_PAGINA < total

  const formatCurrency = (value: number) =>
    value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 border-b border-border pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Historial de Transacciones
            </h1>
            <p className="text-muted mt-1">
              Registro completo de todas las transacciones del marketplace.
            </p>
          </div>
          <Link href="/admin" className="text-sm text-primary hover:underline transition-colors">
            ← Volver al Panel
          </Link>
        </div>

        <Suspense fallback={<div className="h-10 bg-card rounded-md border border-border animate-pulse mb-4" />}>
          <Buscador
            params={{ query: "query", buyerId: "buyerId", sellerId: "sellerId", estado: "estado" }}
            placeholder="Buscar por número de Transacción u Orden"
            estadoOpciones={ESTADOS_TRANSACCION}
          />
        </Suspense>

        <p className="text-sm text-muted mt-3 mb-3">
          {hayFiltros
            ? `${total} resultado${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`
            : `${total} transacciones en total`}
        </p>

        <div className="bg-card rounded-lg border border-border overflow-visible mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-white">
                <th className="p-3 text-left"><SortLink label="ID" sortKey="id" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                <th className="p-3 text-left"><SortLink label="Order ID" sortKey="order_id" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                <th className="p-3 text-left"><SortLink label="Monto Total" sortKey="monto_total" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                <th className="p-3 text-left"><SortLink label="A Acreditar" sortKey="monto_acreditar" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                <th className="p-3 text-left"><SortLink label="Estado" sortKey="estado" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                <th className="p-3 text-left"><SortLink label="Buyer ID" sortKey="buyer_id" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                <th className="p-3 text-left"><SortLink label="Seller ID" sortKey="seller_id" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                <th className="p-3 text-left"><SortLink label="Fecha" sortKey="fecha" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
              </tr>
            </thead>
            <tbody>
              {transacciones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-muted">
                    {hayFiltros
                      ? "No se encontraron transacciones con esos filtros."
                      : "No hay transacciones todavía."}
                  </td>
                </tr>
              ) : (
                transacciones.map((t, i) => (
                  <tr key={t.id} className={`group ${i % 2 === 0 ? "bg-card" : "bg-background"} hover:bg-primary/15`}>
                    <td className="p-3 text-muted font-mono text-xs">#{t.id}</td>
                    <td className="p-3 text-muted font-mono text-xs">#{t.order_id}</td>
                    <td className="p-3 text-foreground font-medium">{formatCurrency(t.monto_total)}</td>
                    <td className="p-3 text-foreground">{formatCurrency(t.monto_acreditar)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        t.estado === "pagado"      ? "bg-primary text-white"         :
                        t.estado === "acreditado"  ? "bg-muted text-white"           :
                        t.estado === "fallido"     ? "bg-red-100 text-red-700"       :
                        t.estado === "reembolsado" ? "bg-amber-100 text-amber-700"   :
                        "bg-border text-foreground"
                      }`}>
                        {t.estado}
                      </span>
                    </td>
                    <td className="p-3 text-foreground text-xs">
                      {nombres[t.buyer_id] ?? <span className="text-muted">—</span>}
                      <span className="block font-mono text-[10px] text-muted">{t.buyer_id}</span>
                    </td>
                    <td className="p-3 text-foreground text-xs">
                      {nombres[t.seller_id] ?? <span className="text-muted">—</span>}
                      <span className="block font-mono text-[10px] text-muted">{t.seller_id}</span>
                    </td>
                    <td className="p-3 pr-8 min-w-[160px] text-muted relative">
                      {new Date(t.fecha).toLocaleDateString("es-AR")}
                      <Link
                        href={`/admin/transacciones/${t.id}`}
                        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-10 px-3 py-1 rounded text-xs font-semibold bg-primary text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                      >
                        →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > POR_PAGINA && (
          <Paginacion paginaActual={pagina} tieneMasPaginas={tieneMasPaginas} />
        )}
      </div>
    </main>
  )
}