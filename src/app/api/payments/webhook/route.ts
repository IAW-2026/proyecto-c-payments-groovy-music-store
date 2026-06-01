import { NextResponse } from "next/server"
import { getPayment, getMerchantOrder } from "@/lib/mercadopago"
import { confirmarPago } from "@/lib/confirmar-pago"

export async function POST(request: Request) {
  try {
    // Leemos query params (formato IPN legacy)
    const url    = new URL(request.url)
    const topic  = url.searchParams.get("topic")
    const idQP   = url.searchParams.get("id")

    // Leemos body (formato nuevo de webhooks)
    let body: { type?: string; data?: { id?: string } } = {}
    try { body = await request.json() } catch { /* body vacío es válido */ }

    // Unificamos: el tipo y el id pueden venir de cualquiera de los dos lugares
    const tipo      = body.type ?? topic
    const recursoId = body.data?.id ?? idQP

    if (!recursoId) {
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    let paymentId: string | null = null

    if (tipo === "payment") {
      paymentId = recursoId
    } else if (tipo === "merchant_order") {
      // Consultamos la orden para extraer el payment_id
      const orden = await getMerchantOrder().get({ merchantOrderId: recursoId })
      const pagos = orden.payments ?? []
      // Tomamos el primer pago aprobado o el último disponible
      const pagoAprobado = pagos.find((p: { status: string }) => p.status === "approved") 
                        ?? pagos[pagos.length - 1]
      paymentId = pagoAprobado?.id ? String(pagoAprobado.id) : null
    }

    if (!paymentId) {
      console.log(`Webhook ignorado: tipo=${tipo}, sin paymentId resoluble`)
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    const token = process.env.MP_ACCESS_TOKEN
    console.log(`Token presente: ${!!token}, primeros 10 chars: ${token?.slice(0, 10)}`)

    const pagoMP        = await getPayment().get({ id: paymentId })
    const transaccionId = pagoMP.external_reference

    console.log(`Webhook: paymentId=${paymentId} status=${pagoMP.status} transaccionId=${transaccionId}`)

    if (!transaccionId) {
      console.log("Webhook ignorado: falta external_reference")
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    const resultado = await confirmarPago(paymentId, transaccionId, pagoMP)

    if (!resultado) {
      console.log(`Webhook ignorado: estado MP no mapeable "${pagoMP.status}"`)
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    console.log(`Webhook OK: transaccion ${transaccionId} → ${resultado.estado}`)
    return NextResponse.json({ recibido: true }, { status: 200 })

  } catch (error) {
    console.error("Error en webhook:", error)
    return NextResponse.json({ recibido: true }, { status: 200 })
  }
}