export const ALGORITHM_META = [
  { key: "hits", label: "HITS", color: "#ff5d6c" },
  { key: "pr", label: "PageRank", color: "#56a3ff" },
  { key: "ppr", label: "Personalized PR", color: "#48d597" },
  { key: "dnpr", label: "Degree-Normalized PR", color: "#a873ff" },
];

export const ALGORITHM_LOOKUP = Object.fromEntries(
  ALGORITHM_META.map((entry) => [entry.key, entry]),
);

export function formatScore(value) {
  if (!Number.isFinite(value)) {
    return "0.000000";
  }
  return Number(value).toFixed(6);
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

export function formatShift(value) {
  const numericValue = Number(value ?? 0);
  return numericValue > 0 ? `+${numericValue}` : `${numericValue}`;
}

export function buildScatterSeries(analysis) {
  if (!analysis) {
    return [];
  }

  return ALGORITHM_META.map((algorithm) => ({
    ...algorithm,
    data: analysis.nodes.map((nodeId) => ({
      node_id: nodeId,
      degree: analysis.degree[nodeId] ?? 0,
      score: analysis.scores[algorithm.key][nodeId] ?? 0,
      algorithm: algorithm.label,
    })),
  }));
}

export function buildTailVisibilityData(tailVisibility) {
  return ALGORITHM_META.map((algorithm) => ({
    key: algorithm.key,
    label: algorithm.label,
    value: tailVisibility?.[algorithm.key] ?? 0,
    color: algorithm.color,
  }));
}

export function buildRankShiftBins(rankShiftRows, targetBinCount = 14) {
  if (!rankShiftRows?.length) {
    return [];
  }

  const shifts = rankShiftRows.map((row) => Number(row.shift));
  const minShift = Math.min(...shifts);
  const maxShift = Math.max(...shifts);
  const range = maxShift - minShift + 1;
  const step = Math.max(1, Math.ceil(range / targetBinCount));
  const start = Math.floor(minShift / step) * step;
  const end = Math.ceil((maxShift + 1) / step) * step - 1;

  const bins = [];
  for (let rangeStart = start; rangeStart <= end; rangeStart += step) {
    const rangeEnd = Math.min(end, rangeStart + step - 1);
    bins.push({
      rangeStart,
      rangeEnd,
      label: rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart} to ${rangeEnd}`,
      count: 0,
    });
  }

  shifts.forEach((shift) => {
    const rawIndex = Math.floor((shift - start) / step);
    const index = Math.max(0, Math.min(bins.length - 1, rawIndex));
    bins[index].count += 1;
  });

  return bins.map((bin) => {
    const midpoint = (bin.rangeStart + bin.rangeEnd) / 2;
    return {
      ...bin,
      trend: midpoint > 0 ? "positive" : midpoint < 0 ? "negative" : "neutral",
    };
  });
}

export function pickWinningAlgorithm(metricMap, direction = "min") {
  const entries = Object.entries(metricMap ?? {});
  if (!entries.length) {
    return null;
  }

  return entries.reduce((best, current) => {
    if (!best) {
      return current;
    }

    const [bestKey, bestValue] = best;
    const [currentKey, currentValue] = current;
    if (direction === "min") {
      return currentValue < bestValue ? [currentKey, currentValue] : [bestKey, bestValue];
    }
    return currentValue > bestValue ? [currentKey, currentValue] : [bestKey, bestValue];
  }, null)?.[0];
}
