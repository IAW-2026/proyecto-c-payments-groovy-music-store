import { PrismaClient } from "@prisma/client"
import { ESTADOS_PAGO, ESTADOS_ACREDITACION, COMISION_PLATAFORMA } from "../src/lib/constants"

const prisma = new PrismaClient()

const [PAGO_PENDIENTE, PAGO_PAGADO, PAGO_FALLIDO] = ESTADOS_PAGO
const [ACREDITACION_ACREDITADO] = ESTADOS_ACREDITACION

function montos(monto_total: number, costoEnvio: number) {
  const producto = monto_total - costoEnvio
  return {
    monto_total,
    costoEnvio,
    comision:        producto * COMISION_PLATAFORMA,
    monto_acreditar: producto * (1 - COMISION_PLATAFORMA),
  }
}

async function main() {

  await prisma.reclamo.deleteMany()
  await prisma.acreditacion.deleteMany()
  await prisma.pago.deleteMany()
  await prisma.transaccion.deleteMany()

  const ahora = new Date()
  const diasAtras = (d: number) => new Date(ahora.getTime() - d * 86_400_000)

  // ─── Transacciones ────────────────────────────────────────────────────────

  const [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10,
         t11, t12, t13, t14, t15, t16, t17, t18, t19, t20] =
    await Promise.all([
      prisma.transaccion.create({ data: { order_id: "1001", buyer_id: "clerk_buyer_001", seller_id: "clerk_seller_001", ...montos(48500, 2500), estado: "acreditado",  fecha: diasAtras(60) } }),
      prisma.transaccion.create({ data: { order_id: "1002", buyer_id: "clerk_buyer_002", seller_id: "clerk_seller_001", ...montos(12000, 800),  estado: "pagado",      fecha: diasAtras(55) } }),
      prisma.transaccion.create({ data: { order_id: "1003", buyer_id: "clerk_buyer_001", seller_id: "clerk_seller_002", ...montos(32000, 1500), estado: "acreditado",  fecha: diasAtras(50) } }),
      prisma.transaccion.create({ data: { order_id: "1004", buyer_id: "clerk_buyer_003", seller_id: "clerk_seller_002", ...montos(75000, 3000), estado: "pagado",      fecha: diasAtras(45) } }),
      prisma.transaccion.create({ data: { order_id: "1005", buyer_id: "clerk_buyer_004", seller_id: "clerk_seller_003", ...montos(9800,  600),  estado: "fallido",     fecha: diasAtras(42) } }),
      prisma.transaccion.create({ data: { order_id: "1006", buyer_id: "clerk_buyer_002", seller_id: "clerk_seller_003", ...montos(21500, 1200), estado: "acreditado",  fecha: diasAtras(38) } }),
      prisma.transaccion.create({ data: { order_id: "1007", buyer_id: "clerk_buyer_005", seller_id: "clerk_seller_001", ...montos(55000, 2000), estado: "pagado",      fecha: diasAtras(34) } }),
      prisma.transaccion.create({ data: { order_id: "1008", buyer_id: "clerk_buyer_003", seller_id: "clerk_seller_004", ...montos(18200, 1000), estado: "reembolsado", fecha: diasAtras(30) } }),
      prisma.transaccion.create({ data: { order_id: "1009", buyer_id: "clerk_buyer_001", seller_id: "clerk_seller_004", ...montos(43000, 1800), estado: "acreditado",  fecha: diasAtras(25) } }),
      prisma.transaccion.create({ data: { order_id: "1010", buyer_id: "clerk_buyer_006", seller_id: "clerk_seller_002", ...montos(6500,  500),  estado: "pagado",      fecha: diasAtras(20) } }),
      prisma.transaccion.create({ data: { order_id: "1011", buyer_id: "clerk_buyer_004", seller_id: "clerk_seller_001", ...montos(88000, 3500), estado: "pagado",      fecha: diasAtras(15) } }),
      prisma.transaccion.create({ data: { order_id: "1012", buyer_id: "clerk_buyer_007", seller_id: "clerk_seller_003", ...montos(14300, 900),  estado: "pendiente",   fecha: diasAtras(12) } }),
      prisma.transaccion.create({ data: { order_id: "1013", buyer_id: "clerk_buyer_005", seller_id: "clerk_seller_004", ...montos(37500, 1600), estado: "pagado",      fecha: diasAtras(8)  } }),
      prisma.transaccion.create({ data: { order_id: "1014", buyer_id: "clerk_buyer_002", seller_id: "clerk_seller_002", ...montos(5200,  400),  estado: "fallido",     fecha: diasAtras(5)  } }),
      prisma.transaccion.create({ data: { order_id: "1015", buyer_id: "clerk_buyer_006", seller_id: "clerk_seller_001", ...montos(29900, 1300), estado: "pendiente",   fecha: diasAtras(2)  } }),
      prisma.transaccion.create({ data: { order_id: "1016", buyer_id: "clerk_buyer_007", seller_id: "clerk_seller_002", ...montos(61000, 2800), estado: "acreditado",  fecha: diasAtras(70) } }),
      prisma.transaccion.create({ data: { order_id: "1017", buyer_id: "clerk_buyer_003", seller_id: "clerk_seller_003", ...montos(8900,  600),  estado: "reembolsado", fecha: diasAtras(65) } }),
      prisma.transaccion.create({ data: { order_id: "1018", buyer_id: "clerk_buyer_005", seller_id: "clerk_seller_001", ...montos(44000, 2000), estado: "pagado",      fecha: diasAtras(18) } }),
      prisma.transaccion.create({ data: { order_id: "1019", buyer_id: "clerk_buyer_001", seller_id: "clerk_seller_003", ...montos(19500, 1100), estado: "fallido",     fecha: diasAtras(9)  } }),
      prisma.transaccion.create({ data: { order_id: "1020", buyer_id: "clerk_buyer_006", seller_id: "clerk_seller_004", ...montos(52000, 2200), estado: "acreditado",  fecha: diasAtras(80) } }),
    ])

  // ─── Pagos ────────────────────────────────────────────────────────────────

  await Promise.all([
    prisma.pago.create({ data: { transaccion_id: t1.id,  buyer_id: "clerk_buyer_001", monto: t1.monto_total,  estado: PAGO_PAGADO,    fecha: diasAtras(60) } }),
    prisma.pago.create({ data: { transaccion_id: t2.id,  buyer_id: "clerk_buyer_002", monto: t2.monto_total,  estado: PAGO_PAGADO,    fecha: diasAtras(55) } }),
    prisma.pago.create({ data: { transaccion_id: t3.id,  buyer_id: "clerk_buyer_001", monto: t3.monto_total,  estado: PAGO_PAGADO,    fecha: diasAtras(50) } }),
    prisma.pago.create({ data: { transaccion_id: t4.id,  buyer_id: "clerk_buyer_003", monto: t4.monto_total,  estado: PAGO_PAGADO,    fecha: diasAtras(45) } }),
    prisma.pago.create({ data: { transaccion_id: t5.id,  buyer_id: "clerk_buyer_004", monto: t5.monto_total,  estado: PAGO_FALLIDO,   fecha: diasAtras(42) } }),
    prisma.pago.create({ data: { transaccion_id: t6.id,  buyer_id: "clerk_buyer_002", monto: t6.monto_total,  estado: PAGO_PAGADO,    fecha: diasAtras(38) } }),
    prisma.pago.create({ data: { transaccion_id: t7.id,  buyer_id: "clerk_buyer_005", monto: t7.monto_total,  estado: PAGO_PAGADO,    fecha: diasAtras(34) } }),
    prisma.pago.create({ data: { transaccion_id: t8.id,  buyer_id: "clerk_buyer_003", monto: t8.monto_total,  estado: PAGO_PAGADO,    fecha: diasAtras(30) } }),
    prisma.pago.create({ data: { transaccion_id: t9.id,  buyer_id: "clerk_buyer_001", monto: t9.monto_total,  estado: PAGO_PAGADO,    fecha: diasAtras(25) } }),
    prisma.pago.create({ data: { transaccion_id: t10.id, buyer_id: "clerk_buyer_006", monto: t10.monto_total, estado: PAGO_PAGADO,    fecha: diasAtras(20) } }),
    prisma.pago.create({ data: { transaccion_id: t11.id, buyer_id: "clerk_buyer_004", monto: t11.monto_total, estado: PAGO_PAGADO,    fecha: diasAtras(15) } }),
    prisma.pago.create({ data: { transaccion_id: t12.id, buyer_id: "clerk_buyer_007", monto: t12.monto_total, estado: PAGO_PENDIENTE, fecha: diasAtras(12) } }),
    prisma.pago.create({ data: { transaccion_id: t13.id, buyer_id: "clerk_buyer_005", monto: t13.monto_total, estado: PAGO_PAGADO,    fecha: diasAtras(8)  } }),
    prisma.pago.create({ data: { transaccion_id: t14.id, buyer_id: "clerk_buyer_002", monto: t14.monto_total, estado: PAGO_FALLIDO,   fecha: diasAtras(5)  } }),
    prisma.pago.create({ data: { transaccion_id: t15.id, buyer_id: "clerk_buyer_006", monto: t15.monto_total, estado: PAGO_PENDIENTE, fecha: diasAtras(2)  } }),
    prisma.pago.create({ data: { transaccion_id: t16.id, buyer_id: "clerk_buyer_007", monto: t16.monto_total, estado: PAGO_PAGADO,    fecha: diasAtras(70) } }),
    prisma.pago.create({ data: { transaccion_id: t17.id, buyer_id: "clerk_buyer_003", monto: t17.monto_total, estado: PAGO_PAGADO,    fecha: diasAtras(65) } }),
    prisma.pago.create({ data: { transaccion_id: t18.id, buyer_id: "clerk_buyer_005", monto: t18.monto_total, estado: PAGO_PAGADO,    fecha: diasAtras(18) } }),
    prisma.pago.create({ data: { transaccion_id: t19.id, buyer_id: "clerk_buyer_001", monto: t19.monto_total, estado: PAGO_FALLIDO,   fecha: diasAtras(9)  } }),
    prisma.pago.create({ data: { transaccion_id: t20.id, buyer_id: "clerk_buyer_006", monto: t20.monto_total, estado: PAGO_PAGADO,    fecha: diasAtras(80) } }),
  ])

  // ─── Acreditaciones ───────────────────────────────────────────────────────

  await Promise.all([
    prisma.acreditacion.create({ data: { transaccion_id: t1.id,  seller_id: "clerk_seller_001", monto: Number(t1.monto_acreditar),  estado: ACREDITACION_ACREDITADO, fecha: diasAtras(57) } }),
    prisma.acreditacion.create({ data: { transaccion_id: t3.id,  seller_id: "clerk_seller_002", monto: Number(t3.monto_acreditar),  estado: ACREDITACION_ACREDITADO, fecha: diasAtras(47) } }),
    prisma.acreditacion.create({ data: { transaccion_id: t6.id,  seller_id: "clerk_seller_003", monto: Number(t6.monto_acreditar),  estado: ACREDITACION_ACREDITADO, fecha: diasAtras(35) } }),
    prisma.acreditacion.create({ data: { transaccion_id: t9.id,  seller_id: "clerk_seller_004", monto: Number(t9.monto_acreditar),  estado: ACREDITACION_ACREDITADO, fecha: diasAtras(22) } }),
    prisma.acreditacion.create({ data: { transaccion_id: t16.id, seller_id: "clerk_seller_002", monto: Number(t16.monto_acreditar), estado: ACREDITACION_ACREDITADO, fecha: diasAtras(67) } }),
    prisma.acreditacion.create({ data: { transaccion_id: t20.id, seller_id: "clerk_seller_004", monto: Number(t20.monto_acreditar), estado: ACREDITACION_ACREDITADO, fecha: diasAtras(77) } }),
  ])

  // ─── Reclamos ─────────────────────────────────────────────────────────────

  await Promise.all([
    // abiertos
    prisma.reclamo.create({ data: { transaccion_id: t2.id,  motivo: "FUERA_DE_PLAZO",     estado: "abierto", fecha_apertura: diasAtras(10) } }),
    prisma.reclamo.create({ data: { transaccion_id: t4.id,  motivo: "PRODUCTO_DANADO",     estado: "abierto", fecha_apertura: diasAtras(7)  } }),
    prisma.reclamo.create({ data: { transaccion_id: t7.id,  motivo: "PRODUCTO_INCORRECTO", estado: "abierto", fecha_apertura: diasAtras(4)  } }),
    prisma.reclamo.create({ data: { transaccion_id: t11.id, motivo: "FUERA_DE_PLAZO",      estado: "abierto", fecha_apertura: diasAtras(2)  } }),
    prisma.reclamo.create({ data: { transaccion_id: t13.id, motivo: "PRODUCTO_DANADO",     estado: "abierto", fecha_apertura: diasAtras(1)  } }),
    prisma.reclamo.create({ data: { transaccion_id: t18.id, motivo: "PRODUCTO_INCORRECTO", estado: "abierto", fecha_apertura: diasAtras(3)  } }),
    
    // resueltos sin reembolso
    prisma.reclamo.create({ data: { transaccion_id: t1.id,  motivo: "PRODUCTO_INCORRECTO", estado: "resuelto", fecha_apertura: diasAtras(55), fecha_resolucion: diasAtras(48), monto_reembolso: 0 } }),
    prisma.reclamo.create({ data: { transaccion_id: t3.id,  motivo: "PRODUCTO_DANADO",     estado: "resuelto", fecha_apertura: diasAtras(46), fecha_resolucion: diasAtras(40), monto_reembolso: 0 } }),
    prisma.reclamo.create({ data: { transaccion_id: t6.id,  motivo: "FUERA_DE_PLAZO",      estado: "resuelto", fecha_apertura: diasAtras(35), fecha_resolucion: diasAtras(28), monto_reembolso: 0 } }),
    prisma.reclamo.create({ data: { transaccion_id: t16.id, motivo: "PRODUCTO_DANADO",     estado: "resuelto", fecha_apertura: diasAtras(68), fecha_resolucion: diasAtras(62), monto_reembolso: 0 } }),
    
    // resueltos con reembolso total
    prisma.reclamo.create({ data: { transaccion_id: t8.id,  motivo: "PRODUCTO_INCORRECTO", estado: "resuelto", fecha_apertura: diasAtras(28), fecha_resolucion: diasAtras(20), monto_reembolso: Number(t8.monto_total)  } }),
    prisma.reclamo.create({ data: { transaccion_id: t17.id, motivo: "PRODUCTO_DANADO",     estado: "resuelto", fecha_apertura: diasAtras(63), fecha_resolucion: diasAtras(58), monto_reembolso: Number(t17.monto_total) } }),
    
    // resueltos con reembolso parcial
    prisma.reclamo.create({ data: { transaccion_id: t9.id,  motivo: "PRODUCTO_DANADO",     estado: "resuelto", fecha_apertura: diasAtras(22), fecha_resolucion: diasAtras(15), monto_reembolso: 15000 } }),
    prisma.reclamo.create({ data: { transaccion_id: t20.id, motivo: "FUERA_DE_PLAZO",      estado: "resuelto", fecha_apertura: diasAtras(75), fecha_resolucion: diasAtras(70), monto_reembolso: 20000 } }),
  ])

  // ─── Verificación contable ────────────────────────────────────────────────

  const todas = [t1,t2,t3,t4,t5,t6,t7,t8,t9,t10,t11,t12,t13,t14,t15,t16,t17,t18,t19,t20]
  for (const t of todas) {
    const suma = t.costoEnvio + t.comision + t.monto_acreditar
    if (Math.abs(Number(suma) - Number(t.monto_total)) > 0.01) {
      throw new Error(`Identidad contable rota en order ${t.order_id}: ${suma} ≠ ${t.monto_total}`)
    }
  }
  console.log(`✔ Identidad contable verificada en ${todas.length} transacciones`)
  console.log("✅ Datos de prueba cargados correctamente")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })