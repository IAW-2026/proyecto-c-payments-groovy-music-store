import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getLabelMotivo } from "@/lib/motivos-reclamo"
import { getNombresUsuarios } from "@/lib/usuarios"
import FormularioResolucion from "./formulario-resolucion"
import BotonVolver from "./boton-volver"

export default async function ReclamoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect("/sign-in")
  const roles = (sessionClaims?.roles as string[]) ?? []
  if (!roles.includes("admin_payments")) redirect("/sign-in")

  const { id } = await params

  const reclamo = await prisma.reclamo.findUnique({
    where: { id },
    include: { transaccion: true },
  })

  if (!reclamo) notFound()

  // Resolver nombres de usuario a partir de los IDs de Clerk (fallback al ID).
  const { buyer_id, seller_id } = reclamo.transaccion
  const nombres = await getNombresUsuarios([buyer_id, seller_id])
  const nombreComprador = nombres[buyer_id]
  const nombreVendedor = nombres[seller_id]

  const formatCurrency = (value: number) =>
    value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">

        <div className="mb-8 border-b border-border pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reclamo #{reclamo.id}</h1>
            <p className="text-muted mt-1">Detalle y resolución del reclamo.</p>
          </div>
          <BotonVolver />
        </div>

        {/* Detalle del reclamo */}
        <section className="mb-6 bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Detalle del Reclamo</h2>
          <dl className="space-y-3">
            <div className="flex gap-4">
              <dt className="w-44 text-sm text-muted shrink-0">Motivo</dt>
              <dd className="text-sm text-foreground">{getLabelMotivo(reclamo.motivo)}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-sm text-muted shrink-0">Descripción</dt>
              <dd className="text-sm text-foreground">
                {reclamo.descripcion ?? (
                  <span className="text-muted italic">Sin descripción adicional.</span>
                )}
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-sm text-muted shrink-0">Fecha de apertura</dt>
              <dd className="text-sm text-foreground">
                {new Date(reclamo.fecha_apertura).toLocaleDateString("es-AR")}
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-sm text-muted shrink-0">Estado</dt>
              <dd>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  reclamo.estado === "abierto"  ? "bg-primary text-white" :
                  reclamo.estado === "resuelto" ? "bg-muted text-white"   :
                  "bg-border text-foreground"
                }`}>
                  {reclamo.estado}
                </span>
              </dd>
            </div>
          </dl>
        </section>

        {/* Transacción relacionada */}
        <section className="mb-6 bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Transacción Relacionada</h2>
          <dl className="space-y-3">
            <div className="flex gap-4">
              <dt className="w-44 text-sm text-muted shrink-0">ID Transacción</dt>
              <dd className="text-sm font-mono text-muted">#{reclamo.transaccion.id}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-sm text-muted shrink-0">ID Orden</dt>
              <dd className="text-sm font-mono text-muted">#{reclamo.transaccion.order_id}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-sm text-muted shrink-0">Monto Total</dt>
              <dd className="text-sm font-medium text-foreground">
                {formatCurrency(reclamo.transaccion.monto_total)}
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-sm text-muted shrink-0">Comprador</dt>
              <dd className="text-sm text-foreground">
                {nombreComprador ?? <span className="text-muted italic">Sin nombre</span>}
                <span className="block text-xs font-mono text-muted">{buyer_id}</span>
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-sm text-muted shrink-0">Vendedor</dt>
              <dd className="text-sm text-foreground">
                {nombreVendedor ?? <span className="text-muted italic">Sin nombre</span>}
                <span className="block text-xs font-mono text-muted">{seller_id}</span>
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-44 text-sm text-muted shrink-0">Estado transacción</dt>
              <dd>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  reclamo.transaccion.estado === "pagado"      ? "bg-primary text-white"       :
                  reclamo.transaccion.estado === "acreditado"  ? "bg-muted text-white"          :
                  reclamo.transaccion.estado === "fallido"     ? "bg-red-100 text-red-700"      :
                  reclamo.transaccion.estado === "reembolsado" ? "bg-amber-100 text-amber-700"  :
                  "bg-border text-foreground"
                }`}>
                  {reclamo.transaccion.estado}
                </span>
              </dd>
            </div>
          </dl>
        </section>

        {/* Resolución */}
        {reclamo.estado === "abierto" ? (
          <FormularioResolucion
            reclamoId={reclamo.id}
            transaccionId={reclamo.transaccion_id}
            montoTotal={reclamo.transaccion.monto_total}
          />
        ) : (
          <section className="bg-card rounded-lg border border-border p-6">
            <p className="text-sm text-muted">
              Este reclamo fue resuelto el{" "}
              <span className="text-foreground font-medium">
                {reclamo.fecha_resolucion
                  ? new Date(reclamo.fecha_resolucion).toLocaleDateString("es-AR")
                  : "—"}
              </span>.
            </p>
          </section>
        )}

      </div>
    </main>
  )
}
