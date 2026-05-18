import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function AdminPage() {

  // Si no hay sesión activa, userId es null
  const { userId, sessionClaims } = await auth() //objeto con informacion del usuario logueado

  // Si no esta usuario logueado, mandamos al login
  if (!userId) {
    redirect("/sign-in")
  }

  /* -------------------------DESCOMENTAR !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  / si usuario no tiene rol admin_payments, lo mandamos al login 
  const roles = (sessionClaims?.roles as string[]) ?? []
  if (!roles.includes("admin_payments")) {
    redirect("/sign-in")
  }
    */

  // Si llegó hasta acá, el usuario es admin
  // Consultamos los datos de la DB usando Prisma
  const transacciones = await prisma.transaccion.findMany({
    orderBy: { fecha: "desc" },
    take: 20, // traemos las últimas 20
  })

  const reclamos = await prisma.reclamo.findMany({
    where: { estado: "abierto" },
    orderBy: { fecha_apertura: "desc" },
  })

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-8">Panel de Administración</h1>

      {/* Listado de transacciones */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          Últimas Transacciones
        </h2>
        {transacciones.length === 0 ? (
          <p className="text-gray-500">No hay transacciones todavía.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 p-2 text-left">ID</th>
                <th className="border border-gray-200 p-2 text-left">Monto</th>
                <th className="border border-gray-200 p-2 text-left">Estado</th>
                <th className="border border-gray-200 p-2 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {transacciones.map((t) => (
                <tr key={t.id}>
                  <td className="border border-gray-200 p-2">{t.id}</td>
                  <td className="border border-gray-200 p-2">${t.monto_total}</td>
                  <td className="border border-gray-200 p-2">{t.estado}</td>
                  <td className="border border-gray-200 p-2">
                    {new Date(t.fecha).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Listado de reclamos abiertos */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Reclamos Abiertos
        </h2>
        {reclamos.length === 0 ? (
          <p className="text-gray-500">No hay reclamos abiertos.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 p-2 text-left">ID</th>
                <th className="border border-gray-200 p-2 text-left">Motivo</th>
                <th className="border border-gray-200 p-2 text-left">Estado</th>
                <th className="border border-gray-200 p-2 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {reclamos.map((r) => (
                <tr key={r.id}>
                  <td className="border border-gray-200 p-2">{r.id}</td>
                  <td className="border border-gray-200 p-2">{r.motivo}</td>
                  <td className="border border-gray-200 p-2">{r.estado}</td>
                  <td className="border border-gray-200 p-2">
                    {new Date(r.fecha_apertura).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}