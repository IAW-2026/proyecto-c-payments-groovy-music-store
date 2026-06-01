import { NextResponse } from "next/server"
import { getPayment } from "@/lib/mercadopago"
import { confirmarPago } from "@/lib/confirmar-pago"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    //solo nos interesan los eventos de pago de mp
    if (body.type !== "payment") {
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    // Consultamos el pago UNA sola vez: nos da el external_reference (transaccion_id)
    // y se reutiliza pasándoselo a confirmarPago para no llamar de nuevo a MP.
    const token = process.env.MP_ACCESS_TOKEN
    console.log(`Token presente: ${!!token}, primeros 10 chars: ${token?.slice(0, 10)}`)

    const pagoMP        = await getPayment().get({ id: String(paymentId) })
    const transaccionId = pagoMP.external_reference

    console.log(`Webhook recibido: paymentId=${paymentId} status=${pagoMP.status} transaccionId=${transaccionId}`)

    if (!transaccionId) {
      console.log("Webhook ignorado: falta transaccionId (external_reference)")
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    // Toda la actualización de estado (transacción + pago) la hace confirmarPago.
    const resultado = await confirmarPago(String(paymentId), transaccionId, pagoMP)

    if (!resultado) {
      console.log(`Webhook ignorado: estado MP no mapeable "${pagoMP.status}"`)
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    console.log(`Webhook OK: transaccion ${transaccionId} → ${resultado.estado}`)

    return NextResponse.json({ recibido: true }, { status: 200 })

  } catch (error) {
    //aunque falle, devolvemos 200 para que mp no reintente indefinidamente
    console.error("Error en webhook:", error)
    return NextResponse.json({ recibido: true }, { status: 200 })
  }
}
