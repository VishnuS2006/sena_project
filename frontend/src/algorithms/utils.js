export function getNodes(edges) {
  return Array.from(new Set(edges.flatMap(([source, target]) => [String(source), String(target)])));
}

export function buildAdjacency(edges) {
  const nodes = getNodes(edges);
  const incoming = Object.fromEntries(nodes.map((node) => [node, []]));
  const outgoing = Object.fromEntries(nodes.map((node) => [node, []]));
  edges.forEach(([source, target]) => {
    const s = String(source);
    const t = String(target);
    outgoing[s].push(t);
    incoming[t].push(s);
  });
  return { nodes, incoming, outgoing };
}

export function degreeMap(edges) {
  const { nodes } = buildAdjacency(edges);
  const degree = Object.fromEntries(nodes.map((node) => [node, 0]));
  edges.forEach(([source, target]) => {
    degree[String(source)] += 1;
    degree[String(target)] += 1;
  });
  return degree;
}

export function normalizeScores(scores) {
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0) || 1;
  return Object.fromEntries(Object.entries(scores).map(([node, value]) => [node, value / total]));
}

export function sortScores(scores, edges) {
  const degree = degreeMap(edges);
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      rank: index + 1,
      name,
      value,
      degree: degree[name] ?? 0,
    }));
}
