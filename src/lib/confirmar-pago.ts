import { getPayment } from "@/lib/mercadopago"
import { prisma } from "@/lib/prisma"

function mapearEstado(statusMP: string): string | null {
  switch (statusMP) {
    case "approved":   return "pagado"
    case "rejected":   return "fallido"
    case "pending":
    case "in_process": return "pendiente"
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

  await prisma.transaccion.update({
    where: { id: transaccionId },
    data:  { estado: nuevoEstado },
  })

  return { estado: nuevoEstado }
}
