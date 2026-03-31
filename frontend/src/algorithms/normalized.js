import { computePageRank } from './pagerank.js';
import { degreeMap, normalizeScores } from './utils.js';

export function computeNormalizedPageRank(edges, damping = 0.85, maxIterations = 100) {
  const raw = computePageRank(edges, damping, maxIterations);
  const degree = degreeMap(edges);
  const normalized = {};

  Object.entries(raw).forEach(([node, value]) => {
    normalized[node] = value / Math.max(degree[node] ?? 1, 1);
  });

  return normalizeScores(normalized);
}
