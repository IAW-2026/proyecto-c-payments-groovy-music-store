import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import Buscador from "@/app/ui/buscador"

// Next.js App Router pasa searchParams como prop al Server Component de página
type SearchParams = {
  query?: string
  estado?: string
  buyerId?: string
  sellerId?: string
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>   // ← Promise
}) {
  // ...
  const sp = await searchParams         // ← await

  const query    = sp.query?.trim()    ?? ""
  const estado   = sp.estado?.trim()   ?? ""
  const buyerId  = sp.buyerId?.trim()  ?? ""
  const sellerId = sp.sellerId?.trim() ?? ""

  // --- Construir el where dinámicamente ---
  // Prisma.TransaccionWhereInput garantiza type-safety sin hardcodear el objeto
  const where: Prisma.TransaccionWhereInput = {}

  if (query) {
  const idNumerico = parseInt(query, 10)

  // Solo filtramos si el usuario escribió un número válido
  if (!isNaN(idNumerico)) {
    where.OR = [
      { id:       idNumerico },
      { order_id: idNumerico },
    ]
  }
}
  if (estado)   where.estado    = estado
  if (buyerId)  where.buyer_id  = { contains: buyerId,  mode: "insensitive" }
  if (sellerId) where.seller_id = { contains: sellerId, mode: "insensitive" }

  // --- Consultas en paralelo ---
  // Los KPIs usan su propio where fijo (siempre globales)
  // Solo transacciones usa el where dinámico
  const [
    aggVTP,
    aggFondosRetenidos,
    transacciones,
    totalTransacciones,
    reclamos,
    reclamosCount,
  ] = await Promise.all([
    prisma.transaccion.aggregate({
      where: { estado: { in: ["pagado", "acreditado"] } },
      _sum: { monto_total: true, monto_acreditar: true },
    }),
    prisma.transaccion.aggregate({
      where: { estado: "pagado" },
      _sum: { monto_acreditar: true },
    }),
    prisma.transaccion.findMany({
      where,
      orderBy: { fecha: "desc" },
      take: 20,
    }),
    prisma.transaccion.count({ where }),
    prisma.reclamo.findMany({
      where: { estado: "abierto" },
      orderBy: { fecha_apertura: "desc" },
    }),
    prisma.reclamo.count({ where: { estado: "abierto" } }),
  ])

  const vtp            = aggVTP._sum.monto_total      ?? 0
  const totalAcreditar = aggVTP._sum.monto_acreditar  ?? 0
  const comisiones     = vtp - totalAcreditar
  const fondosRetenidos = aggFondosRetenidos._sum.monto_acreditar ?? 0
  const reclamosAbiertos = reclamosCount

  const formatCurrency = (value: number) =>
    value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })

  const hayFiltros = query || estado || buyerId || sellerId

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-foreground">
            Panel de Administración
          </h1>
          <p className="text-muted mt-1">
            Gestionar y revisar las operaciones del marketplace.
          </p>
        </div>

        {/* KPIs — siempre globales, sin filtros */}
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* VTP */}
            <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Volumen Total Procesado (VTP)</p>
                <p className="text-2xl font-semibold text-foreground mt-2">
                  {formatCurrency(Number(vtp))}
                </p>
                <p className="text-xs text-muted mt-1">
                  Representa: suma de <em>monto_total</em> de transacciones con estado 'pagado' o 'acreditado'.
                </p>
              </div>
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" />
                </svg>
              </span>
            </div>

            {/* Comisiones */}
            <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Comisiones de Plataforma</p>
                <p className="text-2xl font-semibold text-foreground mt-2">
                  {formatCurrency(Number(comisiones))}
                </p>
                <p className="text-xs text-muted mt-1">
                  Representa: estimación de ingresos netos (VTP menos monto a acreditar a sellers).
                </p>
              </div>
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14.5 10.5l-5 5M9.5 9.5l5 5" />
                  <circle cx="6.5" cy="6.5" r="1.5" />
                  <circle cx="17.5" cy="17.5" r="1.5" />
                </svg>
              </span>
            </div>

            {/* Fondos Retenidos */}
            <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Fondos Retenidos</p>
                <p className="text-2xl font-semibold text-foreground mt-2">
                  {formatCurrency(Number(fondosRetenidos))}
                </p>
                <p className="text-xs text-muted mt-1">
                  Representa: monto retenido para acreditación a sellers (campo <em>monto_acreditar</em> de transacciones 'pagado').
                </p>
              </div>
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 text-amber-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                  <rect x="3" y="7" width="18" height="13" rx="2" ry="2" />
                </svg>
              </span>
            </div>

            {/* Reclamos Abiertos */}
            <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Reclamos Abiertos</p>
                <p className="text-2xl font-semibold text-foreground mt-2">
                  {reclamosAbiertos}
                </p>
                <p className="text-xs text-muted mt-1">
                  Representa: número de reclamos con estado 'abierto' pendientes de resolución.
                </p>
              </div>
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-red-100 text-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />
                  <circle cx="12" cy="17" r="1" />
                </svg>
              </span>
            </div>
          </div>
        </section>

        {/* Buscador + tabla de transacciones */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Transacciones
          </h2>

          {/*
            Suspense es obligatorio aquí porque Buscador usa useSearchParams().
            Sin él, Next.js marcaría toda la ruta como client-side en build.
            El fallback es un skeleton minimalista para no cortar el layout.
          */}
          <Suspense fallback={<div className="h-10 bg-card rounded-md border border-border animate-pulse mb-4" />}>
            <Buscador />
          </Suspense>

          {/* Conteo de resultados */}
          <p className="text-sm text-muted mt-3 mb-3">
            {hayFiltros
              ? `${totalTransacciones} resultado${totalTransacciones !== 1 ? "s" : ""} encontrado${totalTransacciones !== 1 ? "s" : ""}`
              : `Mostrando las últimas ${transacciones.length} transacciones`}
          </p>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary text-white">
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Order ID</th>
                  <th className="p-3 text-left">Monto Total</th>
                  <th className="p-3 text-left">A Acreditar</th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-left">ID Buyer</th>
                  <th className="p-3 text-left">ID Seller</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted">
                      {hayFiltros
                        ? "No se encontraron transacciones con esos filtros."
                        : "No hay transacciones todavía."}
                    </td>
                  </tr>
                ) : (
                  transacciones.map((t, i) => (
                    <tr
                      key={t.id}
                      className={i % 2 === 0 ? "bg-card" : "bg-background"}
                    >
                      <td className="p-3 text-muted font-mono text-xs">#{t.id}</td>
                      <td className="p-3 text-muted font-mono text-xs">#{t.order_id}</td>
                      <td className="p-3 text-foreground font-medium">
                        {formatCurrency(t.monto_total)}
                      </td>
                      <td className="p-3 text-foreground">
                        {formatCurrency(t.monto_acreditar)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          t.estado === "pagado"      ? "bg-primary text-white"      :
                          t.estado === "acreditado"  ? "bg-muted text-white"        :
                          t.estado === "fallido"     ? "bg-red-100 text-red-700"    :
                          t.estado === "reembolsado" ? "bg-amber-100 text-amber-700" :
                          "bg-border text-foreground"
                        }`}>
                          {t.estado}
                        </span>
                      </td>
                      <td className="p-3 text-muted">
                        {new Date(t.fecha).toLocaleDateString("es-AR")}
                      </td>
                      <td className="p-3 text-muted font-mono text-xs">{t.buyer_id}</td>
                      <td className="p-3 text-muted font-mono text-xs">{t.seller_id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reclamos — igual que antes */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Reclamos Abiertos
          </h2>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary text-white">
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Transacción</th>
                  <th className="p-3 text-left">Motivo</th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-left">Fecha Apertura</th>
                </tr>
              </thead>
              <tbody>
                {reclamos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted">
                      No hay reclamos abiertos.
                    </td>
                  </tr>
                ) : (
                  reclamos.map((r, i) => (
                    <tr
                      key={r.id}
                      className={i % 2 === 0 ? "bg-card" : "bg-background"}
                    >
                      <td className="p-3 text-muted font-mono text-xs">#{r.id}</td>
                      <td className="p-3 text-muted font-mono text-xs">#{r.transaccion_id}</td>
                      <td className="p-3 text-foreground">{r.motivo}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary text-white">
                          {r.estado}
                        </span>
                      </td>
                      <td className="p-3 text-muted">
                        {new Date(r.fecha_apertura).toLocaleDateString("es-AR")}
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