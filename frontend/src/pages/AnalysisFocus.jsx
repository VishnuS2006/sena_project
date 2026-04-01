import { useMemo, useState } from 'react';
import { ComparisonChart } from '../components/ComparisonChart.jsx';
import { DegreeVisibilityChart } from '../components/DegreeVisibilityChart.jsx';
import { DominanceChart } from '../components/DominanceChart.jsx';
import { useDataset } from '../context/DatasetContext.jsx';
import { ALGORITHM_META, getAlgorithmViews, minMaxNormalize } from '../utils/scoreUtils.js';

function normalizeRows(rows, normalized) {
  if (!normalized) {
    return rows;
  }
  const values = rows.map((row) => Number(row.value ?? 0));
  const scaled = minMaxNormalize(values);
  return rows.map((row, index) => ({ ...row, value: scaled[index] ?? 0 }));
}

function buildComparisonData(algorithms, normalized) {
  const normalizedSeries = algorithms.map((algorithm) => {
    const ordered = [...algorithm.scores].sort((a, b) => b.value - a.value);
    return {
      ...algorithm,
      rows: normalizeRows(
        ordered.map((row, index) => ({
          rank: index + 1,
          value: Number(row.value ?? 0),
          rawValue: Number(row.value ?? 0),
        })),
        normalized,
      ),
    };
  });

  const maxLength = Math.max(0, ...normalizedSeries.map((algorithm) => algorithm.rows.length));
  return Array.from({ length: maxLength }, (_, index) => {
    const row = { rank: index + 1 };
    normalizedSeries.forEach((algorithm) => {
      const point = algorithm.rows[index];
      row[algorithm.key] = point?.value ?? null;
      row[`${algorithm.key}Raw`] = point?.rawValue ?? null;
    });
    return row;
  });
}

function buildDominanceData(algorithms) {
  return algorithms.map((algorithm) => {
    const ordered = [...algorithm.scores].sort((a, b) => b.value - a.value);
    const topCount = Math.max(1, Math.ceil(ordered.length * 0.1));
    const topSum = ordered.slice(0, topCount).reduce((sum, row) => sum + Number(row.value ?? 0), 0);
    const total = ordered.reduce((sum, row) => sum + Number(row.value ?? 0), 0) || 1;
    return {
      algorithm: algorithm.label,
      shortLabel: algorithm.label.replace(' PageRank', '').replace('Rank', 'PR'),
      value: (topSum / total) * 100,
      color: algorithm.color,
    };
  });
}

function buildDegreeVisibilityData(algorithms, normalized) {
  const groups = ['Low-degree', 'Mid-degree', 'High-degree'];

  const groupedByAlgorithm = algorithms.map((algorithm) => {
    const orderedByDegree = [...algorithm.scores].sort((a, b) => a.degree - b.degree);
    const size = orderedByDegree.length;
    const lowCut = Math.ceil(size / 3);
    const midCut = Math.ceil((2 * size) / 3);

    const low = orderedByDegree.slice(0, lowCut);
    const mid = orderedByDegree.slice(lowCut, midCut);
    const high = orderedByDegree.slice(midCut);

    const avg = (rows) => rows.reduce((sum, row) => sum + Number(row.value ?? 0), 0) / Math.max(rows.length, 1);
    const values = [avg(low), avg(mid), avg(high)];
    const display = normalized ? minMaxNormalize(values) : values;

    return {
      ...algorithm,
      values: display,
    };
  });

  return groups.map((group, index) => {
    const row = { group };
    groupedByAlgorithm.forEach((algorithm) => {
      row[algorithm.key] = algorithm.values[index] ?? 0;
      row[`${algorithm.key}Raw`] = algorithm.values[index] ?? 0;
    });
    return row;
  });
}

function AnalysisFocus() {
  const { dataset, loading, error } = useDataset();
  const [normalized, setNormalized] = useState(true);
  const algorithms = useMemo(() => getAlgorithmViews(dataset?.rankings), [dataset?.rankings]);

  const comparisonData = useMemo(() => buildComparisonData(algorithms, normalized), [algorithms, normalized]);
  const dominanceData = useMemo(() => buildDominanceData(algorithms), [algorithms]);
  const degreeVisibilityData = useMemo(() => buildDegreeVisibilityData(algorithms, normalized), [algorithms, normalized]);

  const series = useMemo(
    () => Object.keys(ALGORITHM_META).map((label) => ({
      key: ALGORITHM_META[label].key,
      label,
      color: ALGORITHM_META[label].color,
    })),
    [],
  );

  return (
    <section className="space-y-8">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-950">Analysis</h1>
            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
              This page is focused on one visual claim: HITS and PageRank concentrate score in a small head, while fairness-aware variants spread visibility more evenly.
            </p>
            <p className="mt-3 text-sm text-slate-500">{loading ? 'Loading dataset...' : error || 'All five algorithms are shown on the same scale.'}</p>
          </div>
          <button
            type="button"
            onClick={() => setNormalized((value) => !value)}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              normalized ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Normalize {normalized ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <ComparisonChart data={comparisonData} series={series} normalized={normalized} />

      <div className="grid gap-6 xl:grid-cols-2">
        <DominanceChart data={dominanceData} />
        <DegreeVisibilityChart data={degreeVisibilityData} series={series} normalized={normalized} />
      </div>
    </section>
  );
}

export default AnalysisFocus;
