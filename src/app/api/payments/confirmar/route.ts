import { NextResponse } from "next/server"
import { confirmarPago } from "@/lib/confirmar-pago"

export async function POST(request: Request) {
  try {
    const { payment_id, external_reference } = await request.json()

    if (!payment_id || !external_reference) {
      return NextResponse.json(
        { error: "Faltan payment_id o external_reference" },
        { status: 400 },
      )
    }

    const resultado = await confirmarPago(String(payment_id), String(external_reference))

    if (!resultado) {
      return NextResponse.json(
        { error: "Estado de pago no mapeable" },
        { status: 422 },
      )
    }

    return NextResponse.json({ ok: true, estado: resultado.estado })
  } catch (error) {
    console.error("Error en /api/payments/confirmar:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
