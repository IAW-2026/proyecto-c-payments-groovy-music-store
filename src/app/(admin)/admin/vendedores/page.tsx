import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function VendedoresPage() {
  // 2. Tres agregaciones en paralelo
  const [retenidos, acreditados, conteos] = await Promise.all([
    prisma.transaccion.groupBy({
      by: ["seller_id"],
      where: { estado: "pagado" },
      _sum: { monto_acreditar: true },
    }),
    prisma.transaccion.groupBy({
      by: ["seller_id"],
      where: { estado: "acreditado" },
      _sum: { monto_acreditar: true },
    }),
    prisma.transaccion.groupBy({
      by: ["seller_id"],
      _count: { id: true },
    }),
  ])

  // 3. Convertir los arrays de balances en Maps para búsqueda rápida
  const mapaRetenido = new Map(
    retenidos.map((r) => [r.seller_id, r._sum.monto_acreditar ?? 0])
  )
  const mapaAcreditado = new Map(
    acreditados.map((a) => [a.seller_id, a._sum.monto_acreditar ?? 0])
  )

  // 4. Construir la lista final a partir de los conteos (que incluye a todos los sellers)
  const vendedores = conteos.map((c) => ({
    seller_id:    c.seller_id,
    transacciones: c._count.id,
    retenido:     mapaRetenido.get(c.seller_id)   ?? 0,
    acreditado:   mapaAcreditado.get(c.seller_id) ?? 0,
  }))

  const formatCurrency = (value: number) =>
    value.toLocaleString("es-AR", { style: "currency", currency: "ARS" })

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8 border-b border-border pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vendedores</h1>
            <p className="text-muted mt-1">
              Balance de fondos por vendedor.
            </p>
          </div>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            ← Volver al panel
          </Link>
        </div>

        <p className="text-sm text-muted mb-4">
          {vendedores.length} vendedor{vendedores.length !== 1 ? "es" : ""} con transacciones
        </p>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-white">
                <th scope="col" className="p-3 text-left">Seller ID</th>
                <th scope="col" className="p-3 text-left">Retenido</th>
                <th scope="col" className="p-3 text-left">Acreditado</th>
                <th scope="col" className="p-3 text-left">Transacciones</th>
                <th scope="col" className="p-3 text-left">Acción</th>
              </tr>
            </thead>
            <tbody>
              {vendedores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted">
                    No hay vendedores con transacciones.
                  </td>
                </tr>
              ) : (
                vendedores.map((v, i) => (
                  <tr key={v.seller_id} className={i % 2 === 0 ? "bg-card" : "bg-background"}>
                    <td className="p-3 text-muted font-mono text-xs">{v.seller_id}</td>
                    <td className="p-3 text-foreground font-medium">{formatCurrency(v.retenido)}</td>
                    <td className="p-3 text-foreground font-medium">{formatCurrency(v.acreditado)}</td>
                    <td className="p-3 text-muted">{v.transacciones}</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/vendedores/${v.seller_id}`}
                        className="px-3 py-1.5 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        Ver detalle →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}