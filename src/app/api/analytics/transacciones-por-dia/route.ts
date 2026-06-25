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
        const { searchParams } = new URL(request.url)
        const desdeParam = searchParams.get("desde")
        const hastaParam = searchParams.get("hasta")

        const filtroFecha: { gte?: Date; lte?: Date } = {}
        if (desdeParam) filtroFecha.gte = new Date(desdeParam)
        if (hastaParam) {
            const hasta = new Date(hastaParam)
            hasta.setHours(23, 59, 59, 999)
            filtroFecha.lte = hasta
        }

        const transacciones = await prisma.transaccion.findMany({
            where: Object.keys(filtroFecha).length > 0 ? { fecha: filtroFecha } : undefined,
            select: { fecha: true, monto_total: true },
            orderBy: { fecha: "asc" },
        })

        const porDia = new Map<string, { cantidad: number; monto: number }>()
        for (const tx of transacciones) {
            const dia = tx.fecha.toISOString().slice(0, 10)
            if (!porDia.has(dia)) porDia.set(dia, { cantidad: 0, monto: 0 })
            const entry = porDia.get(dia)!
            entry.cantidad += 1
            entry.monto += Number(tx.monto_total)
        }

        const resultado = Array.from(porDia.entries()).map(([fecha, v]) => ({ fecha, ...v }))

        return NextResponse.json(resultado)  // 👈 array directo, SIN { datos: [...] }

    } catch (error) {
        console.error("Error en GET /api/analytics/transacciones-por-dia:", error)
        return errorContrato("error_interno", "Error al calcular la serie temporal", 500)
    }
}