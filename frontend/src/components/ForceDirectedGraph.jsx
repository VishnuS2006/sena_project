import { useEffect, useMemo, useState } from 'react';
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force';

const DEGREE_PALETTE = ['#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#4f46e5', '#7c3aed', '#a21caf', '#e11d48', '#dc2626', '#f97316', '#d97706', '#84cc16', '#65a30d', '#0f766e'];
const CANVAS_WIDTH = 820;
const CANVAS_HEIGHT = 620;
const PADDING = 40;

function buildDegreeColorMap(nodes) {
  const degrees = [...new Set(nodes.map((node) => Number(node.degree ?? 0)))].sort((a, b) => a - b);
  return new Map(degrees.map((degree, index) => [degree, DEGREE_PALETTE[index % DEGREE_PALETTE.length]]));
}

function nodeRadius(node) {
  return Math.max(2.5, Math.min(8, 2.2 + Number(node.degree ?? 0) * 0.35));
}

function connectedComponents(nodes, links) {
  const adjacency = new Map(nodes.map((node) => [node.id, new Set()]));
  links.forEach((link) => {
    const source = typeof link.source === 'object' ? link.source.id : link.source;
    const target = typeof link.target === 'object' ? link.target.id : link.target;
    if (adjacency.has(source) && adjacency.has(target)) {
      adjacency.get(source).add(target);
      adjacency.get(target).add(source);
    }
  });

  const visited = new Set();
  const components = [];
  nodes.forEach((node) => {
    if (visited.has(node.id)) {
      return;
    }
    const queue = [node.id];
    const component = [];
    visited.add(node.id);
    while (queue.length) {
      const current = queue.shift();
      component.push(current);
      adjacency.get(current)?.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }
    components.push(component);
  });

  return components.sort((a, b) => b.length - a.length);
}

function layoutCluster(nodes, links, centerX, centerY, radius) {
  const localNodes = nodes.map((node) => ({ ...node }));
  const ids = new Set(localNodes.map((node) => node.id));
  const localLinks = links
    .filter((link) => {
      const source = typeof link.source === 'object' ? link.source.id : link.source;
      const target = typeof link.target === 'object' ? link.target.id : link.target;
      return ids.has(source) && ids.has(target);
    })
    .map((link) => ({
      source: typeof link.source === 'object' ? link.source.id : link.source,
      target: typeof link.target === 'object' ? link.target.id : link.target,
    }));

  const simulation = forceSimulation(localNodes)
    .force('link', forceLink(localLinks).id((node) => node.id).distance(28).strength(0.55))
    .force('charge', forceManyBody().strength(-55))
    .force('collide', forceCollide().radius((node) => nodeRadius(node) + 1.8))
    .force('center', forceCenter(0, 0))
    .stop();

  for (let i = 0; i < 180; i += 1) {
    simulation.tick();
  }
  simulation.stop();

  const xValues = localNodes.map((node) => node.x ?? 0);
  const yValues = localNodes.map((node) => node.y ?? 0);
  const minX = Math.min(...xValues, 0);
  const maxX = Math.max(...xValues, 1);
  const minY = Math.min(...yValues, 0);
  const maxY = Math.max(...yValues, 1);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min((radius * 2) / spanX, (radius * 2) / spanY, 1.8);

  return localNodes.map((node) => ({
    ...node,
    fx: centerX + ((node.x ?? 0) - (minX + spanX / 2)) * scale,
    fy: centerY + ((node.y ?? 0) - (minY + spanY / 2)) * scale,
  }));
}

function layoutGraph(nodes, links) {
  if (!nodes.length) {
    return [];
  }

  const components = connectedComponents(nodes, links);
  const centers = [
    [CANVAS_WIDTH * 0.56, CANVAS_HEIGHT * 0.20],
    [CANVAS_WIDTH * 0.20, CANVAS_HEIGHT * 0.42],
    [CANVAS_WIDTH * 0.53, CANVAS_HEIGHT * 0.52],
    [CANVAS_WIDTH * 0.74, CANVAS_HEIGHT * 0.55],
    [CANVAS_WIDTH * 0.30, CANVAS_HEIGHT * 0.78],
    [CANVAS_WIDTH * 0.86, CANVAS_HEIGHT * 0.25],
    [CANVAS_WIDTH * 0.62, CANVAS_HEIGHT * 0.82],
    [CANVAS_WIDTH * 0.12, CANVAS_HEIGHT * 0.15],
  ];
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return components.flatMap((component, index) => {
    const members = component.map((id) => nodeMap.get(id)).filter(Boolean);
    const [centerX, centerY] = centers[index] ?? [
      PADDING + ((index % 4) + 0.5) * ((CANVAS_WIDTH - PADDING * 2) / 4),
      PADDING + (Math.floor(index / 4) + 0.5) * ((CANVAS_HEIGHT - PADDING * 2) / 3),
    ];
    const radius = Math.max(28, Math.min(110, 18 + members.length * 4.2));
    return layoutCluster(members, links, centerX, centerY, radius);
  });
}

