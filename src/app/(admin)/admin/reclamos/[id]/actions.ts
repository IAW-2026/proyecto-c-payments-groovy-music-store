"use server"

import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

const DECISIONES_VALIDAS = ["REEMBOLSO_TOTAL", "REEMBOLSO_PARCIAL", "RECHAZAR"] as const
type Decision = typeof DECISIONES_VALIDAS[number]

export async function resolverReclamo(formData: FormData) {
  const reclamoId     = formData.get("reclamoId")     as string
  const transaccionId = formData.get("transaccionId") as string
  const montoTotal    = parseFloat(formData.get("montoTotal")  as string)
  const decision      = formData.get("decision") as string
  const montoRaw      = formData.get("monto")    as string | null
  const monto         = montoRaw ? parseFloat(montoRaw) : 0

  if (!DECISIONES_VALIDAS.includes(decision as Decision)) {
    throw new Error("Decisión inválida.")
  }

  if (decision === "REEMBOLSO_PARCIAL") {
    if (!monto || monto <= 0 || monto > montoTotal) {
      throw new Error(
        `El monto debe ser mayor a 0 y no superar ${montoTotal.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}.`
      )
    }
  }

  const montoReembolso =
    decision === "REEMBOLSO_TOTAL"   ? montoTotal :
    decision === "REEMBOLSO_PARCIAL" ? monto      : 0

  const reclamoUpdate = prisma.reclamo.update({
    where: { id: reclamoId },
    data: {
      estado:           "resuelto",
      monto_reembolso:  montoReembolso,
      fecha_resolucion: new Date(),
    },
  })

  if (decision === "REEMBOLSO_TOTAL") {
    // Reembolso total: la transacción pasa a 'reembolsado' y queda excluida
    // de todas las métricas y balances (el valor se devolvió por completo).
    await prisma.$transaction([
      reclamoUpdate,
      prisma.transaccion.update({
        where: { id: transaccionId },
        data:  { estado: "reembolsado" },
      }),
    ])
  } else if (decision === "REEMBOLSO_PARCIAL") {
    // Reembolso parcial: el monto sale ÚNICAMENTE de la acreditación al vendedor,
    // con piso en 0. La transacción NO pasa a 'reembolsado': sigue contando
    // (la plataforma conserva su comisión y la ganancia de envío).
    const t = await prisma.transaccion.findUnique({
      where: { id: transaccionId },
      select: { monto_acreditar: true },
    })
    const nuevoAcreditar = Math.max(0, (t?.monto_acreditar ?? 0) - montoReembolso)
    await prisma.$transaction([
      reclamoUpdate,
      prisma.transaccion.update({
        where: { id: transaccionId },
        data:  { monto_acreditar: nuevoAcreditar },
      }),
    ])
  } else {
    // RECHAZAR: solo se cierra el reclamo, la transacción no cambia.
    await prisma.$transaction([reclamoUpdate])
  }

  redirect("/admin/historial-reclamos")
}
