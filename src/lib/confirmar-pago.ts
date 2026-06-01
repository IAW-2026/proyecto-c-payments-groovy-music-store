import { getPayment } from "@/lib/mercadopago"
import { prisma } from "@/lib/prisma"
import { ESTADOS_PAGO } from "@/lib/constants"

const [PAGO_PENDIENTE, PAGO_PAGADO, PAGO_FALLIDO] = ESTADOS_PAGO

function mapearEstado(statusMP: string): string | null {
  switch (statusMP) {
    case "approved":   return PAGO_PAGADO
    case "rejected":   return PAGO_FALLIDO
    case "pending":
    case "in_process": return PAGO_PENDIENTE
    default:           return null
  }
}

/**
 * Consulta el estado real del pago en MP y actualiza la transacción en DB.
 * Retorna el nuevo estado, o null si no hay estado mapeable.
 */
export async function confirmarPago(
  paymentId: string,
  transaccionId: string,
): Promise<{ estado: string } | null> {
  const pagoMP   = await getPayment().get({ id: paymentId })
  const statusMP = pagoMP.status
  if (!statusMP) return null

  const nuevoEstado = mapearEstado(statusMP)
  if (!nuevoEstado) return null

  // Actualizamos la transacción y su(s) pago(s) al mismo estado, de forma atómica.
  // El pago ya fue creado en el checkout, acá solo se sincroniza su estado.
  await prisma.$transaction([
    prisma.transaccion.update({
      where: { id: transaccionId },
      data:  { estado: nuevoEstado },
    }),
    prisma.pago.updateMany({
      where: { transaccion_id: transaccionId },
      data:  { estado: nuevoEstado },
    }),
  ])

  return { estado: nuevoEstado }
}
