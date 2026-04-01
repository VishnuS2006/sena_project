import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDataset } from '../context/DatasetContext.jsx';
import { ALGORITHM_META, getAlgorithmViews, minMaxNormalize } from '../utils/scoreUtils.js';

function normalizeScoreMass(scores) {
  const rawValues = scores.map((item) => Math.max(Number(item.value ?? 0), 0));
  const total = rawValues.reduce((sum, value) => sum + value, 0) || 1;
  return rawValues.map((value) => value / total);
}

function ResultsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-semibold text-slate-900">Rank {label}</p>
      <div className="mt-2 space-y-2">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="text-sm">
            <p className="font-medium" style={{ color: entry.color }}>{entry.name}</p>
            <p className="text-slate-600">Normalized score: {Number(entry.value ?? 0).toFixed(4)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DominanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-2 text-sm text-slate-600">Top 10% contribution: {Number(payload[0]?.value ?? 0).toFixed(2)}%</p>
    </div>
  );
}

function buildDistributionData(algorithms, limit = 60) {
  const prepared = algorithms.map((algorithm) => {
    const ordered = [...algorithm.scores].sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0)).slice(0, limit);
    const normalized = minMaxNormalize(ordered.map((item) => Number(item.value ?? 0)));
    return {
      ...algorithm,
      normalized,
    };
  });

  const maxLength = Math.max(0, ...prepared.map((algorithm) => algorithm.normalized.length));
  return Array.from({ length: maxLength }, (_, index) => {
    const row = { rank: index + 1 };
    prepared.forEach((algorithm) => {
      row[algorithm.key] = algorithm.normalized[index] ?? null;
    });
    return row;
  });
}

function buildDominanceData(algorithms) {
  return algorithms.map((algorithm) => {
    const ordered = [...algorithm.scores].sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0));
    const scoreMass = normalizeScoreMass(ordered);
    const total = scoreMass.reduce((sum, value) => sum + value, 0);
    const topCount = Math.max(1, Math.ceil(scoreMass.length * 0.1));
    const topShare = scoreMass.slice(0, topCount).reduce((sum, value) => sum + value, 0);
    return {
      algorithm: algorithm.label,
      shortLabel:
        algorithm.label === 'Fair PageRank'
          ? 'Fair PR'
          : algorithm.label === 'Personalized PageRank'
            ? 'Personalized'
            : algorithm.label === 'Normalized PageRank'
              ? 'Normalized'
              : algorithm.label,
      value: total ? (topShare / total) * 100 : 0,
      color: algorithm.color,
    };
  });
}

function ResultsEmpty() {
  const { dataset, loading, error } = useDataset();
  const algorithms = useMemo(() => getAlgorithmViews(dataset?.rankings), [dataset?.rankings]);
  const distributionData = useMemo(() => buildDistributionData(algorithms), [algorithms]);
  const dominanceData = useMemo(() => buildDominanceData(algorithms), [algorithms]);
  const comparison = dataset?.metrics?.comparison ?? [];
  const highestBias = dataset?.metrics?.insights?.highest_bias ?? 'HITS';
  const lowestBias = dataset?.metrics?.insights?.lowest_bias ?? 'Fair PageRank';
  const lowestGini = comparison.length ? [...comparison].sort((a, b) => a.gini - b.gini)[0] : null;

  return (
    <section className="space-y-8">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Results</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          The results page shows one visual conclusion: HITS and PageRank concentrate score quickly, while the fairness-aware variants spread visibility more evenly.
        </p>
        <p className="mt-3 text-sm text-slate-500">{loading ? 'Loading results...' : error || 'Results ready.'}</p>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-slate-950">Key Findings</h2>
        <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
          <li>HITS shows the strongest head-node concentration and the sharpest score decay.</li>
          <li>PageRank remains biased toward already prominent nodes and still follows a rich-get-richer pattern.</li>
          <li>{lowestBias} is the most balanced method in the current run and keeps more score outside the top core.</li>
          <li>{lowestGini ? `${lowestGini.name} has the lowest Gini coefficient (${lowestGini.gini.toFixed(3)}), which signals the fairest distribution.` : 'Fair algorithms flatten the curve and reduce top-node dominance.'}</li>
        </ul>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Score Distribution Comparison</h2>
          <p className="mt-2 text-sm text-slate-600">Steeper early drops indicate stronger bias. Flatter curves indicate fairer visibility.</p>
          <div className="mt-5">
            {distributionData.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={distributionData} margin={{ top: 8, right: 18, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="2 10" vertical={false} />
                  <XAxis dataKey="rank" tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} domain={[0, 1]} />
                  <Tooltip content={<ResultsTooltip />} />
                  <Legend verticalAlign="top" />
                  {algorithms.map((algorithm) => (
                    <Line
                      key={algorithm.key}
                      type="monotone"
                      dataKey={algorithm.key}
                      name={algorithm.label}
                      stroke={algorithm.color}
                      strokeWidth={2.8}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">No comparison data available.</div>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Top 10% Node Contribution</h2>
          <p className="mt-2 text-sm text-slate-600">Higher percentages mean a small set of nodes controls more of the score.</p>
          <div className="mt-5">
            {dominanceData.length ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={dominanceData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="2 10" vertical={false} />
                  <XAxis dataKey="shortLabel" tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip content={<DominanceTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {dominanceData.map((entry) => (
                      <Cell key={entry.algorithm} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">No dominance data available.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResultsEmpty;
