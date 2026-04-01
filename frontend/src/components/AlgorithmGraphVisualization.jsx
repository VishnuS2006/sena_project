import { useMemo } from 'react';
import { GraphChart } from './GraphChart.jsx';
import { computeFairPageRank } from '../algorithms/fairpagerank.js';
import { computeHITS } from '../algorithms/hits.js';
import { computeNormalizedPageRank } from '../algorithms/normalized.js';
import { computePageRank } from '../algorithms/pagerank.js';
import { computePersonalizedPageRank } from '../algorithms/personalized.js';
import { degreeMap } from '../algorithms/utils.js';

const NODES = ['A', 'B', 'C', 'D', 'E'];
const DEMO_EDGES = [
  ['A', 'B'],
  ['A', 'C'],
  ['B', 'C'],
  ['C', 'D'],
  ['D', 'E'],
];

const COLORS = {
  hits: '#2563eb',
  pagerank: '#16a34a',
  fair: '#f59e0b',
  personalized: '#7c3aed',
  normalized: '#0f766e',
};

function uniformMap() {
  return Object.fromEntries(NODES.map((node) => [node, 1]));
}

function toScoreRows(scoreMap) {
  return NODES.map((node) => ({
    node,
    value: Number(scoreMap[node] ?? 0),
  }));
}

function buildSnapshots(id) {
  const initial = uniformMap();

  if (id === 'hits') {
    return {
      iterations: [
        initial,
        computeHITS(DEMO_EDGES, 1).authority,
        computeHITS(DEMO_EDGES, 2).authority,
      ],
      final: computeHITS(DEMO_EDGES, 100).authority,
    };
  }

  if (id === 'pagerank') {
    return {
      iterations: [
        initial,
        computePageRank(DEMO_EDGES, 0.85, 1),
        computePageRank(DEMO_EDGES, 0.85, 2),
      ],
      final: computePageRank(DEMO_EDGES, 0.85, 100),
    };
  }

  if (id === 'fair') {
    return {
      iterations: [
        initial,
        computeFairPageRank(DEMO_EDGES, 0.85, 1, 0.7),
        computeFairPageRank(DEMO_EDGES, 0.85, 2, 0.7),
      ],
      final: computeFairPageRank(DEMO_EDGES, 0.85, 100, 0.7),
    };
  }

  if (id === 'personalized') {
    return {
      iterations: [
        initial,
        computePersonalizedPageRank(DEMO_EDGES, { A: 0.45, C: 0.35, E: 0.2 }, 0.85, 1),
        computePersonalizedPageRank(DEMO_EDGES, { A: 0.45, C: 0.35, E: 0.2 }, 0.85, 2),
      ],
      final: computePersonalizedPageRank(DEMO_EDGES, { A: 0.45, C: 0.35, E: 0.2 }, 0.85, 100),
    };
  }

  return {
    iterations: [
      initial,
      computeNormalizedPageRank(DEMO_EDGES, 0.85, 1),
      computeNormalizedPageRank(DEMO_EDGES, 0.85, 2),
    ],
    final: computeNormalizedPageRank(DEMO_EDGES, 0.85, 100),
  };
}

function IterationCard({ title, rows, color, maxScore }) {
  return (
    <div className="flex h-full min-h-[260px] flex-col rounded-[24px] bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {rows.map((row) => (
          <div key={`${title}-${row.node}`} className="rounded-[20px] bg-white px-2 py-4 text-center">
            <p className="text-sm font-medium text-slate-600">{row.node}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">deg {row.degree}</p>
            <div className="mt-3 h-24 rounded-full bg-slate-100 p-2">
              <div className="flex h-full items-end justify-center rounded-full bg-slate-100">
                <div
                  className="w-6 rounded-full transition-all"
                  style={{ height: `${Math.max(6, ((row.value ?? 0) / Math.max(maxScore, 1e-9)) * 100)}%`, backgroundColor: color }}
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] font-semibold text-slate-500">{row.value.toFixed(3)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AlgorithmGraphVisualization({ algorithm }) {
  const color = COLORS[algorithm.id] ?? '#2563eb';
  const snapshots = useMemo(() => buildSnapshots(algorithm.id), [algorithm.id]);
  const degree = useMemo(() => degreeMap(DEMO_EDGES), []);

  const iterationRows = useMemo(
    () => snapshots.iterations.map((snapshot) => toScoreRows(snapshot).map((row) => ({ ...row, degree: degree[row.node] ?? 0 }))),
    [degree, snapshots.iterations],
  );

  const finalRows = useMemo(
    () => toScoreRows(snapshots.final).map((row) => ({ ...row, degree: degree[row.node] ?? 0 })),
    [degree, snapshots.final],
  );

  const maxScore = useMemo(
    () => Math.max(...iterationRows.flatMap((rows) => rows.map((row) => row.value)), ...finalRows.map((row) => row.value), 1),
    [finalRows, iterationRows],
  );

  const comparisonData = NODES.map((node) => {
    const initial = Number(snapshots.iterations[0][node] ?? 0);
    const final = Number(snapshots.final[node] ?? 0);
    return {
      node,
      degree: degree[node] ?? 0,
      initial,
      final,
      initialRaw: initial,
      finalRaw: final,
    };
  });

  return (
    <div className="flex min-h-[520px] h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
      <div>
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Visualization</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Follow how scores move from initialization to early updates and then settle into the final ranking.</p>
          <p className="mt-2 text-xs leading-6 text-slate-500">Same degree does not always mean same score. These algorithms also depend on edge direction and where score arrives from.</p>
        </div>
      </div>

      <div className="mt-5 grid flex-1 items-stretch gap-4 2xl:grid-cols-[1.45fr_0.55fr]">
        <div className="grid gap-4 md:grid-cols-3">
          <IterationCard title="Iteration 0" rows={iterationRows[0]} color={color} maxScore={maxScore} />
          <IterationCard title="Iteration 1" rows={iterationRows[1]} color={color} maxScore={maxScore} />
          <IterationCard title="Iteration 2" rows={iterationRows[2]} color={color} maxScore={maxScore} />
        </div>

        <div className="flex min-h-[260px] h-full flex-col rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft">
          <GraphChart
            data={comparisonData}
            title="Initial vs Final"
            xKey="node"
            mode="normalized"
            yDomain={[0, 1]}
            height={220}
            series={[
              { key: 'initial', label: 'Initial', color: '#94a3b8' },
              { key: 'final', label: 'Final', color },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
