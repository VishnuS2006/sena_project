import { useEffect, useState } from 'react';
import { GraphChart } from '../components/GraphChart.jsx';
import { fetchRankingResults } from '../services/api.js';

function Results() {
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchRankingResults();
        setRanking(result);
      } catch (err) {
        setError('Unable to load live dataset rankings.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const summary = ranking
    ? [
        { name: 'HITS', value: ranking.hits?.authority?.[0]?.value ?? 0 },
        { name: 'PageRank', value: ranking.pagerank?.[0]?.value ?? 0 },
        { name: 'FairPR', value: ranking.fair?.[0]?.value ?? 0 },
      ]
    : [];

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Results</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Live results from the marketplace dataset show the ranking gap between HITS, PageRank, and fairness-aware ranking.
        </p>
      </div>

      {loading && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <p className="text-slate-600">Loading ranking comparisons...</p>
        </div>
      )}

      {error && (
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-8 text-red-700">
          {error}
        </div>
      )}

      {!loading && ranking && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
              <h2 className="text-xl font-semibold text-slate-950">Ranking improvement</h2>
              <p className="mt-4 text-slate-600">The Fair PageRank variant reduces top-score concentration, promoting broader long-tail coverage.</p>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
              <h2 className="text-xl font-semibold text-slate-950">Long-tail visibility</h2>
              <p className="mt-4 text-slate-600">Normalized ranking lifts lower-degree nodes while preserving relevance from the underlying graph.</p>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
              <h2 className="text-xl font-semibold text-slate-950">Key findings</h2>
              <p className="mt-4 text-slate-600">Simple degree-penalization and personalization both help counteract the rich-get-richer effect.</p>
            </div>
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-2xl font-semibold text-slate-950">Live ranking comparison</h2>
            <p className="mt-4 text-slate-600">Top node score values across the most important ranking algorithms.</p>
            <div className="mt-8">
              <GraphChart data={summary} type="bar" />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default Results;
