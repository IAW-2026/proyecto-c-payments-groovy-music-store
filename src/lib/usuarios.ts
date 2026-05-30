import { clerkClient } from "@clerk/nextjs/server"

/**
 * Dado un conjunto de IDs de Clerk (buyer_id / seller_id), devuelve un mapa
 * id -> nombre para mostrar. El nombre se arma con prioridad:
 * "nombre apellido" -> username -> email -> (no incluido).
 *
 * Si un ID no existe en Clerk o la consulta falla, ese ID NO aparece en el mapa,
 * por lo que el llamador debe usar el ID como fallback (ej: `nombres[id] ?? id`).
 */
export async function getNombresUsuarios(ids: string[]): Promise<Record<string, string>> {
  const unicos = [...new Set(ids.filter(Boolean))]
  const nombres: Record<string, string> = {}
  if (unicos.length === 0) return nombres

  try {
    const client = await clerkClient()
    const { data: usuarios } = await client.users.getUserList({
      userId: unicos,
      limit: 500,
    })
    for (const u of usuarios) {
      nombres[u.id] =
        [u.firstName, u.lastName].filter(Boolean).join(" ") ||
        u.username ||
        u.emailAddresses[0]?.emailAddress ||
        u.id
    }
  } catch {
    // Silencioso: el llamador usa el ID como fallback.
  }

  return nombres
}
