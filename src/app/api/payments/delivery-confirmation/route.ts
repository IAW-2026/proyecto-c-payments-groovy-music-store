import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ESTADOS_ACREDITACION } from "@/lib/constants"
import { requiereAuth } from "@/lib/auth-interservicios"
import { errorContrato } from "@/lib/error-contrato"

const [ACREDITACION_ACREDITADO] = ESTADOS_ACREDITACION

export async function POST(request: NextRequest) {
  const auth = await requiereAuth(request)
  if ("error" in auth) {
    return NextResponse.json(auth.error, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { ordenId } = body  // 👈 el contrato manda ordenId (externo), no tu id interno

    if (!ordenId) {
      return errorContrato("solicitud_invalida", "El campo ordenId es obligatorio", 400)
    }

    // ordenId = el order_id externo que guardaste en el checkout.
    // Por eso buscamos por ese campo, no por tu id interno de Transaccion.
    const transaccion = await prisma.transaccion.findFirst({
      where: { order_id: ordenId },
    })

    if (!transaccion) {
      return errorContrato("no_encontrado", "Transacción no encontrada para esa orden", 404)
    }

    if (transaccion.estado !== "pagado") {
      return errorContrato(
        "estado_invalido",
        `No se puede confirmar entrega de una transacción en estado '${transaccion.estado}'`,
        422
      )
    }

    await prisma.$transaction([
      prisma.transaccion.update({
        where: { id: transaccion.id },
        data: { estado: "acreditado" },
      }),
      prisma.acreditacion.create({
        data: {
          transaccion_id: transaccion.id,
          seller_id: transaccion.seller_id,
          monto: transaccion.monto_acreditar,
          estado: ACREDITACION_ACREDITADO,
        },
      }),
    ])

    return NextResponse.json({
      estado: "fondos_liberados",  // 👈 literal del contrato, no tu estado interno
      mensaje: "Fondos transferidos al vendedor",
    })

  } catch (error) {
    console.error("Error en POST /api/payments/delivery-confirmation:", error)
    return errorContrato("error_interno", "Error al confirmar la entrega", 500)
  }
}