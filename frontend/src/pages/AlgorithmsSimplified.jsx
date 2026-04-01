import { useMemo } from 'react';
import { computeFairPageRank } from '../algorithms/fairpagerank.js';
import { computeHITS } from '../algorithms/hits.js';
import { computeNormalizedPageRank } from '../algorithms/normalized.js';
import { computePageRank } from '../algorithms/pagerank.js';
import { computePersonalizedPageRank } from '../algorithms/personalized.js';
import { GraphChart } from '../components/GraphChart.jsx';

const DEMO_EDGES = [
  ['A', 'B'],
  ['A', 'C'],
  ['B', 'C'],
  ['C', 'D'],
  ['D', 'E'],
];
const NODES = ['A', 'B', 'C', 'D', 'E'];
const COLORS = {
  hits: '#2563eb',
  pagerank: '#16a34a',
  fair: '#f59e0b',
  personalized: '#7c3aed',
  normalized: '#0f766e',
};

function normalizeMap(map) {
  const values = NODES.map((node) => Number(map[node] ?? 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  return Object.fromEntries(NODES.map((node) => {
    const raw = Number(map[node] ?? 0);
    const value = max === min ? 1 : (raw - min) / (max - min);
    return [node, value];
  }));
}

function buildAlgorithmSnapshots() {
  const hits0 = normalizeMap(Object.fromEntries(NODES.map((node) => [node, 1])));
  const hits1 = normalizeMap(computeHITS(DEMO_EDGES, 1).authority);
  const hits2 = normalizeMap(computeHITS(DEMO_EDGES, 2).authority);
  const hitsFinal = normalizeMap(computeHITS(DEMO_EDGES, 100).authority);

  const pagerank0 = normalizeMap(Object.fromEntries(NODES.map((node) => [node, 1])));
  const pagerank1 = normalizeMap(computePageRank(DEMO_EDGES, 0.85, 1));
  const pagerank2 = normalizeMap(computePageRank(DEMO_EDGES, 0.85, 2));
  const pagerankFinal = normalizeMap(computePageRank(DEMO_EDGES, 0.85, 100));

  const fair1 = normalizeMap(computeFairPageRank(DEMO_EDGES, 0.85, 1, 0.7));
  const fair2 = normalizeMap(computeFairPageRank(DEMO_EDGES, 0.85, 2, 0.7));
  const fairFinal = normalizeMap(computeFairPageRank(DEMO_EDGES, 0.85, 100, 0.7));

  const ppr1 = normalizeMap(computePersonalizedPageRank(DEMO_EDGES, { A: 0.45, C: 0.35, E: 0.2 }, 0.85, 1));
  const ppr2 = normalizeMap(computePersonalizedPageRank(DEMO_EDGES, { A: 0.45, C: 0.35, E: 0.2 }, 0.85, 2));
  const pprFinal = normalizeMap(computePersonalizedPageRank(DEMO_EDGES, { A: 0.45, C: 0.35, E: 0.2 }, 0.85, 100));

  const normalized1 = normalizeMap(computeNormalizedPageRank(DEMO_EDGES, 0.85, 1));
  const normalized2 = normalizeMap(computeNormalizedPageRank(DEMO_EDGES, 0.85, 2));
  const normalizedFinal = normalizeMap(computeNormalizedPageRank(DEMO_EDGES, 0.85, 100));

  return [
    { id: 'hits', label: 'HITS', color: COLORS.hits, iterations: [hits0, hits1, hits2], final: hitsFinal },
    { id: 'pagerank', label: 'PageRank', color: COLORS.pagerank, iterations: [pagerank0, pagerank1, pagerank2], final: pagerankFinal },
    { id: 'fair', label: 'Fair PageRank', color: COLORS.fair, iterations: [pagerank0, fair1, fair2], final: fairFinal },
    { id: 'personalized', label: 'Personalized PageRank', color: COLORS.personalized, iterations: [pagerank0, ppr1, ppr2], final: pprFinal },
    { id: 'normalized', label: 'Normalized PageRank', color: COLORS.normalized, iterations: [pagerank0, normalized1, normalized2], final: normalizedFinal },
  ];
}

function IterationStrip({ title, scores, color }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {NODES.map((node) => (
          <div key={`${title}-${node}`} className="rounded-2xl bg-white p-3 text-center">
            <p className="text-xs font-semibold text-slate-500">{node}</p>
            <div className="mt-2 h-16 rounded-full bg-slate-100 px-2 py-2">
              <div className="mx-auto flex h-full w-4 items-end rounded-full bg-slate-100">
                <div className="w-full rounded-full" style={{ height: `${Math.max(8, (scores[node] ?? 0) * 100)}%`, backgroundColor: color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlgorithmsSimplified() {
  const algorithms = useMemo(() => buildAlgorithmSnapshots(), []);

  return (
    <section className="space-y-8">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Algorithms</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          This page is process-first. Each card shows how scores evolve from initialization to early updates and how the final distribution differs from the starting point.
        </p>
      </div>

      <div className="grid gap-6">
        {algorithms.map((algorithm) => {
          const beforeAfter = NODES.map((node) => ({
            node,
            initial: algorithm.iterations[0][node] ?? 0,
            final: algorithm.final[node] ?? 0,
          }));

          return (
            <section key={algorithm.id} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: algorithm.color }} />
                <h2 className="text-2xl font-semibold text-slate-950">{algorithm.label}</h2>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="grid gap-4 md:grid-cols-3">
                  {algorithm.iterations.map((snapshot, index) => (
                    <IterationStrip key={`${algorithm.id}-${index}`} title={`Iteration ${index}`} scores={snapshot} color={algorithm.color} />
                  ))}
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-soft">
                  <GraphChart
                    data={beforeAfter}
                    title="Initial vs Final"
                    xKey="node"
                    mode="normalized"
                    yDomain={[0, 1]}
                    height={180}
                    series={[
                      { key: 'initial', label: 'Initial', color: '#94a3b8' },
                      { key: 'final', label: 'Final', color: algorithm.color },
                    ]}
                  />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

export default AlgorithmsSimplified;
