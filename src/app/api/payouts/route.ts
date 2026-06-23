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

    if (!sellerId) {
      return errorContrato("solicitud_invalida", "El parámetro sellerId es obligatorio", 400)
    }

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

  } catch (error) {
    console.error("Error en GET /api/payouts:", error)
    return errorContrato("error_interno", "Error al consultar el balance", 500)
  }
}