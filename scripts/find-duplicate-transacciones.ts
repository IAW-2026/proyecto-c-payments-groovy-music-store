import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type TransRec = {
  id: string
  order_id: string
  buyer_id: string
  seller_id: string
  monto_total: number
  fecha: Date
  estado: string
}

async function main() {
  console.log("Buscando duplicados por order_id...")
  const rows = await prisma.transaccion.findMany({ orderBy: { id: "asc" } })
  const records = rows as unknown as TransRec[]

  const map = new Map<string, TransRec[]>()
  for (const r of records) {
    const arr = map.get(r.order_id) ?? []
    arr.push(r)
    map.set(r.order_id, arr)
  }

  const duplicates = [...map.entries()].filter(([_, arr]) => arr.length > 1)
  if (duplicates.length === 0) {
    console.log("No se encontraron duplicados por order_id.")
    return
  }

  console.log(`Encontrados ${duplicates.length} order_id(s) con duplicados:`)
  for (const [order_id, arr] of duplicates) {
    console.log(`\norder_id=${order_id} — count=${arr.length}`)
    for (const rec of arr) {
      console.log(
        `  id=${rec.id} fecha=${new Date(rec.fecha).toISOString()} estado=${rec.estado} buyer=${rec.buyer_id} seller=${rec.seller_id} monto=${rec.monto_total}`
      )
    }
  }

  console.log("\nPlan sugerido (mantener la última por id, borrar el resto):")
  const deletionPlan: { order_id: string; keepId: string; deleteIds: string[] }[] = []
  for (const [order_id, arr] of duplicates) {
    const keep = arr[arr.length - 1]
    const deleteIds = arr.filter((r) => r.id !== keep.id).map((r) => r.id)
    deletionPlan.push({ order_id, keepId: keep.id, deleteIds })
    console.log(`order_id=${order_id} keep=${keep.id} delete=[${deleteIds.join(", ")}]`)
  }

  if (process.env.RUN_DELETE === "1") {
    console.log("\nEjecutando borrado de duplicados (incluye pagos, acreditaciones y reclamos)...")
    let totalDeleted = 0
    for (const plan of deletionPlan) {
      if (plan.deleteIds.length === 0) continue
      // Eliminar registros hijos primero para evitar errores de FK
      const pagosRes = await prisma.pago.deleteMany({ where: { transaccion_id: { in: plan.deleteIds } } })
      const acreditRes = await prisma.acreditacion.deleteMany({ where: { transaccion_id: { in: plan.deleteIds } } })
      const reclRes = await prisma.reclamo.deleteMany({ where: { transaccion_id: { in: plan.deleteIds } } })
      const transRes = await prisma.transaccion.deleteMany({ where: { id: { in: plan.deleteIds } } })
      console.log(
        `order_id=${plan.order_id} pagos=${pagosRes.count} acreditaciones=${acreditRes.count} reclamos=${reclRes.count} transacciones=${transRes.count}`
      )
      totalDeleted += transRes.count
    }
    console.log(`Total transacciones borradas: ${totalDeleted}`)
  } else {
    console.log("\nNo se borró nada. Para borrar, vuelve a ejecutar con:")
    console.log("RUN_DELETE=1 npx tsx scripts/find-duplicate-transacciones.ts")
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
