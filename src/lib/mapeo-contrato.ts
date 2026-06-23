import { ESTADOS_PAGO } from "@/lib/constants"

const [PAGO_PENDIENTE, PAGO_PAGADO, PAGO_FALLIDO] = ESTADOS_PAGO

/**
 * Traduce el vocabulario interno (constants.ts) al vocabulario que espera
 * 03-apis.md para hablar con otras apps. El estado interno en la base NUNCA
 * cambia — esto es pura capa de traducción en la respuesta/notificación.
 */
export function estadoAContrato(estadoInterno: string): "pendiente" | "aprobado" | "rechazado" {
    switch (estadoInterno) {
        case PAGO_PAGADO: return "aprobado"
        case PAGO_FALLIDO: return "rechazado"
        case PAGO_PENDIENTE:
        default: return "pendiente"
    }
}