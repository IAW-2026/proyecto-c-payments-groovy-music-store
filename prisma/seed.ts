import { PrismaClient } from "@prisma/client";
import { ESTADOS_PAGO, ESTADOS_ACREDITACION } from "../src/lib/constants";
import { SELLER_ID, ORDENES } from "./contrato-datos";

const prisma = new PrismaClient();

const [PAGO_PENDIENTE, PAGO_PAGADO, PAGO_FALLIDO] = ESTADOS_PAGO;
const [ACREDITACION_ACREDITADO] = ESTADOS_ACREDITACION;

// estado_global del contrato -> estado base de la Transaccion en Payments.
// "ENTREGADO" arranca en "acreditado"; si después tiene un reembolso TOTAL
// (ver más abajo), se pisa a "reembolsado" — igual que hace la ruta real de
// refund, que nunca toca comision/costoEnvio, solo estado y monto_acreditar.
const MAPA_TRANSACCION: Record<string, string> = {
  RESERVADO: "pendiente",
  PAGO_FALLIDO: "fallido",
  PREPARANDO_PENDIENTE: "pagado",
  PREPARANDO: "pagado",
  LISTO_PARA_ENVIO: "pagado",
  ENVIADO_EN_PREPARACION: "pagado",
  EN_CAMINO: "pagado",
  ENTREGADO: "acreditado",
};

async function main() {
  console.log("🌱 Iniciando seed de Payments...");

  await prisma.reclamo.deleteMany();
  await prisma.acreditacion.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.transaccion.deleteMany();

  console.log("✓ Tablas limpiadas");

  let creadas = 0;
  let conAcreditacion = 0;
  let conReclamo = 0;

  for (const orden of ORDENES) {
    const fecha = new Date(Date.now() - orden.dias_atras * 86_400_000);
    const estadoBase = MAPA_TRANSACCION[orden.estado_global];

    // El reembolso (si lo hay) solo puede afectar transacciones ENTREGADAS:
    // es la única rama del contrato donde generamos reclamos resueltos con
    // plata devuelta. Replicamos lo que hace la ruta real de refund: total ->
    // estado "reembolsado" + monto_acreditar 0 (sin tocar comision/costoEnvio);
    // parcial -> estado SIN cambios, solo se resta del monto_acreditar.
    let estadoFinal = estadoBase;
    let montoAcreditarFinal = orden.monto_acreditar;

    if (
      orden.estado_global === "ENTREGADO" &&
      orden.reclamo?.estado === "resuelto" &&
      (orden.reclamo.monto_reembolso ?? 0) > 0
    ) {
      const montoMaximoTotal = orden.monto_total - orden.costo_envio;
      const esReembolsoTotal = Math.abs(orden.reclamo.monto_reembolso! - montoMaximoTotal) < 1;
      if (esReembolsoTotal) {
        estadoFinal = "reembolsado";
        montoAcreditarFinal = 0;
      } else {
        montoAcreditarFinal = orden.monto_acreditar - orden.reclamo.monto_reembolso!;
      }
    }

    const transaccion = await prisma.transaccion.create({
      data: {
        order_id: orden.id,
        buyer_id: orden.buyer_id,
        seller_id: SELLER_ID,
        monto_total: orden.monto_total,
        costoEnvio: orden.costo_envio,
        comision: orden.comision,
        monto_acreditar: montoAcreditarFinal,
        estado: estadoFinal,
        fecha,
      },
    });
    creadas++;

    // Pago: registra si el cobro al comprador salió bien o mal. Un reembolso
    // posterior no reescribe esto — el cobro original sí ocurrió.
    const estadoPago =
      orden.estado_global === "RESERVADO" ? PAGO_PENDIENTE
      : orden.estado_global === "PAGO_FALLIDO" ? PAGO_FALLIDO
      : PAGO_PAGADO;

    await prisma.pago.create({
      data: {
        transaccion_id: transaccion.id,
        buyer_id: orden.buyer_id,
        monto: orden.monto_total,
        estado: estadoPago,
        fecha,
      },
    });

    // Acreditación: se crea SIEMPRE que la orden llegó a ENTREGADO, con el
    // monto_acreditar ORIGINAL (pre-reembolso) — la ruta real de refund nunca
    // toca esta tabla, así que el historial de acreditación queda "viejo" si
    // hay un reembolso después. Es fiel al código real, no es un descuido.
    if (orden.estado_global === "ENTREGADO") {
      const fechaAcreditacion = new Date(
        Date.now() - Math.max(0, orden.dias_atras - 3) * 86_400_000
      );
      await prisma.acreditacion.create({
        data: {
          transaccion_id: transaccion.id,
          seller_id: SELLER_ID,
          monto: orden.monto_acreditar,
          estado: ACREDITACION_ACREDITADO,
          fecha: fechaAcreditacion,
        },
      });
      conAcreditacion++;
    }

    // Reclamo: independiente de si hubo reembolso, se crea si el contrato
    // tiene uno asociado a esta orden (algunos están "abiertos" sobre
    // órdenes EN_CAMINO, no solo sobre entregadas).
    if (orden.reclamo) {
      const fechaApertura = new Date(Date.now() - orden.reclamo.dias_apertura * 86_400_000);
      const fechaResolucion =
        orden.reclamo.estado === "resuelto"
          ? new Date(
              Date.now() -
                (orden.reclamo.dias_apertura - (orden.reclamo.dias_resolucion ?? 0)) * 86_400_000
            )
          : null;

      await prisma.reclamo.create({
        data: {
          transaccion_id: transaccion.id,
          motivo: orden.reclamo.motivo,
          estado: orden.reclamo.estado,
          fecha_apertura: fechaApertura,
          fecha_resolucion: fechaResolucion,
          monto_reembolso: orden.reclamo.monto_reembolso ?? null,
        },
      });
      conReclamo++;
    }
  }

  console.log(`✓ ${creadas} transacciones creadas`);
  console.log(`✓ ${conAcreditacion} acreditaciones (órdenes entregadas)`);
  console.log(`✓ ${conReclamo} reclamos`);

  // ─── Resumen ──────────────────────────────────────────────────────────
  const porEstado = await prisma.transaccion.groupBy({ by: ["estado"], _count: { _all: true } });
  const totales = await prisma.transaccion.aggregate({
    _sum: { monto_total: true, comision: true },
  });

  console.log("");
  console.log("📊 Resumen del seed:");
  console.log(`   Transacciones: ${creadas}`);
  for (const g of porEstado) console.log(`     - ${g.estado}: ${g._count._all}`);
  console.log(`   Monto total procesado: $${(totales._sum.monto_total ?? 0).toLocaleString("es-AR")}`);
  console.log(`   Comisión acumulada:    $${(totales._sum.comision ?? 0).toLocaleString("es-AR")}`);
  console.log("");
  console.log("✅ Seed completado.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });