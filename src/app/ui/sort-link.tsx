import Link from "next/link"

type Props = {
  label: string
  sortKey: string
  sortByParam?: string
  sortDirParam?: string
  currentSortBy: string
  currentSortDir: string
  baseParams: Record<string, string | undefined>
}

// Ciclo: sin orden → desc → asc → sin orden
export default function SortLink({
  label,
  sortKey,
  sortByParam = "sortBy",
  sortDirParam = "sortDir",
  currentSortBy,
  currentSortDir,
  baseParams,
}: Props) {
  const isActive = currentSortBy === sortKey

  let nextBy: string | null = sortKey
  let nextDir: "asc" | "desc" | null = "desc"

  if (isActive) {
    if (currentSortDir === "desc") {
      nextDir = "asc"
    } else {
      nextBy = null
      nextDir = null
    }
  }

  const params = new URLSearchParams()
  Object.entries(baseParams).forEach(([k, v]) => {
    if (v && k !== sortByParam && k !== sortDirParam && k !== "pagina") {
      params.set(k, v)
    }
  })
  if (nextBy && nextDir) {
    params.set(sortByParam, nextBy)
    params.set(sortDirParam, nextDir)
  }

  const icon = !isActive ? "↕" : currentSortDir === "desc" ? "↓" : "↑"

  return (
    <Link
      href={`?${params.toString()}`}
      scroll={false}
      className={`inline-flex items-center gap-1 whitespace-nowrap transition-opacity hover:opacity-75 ${
        isActive ? "text-primary" : ""
      }`}
    >
      {label}
      <span className="text-[10px] opacity-60">{icon}</span>
    </Link>
  )
}
