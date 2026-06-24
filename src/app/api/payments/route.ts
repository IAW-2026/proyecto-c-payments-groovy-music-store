import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requiereAuth } from "@/lib/auth-interservicios"
import { errorContrato } from "@/lib/error-contrato"
import { estadoAContrato } from "@/lib/mapeo-contrato"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
    const auth = await requiereAuth(request)
    if ("error" in auth) {
        return NextResponse.json(auth.error, { status: auth.status })
    }

    try {
        const { searchParams } = new URL(request.url)

        // --- Paginación (formato del contrato: ?pagina=1&limite=20) ---
        // parseInt con fallback: si no mandan el param o mandan basura, usamos el default.
        const pagina = Math.max(1, parseInt(searchParams.get("pagina") ?? "1", 10) || 1)
        const limite = Math.max(1, parseInt(searchParams.get("limite") ?? "20", 10) || 20)
        const skip = (pagina - 1) * limite  // cuántas filas saltear para llegar a esta página

        // --- Filtros opcionales ---
        const estado = searchParams.get("estado")
        const desdeParam = searchParams.get("desde")
        const hastaParam = searchParams.get("hasta")

        // Armamos el where solo con los filtros que efectivamente vengan.
        const where: Prisma.TransaccionWhereInput = {}
        if (estado) {
            where.estado = estado  // filtra por estado INTERNO (pagado, acreditado, etc.)
        }
        if (desdeParam || hastaParam) {
            where.fecha = {}
            if (desdeParam) where.fecha.gte = new Date(desdeParam)
            if (hastaParam) {
                const hasta = new Date(hastaParam)
                hasta.setHours(23, 59, 59, 999)
                where.fecha.lte = hasta
            }
        }

        // --- Dos consultas en paralelo: el total (para calcular totalPaginas) y la página actual ---
        // Necesitamos el total porque sin él no sabemos cuántas páginas hay en total.
        const [total, transacciones] = await Promise.all([
            prisma.transaccion.count({ where }),
            prisma.transaccion.findMany({
                where,
                orderBy: { fecha: "desc" },  // más recientes primero
                skip,
                take: limite,
                select: {
                    id: true,
                    order_id: true,
                    buyer_id: true,
                    seller_id: true,
                    monto_total: true,
                    estado: true,
                    fecha: true,
                },
            }),
        ])

        // Mapeamos cada fila al formato de salida, traduciendo el estado al vocabulario de contrato.
        const datos = transacciones.map((tx) => ({
            id: tx.id,
            ordenId: tx.order_id,
            buyerId: tx.buyer_id,
            sellerId: tx.seller_id,
            monto: tx.monto_total,
            estado: estadoAContrato(tx.estado),
            fecha: tx.fecha.toISOString(),
        }))

        return NextResponse.json({
            datos,
            paginacion: {
                página: pagina,
                limite,
                total,
                totalPaginas: Math.ceil(total / limite),
            },
        })

    } catch (error) {
        console.error("Error en GET /api/payments:", error)
        return errorContrato("error_interno", "Error al listar pagos", 500)
    }
}