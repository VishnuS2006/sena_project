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
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDataset } from '../context/DatasetContext.jsx';
import { getAlgorithmViews } from '../utils/scoreUtils.js';

function MetricTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-semibold text-slate-900">{label ?? payload[0]?.payload?.degree}</p>
      <div className="mt-2 space-y-2">
        {payload.map((entry) => (
          <div key={entry.dataKey ?? entry.name} className="text-sm">
            <p className="font-medium" style={{ color: entry.color }}>{entry.name}</p>
            <p className="text-slate-600">{Number(entry.value ?? entry.payload?.value ?? 0).toFixed(4)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeScoreMass(scores) {
  const rawValues = scores.map((item) => Math.max(Number(item.value ?? 0), 0));
  const total = rawValues.reduce((sum, value) => sum + value, 0) || 1;
  return scores.map((item, index) => ({
    ...item,
    normalizedMass: rawValues[index] / total,
  }));
}

function buildCorrelationData(algorithms, degreeLimit = 30) {
  const seriesByAlgorithm = algorithms.map((algorithm) => {
    const grouped = normalizeScoreMass(algorithm.scores).reduce((acc, item) => {
      const degree = Number(item.degree ?? 0);
      if (degree > degreeLimit) {
        return acc;
      }
      if (!acc.has(degree)) {
        acc.set(degree, []);
      }
      acc.get(degree).push(item.normalizedMass);
      return acc;
    }, new Map());

    const points = [...grouped.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([degree, values]) => ({
        degree,
        rawValue: values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1),
      }));

    return {
      ...algorithm,
      points,
    };
  });

  const globalMax = Math.max(
    ...seriesByAlgorithm.flatMap((algorithm) => algorithm.points.map((point) => point.rawValue)),
    0,
  ) || 1;
  const allDegrees = [...new Set(seriesByAlgorithm.flatMap((algorithm) => algorithm.points.map((point) => point.degree)))].sort((a, b) => a - b);

  return allDegrees.map((degree) => {
    const row = { degree };
    seriesByAlgorithm.forEach((algorithm) => {
      const point = algorithm.points.find((entry) => entry.degree === degree);
      row[algorithm.key] = point ? point.rawValue / globalMax : null;
      row[`${algorithm.key}Raw`] = point?.rawValue ?? null;
    });
    return row;
  });
}

function buildDegreeVisibilityData(algorithms) {
  if (!algorithms?.length) {
    return [];
  }

  const degreeEntries = [...new Map(
    algorithms
      .flatMap((algorithm) => algorithm.scores.map((item) => [item.name, Number(item.degree ?? 0)])),
  ).entries()].sort((a, b) => a[1] - b[1]);

  const totalNodes = degreeEntries.length;
  if (!totalNodes) {
    return [];
  }

  const lowEnd = Math.max(1, Math.ceil(totalNodes / 3));
  const midEnd = Math.max(lowEnd + 1, Math.ceil((totalNodes * 2) / 3));
  const lowEntries = degreeEntries.slice(0, lowEnd);
  const midEntries = degreeEntries.slice(lowEnd, midEnd);
  const headEntries = degreeEntries.slice(midEnd);
  const lowNodes = new Set(lowEntries.map(([name]) => name));
  const midNodes = new Set(midEntries.map(([name]) => name));
  const averageDegree = (entries) => entries.reduce((sum, [, degree]) => sum + degree, 0) / Math.max(entries.length, 1);
  const lowWeight = Math.max(averageDegree(lowEntries), 1);
  const midWeight = Math.max(averageDegree(midEntries), 1);
  const headWeight = Math.max(averageDegree(headEntries), 1);

  return algorithms.map((algorithm) => {
    const massScores = normalizeScoreMass(algorithm.scores);
    let low = 0;
    let mid = 0;
    let head = 0;

    massScores.forEach((item) => {
      if (lowNodes.has(item.name)) {
        low += item.normalizedMass;
      } else if (midNodes.has(item.name)) {
        mid += item.normalizedMass;
      } else {
        head += item.normalizedMass;
      }
    });

    const weightedLow = low * lowWeight;
    const weightedMid = mid * midWeight;
    const weightedHead = head * headWeight;
    const total = weightedLow + weightedMid + weightedHead || 1;

    return {
      name:
        algorithm.label === 'Fair PageRank'
          ? 'Fair PR'
          : algorithm.label === 'Personalized PageRank'
            ? 'Personalized'
            : algorithm.label === 'Normalized PageRank'
              ? 'Normalized'
              : algorithm.label,
      low_degree: weightedLow / total,
      mid_degree: weightedMid / total,
      head_degree: weightedHead / total,
      low_degreeRaw: low,
      mid_degreeRaw: mid,
      head_degreeRaw: head,
    };
  });
}

function MetricsEmpty() {
  const { dataset, loading, error } = useDataset();
  const comparison = dataset?.metrics?.comparison ?? [];
  const algorithms = useMemo(() => getAlgorithmViews(dataset?.rankings), [dataset?.rankings]);
  const giniData = comparison.map((row) => ({
    algorithm: row.name,
    shortLabel:
      row.name === 'Fair PageRank'
        ? 'Fair PR'
        : row.name === 'Personalized PageRank'
          ? 'Personalized'
          : row.name === 'Normalized PageRank'
            ? 'Normalized'
            : row.name,
    value: row.gini,
    color: algorithms.find((algorithm) => algorithm.label === row.name)?.color ?? '#64748b',
  }));
  const correlationData = useMemo(() => buildCorrelationData(algorithms), [algorithms]);
  const degreeVisibilityData = useMemo(
    () => buildDegreeVisibilityData(algorithms),
    [algorithms],
  );

  return (
    <section className="space-y-8">
      <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-soft">
        <h1 className="text-4xl font-semibold text-slate-950">Metrics</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">
          The metrics page isolates three fairness signals: inequality, degree-score coupling, and low-degree visibility.
        </p>
        <p className="mt-3 text-sm text-slate-500">{loading ? 'Loading metrics...' : error || 'Metrics ready.'}</p>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Gini Coefficient</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
            {giniData.map((item) => (
              <div key={item.algorithm} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-900">{item.algorithm}</p>
                <p className="mt-1">{item.value.toFixed(3)}</p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            {giniData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={giniData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="2 10" vertical={false} />
                  <XAxis dataKey="shortLabel" tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} domain={[0, 'auto']} />
                  <Tooltip content={<MetricTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {giniData.map((entry) => (
                      <Cell key={entry.algorithm} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">No Gini data available.</div>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-950">Degree vs Score Correlation</h2>
          <p className="mt-2 text-sm text-slate-600">Average normalized score by degree. Stronger upward dependence means stronger structural bias.</p>
          <div className="mt-5">
            {correlationData.length ? (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={correlationData} margin={{ top: 8, right: 18, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="2 10" vertical={false} />
                  <XAxis dataKey="degree" tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} domain={[0, 1]} />
                  <Tooltip content={<MetricTooltip />} />
                  <Legend verticalAlign="top" />
                  {algorithms.map((algorithm) => (
                    <Line
                      key={algorithm.key}
                      type="monotone"
                      dataKey={algorithm.key}
                      name={algorithm.label}
                      stroke={algorithm.color}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">No degree-score data available.</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-slate-950">Low-Degree Node Visibility</h2>
        <p className="mt-2 text-sm text-slate-600">Each algorithm shows how its total score is split across low, mid, and high-degree nodes. Biased methods concentrate more score in the high-degree bucket.</p>
        <div className="mt-5">
          {degreeVisibilityData.length ? (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={degreeVisibilityData} margin={{ top: 8, right: 18, left: 0, bottom: 8 }} barGap={6}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="2 10" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} domain={[0, 1]} />
                <Tooltip content={<MetricTooltip />} />
                <Legend verticalAlign="top" />
                <Bar stackId="visibility" dataKey="low_degree" name="Low-degree" fill="#2563eb" radius={[0, 0, 6, 6]} />
                <Bar stackId="visibility" dataKey="mid_degree" name="Mid-degree" fill="#16a34a" />
                <Bar stackId="visibility" dataKey="head_degree" name="High-degree" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">No visibility data available.</div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MetricsEmpty;
