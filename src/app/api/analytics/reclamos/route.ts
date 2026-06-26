import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requiereAuth } from "@/lib/auth-interservicios"
import { errorContrato } from "@/lib/error-contrato"

export async function GET(request: NextRequest) {
    const auth = await requiereAuth(request)
    if ("error" in auth) {
        return NextResponse.json(auth.error, { status: auth.status })
    }

    try {
        const reclamos = await prisma.reclamo.findMany({
            select: { estado: true, fecha_apertura: true, fecha_resolucion: true },
        })

        const totalReclamos = reclamos.length
        const resueltos = reclamos.filter((r) => r.estado === "resuelto")
        const sinResolver = totalReclamos - resueltos.length

        const horasPorReclamo = resueltos
            .filter((r) => r.fecha_resolucion != null)
            .map(
                (r) =>
                    (r.fecha_resolucion!.getTime() - r.fecha_apertura.getTime()) / (1000 * 60 * 60)
            )

        const tiempoPromedioResolucionHoras =
            horasPorReclamo.length > 0
                ? Math.round(horasPorReclamo.reduce((acc, h) => acc + h, 0) / horasPorReclamo.length)
                : 0

        return NextResponse.json({
            totalReclamos,
            sinResolver,
            resueltos: resueltos.length,
            tiempoPromedioResolucionHoras,
        })
    } catch (error) {
        console.error("Error en GET /api/analytics/reclamos:", error)
        return errorContrato("error_interno", "Error al consultar reclamos", 500)
    }
}