function ForceDirectedGraph({ graph }) {
  const [hovered, setHovered] = useState(null);
  const [zoom, setZoom] = useState(1);

  const localGraph = useMemo(() => {
    if (!graph?.nodes?.length) {
      return { nodes: [], links: [] };
    }

    const nodes = graph.nodes.map((node) => ({ ...node }));
    const links = graph.links.map((link) => ({ ...link }));
    return {
      nodes: layoutGraph(nodes, links),
      links,
    };
  }, [graph]);

  const degreeColors = useMemo(() => buildDegreeColorMap(localGraph.nodes), [localGraph.nodes]);
  const legendDegrees = useMemo(() => [...degreeColors.entries()].slice(0, 8), [degreeColors]);

  useEffect(() => {
    setHovered(null);
  }, [graph]);

  if (!localGraph.nodes.length) {
    return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-500">No graph available yet.</div>;
  }

  const scaledWidth = Math.round(CANVAS_WIDTH * zoom);
  const scaledHeight = Math.round(CANVAS_HEIGHT * zoom);

  return (
    <div className="min-w-0 space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Marketplace graph sample</h3>
          <p className="text-sm text-slate-500">The graph is fixed after layout, all sampled nodes are fitted inside the canvas, and same-degree vertices share the same color.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {legendDegrees.map(([degree, color]) => (
            <span key={degree} className="rounded-full px-3 py-1" style={{ backgroundColor: `${color}1A`, color }}>
              Degree {degree}
            </span>
          ))}
          <button type="button" onClick={() => setZoom((value) => Math.max(0.8, Number((value - 0.2).toFixed(2))))} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">-</button>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{Math.round(zoom * 100)}%</div>
          <button type="button" onClick={() => setZoom((value) => Math.min(2, Number((value + 0.2).toFixed(2))))} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">+</button>
          <button type="button" onClick={() => setZoom(1)} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Reset</button>
        </div>
      </div>
      <div className="overflow-auto rounded-[24px] border border-slate-100 bg-slate-50 p-2">
        <svg viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} width={scaledWidth} height={scaledHeight} preserveAspectRatio="xMidYMid meet" className="block rounded-[20px] bg-slate-50">
          {localGraph.links.map((link, index) => {
            const source = typeof link.source === 'object' ? link.source : localGraph.nodes.find((node) => node.id === link.source);
            const target = typeof link.target === 'object' ? link.target : localGraph.nodes.find((node) => node.id === link.target);
            if (!source || !target) {
              return null;
            }
            return (
              <path
                key={`${source.id}-${target.id}-${index}`}
                d={`M ${source.fx} ${source.fy} Q ${(source.fx + target.fx) / 2} ${((source.fy + target.fy) / 2) - 10} ${target.fx} ${target.fy}`}
                stroke={degreeColors.get(Number(source.degree ?? 0)) ?? '#94a3b8'}
                fill="none"
                strokeOpacity="0.24"
                strokeWidth="0.8"
              />
            );
          })}
          {localGraph.nodes.map((node) => (
            <g
              key={node.id}
              transform={`translate(${node.fx}, ${node.fy})`}
              onMouseEnter={() => setHovered(node)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle r={nodeRadius(node)} fill={degreeColors.get(Number(node.degree ?? 0)) ?? '#64748b'} fillOpacity="0.95" stroke="#ffffff" strokeWidth="1" />
            </g>
          ))}
        </svg>
      </div>
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {hovered
          ? `Node ${hovered.id} · degree ${hovered.degree} · in ${hovered.in_degree ?? 0} · out ${hovered.out_degree ?? 0} · all degree-${hovered.degree} nodes share this color`
          : 'Hover a node to inspect degree and connectivity. Zoom changes size only; it does not recompute the graph.'}
      </div>
    </div>
  );
}

export default ForceDirectedGraph;
