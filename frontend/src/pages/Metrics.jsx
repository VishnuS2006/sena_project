import { useMemo } from 'react';
import { computePageRank } from '../algorithms/pagerank.js';
import { computeFairPageRank } from '../algorithms/fairpagerank.js';
import { computeHITS } from '../algorithms/hits.js';
import { computePersonalizedPageRank } from '../algorithms/personalized.js';
import { computeNormalizedPageRank } from '../algorithms/normalized.js';
import { GraphChart } from '../components/GraphChart.jsx';

const sampleEdges = [
  ['A', 'B'],
  ['A', 'C'],
  ['A', 'D'],
  ['B', 'C'],
  ['B', 'E'],
  ['C', 'F'],
  ['D', 'G'],
  ['E', 'H'],
  ['F', 'I'],
  ['G', 'J'],
  ['H', 'K'],
  ['I', 'L'],
  ['J', 'M'],
  ['K', 'N'],
  ['L', 'O'],
  ['M', 'P'],
  ['N', 'Q'],
  ['O', 'R'],
  ['P', 'S'],
  ['Q', 'T'],
];

const giniCoefficient = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const cumulative = sorted.reduce((sum, value, i) => sum + value * (i + 1), 0);
  const total = sorted.reduce((sum, value) => sum + value, 0) || 1;
  return (2 * cumulative) / (n * total) - (n + 1) / n;
};

const skewness = (values) => {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const sd = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length) || 1;
  return values.reduce((sum, v) => sum + ((v - mean) / sd) ** 3, 0) / values.length;
};

const rankInequality = (values) => {
  const sorted = [...values].sort((a, b) => b - a);
  const top5 = sorted.slice(0, 5).reduce((sum, value) => sum + value, 0);
  const bottom5 = sorted.slice(-5).reduce((sum, value) => sum + value, 0) || 1;
  return top5 / bottom5;
};

function Metrics() {
  const hits = useMemo(() => Object.values(computeHITS(sampleEdges).authority), []);
  const pageRank = useMemo(() => Object.values(computePageRank(sampleEdges)), []);
  const fairRank = useMemo(() => Object.values(computeFairPageRank(sampleEdges)), []);
  const personalized = useMemo(() => Object.values(computePersonalizedPageRank(sampleEdges, { A: 0.4, B: 0.3, C: 0.3 })), []);
  const normalized = useMemo(() => Object.values(computeNormalizedPageRank(sampleEdges)), []);

  const metrics = [
    { name: 'Gini coefficient', fn: giniCoefficient },
    { name: 'Rank inequality', fn: rankInequality },
    { name: 'Skewness', fn: skewness },
  ];

  const algorithms = [
    { label: 'HITS', values: hits },
    { label: 'PageRank', values: pageRank },
    { label: 'Fair PageRank', values: fairRank },
    { label: 'Personalized PageRank', values: personalized },
    { label: 'Normalized PageRank', values: normalized },
  ];

  const metricData = metrics.map((metric) => ({
    name: metric.name,
    values: algorithms.map((algorithm) => ({ name: algorithm.label, value: Number(metric.fn(algorithm.values).toFixed(4)) })),
  }));

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Metrics</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Quantitative indicators show how inequality and skewness change across ranking algorithms in a power-law network.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Gini coefficient</h2>
          <p className="mt-4 text-slate-600">Measures inequality in score distribution. Lower values indicate more equitable ranking.</p>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Rank inequality</h2>
          <p className="mt-4 text-slate-600">Compares the mass of top-ranked nodes to the long tail. Higher values denote stronger concentration.</p>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Distribution skewness</h2>
          <p className="mt-4 text-slate-600">Captures asymmetry in the score distribution. Positive skew shows strong tail concentration.</p>
        </div>
      </div>
      <div className="space-y-8">
        {metricData.map((metric) => (
          <div key={metric.name} className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-2xl font-semibold text-slate-950">{metric.name}</h2>
            <div className="mt-6">
              <GraphChart data={metric.values} type="bar" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Metrics;
