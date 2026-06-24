import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requiereAuth } from "@/lib/auth-interservicios"
import { errorContrato } from "@/lib/error-contrato"
import { ESTADOS_TRANSACCION } from "@/lib/constants"

const [TX_PENDIENTE, TX_PAGADO, TX_ACREDITADO, TX_FALLIDO, TX_REEMBOLSADO] = ESTADOS_TRANSACCION

export async function GET(request: NextRequest) {
    const auth = await requiereAuth(request)
    if ("error" in auth) {
        return NextResponse.json(auth.error, { status: auth.status })
    }

    try {
        const grupos = await prisma.transaccion.groupBy({
            by: ["estado"],
            _count: { _all: true },
            _sum: { monto_total: true, monto_acreditar: true },
        })

        const porEstado = new Map(grupos.map((g) => [g.estado, g]))
        const cantidad = (e: string) => porEstado.get(e)?._count._all ?? 0
        const sumaTotal = (e: string) => porEstado.get(e)?._sum.monto_total ?? 0
        const sumaAcreditar = (e: string) => porEstado.get(e)?._sum.monto_acreditar ?? 0

        const aprobadas = cantidad(TX_PAGADO) + cantidad(TX_ACREDITADO)
        const rechazadas = cantidad(TX_FALLIDO)
        const conResultado = aprobadas + rechazadas

        return NextResponse.json({
            volumenTotal: sumaTotal(TX_PAGADO) + sumaTotal(TX_ACREDITADO),
            porcentajeAprobados: conResultado > 0 ? Math.round((aprobadas / conResultado) * 1000) / 10 : 0,
            porcentajeRechazados: conResultado > 0 ? Math.round((rechazadas / conResultado) * 1000) / 10 : 0,
            fondosRetenidos: sumaAcreditar(TX_PAGADO),
            fondosLiberados: sumaAcreditar(TX_ACREDITADO),
        })

    } catch (error) {
        console.error("Error en GET /api/analytics/resumen:", error)
        return errorContrato("error_interno", "Error al calcular el resumen", 500)
    }
}