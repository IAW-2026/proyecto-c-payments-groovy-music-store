export const MOTIVOS_RECLAMO = [
  {
    clave: "PRODUCTO_DANADO",
    label: "El producto llegó dañado",
  },
  {
    clave: "FUERA_DE_PLAZO",
    label: "Entrega fuera de plazo",
  },
  {
    clave: "PRODUCTO_INCORRECTO",
    label: "Llegó otro producto",
  },
  {
    clave: "OTROS",
    label: "Otros",
  },
  {
    clave: "PROBLEMA_PAGO",
    label: "Problema con pago",
  },
] as const

export type ClaveMotivo = typeof MOTIVOS_RECLAMO[number]["clave"]

export function getLabelMotivo(clave: string): string {
  return MOTIVOS_RECLAMO.find((m) => m.clave === clave)?.label ?? clave
}