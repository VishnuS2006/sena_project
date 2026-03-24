export const ALGORITHM_META = [
  { key: "hits", label: "HITS", color: "#ef4444", scoreKey: "hitsScore" },
  { key: "pageRank", label: "PageRank", color: "#3b82f6", scoreKey: "pageRankScore" },
  {
    key: "personalizedPageRank",
    label: "Personalized PageRank",
    color: "#10b981",
    scoreKey: "personalizedPageRankScore",
  },
  {
    key: "degreeNormalizedPageRank",
    label: "Degree-Normalized PageRank",
    color: "#8b5cf6",
    scoreKey: "degreeNormalizedPageRankScore",
  },
]

export const ALGORITHM_LOOKUP = Object.fromEntries(
  ALGORITHM_META.map((algorithm) => [algorithm.key, algorithm]),
)

export function formatScore(value) {
  const numericValue = Number(value ?? 0)
  if (!Number.isFinite(numericValue)) {
    return "0.000000"
  }
  if (Math.abs(numericValue) >= 1) {
    return numericValue.toFixed(4)
  }
  return numericValue.toExponential(3)
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value ?? 0)
}

export function formatInteger(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0)
}

export function formatShift(value) {
  const numericValue = Number(value ?? 0)
  return numericValue > 0 ? `+${numericValue}` : `${numericValue}`
}

export function pickWinningAlgorithm(metricMap, direction = "min") {
  const entries = Object.entries(metricMap ?? {})
  if (!entries.length) {
    return null
  }

  return entries.reduce((best, current) => {
    if (!best) {
      return current
    }
    const [bestKey, bestValue] = best
    const [currentKey, currentValue] = current

    if (direction === "min") {
      return currentValue < bestValue ? [currentKey, currentValue] : [bestKey, bestValue]
    }
    return currentValue > bestValue ? [currentKey, currentValue] : [bestKey, bestValue]
  }, null)?.[0]
}

export function buildScatterSeries(rows) {
  if (!rows?.length) {
    return []
  }

  return ALGORITHM_META.map((algorithm) => ({
    ...algorithm,
    data: rows.map((row) => ({
      nodeId: row.nodeId,
      degree: row.degree ?? 0,
      score: row[algorithm.scoreKey] ?? 0,
      algorithm: algorithm.label,
    })),
  }))
}

export function buildTailVisibilityData(tailVisibility) {
  return ALGORITHM_META.map((algorithm) => ({
    key: algorithm.key,
    label:
      algorithm.key === "personalizedPageRank"
        ? "PPR"
        : algorithm.key === "degreeNormalizedPageRank"
          ? "DNPR"
          : algorithm.key === "pageRank"
            ? "PR"
            : "HITS",
    value: tailVisibility?.[algorithm.key] ?? 0,
    color: algorithm.color,
  }))
}

export function getGiniAccent(value) {
  const clampedValue = Math.max(0, Math.min(1, Number(value ?? 0)))
  const hue = Math.round((1 - clampedValue) * 120)
  return {
    border: `hsla(${hue}, 70%, 42%, 0.26)`,
    glow: `hsla(${hue}, 85%, 70%, 0.22)`,
    soft: `hsla(${hue}, 78%, 92%, 0.95)`,
    strong: `hsl(${hue}, 62%, 38%)`,
  }
}
