import { useMemo } from 'react';
import { GraphChart } from '../components/GraphChart.jsx';
import { useDataset } from '../context/DatasetContext.jsx';
import {
  algorithmSeries,
  buildCombinedSeries,
  buildNodeScoreSeries,
  getAlgorithmViews,
} from '../utils/scoreUtils.js';

function ResultsRedesigned() {
  const { dataset } = useDataset();
  const algorithms = useMemo(() => getAlgorithmViews(dataset?.rankings), [dataset?.rankings]);
  const comparison = dataset?.metrics?.comparison ?? [];

  const scoreComparison = useMemo(
    () => buildCombinedSeries(algorithms, (scores) => buildNodeScoreSeries(scores, true, 400)),
    [algorithms],
  );

  const metricSeriesData = comparison.map((row, index) => ({
    index: index + 1,
    name: row.name,
    gini: row.gini,
    rankInequality: row.rankInequality,
    degreeRankCorrelation: row.degreeRankCorrelation,
  }));

  return (
    <section className="space-y-8">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Results</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          This page reinforces the core finding with one compact comparison view, a minimal metric panel, and short visual takeaways.
        </p>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
        <GraphChart
          data={scoreComparison}
          title="Algorithm Distribution Comparison"
          xKey="index"
          mode="normalized"
          yDomain={[0, 1]}
          series={algorithmSeries()}
          height={230}
          brush
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <GraphChart
            data={metricSeriesData}
            title="Bias Metrics"
            xKey="index"
            mode="raw"
            height={220}
            series={[
              { key: 'gini', label: 'Gini', color: '#2563eb' },
              { key: 'rankInequality', label: 'Rank inequality', color: '#f59e0b' },
              { key: 'degreeRankCorrelation', label: 'Degree correlation', color: '#16a34a' },
            ]}
          />
        </div>
        <div className="grid gap-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">HITS</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">HITS shows the strongest centralization, with visibility collapsing into the head of the graph.</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">PageRank</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">PageRank remains biased toward high-degree nodes and still exhibits a strong rich-get-richer curve.</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Fair Algorithms</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Fair, Personalized, and Normalized PageRank flatten the score decay and improve low-degree visibility.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResultsRedesigned;
