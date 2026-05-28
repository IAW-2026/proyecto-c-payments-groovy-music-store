"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export default function Buscador() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Estado local para los inputs (para el debounce)
  const [query, setQuery] = useState(searchParams?.get("query") ?? "")
  const [buyerId, setBuyerId] = useState(searchParams?.get("buyerId") ?? "")
  const [sellerId, setSellerId] = useState(searchParams?.get("sellerId") ?? "")
  const [estado, setEstado] = useState(searchParams?.get("estado") ?? "")
  const [mostrarAvanzados, setMostrarAvanzados] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Función central que actualiza la URL
  const actualizarURL = (cambios: Record<string, string>) => {
    if (!pathname) return

    const params = new URLSearchParams(searchParams?.toString() ?? "")

    // Aplicar cambios
    Object.entries(cambios).forEach(([clave, valor]) => {
      if (valor) {
        params.set(clave, valor)
      } else {
        params.delete(clave)
      }
    })

    // Resetear paginación al cambiar filtros
    params.set("pagina", "1")

    const search = params.toString()
    router.replace(`${pathname}${search ? `?${search}` : ""}`)
  }

  // Actualización con debounce para campos de texto
  const actualizarConDebounce = (clave: string, valor: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      actualizarURL({ [clave]: valor })
    }, 300)
  }

  // Limpieza del timeout al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const limpiarFiltros = () => {
    setQuery("")
    setBuyerId("")
    setSellerId("")
    setEstado("")
    if (!pathname) return
    router.replace(pathname)
  }

  const hayFiltrosActivos = query || buyerId || sellerId || estado

  return (
    <div className="flex flex-col gap-3">
      {/* Barra principal */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            actualizarConDebounce("query", e.target.value)
          }}
          placeholder="Buscar por número de Transacción o de Orden"
          className="flex-1 px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          type="button"
          onClick={() => {
            const abriendo = !mostrarAvanzados
            setMostrarAvanzados(abriendo)

            // Si se está cerrando, limpiar los filtros avanzados de la URL
            if (!abriendo) {
              setBuyerId("")
              setSellerId("")
              setEstado("")
              actualizarURL({ buyerId: "", sellerId: "", estado: "" })
            }
          }}
          className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
            mostrarAvanzados
              ? "border-primary bg-primary text-white"
              : "border-border bg-card text-foreground hover:bg-card/80"
          }`}
        >
          Filtros avanzados
        </button>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="px-3 py-2 rounded-md border border-border bg-card text-muted text-sm hover:text-foreground transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Filtros avanzados (condicional) */}
      {mostrarAvanzados && (
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={buyerId}
            onChange={(e) => {
              setBuyerId(e.target.value)
              actualizarConDebounce("buyerId", e.target.value)
            }}
            placeholder="Buyer ID"
            className="flex-1 min-w-[150px] px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <input
            type="text"
            value={sellerId}
            onChange={(e) => {
              setSellerId(e.target.value)
              actualizarConDebounce("sellerId", e.target.value)
            }}
            placeholder="Seller ID"
            className="flex-1 min-w-[150px] px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value)
              actualizarURL({ estado: e.target.value }) // sin debounce
            }}
            className="px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="acreditado">Acreditado</option>
            <option value="fallido">Fallido</option>
            <option value="reembolsado">Reembolsado</option>
          </select>
        </div>
      )}
    </div>
  )
}