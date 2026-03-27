import { useDeferredValue, useState } from "react"

import { formatInteger, formatScore, formatShift } from "../lib/analytics"
import AnalyticsEmptyState from "./AnalyticsEmptyState"

const columns = [
  { key: "nodeId", label: "Node ID", type: "string" },
  { key: "degree", label: "Degree", type: "number" },
  { key: "hitsScore", label: "HITS Score", type: "number" },
  { key: "pageRankScore", label: "PageRank Score", type: "number" },
  { key: "personalizedPageRankScore", label: "Personalized PR Score", type: "number" },
  { key: "degreeNormalizedPageRankScore", label: "Degree-Normalized PR Score", type: "number" },
  { key: "rankShift", label: "Rank Difference (PR vs PPR)", type: "number" },
]

function compareRows(left, right, column, direction) {
  const multiplier = direction === "asc" ? 1 : -1
  const leftValue = left[column.key]
  const rightValue = right[column.key]

  if (column.type === "number") {
    if (leftValue === rightValue) {
      return String(left.nodeId).localeCompare(String(right.nodeId))
    }
    return (Number(leftValue) - Number(rightValue)) * multiplier
  }

  return String(leftValue).localeCompare(String(rightValue)) * multiplier
}

function formatCell(key, value) {
  if (key === "nodeId") {
    return value
  }
  if (key === "degree") {
    return formatInteger(value)
  }
  if (key === "rankShift") {
    return formatShift(value)
  }
  return formatScore(value)
}

export default function ComparisonTable({ rows }) {
  const [sortConfig, setSortConfig] = useState({ key: "rankShift", direction: "desc" })
  const deferredRows = useDeferredValue(rows)

  if (!deferredRows?.length) {
    return (
      <article className="section-shell">
        <AnalyticsEmptyState
          title="Top-50 comparison pending"
          description="Upload a dataset to inspect score changes, degree levels, and PageRank-to-personalized rank movement."
          className="min-h-[260px]"
        />
      </article>
    )
  }

  const column = columns.find((entry) => entry.key === sortConfig.key) ?? columns[0]
  const sortedRows = [...deferredRows].sort((left, right) =>
    compareRows(left, right, column, sortConfig.direction),
  )

  const changeSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key
          ? current.direction === "desc"
            ? "asc"
            : "desc"
          : key === "nodeId"
            ? "asc"
            : "desc",
    }))
  }

  return (
    <article className="section-shell">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.32em] text-stone-500">
            Top-50 Comparison Table
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">Sortable cross-algorithm node view</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Green rows improved under Personalized PageRank. Red rows lost rank relative to standard PageRank.
          </p>
        </div>
        <div className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm text-stone-600">
          Sorted by{" "}
          <span className="font-medium text-stone-800">
            {columns.find((entry) => entry.key === sortConfig.key)?.label}
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[26px] border border-white/70 bg-white/60">
        <div className="max-h-[720px] overflow-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-stone-100/95 backdrop-blur">
              <tr>
                {columns.map((entry) => (
                  <th key={entry.key} className="px-4 py-4 font-medium text-stone-700">
                    <button
                      type="button"
                      onClick={() => changeSort(entry.key)}
                      className="flex items-center gap-2 transition hover:text-ink"
                    >
                      <span>{entry.label}</span>
                      <span className="font-['IBM_Plex_Mono'] text-[11px] text-stone-400">
                        {sortConfig.key === entry.key
                          ? sortConfig.direction === "desc"
                            ? "v"
                            : "^"
                          : "<>"}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const rowTone =
                  row.rankShift > 0
                    ? "bg-emerald-50/75 hover:bg-emerald-50"
                    : row.rankShift < 0
                      ? "bg-rose-50/75 hover:bg-rose-50"
                      : "hover:bg-stone-50/80"
                const rankDeltaLabel =
                  row.rankShift > 0 ? "Improved" : row.rankShift < 0 ? "Dropped" : "Stable"

                return (
                  <tr key={row.nodeId} className={`border-t border-stone-200/70 transition ${rowTone}`}>
                    {columns.map((entry) => (
                      <td
                        key={entry.key}
                        className={`px-4 py-3 ${
                          entry.key === "rankShift"
                            ? row.rankShift > 0
                              ? "font-semibold text-emerald-700"
                              : row.rankShift < 0
                                ? "font-semibold text-rose-700"
                                : "text-stone-700"
                            : "text-stone-700"
                        }`}
                      >
                        {entry.key === "nodeId" ? (
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-ink">{row.nodeId}</span>
                            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em]">
                              <span
                                className={`rounded-full px-2 py-1 ${
                                  row.rankShift > 0
                                    ? "bg-emerald-100 text-emerald-700"
                                    : row.rankShift < 0
                                      ? "bg-rose-100 text-rose-700"
                                      : "bg-stone-100 text-stone-600"
                                }`}
                              >
                                {rankDeltaLabel}
                              </span>
                            </div>
                          </div>
                        ) : (
                          formatCell(entry.key, row[entry.key])
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  )
}
