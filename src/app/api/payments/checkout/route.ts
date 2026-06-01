import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPreference } from "@/lib/mercadopago"

export async function POST(request: Request) {
  try {
    // datos que llegan de la buyer app
    const body = await request.json()
    const { order_id, buyer_id, seller_id, costoEnvio, monto_total } = body

    // validacion server-side
    if (!order_id || !buyer_id || !seller_id || monto_total == null) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      )
    }

    // creamos la transaccion en la base de datos
    const transaccion = await prisma.transaccion.create({
      data: {
        order_id,
        buyer_id,
        seller_id,
        monto_total,
        monto_acreditar: monto_total - (costoEnvio ?? 0),
        estado: "pendiente",
        // El pago se registra junto con la transacción (nested write atómico).
        // Toma el id de la transacción automáticamente.
        pagos: {
          create: {
            buyer_id,
            monto: monto_total,
            estado: "pendiente",
          },
        },
      },
    })

    // creamos preferencia en mp
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!

    const esLocal = baseUrl.includes("localhost") 
    // Para que no retorne el approved en local, no se puede redirigir a localhost desde mp

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
        payer: { email: "test_user_buyer@testuser.com" },
      },
    })

    //devuelvo url a buyerapp
    return NextResponse.json({
      transaccion_id: transaccion.id,
      init_point: resultado.init_point,
    })
  } catch (error) {
    console.error("Error en /checkout:", error) 
    return NextResponse.json(
      { error: "Error al crear el pago" },
      { status: 500 }
    )
  }
}