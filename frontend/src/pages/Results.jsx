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
} from '../utils/scoreUtils.js';

function Results() {
  const { dataset } = useDataset();
  const [mode, setMode] = useState('normalized');
  const comparisonBase = useMemo(() => buildComparisonRows(dataset?.rankings, 30), [dataset?.rankings]);
  const topComparison = useMemo(() => buildNormalizedComparison(comparisonBase, mode), [comparisonBase, mode]);
  const degreeBucketVisibility = dataset?.metrics?.degree_bucket_visibility ?? [];
  const degreeBucketChart = useMemo(
    () => normalizeMultiSeries(degreeBucketVisibility, ['low_degree', 'mid_degree', 'head_degree'], 'normalized'),
    [degreeBucketVisibility],
  );

  const fair = dataset?.rankings?.fair_pagerank?.scores ?? [];
  const pagerank = dataset?.rankings?.pagerank?.scores ?? [];
  const hits = dataset?.rankings?.hits?.authority ?? [];
  const personalized = dataset?.rankings?.personalized_pagerank?.scores ?? [];
  const normalized = dataset?.rankings?.degree_normalized_pagerank?.scores ?? [];

  const longTailFocus = fair
    .filter((item) => item.degree <= 2)
    .slice(0, 20)
    .map((item) => ({
      name: item.name,
      degree: item.degree,
      hitsRank: hits.find((entry) => entry.name === item.name)?.rank ?? null,
      pagerankRank: pagerank.find((entry) => entry.name === item.name)?.rank ?? null,
      fairRank: item.rank,
      personalizedRank: personalized.find((entry) => entry.name === item.name)?.rank ?? null,
      normalizedRank: normalized.find((entry) => entry.name === item.name)?.rank ?? null,
      fairValue: item.value,
      pagerankValue: pagerank.find((entry) => entry.name === item.name)?.value ?? 0,
      rankGain: (pagerank.find((entry) => entry.name === item.name)?.rank ?? item.rank) - item.rank,
    }));

  const rankColumns = [
    { Header: 'Node', accessor: 'name' },
    { Header: 'Degree', accessor: 'degree' },
    { Header: 'HITS', accessor: 'hitsRank' },
    { Header: 'PageRank', accessor: 'pagerankRank' },
    { Header: 'FairRank', accessor: 'fairRank' },
    { Header: 'Personalized', accessor: 'personalizedRank' },
    { Header: 'Normalized', accessor: 'normalizedRank' },
  ];

  const valueColumns = [
    { Header: 'Node', accessor: 'name' },
    { Header: 'Degree', accessor: 'degree' },
    { Header: 'PageRank score', accessor: 'pagerankValue', render: (value) => formatScore(value) },
    { Header: 'Fair score', accessor: 'fairValue', render: (value) => formatScore(value) },
    { Header: 'Rank gain vs PR', accessor: 'rankGain' },
  ];

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Results</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          This page is now centered on long-tail recovery. Instead of only showing a few large raw scores, it compares normalized score distributions and rank movement for lower-degree nodes across all five algorithms.
        </p>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex h-full flex-col rounded-[30px] border border-slate-200 bg-white p-7 shadow-soft"><h2 className="text-xl font-semibold text-slate-950">Rich-get-richer baseline</h2><p className="mt-3 grow leading-7 text-slate-600">HITS and PageRank still concentrate visibility around head nodes with many edges and repeated reinforcement.</p></div>
        <div className="flex h-full flex-col rounded-[30px] border border-slate-200 bg-white p-7 shadow-soft"><h2 className="text-xl font-semibold text-slate-950">Low-degree recovery</h2><p className="mt-3 grow leading-7 text-slate-600">Fair, Personalized, and Normalized PageRank push more score toward low-degree nodes, which is the clearest sign that the long tail is becoming visible.</p></div>
        <div className="flex h-full flex-col rounded-[30px] border border-slate-200 bg-white p-7 shadow-soft"><h2 className="text-xl font-semibold text-slate-950">Rank movement</h2><p className="mt-3 grow leading-7 text-slate-600">The tables below highlight nodes that remain low-degree but rank better under the fairness-aware methods than under standard HITS or PageRank.</p></div>
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
        <GraphChart
          data={topComparison}
          type="bar"
          title="Normalized five-algorithm comparison"
          mode={mode}
          yDomain={mode === 'raw' ? undefined : [0, 1]}
          series={algorithmSeries()}
          height={360}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <GraphChart
          data={degreeBucketChart}
          type="bar"
          title="Average score reaching low-degree nodes"
          mode="normalized"
          yDomain={[0, 1]}
          series={[
            { key: 'low_degree', label: 'Low degree', color: '#7c3aed' },
            { key: 'mid_degree', label: 'Mid degree', color: '#16a34a' },
            { key: 'head_degree', label: 'Head degree', color: '#f59e0b' },
          ]}
          height={360}
        />
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950">Long-tail nodes improved by fair ranking</h2>
          <p className="mt-3 text-slate-600">These nodes have degree 2 or less, yet they receive better treatment from fairer algorithms than from the head-biased baselines.</p>
          <div className="mt-6"><TableView data={longTailFocus} columns={rankColumns} /></div>
        </div>
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-950">Raw score evidence for low-degree nodes</h2>
        <div className="mt-6"><TableView data={longTailFocus} columns={valueColumns} /></div>
      </div>
    </section>
  );
}

export default Results;
