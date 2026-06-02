"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useRef, useEffect, useState } from "react"
import { ESTADOS_TRANSACCION } from "@/lib/constants"

export default function FiltrosVendedor() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const [query,  setQuery]  = useState(searchParams.get("query")  ?? "")
  const [estado, setEstado] = useState(searchParams.get("estado") ?? "")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  function pushParams(cambios: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(cambios).forEach(([k, v]) => {
      if (v) sp.set(k, v); else sp.delete(k)
    })
    sp.delete("pagina")
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  function onQuery(v: string) {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => pushParams({ query: v }), 300)
  }

  function onEstado(v: string) {
    setEstado(v)
    pushParams({ query, estado: v })
  }

  const hayFiltros = query || estado

  return (
    <div className="flex gap-2 items-center">
      <label htmlFor="filtro-transaccion" className="sr-only">
        Buscar por ID de transacción u orden
      </label>
      <input
        id="filtro-transaccion"
        type="text"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Buscar por ID de transacción u orden"
        className="flex-1 px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <label htmlFor="estado-filtros-vendedor" className="sr-only">
        Filtrar por estado
      </label>
      <select
        id="estado-filtros-vendedor"
        value={estado}
        onChange={(e) => onEstado(e.target.value)}
        className="px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Todos los estados</option>
        {ESTADOS_TRANSACCION.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
      {hayFiltros && (
        <button
          type="button"
          onClick={() => { setQuery(""); setEstado(""); pushParams({ query: "", estado: "" }) }}
          className="px-3 py-2 rounded-md border border-border bg-card text-muted text-sm hover:text-foreground transition-colors"
        >
          Limpiar
        </button>
      )}
    </div>
  )
}
