import { useMemo, useState } from 'react';
import { GraphChart } from '../components/GraphChart.jsx';
import { useDataset } from '../context/DatasetContext.jsx';
import {
  algorithmSeries,
  buildCombinedSeries,
  buildDegreeScoreSeries,
  buildNodeScoreSeries,
  buildRankScoreSeries,
  buildVisibilitySeries,
  getAlgorithmViews,
} from '../utils/scoreUtils.js';

function insightForAlgorithm(label) {
  if (label === 'HITS') {
    return 'Dual reinforcement concentrates visibility into a small dominant core.';
  }
  if (label === 'PageRank') {
    return 'The curve drops sharply because incoming-link accumulation favors already central nodes.';
  }
  return 'The flatter curve signals broader distribution and more meaningful long-tail visibility.';
}

function AnalysisRedesigned() {
  const { dataset, loading, error } = useDataset();
  const [normalized, setNormalized] = useState(true);
  const algorithms = useMemo(() => getAlgorithmViews(dataset?.rankings), [dataset?.rankings]);

  const nodeComparison = useMemo(
    () => buildCombinedSeries(algorithms, (scores) => buildNodeScoreSeries(scores, true, 500)),
    [algorithms],
  );

  const rankComparison = useMemo(
    () => buildCombinedSeries(algorithms, (scores) => buildRankScoreSeries(scores, true, 500)),
    [algorithms],
  );

  const visibilityComparison = useMemo(() => {
    const seriesByAlgorithm = algorithms.map((algorithm) => ({
      ...algorithm,
      series: buildVisibilitySeries(algorithm.scores, 101),
    }));
    const maxLength = Math.max(0, ...seriesByAlgorithm.map((algorithm) => algorithm.series.length));
    return Array.from({ length: maxLength }, (_, index) => {
      const row = {};
      seriesByAlgorithm.forEach((algorithm) => {
        const point = algorithm.series[index];
        row.percentile = point?.percentile ?? index;
        row[algorithm.key] = point?.value ?? null;
        row[`${algorithm.key}Raw`] = point?.rawValue ?? null;
      });
      return row;
    }).filter((row) => row.percentile !== undefined);
  }, [algorithms]);

  const perAlgorithm = useMemo(
    () => algorithms.map((algorithm) => ({
      ...algorithm,
      nodeData: buildNodeScoreSeries(algorithm.scores, normalized, 260),
      degreeData: buildDegreeScoreSeries(algorithm.scores, normalized, 220),
      rankData: buildRankScoreSeries(algorithm.scores, normalized, 260),
      visibilityData: buildVisibilitySeries(algorithm.scores, 120),
    })),
    [algorithms, normalized],
  );

  return (
    <section className="space-y-8">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-950">Analysis</h1>
            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
              This view is built to make fairness visible immediately: biased algorithms fall sharply and spike early, while fairness-aware variants stay smoother across the same normalized scale.
            </p>
            <p className="mt-3 text-sm text-slate-500">{loading ? 'Loading dataset...' : error || 'All algorithms are visible simultaneously.'}</p>
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

      <div className="grid gap-6 xl:grid-cols-2">
        <GraphChart
          data={nodeComparison}
          title="Score Distribution Comparison"
          xKey="index"
          mode="normalized"
          yDomain={[0, 1]}
          series={algorithmSeries()}
          height={250}
          brush
        />
        <GraphChart
          data={visibilityComparison}
          title="Visibility Distribution Comparison"
          xKey="percentile"
          mode="normalized"
          yDomain={[0, 1]}
          series={algorithmSeries()}
          height={250}
        />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
        <GraphChart
          data={rankComparison}
          title="Rank vs Score Comparison"
          xKey="index"
          mode="normalized"
          yDomain={[0, 1]}
          series={algorithmSeries()}
          height={220}
          brush
        />
      </div>

      {perAlgorithm.map((algorithm) => (
        <section key={algorithm.key} className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: algorithm.color }} />
                <h2 className="text-2xl font-semibold text-slate-950">{algorithm.label}</h2>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{insightForAlgorithm(algorithm.label)}</p>
            </div>
            <div className={`rounded-full px-4 py-2 text-sm font-semibold ${algorithm.family === 'baseline' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {algorithm.family === 'baseline' ? 'Rich-get-richer' : 'Fairer spread'}
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <GraphChart
              data={algorithm.nodeData}
              title="Nodes vs Score"
              xKey="index"
              mode={normalized ? 'normalized' : 'raw'}
              yDomain={normalized ? [0, 1] : undefined}
              height={220}
              brush
              series={[{ key: 'value', label: algorithm.label, color: algorithm.color }]}
            />
            <GraphChart
              data={algorithm.degreeData}
              title="Degree vs Score"
              xKey="degree"
              mode={normalized ? 'normalized' : 'raw'}
              yDomain={normalized ? [0, 1] : undefined}
              height={220}
              series={[{ key: 'value', label: algorithm.label, color: algorithm.color }]}
            />
            <GraphChart
              data={algorithm.rankData}
              title="Rank vs Score"
              xKey="rank"
              mode={normalized ? 'normalized' : 'raw'}
              yDomain={normalized ? [0, 1] : undefined}
              height={220}
              brush
              series={[{ key: 'value', label: algorithm.label, color: algorithm.color }]}
            />
            <GraphChart
              data={algorithm.visibilityData}
              title="Visibility Distribution"
              xKey="percentile"
              mode="normalized"
              yDomain={[0, 1]}
              height={220}
              series={[{ key: 'value', label: algorithm.label, color: algorithm.color }]}
            />
          </div>
        </section>
      ))}
    </section>
  );
}

export default AnalysisRedesigned;
