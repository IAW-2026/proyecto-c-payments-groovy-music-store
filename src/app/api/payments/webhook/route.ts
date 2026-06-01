import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPayment } from "@/lib/mercadopago"

// Mapeo de estados de MP a estados de nuestra app
function mapearEstado(statusMP: string): string | null {
  switch (statusMP) {
    case "approved":   return "pagado"
    case "rejected":   return "fallido"
    case "pending":
    case "in_process": return "pendiente"
    default:           return null
  }
}

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

    // Consultamos el pago completo a MP usando el ID
    const token = process.env.MP_ACCESS_TOKEN
    console.log(`Token presente: ${!!token}, primeros 10 chars: ${token?.slice(0, 10)}`)

    const pagoMP = await getPayment().get({ id: String(paymentId) })

    const statusMP      = pagoMP.status
    const transaccionId = pagoMP.external_reference

    console.log(`Webhook recibido: paymentId=${paymentId} status=${statusMP} transaccionId=${transaccionId}`)

    if (!statusMP || !transaccionId) {
      console.log("Webhook ignorado: falta statusMP o transaccionId")
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    const nuevoEstado = mapearEstado(statusMP)
    if (!nuevoEstado) {
      console.log(`Webhook ignorado: estado MP desconocido "${statusMP}"`)
      return NextResponse.json({ recibido: true }, { status: 200 })
    }

    await prisma.transaccion.update({
      where: { id: transaccionId },
      data:  { estado: nuevoEstado },
    })

    console.log(`Webhook OK: transaccion ${transaccionId} → ${nuevoEstado}`)

    return NextResponse.json({ recibido: true }, { status: 200 })

  } catch (error) {
    //aunque falle, devolvemos 200 para que mp no reintente indefinidamente
    console.error("Error en webhook:", error)
    return NextResponse.json({ recibido: true }, { status: 200 })
  }
}