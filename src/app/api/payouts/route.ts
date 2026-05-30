import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get("sellerId")

    if (!sellerId) {
      return NextResponse.json(
        { error: "El parámetro sellerId es obligatorio" },
        { status: 400 }
      )
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
      seller_id:          sellerId,
      balance_retenido:   retenido._sum.monto_acreditar   ?? 0,
      balance_acreditado: acreditado._sum.monto_acreditar ?? 0,
    })

  } catch (error) {
    console.error("Error en GET /api/payouts:", error)
    return NextResponse.json(
      { error: "Error al consultar el balance" },
      { status: 500 }
    )
  }
}