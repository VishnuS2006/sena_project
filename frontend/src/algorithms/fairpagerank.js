import { computePageRank } from './pagerank.js';

export function computeFairPageRank(edges, damping = 0.85, iterations = 50, alpha = 0.7) {
  const nodes = Array.from(new Set(edges.flatMap(([u, v]) => [u, v])));
  const degree = nodes.reduce((acc, node) => ({ ...acc, [node]: 0 }), {});
  edges.forEach(([u, v]) => {
    degree[u] += 1;
    degree[v] += 1;
  });

  const rawScores = computePageRank(edges, damping, iterations);
  const fairnessAdjusted = {};
  const normalization = Object.values(rawScores).reduce((sum, score) => sum + score, 0);

  nodes.forEach((node) => {
    const penalty = Math.pow(Math.max(degree[node], 1), alpha);
    fairnessAdjusted[node] = rawScores[node] / penalty;
  });

  const adjustedNorm = Object.values(fairnessAdjusted).reduce((sum, score) => sum + score, 0) || 1;
  nodes.forEach((node) => {
    fairnessAdjusted[node] = fairnessAdjusted[node] / adjustedNorm;
  });

  return fairnessAdjusted;
}
