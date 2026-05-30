"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

type Props = {
  params: {
    query: string
    buyerId: string
    sellerId: string
    estado?: string
  }
  placeholder?: string
  estadoOpciones?: readonly string[]
}

export default function Buscador({ params, placeholder, estadoOpciones }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery]       = useState(searchParams?.get(params.query)   ?? "")
  const [buyerId, setBuyerId]   = useState(searchParams?.get(params.buyerId) ?? "")
  const [sellerId, setSellerId] = useState(searchParams?.get(params.sellerId) ?? "")
  const [estado, setEstado]     = useState(params.estado ? (searchParams?.get(params.estado) ?? "") : "")
  const [mostrarAvanzados, setMostrarAvanzados] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const actualizarURL = (cambios: Record<string, string>) => {
    if (!pathname) return
    const urlParams = new URLSearchParams(searchParams?.toString() ?? "")
    Object.entries(cambios).forEach(([clave, valor]) => {
      if (valor) urlParams.set(clave, valor)
      else urlParams.delete(clave)
    })
    router.replace(`${pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}`, { scroll: false })
  }

  const actualizarConDebounce = (clave: string, valor: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => actualizarURL({ [clave]: valor }), 300)
  }

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const limpiarFiltros = () => {
    setQuery(""); setBuyerId(""); setSellerId(""); setEstado("")
    const vacios: Record<string, string> = {
      [params.query]: "",
      [params.buyerId]: "",
      [params.sellerId]: "",
    }
    if (params.estado) vacios[params.estado] = ""
    actualizarURL(vacios)
  }

  const hayFiltrosActivos = query || buyerId || sellerId || estado

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            actualizarConDebounce(params.query, e.target.value)
          }}
          placeholder={placeholder ?? "Buscar..."}
          className="flex-1 px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={() => {
            const abriendo = !mostrarAvanzados
            setMostrarAvanzados(abriendo)
            if (!abriendo) {
              setBuyerId(""); setSellerId(""); setEstado("")
              const vacios: Record<string, string> = {
                [params.buyerId]: "",
                [params.sellerId]: "",
              }
              if (params.estado) vacios[params.estado] = ""
              actualizarURL(vacios)
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

      {mostrarAvanzados && (
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={buyerId}
            onChange={(e) => {
              setBuyerId(e.target.value)
              actualizarConDebounce(params.buyerId, e.target.value)
            }}
            placeholder="Buyer ID"
            className="flex-1 min-w-[150px] px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            value={sellerId}
            onChange={(e) => {
              setSellerId(e.target.value)
              actualizarConDebounce(params.sellerId, e.target.value)
            }}
            placeholder="Seller ID"
            className="flex-1 min-w-[150px] px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {params.estado && estadoOpciones && (
            <div className="relative">
              <select
                value={estado}
                onChange={(e) => {
                  setEstado(e.target.value)
                  actualizarURL({ [params.estado!]: e.target.value })
                }}
                className="appearance-none pl-3 pr-8 py-2 rounded-md border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos los estados</option>
                {estadoOpciones.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06-.02L10 10.586l3.71-3.397a.75.75 0 011.02 1.098l-4.2 3.846a.75.75 0 01-1.02 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
