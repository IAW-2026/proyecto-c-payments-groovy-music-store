"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type AcreditarState = { ok: boolean; message: string } | null

/**
 * Server Action. Acredita el monto al vendedor de UNA transacción.
 * Valida server-side: la transacción debe estar en 'pagado' y sin reclamos abiertos.
 */
export async function acreditarTransaccion(
  _prev: AcreditarState,
  formData: FormData,
): Promise<AcreditarState> {
  const transaccionId = formData.get("transaccionId") as string

  const transaccion = await prisma.transaccion.findUnique({
    where: { id: transaccionId },
    include: { reclamos: { where: { estado: "abierto" } } },
  })

  if (!transaccion) {
    return { ok: false, message: "Transacción no encontrada." }
  }
  if (transaccion.estado !== "pagado") {
    return { ok: false, message: `No se puede acreditar una transacción en estado '${transaccion.estado}'.` }
  }
  if (transaccion.reclamos.length > 0) {
    return { ok: false, message: "No se puede acreditar: la transacción tiene reclamos abiertos." }
  }

  await prisma.$transaction([
    prisma.transaccion.update({
      where: { id: transaccionId },
      data:  { estado: "acreditado" },
    }),
    prisma.acreditacion.create({
      data: {
        transaccion_id: transaccionId,
        seller_id:      transaccion.seller_id,
        monto:          transaccion.monto_acreditar,
        estado:         "acreditado",
      },
    }),
  ])

  revalidatePath(`/admin/transacciones/${transaccionId}`)
  return { ok: true, message: "Monto acreditado al vendedor." }
}
