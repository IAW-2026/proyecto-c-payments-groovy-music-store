import { Suspense } from "react"
import Link from "next/link"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import Paginacion from "@/app/ui/paginacion"
import SortLink from "@/app/ui/sort-link"
import FiltrosVendedor from "./filtros"

const POR_PAGINA = 20
const CAMPOS_T = ["id", "order_id", "monto_total", "monto_acreditar", "estado", "fecha"]

type SearchParams = {
  query?: string
  estado?: string
  pagina?: string
  sortBy?: string
  sortDir?: string
}

export default async function DetalleVendedorPage({
  params,
  searchParams,
}: {
  params: Promise<{ sellerId: string }>
  searchParams: Promise<SearchParams>
}) {
  const { sellerId } = await params
  const sp = await searchParams

  const query   = sp.query?.trim()  ?? ""
  const estado  = sp.estado?.trim() ?? ""
  const pagina  = Math.max(1, parseInt(sp.pagina ?? "1", 10))
  const sortBy  = sp.sortBy  ?? ""
  const sortDir = sp.sortDir ?? ""

  const where: Prisma.TransaccionWhereInput = { seller_id: sellerId }
  if (query) {
    where.OR = [
      { id:       { contains: query, mode: "insensitive" } },
      { order_id: { contains: query, mode: "insensitive" } },
    ]
  }
  if (estado) where.estado = estado

  const orderBy: Prisma.TransaccionOrderByWithRelationInput = CAMPOS_T.includes(sortBy)
    ? { [sortBy]: sortDir === "asc" ? "asc" : "desc" } as Prisma.TransaccionOrderByWithRelationInput
    : { fecha: "desc" }

  const baseParams = sp as Record<string, string | undefined>

  const [retenido, acreditado, transacciones, total] = await Promise.all([
    prisma.transaccion.aggregate({
      where: { seller_id: sellerId, estado: "pagado" },
      _sum: { monto_acreditar: true },
    }),
    prisma.transaccion.aggregate({
      where: { seller_id: sellerId, estado: "acreditado" },
      _sum: { monto_acreditar: true },
    }),
    prisma.transaccion.findMany({
      where,
      orderBy,
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.transaccion.count({ where }),
  ])

  const balanceRetenido   = retenido._sum.monto_acreditar   ?? 0
  const balanceAcreditado = acreditado._sum.monto_acreditar ?? 0
  const tieneMasPaginas   = pagina * POR_PAGINA < total
  const hayFiltros        = query || estado

  const formatCurrency = (value: number) =>
    value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8 border-b border-border pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vendedor</h1>
            <p className="text-muted mt-1 font-mono text-sm">{sellerId}</p>
          </div>
          <Link href="/admin/vendedores" className="text-sm text-primary hover:underline">
            ← Volver a vendedores
          </Link>
        </div>

        {/* Resumen de balances */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted">Balance Retenido</p>
            <p className="text-2xl font-semibold text-foreground mt-2">
              {formatCurrency(balanceRetenido)}
            </p>
            <p className="text-xs text-muted mt-1">
              Fondos de transacciones pagadas, pendientes de liberar.
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted">Balance Acreditado</p>
            <p className="text-2xl font-semibold text-foreground mt-2">
              {formatCurrency(balanceAcreditado)}
            </p>
            <p className="text-xs text-muted mt-1">
              Fondos ya liberados tras confirmar entrega.
            </p>
          </div>
        </section>

        {/* Transacciones del vendedor */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Transacciones</h2>

          <Suspense fallback={<div className="h-10 bg-card rounded-md border border-border animate-pulse mb-4" />}>
            <FiltrosVendedor />
          </Suspense>

          <p className="text-sm text-muted mt-3 mb-3">
            {hayFiltros
              ? `${total} resultado${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`
              : `${total} transacción${total !== 1 ? "es" : ""} en total`}
          </p>

          <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary text-white">
                  <th scope="col" className="p-3 text-left"><SortLink label="ID" sortKey="id" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                  <th scope="col" className="p-3 text-left"><SortLink label="Order ID" sortKey="order_id" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                  <th scope="col" className="p-3 text-left"><SortLink label="Monto Total" sortKey="monto_total" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                  <th scope="col" className="p-3 text-left"><SortLink label="A Acreditar" sortKey="monto_acreditar" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                  <th scope="col" className="p-3 text-left"><SortLink label="Estado" sortKey="estado" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                  <th scope="col" className="p-3 text-left"><SortLink label="Fecha" sortKey="fecha" currentSortBy={sortBy} currentSortDir={sortDir} baseParams={baseParams} /></th>
                </tr>
              </thead>
              <tbody>
                {transacciones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted">
                      {hayFiltros
                        ? "No se encontraron transacciones con esos filtros."
                        : "Este vendedor no tiene transacciones."}
                    </td>
                  </tr>
                ) : (
                  transacciones.map((t, i) => (
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Paginacion paginaActual={pagina} tieneMasPaginas={tieneMasPaginas} />
        </section>
      </div>
    </main>
  )
}
