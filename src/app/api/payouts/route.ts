import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requiereAuth } from "@/lib/auth-interservicios"
import { errorContrato } from "@/lib/error-contrato"

export async function GET(request: NextRequest) {
  const auth = await requiereAuth(request)
  if ("error" in auth) {
    return NextResponse.json(auth.error, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get("sellerId")

    // --- Caso 1: un vendedor puntual ---
    if (sellerId) {
      const [retenido, acreditado] = await Promise.all([
        prisma.transaccion.aggregate({
          where: { seller_id: sellerId, estado: "pagado" },
          _sum: { monto_acreditar: true },
        }),
        prisma.transaccion.aggregate({
          where: { seller_id: sellerId, estado: "acreditado" },
          _sum: { monto_acreditar: true },
        }),
      ])

      return NextResponse.json({
        seller_id: sellerId,
        balance_retenido: retenido._sum.monto_acreditar ?? 0,
        balance_acreditado: acreditado._sum.monto_acreditar ?? 0,
      })
    }

    // --- Caso 2: sin sellerId → global, para Control Plane ---
    const pagina = Math.max(1, parseInt(searchParams.get("pagina") ?? "1", 10) || 1)
    const limite = Math.max(1, parseInt(searchParams.get("limite") ?? "20", 10) || 20)

    // Una sola query: agrupa por vendedor Y por estado a la vez.
    const grupos = await prisma.transaccion.groupBy({
      by: ["seller_id", "estado"],
      where: { estado: { in: ["pagado", "acreditado"] } },
      _sum: { monto_acreditar: true },
    })

    // Pasamos los grupos a un mapa: un objeto {retenido, acreditado} por vendedor.
    const porSeller = new Map<string, { retenido: number; acreditado: number }>()
    for (const g of grupos) {
      if (!porSeller.has(g.seller_id)) {
        porSeller.set(g.seller_id, { retenido: 0, acreditado: 0 })
      }
      const entry = porSeller.get(g.seller_id)!
      const monto = Number(g._sum.monto_acreditar ?? 0)
      if (g.estado === "pagado") entry.retenido = monto
      else entry.acreditado = monto
    }

    const todos = Array.from(porSeller.entries()).map(([seller_id, balances]) => ({
      seller_id,
      balance_retenido: balances.retenido,
      balance_acreditado: balances.acreditado,
    }))

    // Paginamos en memoria
    const total = todos.length
    const inicio = (pagina - 1) * limite
    const datos = todos.slice(inicio, inicio + limite)

    return NextResponse.json({
      datos,
      paginacion: {
        página: pagina,
        limite,
        total,
        totalPaginas: Math.max(1, Math.ceil(total / limite)),
      },
    })

  } catch (error) {
    console.error("Error en GET /api/payouts:", error)
    return errorContrato("error_interno", "Error al consultar el balance", 500)
  }
}