import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requiereAuth } from "@/lib/auth-interservicios"
import { errorContrato } from "@/lib/error-contrato"
import { ESTADOS_ACREDITACION } from "@/lib/constants"

const [ACREDITACION_ACREDITADO] = ESTADOS_ACREDITACION

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // TODO: requiereSuperadmin cuando se confirme el formato del rol Clerk
    const auth = await requiereAuth(request)
    if ("error" in auth) {
        return NextResponse.json(auth.error, { status: auth.status })
    }

    try {
        const { id } = await params
        const body = await request.json().catch(() => ({}))
        const { motivo } = body

        const transaccion = await prisma.transaccion.findUnique({ where: { id } })

        if (!transaccion) {
            return errorContrato("no_encontrado", "Transacción no encontrada", 404)
        }

        if (transaccion.estado !== "pagado") {
            return errorContrato(
                "estado_invalido",
                `No se puede liberar fondos de una transacción en estado '${transaccion.estado}' (debe estar 'pagado')`,
                422
            )
        }

        const [transaccionActualizada] = await prisma.$transaction([
            prisma.transaccion.update({
                where: { id },
                data: { estado: "acreditado" },
            }),
            prisma.acreditacion.create({
                data: {
                    transaccion_id: id,
                    seller_id: transaccion.seller_id,
                    monto: transaccion.monto_acreditar,
                    estado: ACREDITACION_ACREDITADO,
                },
            }),
            // Si hay un Reclamo abierto sobre esta transacción, se cierra como
            // resuelto sin reembolso: liberar fondos a mano normalmente significa
            // que la disputa se resolvió a favor del vendedor.
            prisma.reclamo.updateMany({
                where: { transaccion_id: id, estado: "abierto" },
                data: { estado: "resuelto", fecha_resolucion: new Date(), monto_reembolso: 0 },
            }),
        ])

        return NextResponse.json({
            transaccionId: transaccionActualizada.id,
            estado: transaccionActualizada.estado,
            mensaje: motivo
                ? `Fondos liberados manualmente. Motivo: ${motivo}`
                : "Fondos liberados manualmente al vendedor.",
        })

    } catch (error) {
        console.error("Error en POST /api/payments/[id]/release:", error)
        return errorContrato("error_interno", "Error al liberar los fondos", 500)
    }
}