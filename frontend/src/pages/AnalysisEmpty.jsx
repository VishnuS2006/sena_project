import { useMemo, useState } from 'react';
import { GraphChart } from '../components/GraphChart.jsx';
import { useDataset } from '../context/DatasetContext.jsx';
import { ALGORITHM_META, algorithmSeries, minMaxNormalize, normalizeMultiSeries } from '../utils/scoreUtils.js';

const ALGORITHMS = [
  { label: 'HITS', key: 'hits', path: ['hits', 'authority'] },
  { label: 'PageRank', key: 'pagerank', path: ['pagerank', 'scores'] },
  { label: 'Fair PageRank', key: 'fair', path: ['fair_pagerank', 'scores'] },
  { label: 'Personalized PageRank', key: 'personalized', path: ['personalized_pagerank', 'scores'] },
  { label: 'Normalized PageRank', key: 'normalized', path: ['degree_normalized_pagerank', 'scores'] },
];

function getScores(rankings, path) {
  try {
    return path.reduce((current, key) => current?.[key], rankings) ?? [];
  } catch {
    return [];
  }
}

function buildComparison(rankings, normalize) {
  const seriesByAlgorithm = ALGORITHMS.map((algorithm) => {
    const scores = [...getScores(rankings, algorithm.path)]
      .sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))
      .slice(0, 40);
    const raw = scores.map((item) => Number(item.value ?? 0));
    const display = normalize ? minMaxNormalize(raw) : raw;
    return { ...algorithm, raw, display };
  });

  const maxLen = Math.max(0, ...seriesByAlgorithm.map((item) => item.display.length));
  return Array.from({ length: maxLen }, (_, index) => {
    const row = { index: index + 1 };
    seriesByAlgorithm.forEach((algorithm) => {
      row[algorithm.key] = algorithm.display[index] ?? null;
      row[`${algorithm.key}Raw`] = algorithm.raw[index] ?? null;
    });
    return row;
  });
}

function buildDominance(rankings) {
  const rows = ALGORITHMS.map((algorithm) => {
    const scores = [...getScores(rankings, algorithm.path)].sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0));
    const rawValues = scores.map((item) => Math.max(Number(item.value ?? 0), 0));
    const total = rawValues.reduce((sum, value) => sum + value, 0);
    const topCount = Math.max(1, Math.ceil(rawValues.length * 0.1));
    const topShare = rawValues.slice(0, topCount).reduce((sum, value) => sum + value, 0);
    return {
      name: algorithm.label,
      value: total ? (topShare / total) * 100 : 0,
      color: ALGORITHM_META[algorithm.label]?.color ?? '#2563eb',
    };
  });

  return [...rows].sort((a, b) => a.value - b.value);
}

function EmptyCard({ title, message }) {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 p-8">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 text-slate-600">{message}</p>
    </div>
  );
}

function AnalysisEmpty() {
  const { dataset, loading, error, sourceLabel, statusMessage } = useDataset();
  const [normalize, setNormalize] = useState(true);

  const comparisonData = useMemo(() => buildComparison(dataset?.rankings, normalize), [dataset?.rankings, normalize]);
  const dominanceData = useMemo(() => buildDominance(dataset?.rankings), [dataset?.rankings]);
  const degreeVisibilityData = useMemo(
    () => normalizeMultiSeries(dataset?.metrics?.degree_bucket_visibility ?? [], ['low_degree', 'mid_degree', 'head_degree'], normalize ? 'normalized' : 'raw'),
    [dataset?.metrics?.degree_bucket_visibility, normalize],
  );

  const status = loading ? 'Loading analysis...' : error || sourceLabel || statusMessage || 'Analysis ready.';

  return (
    <section className="space-y-8">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Analysis Page</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-950">Bias vs fairness in one view</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">This page uses a safe, lightweight chart pipeline so it always renders. HITS and PageRank should drop faster, while fair methods should look flatter and less concentrated.</p>
            <p className="mt-4 text-sm text-slate-500">{status}</p>
          </div>
          <div className="flex items-center gap-3 self-start rounded-full border border-slate-200 bg-white/90 p-2 shadow-sm">
            <button
              type="button"
              onClick={() => setNormalize(true)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${normalize ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Normalize ON
            </button>
            <button
              type="button"
              onClick={() => setNormalize(false)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${!normalize ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Normalize OFF
            </button>
          </div>
        </div>
      </div>

      {comparisonData.length > 0 ? (
        <GraphChart
          data={comparisonData}
          title="Score Distribution Comparison"
          xKey="index"
          mode={normalize ? 'normalized' : 'raw'}
          yDomain={normalize ? [0, 1] : undefined}
          series={algorithmSeries()}
          height={360}
          brush
        />
      ) : (
        <EmptyCard title="Score Distribution Comparison" message="Comparison data is not available yet." />
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {dominanceData.length > 0 ? (
          <GraphChart
            data={dominanceData}
            title="Top Nodes Dominance"
            xKey="name"
            mode="raw"
            yDomain={[0, 100]}
            series={[{ key: 'value', label: 'Top 10% score share', color: '#2563eb' }]}
            height={320}
          />
        ) : (
          <EmptyCard title="Top Nodes Dominance" message="Dominance data is not available yet." />
        )}

        {(degreeVisibilityData ?? []).length > 0 ? (
          <GraphChart
            data={degreeVisibilityData.map((item) => ({ ...item, name: item.name ?? item.group }))}
            title="Low-Degree Node Visibility"
            type="bar"
            xKey="name"
            mode={normalize ? 'normalized' : 'raw'}
            yDomain={normalize ? [0, 1] : undefined}
            series={[
              { key: 'low_degree', label: 'Low-degree', color: '#2563eb' },
              { key: 'mid_degree', label: 'Mid-degree', color: '#16a34a' },
              { key: 'head_degree', label: 'High-degree', color: '#f59e0b' },
            ]}
            height={320}
          />
        ) : (
          <EmptyCard title="Low-Degree Node Visibility" message="Degree visibility data is not available yet." />
        )}
      </div>
    </section>
  );
}

export default AnalysisEmpty;
