import { computePageRank } from './pagerank.js';
import { degreeMap, normalizeScores } from './utils.js';

export function computeFairPageRank(edges, damping = 0.85, maxIterations = 100, alpha = 0.7) {
  const raw = computePageRank(edges, damping, maxIterations);
  const degree = degreeMap(edges);
  const adjusted = {};

  Object.entries(raw).forEach(([node, value]) => {
    adjusted[node] = value / Math.pow(Math.max(degree[node] ?? 1, 1), alpha);
  });

  return normalizeScores(adjusted);
}
