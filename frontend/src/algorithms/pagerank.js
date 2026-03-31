export function computePageRank(edges, damping = 0.85, iterations = 50) {
  const nodes = Array.from(new Set(edges.flatMap(([u, v]) => [u, v])));
  const outgoing = nodes.reduce((acc, node) => ({ ...acc, [node]: [] }), {});
  const incoming = nodes.reduce((acc, node) => ({ ...acc, [node]: [] }), {});
  edges.forEach(([source, target]) => {
    outgoing[source].push(target);
    incoming[target].push(source);
  });
  const n = nodes.length;
  const scores = Object.fromEntries(nodes.map((node) => [node, 1 / n]));

  for (let i = 0; i < iterations; i += 1) {
    const nextScores = {};
    nodes.forEach((node) => {
      const incomingScore = incoming[node].reduce(
        (sum, parent) => sum + scores[parent] / Math.max(outgoing[parent].length, 1),
        0,
      );
      nextScores[node] = (1 - damping) / n + damping * incomingScore;
    });
    Object.assign(scores, nextScores);
  }

  return scores;
}
