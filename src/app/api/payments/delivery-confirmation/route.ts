import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ESTADOS_ACREDITACION } from "@/lib/constants"

const [ACREDITACION_ACREDITADO] = ESTADOS_ACREDITACION

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { transaccion_id } = body

    if (!transaccion_id) {
      return NextResponse.json(
        { error: "El campo transaccion_id es obligatorio" },
        { status: 400 }
      )
    }

    const transaccion = await prisma.transaccion.findUnique({
      where: { id: transaccion_id },
    })

    if (!transaccion) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      )
    }

    // 422: request es valido pero la operacion no tiene snetido en el estado actual
    if (transaccion.estado !== "pagado") {
      return NextResponse.json(
        { error: `No se puede confirmar entrega de una transacción en estado '${transaccion.estado}'` },
        { status: 422 }
      )
    }

    // Pasamos la transacción a acreditado y registramos la acreditación, atómico.
    const [actualizada] = await prisma.$transaction([
      prisma.transaccion.update({
        where: { id: transaccion_id },
        data:  { estado: "acreditado" },
      }),
      prisma.acreditacion.create({
        data: {
          transaccion_id: transaccion_id,
          seller_id:      transaccion.seller_id,
          monto:          transaccion.monto_acreditar,
          estado:         ACREDITACION_ACREDITADO,
        },
      }),
    ])

    return NextResponse.json({
      transaccion_id: actualizada.id,
      estado:         actualizada.estado,
      mensaje:        "Entrega confirmada. Fondos liberados al vendedor.",
    })

  } catch (error) {
    console.error("Error en POST /api/payments/delivery-confirmation:", error)
    return NextResponse.json(
      { error: "Error al confirmar la entrega" },
      { status: 500 }
    )
  }
}