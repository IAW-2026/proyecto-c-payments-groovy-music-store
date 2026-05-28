import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {

  // Creamos transacciones de prueba
  // Estas simulan compras reales que haría un buyer en el marketplace
  const transaccion1 = await prisma.transaccion.create({
    data: {
      order_id: 1001,
      buyer_id: "clerk_buyer_001",
      seller_id: "clerk_seller_001",
      monto_total: 48500,
      monto_acreditar: 45000,
      estado: "pagado",
    },
  })

  const transaccion2 = await prisma.transaccion.create({
    data: {
      order_id: 1002,
      buyer_id: "clerk_buyer_002",
      seller_id: "clerk_seller_001",
      monto_total: 12000,
      monto_acreditar: 11000,
      estado: "pendiente",
    },
  })

  const transaccion3 = await prisma.transaccion.create({
    data: {
      order_id: 1003,
      buyer_id: "clerk_buyer_001",
      seller_id: "clerk_seller_002",
      monto_total: 32000,
      monto_acreditar: 30000,
      estado: "acreditado",
    },
  })

  // Creamos pagos asociados a las transacciones
  await prisma.pago.create({
    data: {
      transaccion_id: transaccion1.id,
      buyer_id: "clerk_buyer_001",
      monto: 48500,
      estado: "aprobado",
    },
  })

  await prisma.pago.create({
    data: {
      transaccion_id: transaccion2.id,
      buyer_id: "clerk_buyer_002",
      monto: 12000,
      estado: "pendiente",
    },
  })

  // Creamos reclamos de prueba
  // Simulan disputes que abren los buyers
  await prisma.reclamo.create({
    data: {
      transaccion_id: transaccion1.id,
      motivo: "El producto no llegó en el plazo acordado",
      estado: "abierto",
    },
  })

  await prisma.reclamo.create({
    data: {
      transaccion_id: transaccion3.id,
      motivo: "El producto llegó en mal estado",
      estado: "abierto",
    },
  })

  // Creamos una acreditacion para la transaccion ya completada
  await prisma.acreditacion.create({
    data: {
      transaccion_id: transaccion3.id,
      seller_id: "clerk_seller_002",
      monto: 30000,
      estado: "completada",
    },
  })

  console.log("✅ Datos de prueba cargados correctamente")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })