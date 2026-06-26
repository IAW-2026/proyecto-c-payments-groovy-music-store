import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requiereAuth } from "@/lib/auth-interservicios"
import { errorContrato } from "@/lib/error-contrato"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requiereAuth(request)
    if ("error" in auth) {
        return NextResponse.json(auth.error, { status: auth.status })
    }

    try {
        const { id } = await params
        const body = await request.json()
        const { monto, motivo } = body

        if (monto == null || typeof monto !== "number" || monto <= 0) {
            return errorContrato("solicitud_invalida", "El campo monto es obligatorio y debe ser mayor a 0", 400)
        }

        const transaccion = await prisma.transaccion.findUnique({ where: { id } })

        if (!transaccion) {
            return errorContrato("no_encontrado", "Transacción no encontrada", 404)
        }

        if (transaccion.estado !== "pagado" && transaccion.estado !== "acreditado") {
            return errorContrato(
                "estado_invalido",
                `No se puede reembolsar una transacción en estado '${transaccion.estado}'`,
                422
            )
        }

        const montoAcreditarActual = Number(transaccion.monto_acreditar)
        // Tope de un reembolso TOTAL: todo menos el envío (el envío nunca se devuelve).
        // Esto incluye lo que iba a quedar como comisión de la plataforma.
        const montoMaximoTotal = Number(transaccion.monto_total) - Number(transaccion.costoEnvio)

        // Margen de centavos por errores de redondeo en floats.
        const esReembolsoTotal = Math.abs(monto - montoMaximoTotal) < 0.01

        if (esReembolsoTotal) {
            // Reembolso total: se devuelve todo menos el envío. La plataforma
            // resigna su comisión y el vendedor no recibe nada de esta transacción.
            const [transaccionActualizada] = await prisma.$transaction([
                prisma.transaccion.update({
                    where: { id },
                    data: { estado: "reembolsado", monto_acreditar: 0 },
                }),
                prisma.reclamo.create({
                    data: {
                        transaccion_id: id,
                        motivo: motivo ?? "REEMBOLSO_ADMIN",
                        estado: "resuelto",
                        fecha_apertura: new Date(),
                        fecha_resolucion: new Date(),
                        monto_reembolso: monto,
                    },
                }),
            ])

            return NextResponse.json({
                transaccionId: transaccionActualizada.id,
                estado: transaccionActualizada.estado,
                montoReembolsado: monto,
                montoAcreditarRestante: 0,
                mensaje: "Reembolso total emitido. Transacción cerrada.",
            })
        }

        // Reembolso parcial: se resta SOLO de lo que le correspondía al vendedor.
        // No toca comisión ni envío, y el estado de la transacción no cambia.
        if (monto > montoAcreditarActual) {
            return errorContrato(
                "monto_invalido",
                `No se puede reembolsar $${monto} de forma parcial: el máximo disponible del vendedor es $${montoAcreditarActual}. ` +
                `Para reembolsar más, debe ser un reembolso total de $${montoMaximoTotal}.`,
                400
            )
        }

        const nuevoMontoAcreditar = montoAcreditarActual - monto

        const [transaccionActualizada] = await prisma.$transaction([
            prisma.transaccion.update({
                where: { id },
                data: { monto_acreditar: nuevoMontoAcreditar }, // estado NO cambia
            }),
            prisma.reclamo.create({
                data: {
                    transaccion_id: id,
                    motivo: motivo ?? "REEMBOLSO_ADMIN",
                    estado: "resuelto",
                    fecha_apertura: new Date(),
                    fecha_resolucion: new Date(),
                    monto_reembolso: monto,
                },
            }),
        ])

        return NextResponse.json({
            transaccionId: transaccionActualizada.id,
            estado: transaccionActualizada.estado,
            montoReembolsado: monto,
            montoAcreditarRestante: nuevoMontoAcreditar,
            mensaje: "Reembolso parcial emitido. La transacción sigue activa.",
        })

    } catch (error) {
        console.error("Error en POST /api/payments/[id]/refund:", error)
        return errorContrato("error_interno", "Error al procesar el reembolso", 500)
    }
}