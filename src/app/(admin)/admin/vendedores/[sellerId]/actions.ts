"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ESTADOS_ACREDITACION } from "@/lib/constants"

const [ACREDITACION_ACREDITADO] = ESTADOS_ACREDITACION

export type AcreditarRetenidosState = { ok: boolean; message: string } | null

/**
 * Server Action. Acredita en lote todas las transacciones 'pagado' del vendedor
 * que NO tengan reclamos abiertos. Las que tengan reclamo abierto se excluyen.
 */
export async function acreditarRetenidos(
  _prev: AcreditarRetenidosState,
  formData: FormData,
): Promise<AcreditarRetenidosState> {
  const sellerId = formData.get("sellerId") as string

  const candidatas = await prisma.transaccion.findMany({
    where: {
      seller_id: sellerId,
      estado:    "pagado",
      reclamos:  { none: { estado: "abierto" } },
    },
  })

  if (candidatas.length === 0) {
    return { ok: true, message: "No hay transacciones retenidas para acreditar." }
  }

  const operaciones = candidatas.flatMap((t) => [
    prisma.transaccion.update({
      where: { id: t.id },
      data:  { estado: "acreditado" },
    }),
    prisma.acreditacion.create({
      data: {
        transaccion_id: t.id,
        seller_id:      t.seller_id,
        monto:          t.monto_acreditar,
        estado:         ACREDITACION_ACREDITADO,
      },
    }),
  ])

  await prisma.$transaction(operaciones)

  revalidatePath(`/admin/vendedores/${sellerId}`)
  return {
    ok: true,
    message: `Se acreditaron ${candidatas.length} transacción${candidatas.length !== 1 ? "es" : ""}.`,
  }
}
