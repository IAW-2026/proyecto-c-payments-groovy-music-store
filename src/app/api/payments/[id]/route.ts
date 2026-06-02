import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const transaccion = await prisma.transaccion.findUnique({
      where: { id },
      select: {
        id:              true,
        order_id:        true,
        buyer_id:        true,
        seller_id:       true,
        monto_total:     true,
        monto_acreditar: true,
        estado:          true,
        fecha:           true,
      },
    })

    if (!transaccion) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ transaccion })

  } catch (error) {
    console.error("Error en GET /api/payments/[id]:", error)
    return NextResponse.json(
      { error: "Error al consultar la transacción" },
      { status: 500 }
    )
  }
}