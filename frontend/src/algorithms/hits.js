export function computeHITS(edges, iterations = 20) {
  const nodes = Array.from(new Set(edges.flatMap(([u, v]) => [u, v])));
  const auth = Object.fromEntries(nodes.map((node) => [node, 1]));
  const hub = Object.fromEntries(nodes.map((node) => [node, 1]));
  const inLinks = nodes.reduce((acc, node) => ({ ...acc, [node]: [] }), {});
  const outLinks = nodes.reduce((acc, node) => ({ ...acc, [node]: [] }), {});
  edges.forEach(([source, target]) => {
    outLinks[source].push(target);
    inLinks[target].push(source);
  });

  for (let i = 0; i < iterations; i += 1) {
    nodes.forEach((node) => {
      auth[node] = inLinks[node].reduce((sum, child) => sum + hub[child], 0);
    });
    const authNorm = Math.sqrt(Object.values(auth).reduce((sum, value) => sum + value * value, 0));
    nodes.forEach((node) => {
      auth[node] = authNorm ? auth[node] / authNorm : auth[node];
    });
    nodes.forEach((node) => {
      hub[node] = outLinks[node].reduce((sum, child) => sum + auth[child], 0);
    });
    const hubNorm = Math.sqrt(Object.values(hub).reduce((sum, value) => sum + value * value, 0));
    nodes.forEach((node) => {
      hub[node] = hubNorm ? hub[node] / hubNorm : hub[node];
    });
  }

  return { authority: auth, hub };
}
