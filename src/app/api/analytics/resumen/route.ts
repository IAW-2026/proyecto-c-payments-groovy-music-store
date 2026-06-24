import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requiereAuth } from "@/lib/auth-interservicios"
import { errorContrato } from "@/lib/error-contrato"
import { ESTADOS_TRANSACCION } from "@/lib/constants"

const [
    TX_PENDIENTE,
    TX_PAGADO,
    TX_ACREDITADO,
    TX_FALLIDO,
    TX_REEMBOLSADO,
] = ESTADOS_TRANSACCION

export async function GET(request: NextRequest) {
    const auth = await requiereAuth(request)
    if ("error" in auth) {
        return NextResponse.json(auth.error, { status: auth.status })
    }

    try {
        // Una sola consulta agrupada por estado: trae cuántas transacciones hay
        // en cada estado y la suma de montos de cada grupo. Mucho más eficiente
        // que hacer una query por estado.
        const grupos = await prisma.transaccion.groupBy({
            by: ["estado"],
            _count: { _all: true },
            _sum: { monto_total: true, monto_acreditar: true },
        })

        // Pasamos el array de grupos a un mapa para buscar cada estado por nombre
        // sin recorrer el array una y otra vez.
        const porEstado = new Map(grupos.map((g) => [g.estado, g]))

        const cantidad = (estado: string) => porEstado.get(estado)?._count._all ?? 0
        const sumaTotal = (estado: string) => porEstado.get(estado)?._sum.monto_total ?? 0
        const sumaAcreditar = (estado: string) => porEstado.get(estado)?._sum.monto_acreditar ?? 0

        // Total de transacciones (todas, sin importar estado)
        const totalTransacciones = grupos.reduce((acc, g) => acc + g._count._all, 0)

        // Volumen total transado: suma de monto_total de las que efectivamente
        // se cobraron (pagado + acreditado). Las pendientes/fallidas no son volumen real.
        const volumenTotal = sumaTotal(TX_PAGADO) + sumaTotal(TX_ACREDITADO)

        // Aprobadas = pagado + acreditado (el dinero entró en ambos casos).
        // Rechazadas = fallido.
        const aprobadas = cantidad(TX_PAGADO) + cantidad(TX_ACREDITADO)
        const rechazadas = cantidad(TX_FALLIDO)

        // % sobre el total de transacciones que ya tienen resultado (no las pendientes).
        const conResultado = aprobadas + rechazadas
        const pctAprobadas = conResultado > 0 ? (aprobadas / conResultado) * 100 : 0
        const pctRechazadas = conResultado > 0 ? (rechazadas / conResultado) * 100 : 0

        // Fondos retenidos = monto a acreditar de las "pagado" (cobradas pero aún
        // no entregadas). Liberados = monto a acreditar de las "acreditado".
        const fondosRetenidos = sumaAcreditar(TX_PAGADO)
        const fondosLiberados = sumaAcreditar(TX_ACREDITADO)

        return NextResponse.json({
            volumenTotal,
            totalTransacciones,
            transacciones: {
                pendientes: cantidad(TX_PENDIENTE),
                aprobadas,
                rechazadas,
                reembolsadas: cantidad(TX_REEMBOLSADO),
            },
            porcentajes: {
                aprobadas: Math.round(pctAprobadas * 100) / 100,
                rechazadas: Math.round(pctRechazadas * 100) / 100,
            },
            fondos: {
                retenidos: fondosRetenidos,
                liberados: fondosLiberados,
            },
        })

    } catch (error) {
        console.error("Error en GET /api/analytics/resumen:", error)
        return errorContrato("error_interno", "Error al calcular el resumen", 500)
    }
}