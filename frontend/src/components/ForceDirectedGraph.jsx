import { useEffect, useMemo, useState } from 'react';
import { forceCenter, forceLink, forceManyBody, forceSimulation } from 'd3-force';

function ForceDirectedGraph({ graph }) {
  const [hovered, setHovered] = useState(null);

  const localGraph = useMemo(() => {
    if (!graph?.nodes?.length) {
      return { nodes: [], links: [] };
    }
    return {
      nodes: graph.nodes.map((node) => ({ ...node })),
      links: graph.links.map((link) => ({ ...link })),
    };
  }, [graph]);

  useEffect(() => {
    if (!localGraph.nodes.length) {
      return undefined;
    }

    const width = 760;
    const height = 460;
    const simulation = forceSimulation(localGraph.nodes)
      .force('link', forceLink(localGraph.links).id((node) => node.id).distance(48).strength(0.7))
      .force('charge', forceManyBody().strength(-120))
      .force('center', forceCenter(width / 2, height / 2))
      .stop();

    for (let i = 0; i < 180; i += 1) {
      simulation.tick();
    }

    return () => simulation.stop();
  }, [localGraph]);

  if (!localGraph.nodes.length) {
    return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-500">No graph available yet.</div>;
  }

  return (
    <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Marketplace graph sample</h3>
          <p className="text-sm text-slate-500">Head nodes are expanded with nearby neighbors so the structure stays connected and readable.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Tail</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Mid</span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Head</span>
        </div>
      </div>
      <svg viewBox="0 0 760 460" className="h-[460px] w-full rounded-[24px] bg-slate-50">
        {localGraph.links.map((link, index) => (
          <line
            key={`${link.source.id ?? link.source}-${link.target.id ?? link.target}-${index}`}
            x1={link.source.x}
            y1={link.source.y}
            x2={link.target.x}
            y2={link.target.y}
            stroke="#cbd5e1"
            strokeOpacity="0.7"
            strokeWidth="1.1"
          />
        ))}
        {localGraph.nodes.map((node) => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            onMouseEnter={() => setHovered(node)}
            onMouseLeave={() => setHovered(null)}
          >
            <circle
              r={Math.max(5, Math.min(18, 4 + node.degree * 0.45))}
              fill={node.group === 'head' ? '#f59e0b' : node.group === 'mid' ? '#16a34a' : '#2563eb'}
              fillOpacity="0.9"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {hovered
          ? `Node ${hovered.id} · degree ${hovered.degree} · in ${hovered.in_degree ?? 0} · out ${hovered.out_degree ?? 0}`
          : 'Hover a node to inspect marketplace prominence and long-tail structure.'}
      </div>
    </div>
  );
}

export default ForceDirectedGraph;
