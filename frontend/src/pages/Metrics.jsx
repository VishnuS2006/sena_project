import { useMemo } from 'react';
import { GraphChart } from '../components/GraphChart.jsx';
import { useDataset } from '../context/DatasetContext.jsx';
import { metricSeries, normalizeMultiSeries } from '../utils/scoreUtils.js';

function Metrics() {
  const { dataset } = useDataset();
  const comparison = dataset?.metrics?.comparison ?? [];
  const skewCurves = dataset?.metrics?.skew_curves ?? [];
  const degreeBucketVisibility = dataset?.metrics?.degree_bucket_visibility ?? [];
  const lineData = Array.from({ length: 20 }, (_, index) => {
    const rank = index + 1;
    const rows = skewCurves.filter((item) => item.rank === rank);
    return rows.reduce((acc, row) => ({ ...acc, rank: row.rank, [row.algorithm]: row.value }), { rank });
  });
  const degreeBucketChart = useMemo(
    () => normalizeMultiSeries(degreeBucketVisibility, ['low_degree', 'mid_degree', 'head_degree'], 'normalized'),
    [degreeBucketVisibility],
  );

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Metrics</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          The metrics page now focuses on three questions: how unequal each algorithm is, how strongly it follows degree, and how much average score it gives to low-degree nodes. That makes the fairness effect visible without relying on misleading raw magnitudes.
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Normalization matters because raw ranking values live on different scales. A fair comparison should preserve ordering information and distribution shape while removing visually deceptive magnitude gaps.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex h-full flex-col rounded-[30px] border border-slate-200 bg-white p-7 shadow-soft"><h2 className="text-xl font-semibold text-slate-950">HITS</h2><p className="mt-3 grow leading-7 text-slate-600">HITS usually shows the highest inequality because authority and hub reinforcement locks onto the same dominant core.</p></div>
        <div className="flex h-full flex-col rounded-[30px] border border-slate-200 bg-white p-7 shadow-soft"><h2 className="text-xl font-semibold text-slate-950">PageRank</h2><p className="mt-3 grow leading-7 text-slate-600">PageRank is often less extreme than HITS, but it still rewards high-degree regions and keeps the rich-get-richer pattern alive.</p></div>
        <div className="flex h-full flex-col rounded-[30px] border border-slate-200 bg-white p-7 shadow-soft"><h2 className="text-xl font-semibold text-slate-950">Fair ranking</h2><p className="mt-3 grow leading-7 text-slate-600">Fair PageRank, Personalized PageRank, and Normalized PageRank are useful when you want lower inequality and better low-degree exposure without collapsing the ranking entirely.</p></div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GraphChart
          data={comparison}
          type="bar"
          title="Inequality comparison across algorithms"
          xKey="name"
          series={metricSeries()}
          height={360}
        />
        <GraphChart
          data={comparison.map((row) => ({ name: row.name, value: row.gini }))}
          type="bar"
          title="Gini coefficient focus"
          xKey="name"
          mode="raw"
          height={360}
        />
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-950">Metric reading guide</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[26px] bg-slate-50 p-5">
            <p className="font-semibold text-slate-900">Gini coefficient</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Lower is better when the goal is to avoid extreme concentration of ranking mass.</p>
          </div>
          <div className="rounded-[26px] bg-slate-50 p-5">
            <p className="font-semibold text-slate-900">Rank inequality</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Lower values mean the head is not swallowing nearly all of the score distribution.</p>
          </div>
          <div className="rounded-[26px] bg-slate-50 p-5">
            <p className="font-semibold text-slate-900">Degree-rank correlation</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Lower correlation means ranking is less directly determined by raw connectivity.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GraphChart
          data={degreeBucketChart}
          type="bar"
          title="Degree bucket visibility"
          mode="normalized"
          yDomain={[0, 1]}
          series={[
            { key: 'low_degree', label: 'Low degree', color: '#7c3aed' },
            { key: 'mid_degree', label: 'Mid degree', color: '#16a34a' },
            { key: 'head_degree', label: 'Head degree', color: '#f59e0b' },
          ]}
          height={360}
        />
        <GraphChart
          data={lineData}
          type="line"
          title="Distribution by rank"
          xKey="rank"
          series={[
            { key: 'HITS', label: 'HITS', color: '#2563eb' },
            { key: 'PageRank', label: 'PageRank', color: '#16a34a' },
            { key: 'Fair PageRank', label: 'Fair PageRank', color: '#f59e0b' },
            { key: 'Personalized PageRank', label: 'Personalized PageRank', color: '#e11d48' },
            { key: 'Normalized PageRank', label: 'Normalized PageRank', color: '#7c3aed' },
          ]}
          height={360}
        />
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-950">Interpretation</h2>
        <p className="mt-4 leading-8 text-slate-600">
          If HITS and PageRank stay high on Gini and degree-rank correlation while fairer methods improve the low-degree bucket, then the rich-get-richer effect is being reduced. That is the central fairness signal this project should show on the Amazon graph.
        </p>
      </div>
    </section>
  );
}

export default Metrics;
