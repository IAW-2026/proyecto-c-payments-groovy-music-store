import { ESTADOS_TRANSACCION } from "@/lib/constants"

const [
    TX_PENDIENTE,
    TX_PAGADO,
    TX_ACREDITADO,
    TX_FALLIDO,
    TX_REEMBOLSADO,
] = ESTADOS_TRANSACCION

/**
 * Traduce el vocabulario interno de Transaccion (5 estados, definidos en
 * ESTADOS_TRANSACCION) al vocabulario del contrato.
 * El estado interno en la base NUNCA cambia — esto es pura capa de respuesta.
 *
 * - pagado y acreditado se reportan ambos como "aprobado": desde la óptica de
 *   Buyer, el pago está aprobado en los dos casos. Que los fondos ya estén
 *   liberados al vendedor (acreditado) es información interna de Payments.
 */

export type EstadoContrato = "pendiente" | "aprobado" | "rechazado" | "reembolsado"

export function estadoAContrato(estadoInterno: string): EstadoContrato {
    switch (estadoInterno) {
        case TX_PENDIENTE: return "pendiente"
        case TX_PAGADO: return "aprobado"
        case TX_ACREDITADO: return "aprobado"
        case TX_FALLIDO: return "rechazado"
        case TX_REEMBOLSADO: return "reembolsado"
        default:
            // Estado no contemplado: lo devolvemos tal cual en vez de mentir con
            // "pendiente". Si esto aparece, es señal de que falta un case acá.
            console.warn(`[estadoAContrato] estado interno no mapeado: '${estadoInterno}'`)
            return "pendiente"
    }
}