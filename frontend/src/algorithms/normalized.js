import { computePageRank } from './pagerank.js';

export function computeNormalizedPageRank(edges, damping = 0.85, iterations = 50) {
  const raw = computePageRank(edges, damping, iterations);
  const min = Math.min(...Object.values(raw));
  const max = Math.max(...Object.values(raw));
  const normalized = {};
  const range = max - min || 1;
  Object.entries(raw).forEach(([node, value]) => {
    normalized[node] = (value - min) / range;
  });
  return normalized;
}
