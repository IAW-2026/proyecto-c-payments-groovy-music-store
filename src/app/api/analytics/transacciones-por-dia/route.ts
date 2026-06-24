import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requiereAuth } from "@/lib/auth-interservicios"
import { errorContrato } from "@/lib/error-contrato"
import { ESTADOS_TRANSACCION } from "@/lib/constants"

export async function GET(request: NextRequest) {
    const auth = await requiereAuth(request)
    if ("error" in auth) {
        return NextResponse.json(auth.error, { status: auth.status })
    }

    try {
        const { searchParams } = new URL(request.url)
        const desdeParam = searchParams.get("desde")
        const hastaParam = searchParams.get("hasta")

        // Construimos el filtro de fecha solo con los parámetros que vengan.
        // Si no mandan ninguno, traemos todo.
        const filtroFecha: { gte?: Date; lte?: Date } = {}
        if (desdeParam) {
            filtroFecha.gte = new Date(desdeParam) // ej. "2026-06-01"
        }
        if (hastaParam) {
            // Sumamos casi un día completo para que "hasta=2026-06-23" incluya
            // TODO el día 23 (hasta las 23:59:59), no solo el instante 00:00:00.
            const hasta = new Date(hastaParam)
            hasta.setHours(23, 59, 59, 999)
            filtroFecha.lte = hasta
        }

        const transacciones = await prisma.transaccion.findMany({
            where: Object.keys(filtroFecha).length > 0 ? { fecha: filtroFecha } : undefined,
            select: { fecha: true, estado: true },
            orderBy: { fecha: "asc" },
        })

        // Agrupamos en JS: un objeto por día, con un contador por cada estado.
        // Estructura intermedia: { "2026-06-23": { pendiente: 2, pagado: 1, ... } }
        const porDia = new Map<string, Record<string, number>>()

        for (const tx of transacciones) {
            // toISOString() da "2026-06-23T14:30:00.000Z"; cortamos en la T para
            // quedarnos solo con "2026-06-23" (el día en UTC).
            const dia = tx.fecha.toISOString().slice(0, 10)

            if (!porDia.has(dia)) {
                // Arrancamos cada día con todos los estados en 0, así el gráfico
                // siempre tiene las mismas series aunque ese día no haya, por ej, rechazos.
                const base: Record<string, number> = {}
                for (const estado of ESTADOS_TRANSACCION) base[estado] = 0
                porDia.set(dia, base)
            }

            porDia.get(dia)![tx.estado]++
        }

        // Pasamos el Map a un array ordenado por fecha, formato listo para graficar.
        const datos = Array.from(porDia.entries()).map(([dia, estados]) => ({
            dia,
            ...estados,
        }))

        return NextResponse.json({ datos })

    } catch (error) {
        console.error("Error en GET /api/analytics/transacciones-por-dia:", error)
        return errorContrato("error_interno", "Error al calcular la serie temporal", 500)
    }
}