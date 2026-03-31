import { buildAdjacency } from './utils.js';

export function computeHITS(edges, maxIterations = 100, tolerance = 1e-8) {
  const { nodes, incoming, outgoing } = buildAdjacency(edges);
  if (!nodes.length) {
    return { authority: {}, hub: {} };
  }

  let authority = Object.fromEntries(nodes.map((node) => [node, 1]));
  let hub = Object.fromEntries(nodes.map((node) => [node, 1]));

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const nextAuthority = {};
    nodes.forEach((node) => {
      nextAuthority[node] = incoming[node].reduce((sum, parent) => sum + hub[parent], 0);
    });

    const authorityNorm = Math.sqrt(Object.values(nextAuthority).reduce((sum, value) => sum + value ** 2, 0)) || 1;
    nodes.forEach((node) => {
      nextAuthority[node] /= authorityNorm;
    });

    const nextHub = {};
    nodes.forEach((node) => {
      nextHub[node] = outgoing[node].reduce((sum, child) => sum + nextAuthority[child], 0);
    });

    const hubNorm = Math.sqrt(Object.values(nextHub).reduce((sum, value) => sum + value ** 2, 0)) || 1;
    nodes.forEach((node) => {
      nextHub[node] /= hubNorm;
    });

    const delta = nodes.reduce((sum, node) => sum + Math.abs(nextAuthority[node] - authority[node]) + Math.abs(nextHub[node] - hub[node]), 0);
    authority = nextAuthority;
    hub = nextHub;

    if (delta < tolerance) {
      break;
    }
  }

  const authorityTotal = Object.values(authority).reduce((sum, value) => sum + Math.abs(value), 0) || 1;
  const hubTotal = Object.values(hub).reduce((sum, value) => sum + Math.abs(value), 0) || 1;

  return {
    authority: Object.fromEntries(Object.entries(authority).map(([node, value]) => [node, Math.abs(value) / authorityTotal])),
    hub: Object.fromEntries(Object.entries(hub).map(([node, value]) => [node, Math.abs(value) / hubTotal])),
  };
}
