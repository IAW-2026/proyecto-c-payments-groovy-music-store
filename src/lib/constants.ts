export const ESTADOS_TRANSACCION = ["pendiente", "pagado", "acreditado", "fallido", "reembolsado"] as const
export const ESTADOS_PAGO = ["pendiente", "pagado", "fallido"] as const
export const ESTADOS_ACREDITACION = ["acreditado"] as const

// Comisión de la plataforma: 15% sobre el costo del PRODUCTO
export const COMISION_PLATAFORMA = 0.15
