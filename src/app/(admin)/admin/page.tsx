import { prisma } from "@/lib/prisma"
import Link from "next/link"
import TablaAdminTransacciones from "@/app/ui/tabla-admin-transacciones"
import TablaAdminReclamos from "@/app/ui/tabla-admin-reclamos"
import { getNombresUsuarios } from "@/lib/usuarios"

// Estados donde la plataforma retiene su ganancia: cuentan para envíos y comisiones.
// 'reembolsado' (reembolso total) queda excluido: el valor se devolvió por completo.
const ESTADOS_CONCRETADOS = ["pagado", "acreditado"]

export default async function AdminPage() {
  const [
    aggVTP,
    aggFondosRetenidos,
    transacciones,
    reclamos,
    reclamosCount,
    aggGanancias,
  ] = await Promise.all([
    prisma.transaccion.aggregate({
      where: { estado: { in: ["pagado", "acreditado"] } },
      _sum: { monto_total: true, monto_acreditar: true },
    }),
    prisma.transaccion.aggregate({
      where: { estado: "pagado" },
      _sum: { monto_acreditar: true },
    }),
    prisma.transaccion.findMany({ orderBy: { fecha: "desc" }, take: 10 }),
    prisma.reclamo.findMany({
      where: { estado: "abierto" },
      orderBy: { fecha_apertura: "desc" },
      take: 5,
      include: { transaccion: { select: { buyer_id: true, seller_id: true } } },
    }),
    prisma.reclamo.count({ where: { estado: "abierto" } }),
    prisma.transaccion.aggregate({
      where: { estado: { in: ESTADOS_CONCRETADOS } },
      _sum: { costoEnvio: true, comision: true },
    }),
  ])

  // Resolver nombres de usuario para los buyer/seller mostrados (fallback al ID).
  const nombres = await getNombresUsuarios([
    ...transacciones.flatMap((t) => [t.buyer_id, t.seller_id]),
    ...reclamos.flatMap((r) => [r.transaccion.buyer_id, r.transaccion.seller_id]),
  ])

  const vtp = aggVTP._sum.monto_total     ?? 0
  const fondosRetenidos = aggFondosRetenidos._sum.monto_acreditar ?? 0
  const gananciaEnvios = aggGanancias._sum.costoEnvio ?? 0
  const comisionesGanadas = aggGanancias._sum.comision ?? 0

  const formatCurrency = (value: number) =>
    value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 border-b border-border pb-4">
          <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
          <p className="text-muted mt-1">Gestionar y revisar las operaciones del marketplace.</p>
        </div>

        {/* KPIs */}
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Volumen Total Procesado (VTP)</p>
                <p className="text-2xl font-semibold text-foreground mt-2">{formatCurrency(vtp)}</p>
                <p className="text-xs text-muted mt-1">Suma de <em>monto_total</em> de transacciones con estado 'pagado' o 'acreditado'.</p>
              </div>
              <span className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-emerald-100 text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" />
                </svg>
              </span>
            </div>
            <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Fondos Retenidos</p>
                <p className="text-2xl font-semibold text-foreground mt-2">{formatCurrency(fondosRetenidos)}</p>
                <p className="text-xs text-muted mt-1"><em>monto_acreditar</em> de transacciones con estado 'pagado'.</p>
              </div>
              <span className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-amber-100 text-amber-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                  <rect x="3" y="7" width="18" height="13" rx="2" ry="2" />
                </svg>
              </span>
            </div>
            <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Reclamos Abiertos</p>
                <p className="text-2xl font-semibold text-foreground mt-2">{reclamosCount}</p>
                <p className="text-xs text-muted mt-1">Reclamos con estado 'abierto' pendientes de resolución.</p>
              </div>
              <span className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-red-100 text-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />
                  <circle cx="12" cy="17" r="1" />
                </svg>
              </span>
            </div>
            <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Ganancia envíos</p>
                <p className="text-2xl font-semibold text-foreground mt-2">{formatCurrency(gananciaEnvios)}</p>
                <p className="text-xs text-muted mt-1">Suma de <em>costoEnvio</em> de transacciones pagadas, acreditadas o reembolsadas.</p>
              </div>
              <span className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-primary/15 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M1 3h15v13H1z" />
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 8h4l3 3v5h-7z" />
                  <circle cx="5.5" cy="18.5" r="1.5" /><circle cx="18.5" cy="18.5" r="1.5" />
                </svg>
              </span>
            </div>
            <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Comisiones ganadas</p>
                <p className="text-2xl font-semibold text-foreground mt-2">{formatCurrency(comisionesGanadas)}</p>
                <p className="text-xs text-muted mt-1">Suma de <em>comision</em> de transacciones pagadas, acreditadas o reembolsadas.</p>
              </div>
              <span className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-sky-100 text-sky-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 5L5 19" />
                  <circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
                </svg>
              </span>
            </div>
          </div>
        </section>

        {/* Últimas transacciones */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Últimas Transacciones</h2>
            <Link href="/admin/historial-transacciones" className="text-sm text-primary hover:underline transition-colors">
              Ver historial completo →
            </Link>
          </div>
          <TablaAdminTransacciones transacciones={transacciones} nombres={nombres} />
        </section>

        {/* Lista de vendedores */}
        <Link
          href="/admin/vendedores"
          className="block w-full text-center bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary/90 transition-colors mb-10"
        >
          Ver vendedores →
        </Link>

        {/* Ultimos reclamos abiertos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Reclamos Abiertos</h2>
            <Link href="/admin/historial-reclamos" className="text-sm text-primary hover:underline transition-colors">
              Ver historial completo →
            </Link>
          </div>
          <TablaAdminReclamos reclamos={reclamos} nombres={nombres} />
        </section>
      </div>
    </main>
  )
}
