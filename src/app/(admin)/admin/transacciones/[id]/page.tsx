import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getLabelMotivo } from "@/lib/motivos-reclamo"
import BotonAcreditar from "./boton-acreditar"

export default async function DetalleTransaccionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const transaccion = await prisma.transaccion.findUnique({
    where: { id },
    include: {
      pagos:          { orderBy: { fecha: "desc" } },
      acreditaciones: { orderBy: { fecha: "desc" } },
      reclamos:       { orderBy: { fecha_apertura: "desc" } },
    },
  })

  if (!transaccion) notFound()

  const formatCurrency = (value: number) =>
    value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })

  const formatDate = (fecha: Date) =>
    new Date(fecha).toLocaleDateString("es-AR")

  const estiloEstado = (estado: string) =>
    estado === "pagado"      ? "bg-primary text-white"       :
    estado === "acreditado"  ? "bg-muted text-white"         :
    estado === "fallido"     ? "bg-red-100 text-red-700"     :
    estado === "reembolsado" ? "bg-amber-100 text-amber-700" :
    "bg-border text-foreground"

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8 border-b border-border pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Transacción #{transaccion.id}
            </h1>
            <p className="text-muted mt-1">Detalle completo y registros asociados.</p>
          </div>
          <Link href="/admin/historial-transacciones" className="text-sm text-primary hover:underline" aria-label="Volver al historial de transacciones">
            ← Volver al historial
          </Link>
        </div>

        {/* Datos de la transacción */}
        <section className="mb-6 bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Datos de la Transacción</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-4">
              <dt className="w-44 text-muted shrink-0">ID Orden</dt>
              <dd className="font-mono text-muted">#{transaccion.order_id}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-muted shrink-0">Monto Total</dt>
              <dd className="font-medium text-foreground">{formatCurrency(transaccion.monto_total)}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-muted shrink-0">A Acreditar</dt>
              <dd className="text-foreground">{formatCurrency(transaccion.monto_acreditar)}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-muted shrink-0">Buyer ID</dt>
              <dd className="font-mono text-muted">{transaccion.buyer_id}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-muted shrink-0">Seller ID</dt>
              <dd className="font-mono text-muted">{transaccion.seller_id}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-muted shrink-0">Fecha</dt>
              <dd className="text-foreground">{formatDate(transaccion.fecha)}</dd>
            </div>
            <div className="flex gap-4 items-center">
              <dt className="w-44 text-muted shrink-0">Estado</dt>
              <dd>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${estiloEstado(transaccion.estado)}`}>
                  {transaccion.estado}
                </span>
              </dd>
            </div>
          </dl>
        </section>

        {/* Pagos */}
        <section className="mb-6 bg-card rounded-lg border border-border overflow-hidden">
          <h2 className="text-lg font-semibold text-foreground p-6 pb-3">Pagos</h2>
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="bg-secondary text-white">
                <th scope="col" className="p-3">ID</th>
                <th scope="col" className="p-3">Monto</th>
                <th scope="col" className="p-3">Estado</th>
                <th scope="col" className="p-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {transaccion.pagos.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-muted">Sin pagos registrados.</td></tr>
              ) : (
                transaccion.pagos.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? "bg-card" : "bg-background"}>
                    <td className="p-3 font-mono text-xs text-muted">#{p.id}</td>
                    <td className="p-3 text-foreground font-medium">{formatCurrency(p.monto)}</td>
                    <td className="p-3 text-muted">{p.estado}</td>
                    <td className="p-3 text-muted">{formatDate(p.fecha)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Acción: acreditar monto al vendedor */}
        {transaccion.estado === "pagado" && (
          <BotonAcreditar transaccionId={transaccion.id} />
        )}

        {/* Acreditaciones */}
        <section className="mb-6 bg-card rounded-lg border border-border overflow-hidden">
          <h2 className="text-lg font-semibold text-foreground p-6 pb-3">Acreditaciones</h2>
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="bg-secondary text-white">
                <th scope="col" className="p-3">ID</th>
                <th scope="col" className="p-3">Seller ID</th>
                <th scope="col" className="p-3">Monto</th>
                <th scope="col" className="p-3">Estado</th>
                <th scope="col" className="p-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {transaccion.acreditaciones.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-muted">Sin acreditaciones registradas.</td></tr>
              ) : (
                transaccion.acreditaciones.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? "bg-card" : "bg-background"}>
                    <td className="p-3 font-mono text-xs text-muted">#{a.id}</td>
                    <td className="p-3 font-mono text-xs text-muted">{a.seller_id}</td>
                    <td className="p-3 text-foreground font-medium">{formatCurrency(a.monto)}</td>
                    <td className="p-3 text-muted">{a.estado}</td>
                    <td className="p-3 text-muted">{formatDate(a.fecha)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Reclamos */}
        <section className="bg-card rounded-lg border border-border overflow-hidden">
          <h2 className="text-lg font-semibold text-foreground p-6 pb-3">Reclamos</h2>
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="bg-secondary text-white">
                <th scope="col" className="p-3">ID</th>
                <th scope="col" className="p-3">Motivo</th>
                <th scope="col" className="p-3">Estado</th>
                <th scope="col" className="p-3">Fecha Apertura</th>
                <th scope="col" className="p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {transaccion.reclamos.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-muted">Sin reclamos.</td></tr>
              ) : (
                transaccion.reclamos.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-card" : "bg-background"}>
                    <td className="p-3 font-mono text-xs text-muted">#{r.id}</td>
                    <td className="p-3 text-foreground">{getLabelMotivo(r.motivo)}</td>
                    <td className="p-3 text-muted">{r.estado}</td>
                    <td className="p-3 text-muted">{formatDate(r.fecha_apertura)}</td>
                    <td className="p-3">
                      {r.estado === "abierto" ? (
                        <Link
                          href={`/admin/reclamos/${r.id}`}
                          aria-label={`Resolver reclamo ${r.id}`}
                          className="px-3 py-1.5 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                          Resolver →
                        </Link>
                      ) : (
                        <span className="text-xs text-muted">Resuelto</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  )
}