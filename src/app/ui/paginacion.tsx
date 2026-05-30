"use client"

import React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

type PaginacionProps = {
	paginaActual: number
	tieneMasPaginas: boolean
}

export default function Paginacion({ paginaActual, tieneMasPaginas }: PaginacionProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const updatePage = (newPage: number) => {
		if (!pathname) return

		const params = new URLSearchParams(searchParams?.toString() ?? "")

		// Mantener 'query' u otros parámetros; siempre establecer 'pagina', incluso si es 1
		params.set("pagina", String(Math.max(1, newPage)))

		const search = params.toString()
		const url = `${pathname}${search ? `?${search}` : ""}`

		// Usamos push para que la navegación quede en el historial (back/forward)
		router.push(url)
	}

	const prevDisabled = paginaActual <= 1
	const nextDisabled = !tieneMasPaginas

	return (
		<nav className="flex items-center justify-center gap-3" aria-label="Paginación">
			<button
				type="button"
				onClick={() => updatePage(Math.max(1, paginaActual - 1))}
				disabled={prevDisabled}
				aria-disabled={prevDisabled}
				className={`inline-flex items-center px-3 py-1.5 rounded-md border border-border bg-card text-foreground text-sm font-medium hover:bg-card/95 ${
					prevDisabled ? "opacity-50 cursor-not-allowed" : ""
				}`}
			>
				Anterior
			</button>

			<span className="text-sm text-muted px-2">Página {paginaActual}</span>

			<button
				type="button"
				onClick={() => updatePage(paginaActual + 1)}
				disabled={nextDisabled}
				aria-disabled={nextDisabled}
				className={`inline-flex items-center px-3 py-1.5 rounded-md border border-border bg-primary text-white text-sm font-medium hover:bg-primary/90 ${
					nextDisabled ? "opacity-50 cursor-not-allowed" : ""
				}`}
			>
				Siguiente
			</button>
		</nav>
	)
}

