import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPreference } from "@/lib/mercadopago"
import { ESTADOS_PAGO, COMISION_PLATAFORMA } from "@/lib/constants"
import { requiereAuth } from "@/lib/auth-interservicios"
import { errorContrato } from "@/lib/error-contrato"
import { estadoAContrato } from "@/lib/mapeo-contrato"

const [PAGO_PENDIENTE] = ESTADOS_PAGO

export async function POST(request: NextRequest) {
  const auth = await requiereAuth(request)
  if ("error" in auth) {
    return NextResponse.json(auth.error, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { order_id, buyer_id, seller_id, costoEnvio, monto_total } = body

    if (!order_id || !buyer_id || !seller_id || monto_total == null) {
      return errorContrato(
        "solicitud_invalida",
        "Faltan datos obligatorios: order_id, buyer_id, seller_id y monto_total son requeridos",
        400
      )
    }

    const envio = costoEnvio ?? 0
    const producto = monto_total - envio
    const comision = producto * COMISION_PLATAFORMA
    const monto_acreditar = producto * (1 - COMISION_PLATAFORMA)

    const transaccion = await prisma.transaccion.create({
      data: {
        order_id,
        buyer_id,
        seller_id,
        monto_total,
        costoEnvio: envio,
        comision,
        monto_acreditar,
        estado: "pendiente",
        pagos: {
          create: {
            buyer_id,
            monto: monto_total,
            estado: PAGO_PENDIENTE,
          },
        },
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "")

    if (!baseUrl) {
      return errorContrato("error_interno", "NEXT_PUBLIC_BASE_URL no está configurado", 500)
    }

    const esLocal = baseUrl.includes("localhost")

    const resultado = await getPreference().create({
      body: {
        items: [
          {
            id: String(transaccion.id),
            title: `Orden ${order_id} - Groovy Music Store`,
            quantity: 1,
            unit_price: Number(monto_total),
            currency_id: "ARS",
          },
        ],
        back_urls: {
          success: `${baseUrl}/pago/exitoso`,
          failure: `${baseUrl}/pago/fallido`,
          pending: `${baseUrl}/pago/pendiente`,
        },
        ...(esLocal ? {} : { auto_return: "approved" }),
        external_reference: String(transaccion.id),
        notification_url: `${baseUrl}/api/payments/webhook`,
      },
    })

    // Nombres de campo según 03-apis.md: pagoId, urlCheckout, estado
    return NextResponse.json({
      pagoId: transaccion.id,
      urlCheckout: resultado.init_point,
      estado: estadoAContrato(transaccion.estado),
    })

  } catch (error) {
    console.error("Error en /checkout:", error)
    return errorContrato("error_interno", "Error al crear el pago", 500)
  }
}