import { buildAdjacency, normalizeScores } from './utils.js';

export function computePersonalizedPageRank(edges, personalization = {}, damping = 0.85, maxIterations = 100, tolerance = 1e-8) {
  const { nodes, incoming, outgoing } = buildAdjacency(edges);
  const n = nodes.length;
  if (!n) {
    return {};
  }

  const defaultWeight = 1 / n;
  const rawTeleport = Object.fromEntries(nodes.map((node) => [node, personalization[node] ?? defaultWeight]));
  const teleportTotal = Object.values(rawTeleport).reduce((sum, value) => sum + value, 0) || 1;
  const teleport = Object.fromEntries(nodes.map((node) => [node, rawTeleport[node] / teleportTotal]));
  let scores = Object.fromEntries(nodes.map((node) => [node, 1 / n]));

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const danglingMass = nodes
      .filter((node) => outgoing[node].length === 0)
      .reduce((sum, node) => sum + scores[node], 0);

    const nextScores = {};
    let delta = 0;

    nodes.forEach((node) => {
      const incomingScore = incoming[node].reduce((sum, parent) => {
        return sum + scores[parent] / Math.max(outgoing[parent].length, 1);
      }, 0);

      const next = (1 - damping) * teleport[node] + damping * (incomingScore + danglingMass * teleport[node]);
      nextScores[node] = next;
      delta += Math.abs(next - scores[node]);
    });

    scores = nextScores;
    if (delta < tolerance) {
      break;
    }
  }

  return normalizeScores(scores);
}
