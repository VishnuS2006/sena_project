import { useEffect, useMemo, useState } from 'react';
import TableView from '../components/TableView.jsx';
import { GraphChart } from '../components/GraphChart.jsx';
import { computeHITS } from '../algorithms/hits.js';
import { computePageRank } from '../algorithms/pagerank.js';
import { computeFairPageRank } from '../algorithms/fairpagerank.js';
import { computePersonalizedPageRank } from '../algorithms/personalized.js';
import { computeNormalizedPageRank } from '../algorithms/normalized.js';
import { fetchRankingResults } from '../services/api.js';

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

function sortScores(scores) {
  return scores
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ name: item.name, value: Number(item.value.toFixed(4)) }));
}

function Analysis() {
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRankings() {
      try {
        const result = await fetchRankingResults();
        setRanking(result);
      } catch (err) {
        setError('Unable to fetch ranking results from backend.');
      } finally {
        setLoading(false);
      }
    }
    loadRankings();
  }, []);

  const hits = useMemo(() => ranking?.hits?.authority ?? sortScores(computeHITS(sampleEdges).authority), [ranking]);
  const pageRank = useMemo(() => ranking?.pagerank ?? sortScores(computePageRank(sampleEdges)), [ranking]);
  const fairRank = useMemo(() => ranking?.fair ?? sortScores(computeFairPageRank(sampleEdges)), [ranking]);
  const personalized = useMemo(() => ranking?.personalized ?? sortScores(computePersonalizedPageRank(sampleEdges, { A: 0.4, B: 0.3, C: 0.3 })), [ranking]);
  const normalized = useMemo(() => ranking?.normalized ?? sortScores(computeNormalizedPageRank(sampleEdges)), [ranking]);

  const dataSets = [
    { label: 'HITS (Authority)', data: hits, sample: hits.slice(0, 5) },
    { label: 'PageRank', data: pageRank, sample: pageRank.slice(0, 5) },
    { label: 'Fair PageRank', data: fairRank, sample: fairRank.slice(0, 5) },
    { label: 'Personalized PageRank', data: personalized, sample: personalized.slice(0, 5) },
    { label: 'Normalized PageRank', data: normalized, sample: normalized.slice(0, 5) },
  ];

  const columns = [
    { Header: 'Rank', accessor: 'rank' },
    { Header: 'Node', accessor: 'name' },
    { Header: 'Score', accessor: 'value' },
  ];

  const formatTopRows = (data) => data.map((item, index) => ({ rank: index + 1, ...item }));

  if (loading) {
    return (
      <section className="space-y-10">
        <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
          <h1 className="text-4xl font-semibold text-slate-950">Analysis</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">Loading live dataset ranking results from the backend.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Analysis</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          Detailed comparison of ranking scores, distributions, and top-ranked nodes for each algorithm on the provided marketplace dataset.
        </p>
      </div>

      {error && (
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {dataSets.map((item) => (
          <div key={item.label} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-2xl font-semibold text-slate-950">{item.label}</h2>
            <p className="mt-3 text-slate-600">Score distribution and top-ranked nodes for this algorithm.</p>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <GraphChart data={item.data.slice(0, 20)} type="line" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Top nodes</h3>
                <div className="mt-4">
                  <TableView data={formatTopRows(item.sample)} columns={columns} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-950">Cross-algorithm comparison</h2>
        <p className="mt-4 text-slate-600">Fair and normalized ranking variants reduce dominance by high-degree nodes, improving long-tail exposure in power-law marketplace graphs.</p>
      </div>
    </section>
  );
}

export default Analysis;
