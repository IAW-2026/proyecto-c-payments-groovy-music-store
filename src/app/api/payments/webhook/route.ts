import { NextResponse } from "next/server"
import { getPayment, getMerchantOrder } from "@/lib/mercadopago"
import { confirmarPago } from "@/lib/confirmar-pago"
import { notificarPagoABuyer } from "@/lib/notificarBuyer"
import { estadoAContrato } from "@/lib/mapeo-contrato"

export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const topic = url.searchParams.get("topic")
    const idQP = url.searchParams.get("id")

    let body: { type?: string; data?: { id?: string } } = {}
    try { body = await request.json() } catch { /* body vacío es válido */ }

    const tipo = body.type ?? topic
    const recursoId = body.data?.id ?? idQP

    if (!recursoId) {
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    let paymentId: string | null = null

    if (tipo === "payment") {
      paymentId = recursoId
    } else if (tipo === "merchant_order") {
      const orden = await getMerchantOrder().get({ merchantOrderId: recursoId })
      const pagos = orden.payments ?? []
      const pagoAprobado = pagos.find((p) => p.status === "approved")
        ?? pagos[pagos.length - 1]
      paymentId = pagoAprobado?.id ? String(pagoAprobado.id) : null
    }

    if (!paymentId) {
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    const pagoMP = await getPayment().get({ id: paymentId })
    const transaccionId = pagoMP.external_reference

    if (!transaccionId) {
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    const resultado = await confirmarPago(paymentId, transaccionId, pagoMP)

    if (!resultado) {
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    // Notificación a Buyer — fuera del try interno: si falla, ya sabemos
    // que notificarPagoABuyer nunca tira excepción (lo vimos en su código),
    // así que esto no pone en riesgo el 200 final.
    await notificarPagoABuyer({
      ordenId: resultado.order_id,
      pagoId: transaccionId,
      estado: estadoAContrato(resultado.estado),
      fechaActualizacion: new Date().toISOString(),
    })

    return NextResponse.json({ recibido: true }, { status: 200 })

  } catch (error) {
    console.error("Error en webhook:", error)
    return NextResponse.json({ recibido: true }, { status: 200 })
  }
}