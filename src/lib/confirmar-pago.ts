import { getPayment } from "@/lib/mercadopago"
import { prisma } from "@/lib/prisma"
import { ESTADOS_PAGO } from "@/lib/constants"

const [PAGO_PENDIENTE, PAGO_PAGADO, PAGO_FALLIDO] = ESTADOS_PAGO

// Tipo del objeto que devuelve payment.get() del SDK de MercadoPago.
export type PagoMP = Awaited<ReturnType<ReturnType<typeof getPayment>["get"]>>

function mapearEstado(statusMP: string): string | null {
  switch (statusMP) {
    case "approved": return PAGO_PAGADO
    case "rejected": return PAGO_FALLIDO
    case "pending":
    case "in_process": return PAGO_PENDIENTE
    default: return null
  }
}

/**
 * Consulta el estado real del pago en MP y actualiza la transacción + su pago.
 * Retorna el nuevo estado, o null si no hay estado mapeable.
 *
 * `pagoMP` es opcional: si quien llama ya consultó el pago a MP, lo pasa para
 * evitar una segunda llamada a la API. Si se omite, se consulta acá.
 */
export async function confirmarPago(
  paymentId: string,
  transaccionId: string,
  pagoMP?: PagoMP,
): Promise<{ estado: string; order_id: string } | null> {
  const pago = pagoMP ?? await getPayment().get({ id: paymentId })
  const statusMP = pago.status
  if (!statusMP) return null

  const nuevoEstado = mapearEstado(statusMP)
  if (!nuevoEstado) return null

  // Actualizamos la transacción y su(s) pago(s) al mismo estado, de forma atómica.
  // El pago ya fue creado en el checkout, acá solo se sincroniza su estado.
  const [transaccionActualizada] = await prisma.$transaction([
    prisma.transaccion.update({
      where: { id: transaccionId },
      data: { estado: nuevoEstado },
    }),
    prisma.pago.updateMany({
      where: { transaccion_id: transaccionId },
      data: { estado: nuevoEstado },
    }),
  ])

  return { estado: nuevoEstado, order_id: transaccionActualizada.order_id }
}
