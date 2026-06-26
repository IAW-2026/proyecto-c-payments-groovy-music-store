import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requiereAuth } from "@/lib/auth-interservicios"
import { errorContrato } from "@/lib/error-contrato"
import { estadoAContrato } from "@/lib/mapeo-contrato"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requiereAuth(request)
  if ("error" in auth) {
    return NextResponse.json(auth.error, { status: auth.status })
  }

  try {
    const { id } = await params

    const transaccion = await prisma.transaccion.findUnique({
      where: { id },
      select: {
        id: true,
        order_id: true,
        estado: true,
        monto_total: true,
      },
    })

    if (!transaccion) {
      return errorContrato("no_encontrado", "Transacción no encontrada", 404)
    }

    // Nombres de campo según 03-apis.md sección 7: id, ordenId, estado, monto
    return NextResponse.json({
      id: transaccion.id,
      ordenId: transaccion.order_id,
      estado: estadoAContrato(transaccion.estado),
      monto: transaccion.monto_total,
    })

  } catch (error) {
    console.error("Error en GET /api/payments/[id]:", error)
    return errorContrato("error_interno", "Error al consultar la transacción", 500)
  }
}