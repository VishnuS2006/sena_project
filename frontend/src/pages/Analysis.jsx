import { useMemo, useState } from 'react';
import { GraphChart } from '../components/GraphChart.jsx';
import TableView from '../components/TableView.jsx';
import { useDataset } from '../context/DatasetContext.jsx';
import {
  algorithmSeries,
  buildComparisonRows,
  buildNormalizedComparison,
  formatScore,
  normalizeMultiSeries,
  normalizeRecords,
  paginateRows,
} from '../utils/scoreUtils.js';

function algorithmViews(rankings) {
  if (!rankings) {
    return [];
  }

  return [
    { key: 'HITS', label: 'HITS', scores: rankings.hits.authority },
    { key: 'PageRank', label: 'PageRank', scores: rankings.pagerank.scores },
    { key: 'Fair PageRank', label: 'Fair PageRank', scores: rankings.fair_pagerank.scores },
    { key: 'Personalized PageRank', label: 'Personalized PageRank', scores: rankings.personalized_pagerank.scores },
    { key: 'Normalized PageRank', label: 'Normalized PageRank', scores: rankings.degree_normalized_pagerank.scores },
  ];
}

function Analysis() {
  const { dataset, loading, error } = useDataset();
  const algorithms = algorithmViews(dataset?.rankings);
  const [mode, setMode] = useState('normalized');
  const [pages, setPages] = useState({});
  const percentileCurves = dataset?.metrics?.percentile_curves ?? [];
  const degreeBucketVisibility = dataset?.metrics?.degree_bucket_visibility ?? [];

  const comparisonData = useMemo(() => {
    const rows = buildComparisonRows(dataset?.rankings, 30);
    return buildNormalizedComparison(rows, mode);
  }, [dataset?.rankings, mode]);

  const degreeBucketChart = useMemo(
    () => normalizeMultiSeries(degreeBucketVisibility, ['low_degree', 'mid_degree', 'head_degree'], 'normalized'),
    [degreeBucketVisibility],
  );

  const tableColumns = [
    { Header: 'Rank', accessor: 'rank' },
    { Header: 'Node', accessor: 'name' },
    { Header: 'Degree', accessor: 'degree' },
    { Header: 'Raw score', accessor: 'value', render: (value) => formatScore(value) },
    { Header: mode === 'raw' ? 'Display' : 'Normalized', accessor: 'displayValue', render: (value) => Number(value).toFixed(4) },
  ];

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Analysis</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          This page now uses the widest available ranking output from the dataset cache instead of only top-10 slices. Every algorithm is normalized across its full visible output so low-degree uplift from Fair, Personalized, and Normalized PageRank is easier to inspect.
        </p>
        <p className="mt-3 text-sm text-slate-500">{loading ? 'Loading dataset...' : error || 'Dynamic results are active.'}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { key: 'raw', label: 'Raw values' },
            { key: 'normalized', label: 'Min-Max normalized' },
            { key: 'log', label: 'Log normalized' },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setMode(option.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === option.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-950">All-algorithm normalized comparison</h2>
        <p className="mt-3 text-slate-600">The grouped chart below compares up to 30 nodes drawn from the union of the strongest nodes across all algorithms, not only from HITS.</p>
        <div className="mt-6">
          <GraphChart
            data={comparisonData}
            type="bar"
            title="Union of high-visibility nodes across all algorithms"
            mode={mode}
            yDomain={mode === 'raw' ? undefined : [0, 1]}
            series={algorithmSeries()}
            height={360}
          />
        </div>
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-950">Degree-bucket visibility</h2>
        <p className="mt-3 text-slate-600">This chart shows how much average score reaches low-degree, mid-degree, and head nodes. Fairness-aware methods should increase low-degree visibility and reduce head concentration.</p>
        <div className="mt-6">
          <GraphChart
            data={degreeBucketChart}
            type="bar"
            title="Average score by degree bucket"
            series={[
              { key: 'low_degree', label: 'Low degree', color: '#7c3aed' },
              { key: 'mid_degree', label: 'Mid degree', color: '#16a34a' },
              { key: 'head_degree', label: 'Head degree', color: '#f59e0b' },
            ]}
            mode="normalized"
            yDomain={[0, 1]}
          />
        </div>
      </div>

      {algorithms.map((algorithm) => {
        const page = pages[algorithm.key] ?? 1;
        const normalizedScores = normalizeRecords(algorithm.scores, 'value', mode);
        const currentPageRows = paginateRows(normalizedScores, page, 25);
        const totalPages = Math.max(1, Math.ceil(normalizedScores.length / 25));
        const curveRows = normalizeMultiSeries(
          percentileCurves.filter((item) => item.algorithm === algorithm.key),
          ['value'],
          mode,
        ).map((row) => ({ ...row, value: row.value }));

        return (
          <div key={algorithm.key} className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">{algorithm.label}</h2>
                <p className="mt-2 text-slate-600">Showing a wider ranked output with descending sorting, normalized charting, and paginated rows for more nodes.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                Showing page {page} of {totalPages} · {algorithm.scores.length} ranked nodes available in the cached view
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <GraphChart
                data={normalizedScores.slice(0, 40).map((item) => ({ ...item, value: item.displayValue }))}
                type="bar"
                title="Top ranked nodes"
                mode={mode}
                yDomain={mode === 'raw' ? undefined : [0, 1]}
                height={340}
              />
              <GraphChart
                data={curveRows.slice(0, 100)}
                type="line"
                title="Full output percentile curve"
                xKey="percentile"
                mode={mode}
                yDomain={mode === 'raw' ? undefined : [0, 1]}
                height={340}
              />
              <div className="rounded-3xl border border-slate-200 bg-white p-0 shadow-soft">
                <TableView data={currentPageRows} columns={tableColumns} />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {algorithm.scores.slice(0, 5).map((row) => (
                  <div key={row.name} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                    {row.name} · degree {row.degree}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPages((prev) => ({ ...prev, [algorithm.key]: Math.max(1, page - 1) }))}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPages((prev) => ({ ...prev, [algorithm.key]: Math.min(totalPages, page + 1) }))}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default Analysis;
